const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizePhone, hashString } = require("../utils/helpers");
const { ROLES, REFRESH_TOKEN_EXPIRES_MS } = require("../config/constants");
const { createPaymentRequest, getPaymentRequest, isPaymentSuccessful } = require("../services/instamojo.service");
const { normalizeCode, isCodeUsable } = require("./discountCode.controller");
const { normalizeReferralCode, createReferralReward } = require("./referral.controller");

const REGISTRATION_AMOUNT = Number(process.env.REGISTRATION_FEE_AMOUNT || 999);

function frontendBase() {
  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const appBase = (process.env.FRONTEND_APP_BASE || "/dct").replace(/\/+$/, "");
  return frontend.endsWith(appBase) ? frontend : `${frontend}${appBase}`;
}

function backendBase(req) {
  return (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
}

function setStudentRefreshCookie(res, token) {
  res.cookie("student_refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  });
}

async function generateTokens(user) {
  if (!user?.id) throw new Error("User not found for token generation.");

  const payload = { userId: user.id, role: user.role };

  const accessToken = jwt.sign(
    { ...payload, tokenType: "access" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m", jwtid: crypto.randomUUID() }
  );

  const rawRefreshToken = jwt.sign(
    { ...payload, tokenType: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d", jwtid: crypto.randomUUID() }
  );

  await prisma.refreshToken.deleteMany({ where: { user_id: user.id } }).catch(() => {});

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: hashString(rawRefreshToken),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

function toMoney(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function addDays(dateValue, days) {
  const d = new Date(dateValue || Date.now());
  d.setDate(d.getDate() + days);
  return d;
}

function buildEmiDates(batchStartDate) {
  const first = addDays(batchStartDate, 2);
  const second = addDays(first, 31);
  return { first, second };
}

function buildPaymentSchedule(batchStartDate, isCadSoftwareTools = false) {
  if (isCadSoftwareTools) {
    return { first: new Date(batchStartDate || Date.now()), second: null };
  }
  return buildEmiDates(batchStartDate);
}

function normalizeSelectedTools(value) {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  return String(value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

async function resolveFinalCoursePrice({ batch, selectedCoursePrice, discountCode }) {
  const basePrice = toMoney(selectedCoursePrice, Number(batch?.course?.price || 0));
  const cleanCode = normalizeCode(discountCode);

  if (!cleanCode) {
    return {
      enrolled_price: basePrice,
      original_price: basePrice,
      discount_code: null,
      discount_row: null,
    };
  }

  const discount = await prisma.discountCode.findUnique({ where: { code: cleanCode } });
  const check = isCodeUsable(discount, { course_id: batch.course_id, batch_id: batch.id });
  if (!check.ok) {
    const err = new Error(check.message || "Invalid discount code.");
    err.statusCode = 400;
    throw err;
  }

  const discountPrice = toMoney(discount.discount_price, basePrice);
  return {
    enrolled_price: Math.min(basePrice, discountPrice),
    original_price: toMoney(discount.original_price, basePrice),
    discount_code: discount.code,
    discount_row: discount,
  };
}

async function validateReferralBeforePayment(referralCode, normalizedPhone, normalizedEmail) {
  const clean = normalizeReferralCode(referralCode);
  if (!clean) return null;

  const referrer = await prisma.user.findFirst({
    where: { referral_code: clean, role: "STUDENT", is_active: true },
    select: { id: true, email: true, phone: true, referral_code: true },
  });

  if (!referrer) {
    const err = new Error("Invalid referral code.");
    err.statusCode = 400;
    throw err;
  }

  if (referrer.phone === normalizedPhone || referrer.email === normalizedEmail) {
    const err = new Error("You cannot use your own referral code.");
    err.statusCode = 400;
    throw err;
  }

  return referrer.referral_code;
}

async function startRegistrationPayment(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      password,
      course_id,
      batch_id,
      phone_token,
      selected_course_price,
      discount_code,
      referral_code,
      is_cad_software_tools = false,
      selected_tools = [],
      software_mode,
      payment_plan,
    } = req.body;

    if (!name || !email || !phone || !password || !course_id || !batch_id || !phone_token) {
      return error(res, 400, "All fields are required before payment.");
    }

    let decoded;
    try {
      decoded = jwt.verify(phone_token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return error(res, 400, "Phone verification expired. Please verify OTP again.");
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (decoded.phone !== normalizedPhone || decoded.purpose !== "STUDENT_REGISTER") {
      return error(res, 400, "Invalid phone verification token.");
    }

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.user.findUnique({ where: { phone: normalizedPhone } }),
    ]);

    if (existingEmail) return error(res, 409, "Email already registered. Please login instead.");
    if (existingPhone) return error(res, 409, "Phone number already registered. Please login instead.");

    const batch = await prisma.batch.findFirst({
      where: { id: batch_id, course_id, status: { in: ["UPCOMING", "ACTIVE"] } },
      include: { course: { select: { name: true, slug: true, price: true } } },
    });

    if (!batch) return error(res, 404, "Selected batch not found or no longer available.");

    const enrollmentCount = await prisma.enrollment.count({ where: { batch_id } });
    if (enrollmentCount >= batch.max_students) {
      return error(res, 409, "This batch is full. Please choose another batch.");
    }

    const cleanReferralCode = await validateReferralBeforePayment(referral_code, normalizedPhone, normalizedEmail);
    const cadToolsRegistration = Boolean(is_cad_software_tools || payment_plan === "ONE_BALANCE_ON_BATCH_START");
    const pricing = await resolveFinalCoursePrice({
      batch,
      selectedCoursePrice: selected_course_price,
      discountCode: cadToolsRegistration ? null : discount_code,
    });
    const emi = buildPaymentSchedule(batch.start_date, cadToolsRegistration);
    const selectedTools = normalizeSelectedTools(selected_tools);
    const password_hash = await bcrypt.hash(password, 12);

    let pending = await prisma.pendingRegistration.findFirst({
      where: {
        phone: normalizedPhone,
        email: normalizedEmail,
        course_id,
        batch_id,
        payment_status: { in: ["PENDING", "FAILED"] },
      },
      orderBy: { created_at: "desc" },
    });

    const pendingData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash,
      course_id,
      batch_id,
      payment_status: "PENDING",
      enrolled_price: pricing.enrolled_price,
      original_price: pricing.original_price,
      discount_code: pricing.discount_code,
      referral_code: cleanReferralCode,
      emi_first_due: emi.first,
      emi_second_due: emi.second,
    };

    if (pending) {
      pending = await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: pendingData,
      });
    } else {
      pending = await prisma.pendingRegistration.create({ data: pendingData });
    }

    const redirectUrl = `${frontendBase()}/auth/payment-success?registration_id=${encodeURIComponent(pending.id)}`;
    const webhookUrl = `${backendBase(req)}/api/v1/registration-payments/instamojo/webhook`;

    const payment = await createPaymentRequest({
      amount: REGISTRATION_AMOUNT,
      purpose: `DCT Registration - ${batch.course.name}`,
      buyerName: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      redirectUrl,
      webhookUrl,
    });

    await prisma.$transaction([
      prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { payment_request_id: payment.payment_request_id },
      }),
      prisma.registrationPayment.create({
        data: {
          pending_registration_id: pending.id,
          amount: REGISTRATION_AMOUNT,
          payment_request_id: payment.payment_request_id,
          raw_response: payment.raw || {},
        },
      }),
    ]);

    return success(res, 200, "Registration fee payment created.", {
      registration_id: pending.id,
      registration_amount: REGISTRATION_AMOUNT,
      enrolled_price: pricing.enrolled_price,
      original_price: pricing.original_price,
      discount_code: pricing.discount_code,
      referral_code: cleanReferralCode,
      emi_first_due: emi.first,
      emi_second_due: emi.second,
      payment_plan: cadToolsRegistration ? "ONE_BALANCE_ON_BATCH_START" : "EMI",
      selected_tools: selectedTools,
      software_mode: software_mode || null,
      payment_request_id: payment.payment_request_id,
      payment_url: payment.payment_url,
    });
  } catch (err) {
    if (err.statusCode) return error(res, err.statusCode, err.message);
    next(err);
  }
}

async function getExistingPaidUserForPending(pending) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: pending.email }, { phone: pending.phone }] },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!user) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      student_id_batch_id: {
        student_id: user.id,
        batch_id: pending.batch_id,
      },
    },
  });

  return enrollment?.payment_status === "PAID" ? user : null;
}

