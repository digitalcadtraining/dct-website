const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

const ALLOWED_METHODS = new Set([
  "UPI",
  "CASH",
  "BANK_TRANSFER",
  "PHONEPE",
  "GPAY",
  "INSTAMOJO",
  "OTHER",
]);

function virtualStatus(installment, now = new Date()) {
  if (String(installment?.status || "").toUpperCase() === "PAID" || installment?.paid_at) {
    return "PAID";
  }
  if (installment?.due_date && new Date(installment.due_date) < now) return "DUE";
  return "PENDING";
}

function serializeInstallment(item, now = new Date()) {
  return {
    ...item,
    amount: Number(item.amount || 0),
    display_status: virtualStatus(item, now),
  };
}

function summarizeEnrollment(enrollment, now = new Date()) {
  const installments = (enrollment.installments || [])
    .map((item) => serializeInstallment(item, now))
    .sort((a, b) => a.installment_no - b.installment_no);

  const installmentReceived = installments
    .filter((item) => item.display_status === "PAID")
    .reduce((sum, item) => sum + item.amount, 0);

  const pending = installments
    .filter((item) => item.display_status !== "PAID")
    .reduce((sum, item) => sum + item.amount, 0);

  const overdue = installments
    .filter((item) => item.display_status === "DUE")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    ...enrollment,
    enrolled_price: Number(enrollment.enrolled_price || 0),
    original_price: Number(enrollment.original_price || 0),
    registration_received: 999,
    installments,
    payment_summary: {
      installment_received: installmentReceived,
      total_received: 999 + installmentReceived,
      pending,
      overdue,
      balance: pending,
      has_third_installment: installments.some((item) => item.installment_no >= 3),
    },
  };
}

const enrollmentInclude = {
  batch: {
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      status: true,
      course: { select: { id: true, name: true, slug: true } },
    },
  },
  installments: {
    orderBy: { installment_no: "asc" },
  },
};

const adminTracker = async (req, res, next) => {
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
          include: enrollmentInclude,
        },
      },
    });

    const now = new Date();
    const data = students.map((student) => ({
      ...student,
      enrollments: student.enrollments.map((enrollment) =>
        summarizeEnrollment(enrollment, now),
      ),
    }));

    const enrollments = data.flatMap((student) => student.enrollments);
    const installments = enrollments.flatMap((enrollment) => enrollment.installments);

    const summary = {
      total_students: data.length,
      active_students: data.filter((student) => student.is_active).length,
      disabled_students: data.filter((student) => !student.is_active).length,
      registration_received: enrollments.length * 999,
      emi_received: installments
        .filter((item) => item.display_status === "PAID")
        .reduce((sum, item) => sum + item.amount, 0),
      pending_emi: installments
        .filter((item) => item.display_status === "PENDING")
        .reduce((sum, item) => sum + item.amount, 0),
      overdue_emi: installments
        .filter((item) => item.display_status === "DUE")
        .reduce((sum, item) => sum + item.amount, 0),
    };

    return success(res, 200, "Installment tracker fetched.", { students: data, summary });
  } catch (err) {
    next(err);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const installment = await prisma.enrollmentInstallment.findUnique({
      where: { id: req.params.id },
    });
    if (!installment) return error(res, 404, "Installment not found.");

    const method = String(req.body.payment_method || "OTHER").toUpperCase();
    const updated = await prisma.enrollmentInstallment.update({
      where: { id: installment.id },
      data: {
        status: "PAID",
        paid_at: req.body.paid_at ? new Date(req.body.paid_at) : new Date(),
        payment_method: ALLOWED_METHODS.has(method) ? method : "OTHER",
        payment_ref: String(req.body.payment_ref || "").trim() || null,
        notes: String(req.body.notes || "").trim() || null,
      },
    });

    return success(res, 200, "Installment marked paid.", serializeInstallment(updated));
  } catch (err) {
    next(err);
  }
};

const markPending = async (req, res, next) => {
  try {
    const updated = await prisma.enrollmentInstallment.update({
      where: { id: req.params.id },
      data: {
        status: "PENDING",
        paid_at: null,
        payment_method: null,
        payment_ref: null,
        notes: String(req.body.notes || "").trim() || null,
      },
    });
    return success(res, 200, "Installment reset to pending.", serializeInstallment(updated));
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "Installment not found.");
    next(err);
  }
};

const mine = async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: req.user.id },
      orderBy: { enrolled_at: "desc" },
      include: enrollmentInclude,
    });

    return success(
      res,
      200,
      "Your payment schedule fetched.",
      enrollments.map((enrollment) => summarizeEnrollment(enrollment)),
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { adminTracker, markPaid, markPending, mine };
