const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizePhone, hashString } = require("../utils/helpers");
const { ROLES, REFRESH_TOKEN_EXPIRES_MS } = require("../config/constants");
const { createPaymentRequest, getPaymentRequest, isPaymentSuccessful } = require("../services/instamojo.service");

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
    sameSite: "strict",
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

async function startRegistrationPayment(req, res, next) {
  try {
    const { name, email, phone, password, course_id, batch_id, phone_token } = req.body;

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
      include: { course: { select: { name: true, slug: true } } },
    });

    if (!batch) return error(res, 404, "Selected batch not found or no longer available.");

    const enrollmentCount = await prisma.enrollment.count({ where: { batch_id } });
    if (enrollmentCount >= batch.max_students) {
      return error(res, 409, "This batch is full. Please choose another batch.");
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Current PendingRegistration schema has no amount, status, or user_id.
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

    if (pending) {
      pending = await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: {
          name: name.trim(),
          password_hash,
          payment_status: "PENDING",
        },
      });
    } else {
      pending = await prisma.pendingRegistration.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          password_hash,
          course_id,
          batch_id,
          payment_status: "PENDING",
        },
      });
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
      amount: REGISTRATION_AMOUNT,
      payment_request_id: payment.payment_request_id,
      payment_url: payment.payment_url,
    });
  } catch (err) {
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

    const existingEnrollment = await tx.enrollment.findUnique({
      where: {
        student_id_batch_id: {
          student_id: user.id,
          batch_id: pending.batch_id,
        },
      },
    });

    if (existingEnrollment) {
      await tx.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { payment_status: "PAID", payment_ref: paymentId || paymentRequestId },
      });
    } else {
      await tx.enrollment.create({
        data: {
          student_id: user.id,
          batch_id: pending.batch_id,
          payment_status: "PAID",
          payment_ref: paymentId || paymentRequestId,
        },
      });
    }

    await tx.pendingRegistration.update({
      where: { id: pending.id },
      data: { payment_status: "PAID", payment_id: paymentId || null },
    });

    await tx.registrationPayment.updateMany({
      where: { pending_registration_id: pending.id },
      data: {
        status: "PAID",
        payment_id: paymentId || null,
        raw_response: rawResponse || {},
      },
    });

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

    const pending = await prisma.pendingRegistration.findFirst({
      where: { payment_request_id: paymentRequestId },
    });

    if (!pending) return res.status(200).json({ success: true, ignored: true });

    const paymentData = await getPaymentRequest(paymentRequestId);

    if (isPaymentSuccessful(paymentData, paymentId)) {
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { payment_status: "PAID", payment_id: paymentId || null },
      });

      await prisma.registrationPayment.updateMany({
        where: { pending_registration_id: pending.id },
        data: {
          status: "PAID",
          payment_id: paymentId || null,
          raw_response: paymentData || {},
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { startRegistrationPayment, verifyRegistrationPayment, instamojoWebhook };
