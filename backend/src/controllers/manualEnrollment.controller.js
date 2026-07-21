const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

function money(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

function optionalDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Admin-only list of all courses and batches.
 * Includes old, active, upcoming and completed batches.
 */
async function listManualEnrollmentBatches(req, res, next) {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: [{ start_date: "desc" }, { created_at: "desc" }],
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
        time_slots: true,
        offer_price: true,
        original_price: true,
        course: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
          },
        },
        tutor: {
          select: {
            name: true,
          },
        },
      },
    });

    return success(
      res,
      200,
      "All batches available for manual enrollment.",
      batches,
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Manually add an existing student to any existing batch.
 *
 * Does not:
 * - reopen the batch publicly
 * - change batch dates
 * - change another enrollment
 * - touch paid receipts
 */
async function createManualEnrollment(req, res, next) {
  try {
    const { studentId } = req.params;

    const {
      batch_id,
      enrolled_price,
      original_price,
      registration_paid = true,
      payment_ref,
      installments = [],
    } = req.body;

    if (!batch_id) {
      return error(res, 400, "Batch is required.");
    }

    const enrolledPrice = money(enrolled_price);
    const originalPrice = money(original_price);

    if (enrolledPrice === null || enrolledPrice <= 0) {
      return error(res, 400, "Enter a valid enrolled course fee.");
    }

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!student) {
      return error(res, 404, "Student not found.");
    }

    const batch = await prisma.batch.findUnique({
      where: {
        id: batch_id,
      },
      select: {
        id: true,
        name: true,
        start_date: true,
        status: true,
        course: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    if (!batch) {
      return error(res, 404, "Batch not found.");
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        student_id_batch_id: {
          student_id: student.id,
          batch_id: batch.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return error(
        res,
        409,
        "This student is already enrolled in the selected batch.",
      );
    }

    const cleanInstallments = Array.isArray(installments)
      ? installments
          .map((item, index) => ({
            installment_no: Number(item.installment_no || index + 1),
            label:
              String(item.label || "").trim() ||
              `EMI ${Number(item.installment_no || index + 1)}`,
            amount: money(item.amount),
            due_date: optionalDate(item.due_date),
          }))
          .filter((item) => item.amount !== null && item.amount > 0)
      : [];

    const installmentTotal = cleanInstallments.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const registrationAmount = registration_paid ? 999 : 0;
    const requiredInstallmentTotal = Math.max(
      0,
      enrolledPrice - registrationAmount,
    );

    if (
      cleanInstallments.length > 0 &&
      Math.abs(installmentTotal - requiredInstallmentTotal) > 0.01
    ) {
      return error(
        res,
        400,
        `EMI total must be ₹${requiredInstallmentTotal.toLocaleString(
          "en-IN",
        )}.`,
      );
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const createdEnrollment = await tx.enrollment.create({
        data: {
          student_id: student.id,
          batch_id: batch.id,
          payment_status: registration_paid ? "PAID" : "PENDING",
          payment_ref:
            String(payment_ref || "").trim() ||
            (registration_paid ? "ADMIN_MANUAL_ENROLLMENT" : null),
          progress: 0,
          enrolled_price: enrolledPrice,
          original_price:
            originalPrice === null ? enrolledPrice : originalPrice,
          discount_code: "ADMIN_MANUAL_ENROLLMENT",
        },
      });

      if (cleanInstallments.length > 0) {
        await tx.enrollmentInstallment.createMany({
          data: cleanInstallments.map((item) => ({
            enrollment_id: createdEnrollment.id,
            installment_no: item.installment_no,
            label: item.label,
            amount: item.amount,
            due_date: item.due_date,
            status: "PENDING",
            notes: "Created through admin manual enrollment.",
          })),
        });
      }

      return createdEnrollment;
    });

    return success(res, 201, "Student added to batch successfully.", {
      enrollment_id: enrollment.id,
      student,
      batch,
      enrolled_price: enrolledPrice,
      registration_paid: Boolean(registration_paid),
      registration_amount: registrationAmount,
      installment_total: installmentTotal,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return error(
        res,
        409,
        "This student is already enrolled in the selected batch.",
      );
    }

    next(err);
  }
}

module.exports = {
  listManualEnrollmentBatches,
  createManualEnrollment,
};