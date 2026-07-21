const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizePhone } = require("../utils/helpers");
const {
  normalizeCode,
  isCodeUsable,
} = require("./discountCode.controller");

const DEFAULT_REGISTRATION_AMOUNT = Number(
  process.env.REGISTRATION_FEE_AMOUNT || 999,
);

function asMoney(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

// Course and coupon prices must always be greater than zero.
// This prevents old/empty batch offer values from turning the final fee into ₹0.
function asPositiveMoney(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function addDays(value, days) {
  const date = new Date(value || Date.now());
  date.setDate(date.getDate() + days);
  return date;
}

function activeBatchPrice(batch) {
  const now = new Date();
  const coursePrice = asPositiveMoney(batch.course?.price, 0);
  const originalPrice = asPositiveMoney(batch.original_price, coursePrice);
  const offerPrice = asPositiveMoney(batch.offer_price, 0);
  const offerStart = batch.offer_start_at
    ? new Date(batch.offer_start_at)
    : null;
  const offerEnd = batch.offer_end_at ? new Date(batch.offer_end_at) : null;

  const offerHasNoTimer = Boolean(offerPrice) && !offerStart && !offerEnd;
  const offerIsLive =
    Boolean(offerPrice) &&
    (!offerStart || now >= offerStart) &&
    (!offerEnd || now <= offerEnd);

  return {
    originalPrice,
    currentPrice:
      offerHasNoTimer || offerIsLive ? offerPrice : originalPrice,
  };
}

async function resolvePrice(batch, couponCode) {
  const base = activeBatchPrice(batch);
  const cleanCode = normalizeCode(couponCode);

  if (!cleanCode) {
    return {
      original_price: base.originalPrice,
      enrolled_price: base.currentPrice,
      discount_code: null,
      discount_row: null,
    };
  }

  const discount = await prisma.discountCode.findUnique({
    where: { code: cleanCode },
  });

  const check = isCodeUsable(discount, {
    course_id: batch.course_id,
    batch_id: batch.id,
  });

  if (!check.ok) {
    const err = new Error(check.message || "Invalid discount code.");
    err.statusCode = 400;
    throw err;
  }

  const couponPrice = asPositiveMoney(
    discount.discount_price,
    base.currentPrice,
  );

  return {
    original_price: asPositiveMoney(
      discount.original_price,
      base.originalPrice,
    ),
    enrolled_price: Math.min(base.currentPrice, couponPrice),
    discount_code: discount.code,
    discount_row: discount,
  };
}

function createInstallmentPlan(batch, enrolledPrice, registrationAmount) {
  const remaining = Math.max(0, enrolledPrice - registrationAmount);
  if (remaining <= 0) return [];

  const now = new Date();
  const batchStart = new Date(batch.start_date || now);
  const scheduleBase = batchStart > now ? batchStart : now;
  const isCadTools = batch.course?.slug === "cad-software-tools";

  if (isCadTools) {
    return [
      {
        installment_no: 1,
        label: "Final Payment",
        amount: remaining,
        due_date: scheduleBase,
      },
    ];
  }

  const firstAmount = Math.ceil(remaining / 2);
  const secondAmount = remaining - firstAmount;

  return [
    {
      installment_no: 1,
      label: "First EMI",
      amount: firstAmount,
      due_date: addDays(scheduleBase, 2),
    },
    {
      installment_no: 2,
      label: "Second EMI",
      amount: secondAmount,
      due_date: addDays(scheduleBase, 33),
    },
  ].filter((item) => item.amount > 0);
}

async function listManualRegistrationBatches(req, res, next) {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: [{ start_date: "desc" }, { created_at: "desc" }],
      select: {
        id: true,
        course_id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
        time_slots: true,
        offer_name: true,
        original_price: true,
        offer_price: true,
        offer_start_at: true,
        offer_end_at: true,
        course: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
          },
        },
        tutor: { select: { name: true } },
      },
    });

    const result = batches.map((batch) => {
      const pricing = activeBatchPrice(batch);
      return {
        ...batch,
        current_price: pricing.currentPrice,
        effective_original_price: pricing.originalPrice,
      };
    });

    return success(res, 200, "All batches available for admin registration.", result);
  } catch (err) {
    next(err);
  }
}

