/**
 * Admin Controller
 * All routes require ADMIN role
 * Manages: tutor applications, courses, users, platform stats
 */

const bcrypt     = require("bcryptjs");
const { prisma } = require("../config/db");
const { success, error, paginated } = require("../utils/response");
const { getPagination } = require("../utils/helpers");
const { sendOtp }       = require("../services/otp.service");

// ── STATS: Platform overview ──────────────────────────────
// GET /admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalTutors,
      pendingApplications,
      activeBatches,
      completedBatches,
      totalQueries,
      unresolvedQueries,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "STUDENT", is_active: true } }),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.tutorApplication.count({ where: { status: "PENDING" } }),
      prisma.batch.count({ where: { status: "ACTIVE" } }),
      prisma.batch.count({ where: { status: "COMPLETED" } }),
      prisma.query.count(),
      prisma.query.count({ where: { status: "OPEN" } }),
    ]);

    return success(res, 200, "Platform stats.", {
      totalStudents, activeStudents, totalTutors, pendingApplications,
      activeBatches, completedBatches, totalQueries, unresolvedQueries,
    });
  } catch (err) {
    next(err);
  }
};

// ── TUTOR APPLICATIONS: List ──────────────────────────────
// GET /admin/applications?status=PENDING&page=1
const listApplications = async (req, res, next) => {
  try {
    const { status, page, pageSize } = req.query;
    const { skip, take, page: p, pageSize: ps } = getPagination(page, pageSize);

    const [applications, total] = await Promise.all([
      prisma.tutorApplication.findMany({
        where:   status ? { status } : {},
        skip, take,
        orderBy: { applied_on: "desc" },
        include: {
          course: { select: { name: true } },
          syllabus_sessions: { orderBy: { session_number: "asc" } },
          syllabus_projects: true,
          user:  { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.tutorApplication.count({ where: status ? { status } : {} }),
    ]);

    return paginated(res, applications, total, p, ps, "Applications fetched.");
  } catch (err) {
    next(err);
  }
};

// ── TUTOR APPLICATIONS: Approve ───────────────────────────
// POST /admin/applications/:id/approve
// Creates tutor user account, sends temporary password via SMS
const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.tutorApplication.findUnique({
      where:   { id },
      include: { course: true },
    });

    if (!application)                    return error(res, 404, "Application not found.");
    if (application.status !== "PENDING") return error(res, 400, "Application already reviewed.");

    // Check if email/phone already registered
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email: application.email } }),
      prisma.user.findUnique({ where: { phone: application.phone } }),
    ]);
    if (existingEmail) return error(res, 409, "Email already registered as a user.");
    if (existingPhone) return error(res, 409, "Phone already registered as a user.");

    // Generate temporary password
    const tempPassword    = `DCT@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const password_hash   = await bcrypt.hash(tempPassword, 12);

    const { tutorUser } = await prisma.$transaction(async (tx) => {
      // 1. Create tutor user account
      const tutorUser = await tx.user.create({
        data: {
          name:         application.name,
          email:        application.email,
          phone:        application.phone,
          password_hash,
          role:         "TUTOR",
          is_verified:  true,
          is_active:    true,
        },
      });

      // 2. Link application to user + mark approved
      await tx.tutorApplication.update({
        where: { id },
        data: {
          status:      "APPROVED",
          reviewed_on: new Date(),
          user_id:     tutorUser.id,
        },
      });

      return { tutorUser };
    });

    // Send credentials via SMS (in dev, prints to console)
    await sendOtp(application.phone, "TUTOR_REGISTER").catch(console.error);

    // In production: also send email with temp password
    console.log(`\n🎓 Tutor approved: ${application.name}`);
    console.log(`   Temp password: ${tempPassword}`);
    console.log(`   (In production this would be sent via SMS/email)\n`);

    return success(res, 200, "Application approved. Tutor account created and credentials sent.", {
      tutor_id:  tutorUser.id,
      name:      application.name,
      email:     application.email,
      // Only return temp password in dev
      ...(process.env.NODE_ENV === "development" && { temp_password: tempPassword }),
    });
  } catch (err) {
    next(err);
  }
};

// ── TUTOR APPLICATIONS: Reject ────────────────────────────
// POST /admin/applications/:id/reject
const rejectApplication = async (req, res, next) => {
  try {
    const { rejection_note } = req.body;

    const application = await prisma.tutorApplication.findUnique({ where: { id: req.params.id } });
    if (!application)                    return error(res, 404, "Application not found.");
    if (application.status !== "PENDING") return error(res, 400, "Application already reviewed.");

    await prisma.tutorApplication.update({
      where: { id: req.params.id },
      data: { status: "REJECTED", reviewed_on: new Date(), rejection_note },
    });

    return success(res, 200, "Application rejected.");
  } catch (err) {
    next(err);
  }
};

// ── STUDENTS: List all ────────────────────────────────────
// GET /admin/students?search=name&page=1
const listStudents = async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;
    const { skip, take, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = {
      role: "STUDENT",
      ...(search && {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take,
        orderBy: { created_at: "desc" },
        select: {
          id: true, name: true, email: true, phone: true,
          is_active: true, created_at: true,
          enrollments: {
            include: {
              batch: {
                select: { name: true, course: { select: { name: true } }, tutor: { select: { name: true } } }
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

// ── TUTORS: List approved tutors ──────────────────────────
// GET /admin/tutors
const listTutors = async (req, res, next) => {
  try {
    const tutors = await prisma.user.findMany({
      where:   { role: "TUTOR" },
      orderBy: { created_at: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, is_active: true,
        tutor_application: {
          select: { course: { select: { name: true } }, years_exp: true, location: true },
        },
        tutor_batches: {
          select: { id: true, status: true, _count: { select: { enrollments: true } } },
        },
      },
    });
    return success(res, 200, "Tutors fetched.", tutors);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: List all batches ───────────────────────────────
// GET /admin/batches?status=ACTIVE
const listAllBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const batches = await prisma.batch.findMany({
      where:   status ? { status } : {},
      orderBy: { start_date: "desc" },
      include: {
        course: { select: { name: true } },
        tutor:  { select: { name: true } },
        _count: { select: { enrollments: true, scheduled_sessions: true } },
      },
    });
    return success(res, 200, "All batches.", batches);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: List all queries ───────────────────────────────
// GET /admin/queries?status=OPEN
const listAllQueries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const queries = await prisma.query.findMany({
      where:   status ? { status } : {},
      orderBy: { created_at: "desc" },
      include: {
        student: { select: { name: true } },
        session: { select: { name: true, session_number: true } },
      },
    });
    return success(res, 200, "All queries.", queries);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: Deactivate/reactivate user ─────────────────────
// PATCH /admin/users/:id/status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return error(res, 404, "User not found.");
    if (user.role === "ADMIN") return error(res, 400, "Cannot deactivate admin accounts.");

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data:  { is_active: !user.is_active },
      select: { id: true, name: true, is_active: true },
    });

    return success(res, 200, `User ${updated.is_active ? "activated" : "deactivated"}.`, updated);
  } catch (err) {
    next(err);
  }
};

const listPendingBatches = async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where:   { status: "PENDING_APPROVAL" },
      orderBy: { created_at: "desc" },
      include: {
        course: { select: { name: true } },
        tutor:  { select: { name: true, email: true } },
        _count: { select: { scheduled_sessions: true, enrollments: true } },
      },
    });
    return success(res, 200, "Pending batches.", batches);
  } catch (err) { next(err); }
};

const approveBatch = async (req, res, next) => {
  try {
    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data:  { status: "UPCOMING" },
    });
    return success(res, 200, "Batch approved.", updated);
  } catch (err) { next(err); }
};

const rejectBatch = async (req, res, next) => {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } });
    return success(res, 200, "Batch rejected and removed.");
  } catch (err) { next(err); }
};

module.exports = {
  getStats,
  listApplications,
  approveApplication,
  rejectApplication,
  listStudents,
  listTutors,
  listAllBatches,
  listAllQueries,
  toggleUserStatus,
  listPendingBatches,
  approveBatch,
  rejectBatch,
};
