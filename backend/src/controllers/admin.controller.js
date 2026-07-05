const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { success, error, paginated } = require("../utils/response");
const { getPagination } = require("../utils/helpers");
const { sendOtp } = require("../services/otp.service");

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function safePct(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function normalizeMoney(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function normalizeDateTime(value) {
  if (value === "" || value === null || value === undefined) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function attachBatchPricing(batches = []) {
  if (!batches.length) return batches;
  const ids = batches.map((b) => b.id);
  try {
    const rows = await prisma.$queryRaw`
      SELECT id, offer_name, original_price, offer_price, offer_start_at, offer_end_at
      FROM batches
      WHERE id = ANY(${ids})
    `;
    const map = new Map(rows.map((r) => [r.id, r]));
    return batches.map((batch) => ({ ...batch, ...(map.get(batch.id) || {}) }));
  } catch (err) {
    return batches;
  }
}

async function calculateRevenue(where = {}) {
  const paidEnrollments = await prisma.enrollment.findMany({
    where: { payment_status: "PAID", ...where },
    select: { batch: { select: { course: { select: { price: true } } } } },
  });
  return paidEnrollments.reduce(
    (sum, item) => sum + toNumber(item.batch?.course?.price),
    0,
  );
}

const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      totalStudents,
      activeStudents,
      totalTutors,
      pendingApplications,
      activeBatches,
      completedBatches,
      upcomingBatches,
      pendingBatches,
      totalQueries,
      unresolvedQueries,
      paidEnrollments,
      totalRevenue,
      monthRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "STUDENT", is_active: true } }),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.tutorApplication.count({ where: { status: "PENDING" } }),
      prisma.batch.count({ where: { status: "ACTIVE" } }),
      prisma.batch.count({ where: { status: "COMPLETED" } }),
      prisma.batch.count({ where: { status: "UPCOMING" } }),
      prisma.batch.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.query.count(),
      prisma.query.count({ where: { status: "OPEN" } }),
      prisma.enrollment.count({ where: { payment_status: "PAID" } }),
      calculateRevenue(),
      calculateRevenue({ enrolled_at: { gte: monthStart } }),
    ]);
    const resolvedQueries = Math.max(0, totalQueries - unresolvedQueries);
    const totalBatches =
      activeBatches + completedBatches + upcomingBatches + pendingBatches;
    return success(res, 200, "Platform stats.", {
      totalStudents,
      activeStudents,
      totalTutors,
      pendingApplications,
      activeBatches,
      completedBatches,
      upcomingBatches,
      pendingBatches,
      totalBatches,
      totalQueries,
      unresolvedQueries,
      resolvedQueries,
      paidEnrollments,
      totalRevenue,
      monthRevenue,
      health: {
        activeStudentPct: safePct(activeStudents, totalStudents),
        queryResolutionPct: safePct(resolvedQueries, totalQueries),
        batchCompletionPct: safePct(completedBatches, totalBatches),
      },
    });
  } catch (err) {
    next(err);
  }
};