async function finalizePaidRegistration(pending, paymentRequestId, paymentId, rawResponse, res) {
  if (pending.payment_status === "PAID") {
    const existingUser = await getExistingPaidUserForPending(pending);
    if (existingUser) {
      const tokens = await generateTokens(existingUser);
      setStudentRefreshCookie(res, tokens.refreshToken);
      return { user: existingUser, access_token: tokens.accessToken, already_created: true };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({
      where: { id: pending.batch_id, course_id: pending.course_id, status: { in: ["UPCOMING", "ACTIVE"] } },
      include: { course: { select: { name: true } } },
    });

    if (!batch) throw new Error("Selected batch is no longer available.");

    let user = await tx.user.findFirst({
      where: { OR: [{ email: pending.email }, { phone: pending.phone }] },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    if (!user) {
      const count = await tx.enrollment.count({ where: { batch_id: pending.batch_id } });
      if (count >= batch.max_students) {
        throw new Error("This batch is full. Contact DCT support for manual confirmation.");
      }

      user = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          password_hash: pending.password_hash,
          role: ROLES.STUDENT,
          is_verified: true,
          is_active: true,
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });
    }

    const enrollmentData = {
      payment_status: "PAID",
      payment_ref: paymentId || paymentRequestId,
      enrolled_price: pending.enrolled_price || null,
      original_price: pending.original_price || null,
      discount_code: pending.discount_code || null,
      emi_first_due: pending.emi_first_due || null,
      emi_second_due: pending.emi_second_due || null,
    };

    const existingEnrollment = await tx.enrollment.findUnique({
      where: {
        student_id_batch_id: {
          student_id: user.id,
          batch_id: pending.batch_id,
        },
      },
    });

    let enrollment;
    if (existingEnrollment) {
      enrollment = await tx.enrollment.update({ where: { id: existingEnrollment.id }, data: enrollmentData });
    } else {
      enrollment = await tx.enrollment.create({
        data: {
          student_id: user.id,
          batch_id: pending.batch_id,
          ...enrollmentData,
        },
      });
    }

    const enrolledPrice = Number(pending.enrolled_price || 0);
const remainingAmount = Math.max(
  0,
  enrolledPrice - REGISTRATION_AMOUNT,
);

const isSingleBalancePlan =
  !pending.emi_second_due && remainingAmount > 0;

if (remainingAmount > 0) {
  if (isSingleBalancePlan) {
    // CAD tools: one remaining payment on batch start.
    await tx.enrollmentInstallment.upsert({
      where: {
        enrollment_id_installment_no: {
          enrollment_id: enrollment.id,
          installment_no: 1,
        },
      },
      update: {
        label: "Final Payment",
        amount: remainingAmount,
        due_date: pending.emi_first_due || batch.start_date,
      },
      create: {
        enrollment_id: enrollment.id,
        installment_no: 1,
        label: "Final Payment",
        amount: remainingAmount,
        due_date: pending.emi_first_due || batch.start_date,
        status: "PENDING",
      },
    });
  } else {
    // Domain courses: two EMI payments.
    const firstEmiAmount = Math.ceil(remainingAmount / 2);
    const secondEmiAmount =
      remainingAmount - firstEmiAmount;

    await tx.enrollmentInstallment.upsert({
      where: {
        enrollment_id_installment_no: {
          enrollment_id: enrollment.id,
          installment_no: 1,
        },
      },
      update: {
        label: "First EMI",
        amount: firstEmiAmount,
        due_date: pending.emi_first_due || null,
      },
      create: {
        enrollment_id: enrollment.id,
        installment_no: 1,
        label: "First EMI",
        amount: firstEmiAmount,
        due_date: pending.emi_first_due || null,
        status: "PENDING",
      },
    });

    await tx.enrollmentInstallment.upsert({
      where: {
        enrollment_id_installment_no: {
          enrollment_id: enrollment.id,
          installment_no: 2,
        },
      },
      update: {
        label: "Second EMI",
        amount: secondEmiAmount,
        due_date: pending.emi_second_due || null,
      },
      create: {
        enrollment_id: enrollment.id,
        installment_no: 2,
        label: "Second EMI",
        amount: secondEmiAmount,
        due_date: pending.emi_second_due || null,
        status: "PENDING",
      },
    });
  }
}
    await createReferralReward(tx, { pending, user, enrollmentId: enrollment.id });

    await tx.pendingRegistration.update({
      where: { id: pending.id },
      data: { payment_status: "PAID", payment_id: paymentId || null },
    });

    await tx.registrationPayment.updateMany({
      where: { pending_registration_id: pending.id },
      data: { status: "PAID", payment_id: paymentId || null, raw_response: rawResponse || {} },
    });

    if (pending.discount_code) {
      await tx.discountCode.updateMany({
        where: { code: pending.discount_code, is_active: true },
        data: { used_count: { increment: 1 } },
      });
    }

    return { user, batch_name: batch.name, course_name: batch.course.name };
  });

  const tokens = await generateTokens(result.user);
  setStudentRefreshCookie(res, tokens.refreshToken);
  return { ...result, access_token: tokens.accessToken };
}