async function previewManualRegistration(req, res, next) {
  try {
    const { batch_id, coupon_code, registration_amount } = req.body;
    if (!batch_id) return error(res, 400, "Batch is required.");

    const batch = await prisma.batch.findUnique({
      where: { id: batch_id },
      include: { course: true },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    const pricing = await resolvePrice(batch, coupon_code);

    if (!pricing.enrolled_price || pricing.enrolled_price <= 0) {
      return error(
        res,
        400,
        "A valid course price could not be found for this batch.",
      );
    }

    const registrationAmount = asMoney(
      registration_amount,
      DEFAULT_REGISTRATION_AMOUNT,
    );
    const installments = createInstallmentPlan(
      batch,
      pricing.enrolled_price,
      registrationAmount,
    );

    return success(res, 200, "Registration price calculated.", {
      batch_id: batch.id,
      course_name: batch.course.name,
      batch_name: batch.name,
      original_price: pricing.original_price,
      enrolled_price: pricing.enrolled_price,
      discount_code: pricing.discount_code,
      registration_amount: registrationAmount,
      balance: Math.max(0, pricing.enrolled_price - registrationAmount),
      installments,
    });
  } catch (err) {
    if (err.statusCode) return error(res, err.statusCode, err.message);
    next(err);
  }
}

async function createManualRegistration(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      password,
      batch_id,
      coupon_code,
      registration_amount,
      payment_ref,
    } = req.body;

    if (!name || !email || !phone || !password || !batch_id) {
      return error(
        res,
        400,
        "Name, email, phone, password and batch are required.",
      );
    }

    if (String(password).length < 6) {
      return error(res, 400, "Password must contain at least 6 characters.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.user.findUnique({ where: { phone: normalizedPhone } }),
    ]);

    if (existingEmail) {
      return error(res, 409, "Email is already registered.");
    }
    if (existingPhone) {
      return error(res, 409, "Phone number is already registered.");
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batch_id },
      include: { course: true },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    const pricing = await resolvePrice(batch, coupon_code);

    if (!pricing.enrolled_price || pricing.enrolled_price <= 0) {
      return error(
        res,
        400,
        "A valid course price could not be found for this batch.",
      );
    }
    const registrationAmount = asMoney(
      registration_amount,
      DEFAULT_REGISTRATION_AMOUNT,
    );

    if (registrationAmount > pricing.enrolled_price) {
      return error(
        res,
        400,
        "Registration amount cannot exceed the final course price.",
      );
    }

    const installments = createInstallmentPlan(
      batch,
      pricing.enrolled_price,
      registrationAmount,
    );
    const passwordHash = await bcrypt.hash(String(password), 12);

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          password_hash: passwordHash,
          role: "STUDENT",
          is_verified: true,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          student_id: student.id,
          batch_id: batch.id,
          payment_status: registrationAmount > 0 ? "PAID" : "PENDING",
          payment_ref:
            String(payment_ref || "").trim() || "ADMIN_MANUAL_REGISTRATION",
          progress: 0,
          enrolled_price: pricing.enrolled_price,
          original_price: pricing.original_price,
          discount_code: pricing.discount_code,
          emi_first_due: installments[0]?.due_date || null,
          emi_second_due: installments[1]?.due_date || null,
        },
      });

      // registration_amount is intentionally stored through SQL so this feature
      // remains isolated from the rest of the existing Prisma code.
      await tx.$executeRaw`
        UPDATE enrollments
        SET registration_amount = ${registrationAmount}
        WHERE id = ${enrollment.id}
      `;

      if (installments.length) {
        await tx.enrollmentInstallment.createMany({
          data: installments.map((item) => ({
            enrollment_id: enrollment.id,
            installment_no: item.installment_no,
            label: item.label,
            amount: item.amount,
            due_date: item.due_date,
            status: "PENDING",
            notes: "Automatically created by admin manual registration.",
          })),
        });
      }

      if (pricing.discount_code) {
        await tx.discountCode.updateMany({
          where: { code: pricing.discount_code, is_active: true },
          data: { used_count: { increment: 1 } },
        });
      }

      return { student, enrollment };
    });

    return success(res, 201, "Student registered and added to batch.", {
      student: result.student,
      enrollment_id: result.enrollment.id,
      batch_id: batch.id,
      batch_name: batch.name,
      original_price: pricing.original_price,
      enrolled_price: pricing.enrolled_price,
      discount_code: pricing.discount_code,
      registration_amount: registrationAmount,
      installments,
    });
  } catch (err) {
    if (err.statusCode) return error(res, err.statusCode, err.message);
    if (String(err?.code) === "P2002") {
      return error(res, 409, "Email, phone or enrollment already exists.");
    }
    next(err);
  }
}