const listApplications = async (req, res, next) => {
  try {
    const { status, page, pageSize } = req.query;
    const { skip, take, page: p, pageSize: ps } = getPagination(page, pageSize);
    const where = status ? { status } : {};
    const [applications, total] = await Promise.all([
      prisma.tutorApplication.findMany({
        where,
        skip,
        take,
        orderBy: { applied_on: "desc" },
        include: {
          course: { select: { name: true } },
          syllabus_sessions: { orderBy: { session_number: "asc" } },
          syllabus_projects: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.tutorApplication.count({ where }),
    ]);
    return paginated(res, applications, total, p, ps, "Applications fetched.");
  } catch (err) {
    next(err);
  }
};

const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await prisma.tutorApplication.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!application) return error(res, 404, "Application not found.");
    if (application.status !== "PENDING")
      return error(res, 400, "Application already reviewed.");
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email: application.email } }),
      prisma.user.findUnique({ where: { phone: application.phone } }),
    ]);
    if (existingEmail)
      return error(res, 409, "Email already registered as a user.");
    if (existingPhone)
      return error(res, 409, "Phone already registered as a user.");
    const tempPassword = `DCT@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const password_hash = await bcrypt.hash(tempPassword, 12);
    const { tutorUser } = await prisma.$transaction(async (tx) => {
      const tutorUser = await tx.user.create({
        data: {
          name: application.name,
          email: application.email,
          phone: application.phone,
          password_hash,
          role: "TUTOR",
          is_verified: true,
          is_active: true,
        },
      });
      await tx.tutorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewed_on: new Date(),
          user_id: tutorUser.id,
        },
      });
      return { tutorUser };
    });
    await sendOtp(application.phone, "TUTOR_REGISTER").catch(console.error);
    console.log(`\n🎓 Tutor approved: ${application.name}`);
    console.log(`   Temp password: ${tempPassword}\n`);
    return success(
      res,
      200,
      "Application approved. Tutor account created and credentials sent.",
      {
        tutor_id: tutorUser.id,
        name: application.name,
        email: application.email,
        ...(process.env.NODE_ENV === "development" && {
          temp_password: tempPassword,
        }),
      },
    );
  } catch (err) {
    next(err);
  }
};

const rejectApplication = async (req, res, next) => {
  try {
    const { rejection_note } = req.body;
    const application = await prisma.tutorApplication.findUnique({
      where: { id: req.params.id },
    });
    if (!application) return error(res, 404, "Application not found.");
    if (application.status !== "PENDING")
      return error(res, 400, "Application already reviewed.");
    await prisma.tutorApplication.update({
      where: { id: req.params.id },
      data: { status: "REJECTED", reviewed_on: new Date(), rejection_note },
    });
    return success(res, 200, "Application rejected.");
  } catch (err) {
    next(err);
  }
};

const listStudents = async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;
    const {
      skip,
      take,
      page: p,
      pageSize: ps,
    } = getPagination(page, pageSize || 50);
    const where = {
      role: "STUDENT",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }),
    };
    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
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
              batch: {
                select: {
                  id: true,
                  name: true,
                  start_date: true,
                  end_date: true,
                  status: true,
                  course: { select: { name: true } },
                  tutor: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return paginated(res, students, total, p, ps, "Students fetched.");
  } catch (err) {
    next(err);
  }
};

const listTutors = async (req, res, next) => {
  try {
    const tutors = await prisma.user.findMany({
      where: { role: "TUTOR" },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
        tutor_application: {
          select: {
            course: { select: { name: true } },
            years_exp: true,
            location: true,
            occupation: true,
          },
        },
        tutor_batches: {
          select: {
            id: true,
            status: true,
            _count: { select: { enrollments: true, scheduled_sessions: true } },
          },
        },
      },
    });
    return success(res, 200, "Tutors fetched.", tutors);
  } catch (err) {
    next(err);
  }
};

const updateBatchPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!batch) return error(res, 404, "Batch not found.");

    const offer_name =
      String(req.body.offer_name || "").trim() || "Limited Batch Offer";
    const original_price = normalizeMoney(req.body.original_price);
    const offer_price = normalizeMoney(req.body.offer_price);
    const offer_start_at = normalizeDateTime(req.body.offer_start_at);
    const offer_end_at = normalizeDateTime(req.body.offer_end_at);

    if (!original_price || !offer_price)
      return error(res, 400, "Original price and offer price are required.");
    if (offer_price > original_price)
      return error(
        res,
        400,
        "Offer price cannot be greater than original price.",
      );
    if (offer_start_at && offer_end_at && offer_end_at <= offer_start_at) {
      return error(
        res,
        400,
        "Offer end date/time must be after offer start date/time.",
      );
    }

    await prisma.$executeRaw`
      UPDATE batches
      SET offer_name = ${offer_name},
          original_price = ${original_price},
          offer_price = ${offer_price},
          offer_start_at = ${offer_start_at},
          offer_end_at = ${offer_end_at},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    const rows = await prisma.$queryRaw`
      SELECT id, offer_name, original_price, offer_price, offer_start_at, offer_end_at
      FROM batches
      WHERE id = ${id}
      LIMIT 1
    `;

    return success(res, 200, "Batch pricing and offer timer updated.", {
      ...batch,
      ...(rows[0] || {}),
    });
  } catch (err) {
    next(err);
  }
};