async function verifyRegistrationPayment(req, res, next) {
  try {
    const registrationId = req.body.registration_id || req.query.registration_id;
    const paymentRequestId = req.body.payment_request_id || req.query.payment_request_id;
    const paymentId = req.body.payment_id || req.query.payment_id;

    if (!registrationId) return error(res, 400, "Registration ID is required.");

    const pending = await prisma.pendingRegistration.findUnique({ where: { id: registrationId } });
    if (!pending) return error(res, 404, "Pending registration not found.");

    const requestId = paymentRequestId || pending.payment_request_id;
    if (!requestId) return error(res, 400, "Payment request ID missing.");

    const paymentData = await getPaymentRequest(requestId);

    if (!isPaymentSuccessful(paymentData, paymentId)) {
      await prisma.registrationPayment.updateMany({
        where: { pending_registration_id: pending.id },
        data: { raw_response: paymentData || {} },
      });
      return error(res, 402, "Payment is not successful yet. Please complete payment or try again.");
    }

    const data = await finalizePaidRegistration(pending, requestId, paymentId, paymentData, res);
    return success(res, 200, "Payment verified. Student account activated.", data);
  } catch (err) {
    if (String(err?.message || "").toLowerCase().includes("token already exists")) {
      return error(res, 409, "Session token conflict. Please click Try Again once or login with your registered phone/email.");
    }
    next(err);
  }
}

async function instamojoWebhook(req, res, next) {
  try {
    const paymentRequestId = req.body.payment_request_id || req.body.payment_request;
    const paymentId = req.body.payment_id || req.body.payment;
    if (!paymentRequestId) return res.status(200).json({ success: true, ignored: true });

    const pending = await prisma.pendingRegistration.findFirst({ where: { payment_request_id: paymentRequestId } });
    if (!pending) return res.status(200).json({ success: true, ignored: true });

    const paymentData = await getPaymentRequest(paymentRequestId);
    if (isPaymentSuccessful(paymentData, paymentId)) {
      await finalizePaidRegistration(pending, paymentRequestId, paymentId, paymentData, res);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { startRegistrationPayment, verifyRegistrationPayment, instamojoWebhook };