function installmentDisplayStatus(item, now = new Date()) {
  if (item?.status === "PAID" || item?.paid_at) return "PAID";
  if (item?.due_date && new Date(item.due_date).getTime() < now.getTime()) {
    return "DUE";
  }
  return "PENDING";
}

async function feeTracker(req, res, next) {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
        enrollments: {
          orderBy: { enrolled_at: "desc" },
          include: {
            installments: { orderBy: { installment_no: "asc" } },
            batch: {
              select: {
                id: true,
                name: true,
                start_date: true,
                end_date: true,
                status: true,
                course: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const enrollmentIds = students.flatMap((student) =>
      student.enrollments.map((enrollment) => enrollment.id),
    );

    const registrationRows = enrollmentIds.length
      ? await prisma.$queryRaw`
          SELECT id, registration_amount
          FROM enrollments
          WHERE id = ANY(${enrollmentIds})
        `
      : [];

    const registrationMap = new Map(
      registrationRows.map((row) => [row.id, Number(row.registration_amount || 0)]),
    );

    let registrationReceived = 0;
    let emiReceived = 0;
    let pendingEmi = 0;
    let overdueEmi = 0;

    const formattedStudents = students.map((student) => ({
      ...student,
      enrollments: student.enrollments.map((enrollment) => {
        const installments = enrollment.installments.map((item) => ({
          ...item,
          display_status: installmentDisplayStatus(item),
        }));

        const registrationAmount =
          registrationMap.get(enrollment.id) ??
          (enrollment.payment_status === "PAID"
            ? DEFAULT_REGISTRATION_AMOUNT
            : 0);

        const installmentReceived = installments
          .filter((item) => item.display_status === "PAID")
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const pending = installments
          .filter((item) => item.display_status !== "PAID")
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const overdue = installments
          .filter((item) => item.display_status === "DUE")
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        if (student.is_active) {
          registrationReceived += registrationAmount;
          emiReceived += installmentReceived;
          pendingEmi += pending;
          overdueEmi += overdue;
        }

        return {
          ...enrollment,
          registration_amount: registrationAmount,
          installments,
          payment_summary: {
            registration_received: registrationAmount,
            installment_received: installmentReceived,
            pending,
            overdue,
            balance: pending,
          },
        };
      }),
    }));

    return success(res, 200, "Fee tracker fetched.", {
      students: formattedStudents,
      summary: {
        total_students: students.length,
        active_students: students.filter((student) => student.is_active).length,
        disabled_students: students.filter((student) => !student.is_active)
          .length,
        registration_received: registrationReceived,
        emi_received: emiReceived,
        pending_emi: pendingEmi,
        overdue_emi: overdueEmi,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listManualRegistrationBatches,
  previewManualRegistration,
  createManualRegistration,
  feeTracker,
};