const listAllBatches = async (req, res, next) => {
  try {
    const { status } = req.query;

    const batches = await prisma.batch.findMany({
      where: status ? { status } : {},
      orderBy: { start_date: "desc" },
      include: {
        course: { select: { name: true, price: true } },
        tutor: { select: { name: true, email: true } },
        enrollments: {
          select: {
            payment_status: true,
            student: {
              select: {
                is_active: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            scheduled_sessions: true,
            assignments: true,
          },
        },
      },
    });

    const withPricing = await attachBatchPricing(batches);

    const finalBatches = withPricing.map((b) => {
      const activeStudents = (b.enrollments || []).filter(
        (e) => e.student?.is_active === true,
      ).length;

      const paidStudents = (b.enrollments || []).filter(
        (e) => e.payment_status === "PAID",
      ).length;

      const { enrollments, ...rest } = b;

      return {
        ...rest,
        active_students_count: activeStudents,
        paid_students_count: paidStudents,
      };
    });

    return success(res, 200, "All batches.", finalBatches);
  } catch (err) {
    next(err);
  }
};

const resolveQuery = async (req, res, next) => {
  try {
    const q = await prisma.query.findUnique({ where: { id: req.params.id } });
    if (!q) return error(res, 404, "Query not found.");
    const updated = await prisma.query.update({
      where: { id: req.params.id },
      data: {
        status: "RESOLVED",
        answered_at: q.answered_at || new Date(),
        answer: q.answer || "Marked resolved by admin.",
      },
      include: {
        student: { select: { name: true, email: true } },
        session: { select: { name: true, session_number: true } },
        batch: { select: { name: true } },
      },
    });
    return success(res, 200, "Query marked as resolved.", updated);
  } catch (err) {
    next(err);
  }
};

const listAllQueries = async (req, res, next) => {
  try {
    const { status } = req.query;

    const queries = await prisma.query.findMany({
      where: status ? { status } : {},
      orderBy: { created_at: "desc" },
      include: {
        student: { select: { name: true, email: true, phone: true } },
        session: { select: { name: true, session_number: true } },
        batch: {
          select: {
            name: true,
            course: { select: { name: true } },
            tutor: { select: { name: true } },
          },
        },
      },
    });

    return success(res, 200, "All queries.", queries);
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return error(res, 404, "User not found.");
    if (user.role === "ADMIN")
      return error(res, 400, "Cannot deactivate admin accounts.");
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active: !user.is_active },
      select: { id: true, name: true, is_active: true },
    });
    return success(
      res,
      200,
      `User ${updated.is_active ? "activated" : "deactivated"}.`,
      updated,
    );
  } catch (err) {
    next(err);
  }
};

const listPendingBatches = async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { created_at: "desc" },
      include: {
        course: { select: { name: true, price: true } },
        tutor: { select: { name: true, email: true } },
        _count: { select: { scheduled_sessions: true, enrollments: true } },
      },
    });
    const withPricing = await attachBatchPricing(batches);
    return success(res, 200, "Pending batches.", withPricing);
  } catch (err) {
    next(err);
  }
};

const approveBatch = async (req, res, next) => {
  try {
    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: { status: "UPCOMING" },
    });
    return success(res, 200, "Batch approved.", updated);
  } catch (err) {
    next(err);
  }
};

const rejectBatch = async (req, res, next) => {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } });
    return success(res, 200, "Batch rejected and removed.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  listApplications,
  approveApplication,
  rejectApplication,
  listStudents,
  listTutors,
  listAllBatches,
  updateBatchPricing,
  listAllQueries,
  resolveQuery,
  toggleUserStatus,
  listPendingBatches,
  approveBatch,
  rejectBatch,
};
