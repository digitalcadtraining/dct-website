/**
 * Batch Controller
 * Tutor creates batches → batch name auto-generated from course + date
 * When batch created, syllabus sessions auto-copied from tutor's approved application
 * Students see available batches during registration
 */

const { prisma }         = require("../config/db");
const { success, error } = require("../utils/response");
const { generateBatchName } = require("../utils/helpers");

// ── TUTOR: Create a batch ──────────────────────────────────
// POST /batches
// Auto-generates name: "Plastic Product Design - April 2025"
// Auto-copies syllabus from tutor's approved application
const createBatch = async (req, res, next) => {
  try {
    const { course_id, start_date, end_date, max_students, description, zoom_link } = req.body;
    const tutorId = req.user.id;

    if (!course_id || !start_date || !end_date) {
      return error(res, 400, "course_id, start_date, end_date are required.");
    }

    // Verify tutor is approved for this course
    const application = await prisma.tutorApplication.findFirst({
      where: {
        user_id:   tutorId,
        course_id,
        status:    "APPROVED",
      },
      include: {
        syllabus_sessions: { orderBy: { session_number: "asc" } },
        course:            { select: { name: true, short_name: true } },
      },
    });

    if (!application) {
      return error(res, 403, "You are not approved to teach this course.");
    }

    // Auto-generate batch name
    const batchName = generateBatchName(application.course.name, start_date);

    // Check for duplicate batch name (same tutor, same course, same month)
    const duplicate = await prisma.batch.findFirst({
      where: { tutor_id: tutorId, course_id, name: batchName },
    });
    if (duplicate) {
      return error(res, 409, `A batch named "${batchName}" already exists.`);
    }

    // Create batch AND copy syllabus sessions in a transaction
    const batch = await prisma.$transaction(async (tx) => {
      // 1. Create the batch
      const newBatch = await tx.batch.create({
        data: {
          course_id,
          tutor_id:    tutorId,
          name:        batchName,
          start_date:  new Date(start_date),
          end_date:    new Date(end_date),
          max_students: parseInt(max_students) || 50,
          description,
          zoom_link,
          status: "UPCOMING",
        },
      });

      // 2. Copy syllabus sessions from application → batch
      if (application.syllabus_sessions.length > 0) {
        await tx.scheduledSession.createMany({
          data: application.syllabus_sessions.map(s => ({
            batch_id:       newBatch.id,
            session_number: s.session_number,
            name:           s.name,
            type:           s.type,
            status:         "UPCOMING",
          })),
        });
      }

      return newBatch;
    });

    // Fetch complete batch with session count
    const fullBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course:            { select: { name: true } },
        scheduled_sessions: { orderBy: { session_number: "asc" }, select: { id: true, session_number: true, name: true, type: true } },
        _count: { select: { enrollments: true } },
      },
    });

    return success(res, 201, `Batch "${batchName}" created with ${fullBatch.scheduled_sessions.length} sessions.`, fullBatch);
  } catch (err) {
    next(err);
  }
};

// ── TUTOR: List my batches ────────────────────────────────
// GET /batches/mine
const getMyBatches = async (req, res, next) => {
  try {
    const { status } = req.query;

    const batches = await prisma.batch.findMany({
      where: {
        tutor_id: req.user.id,
        ...(status && { status }),
      },
      orderBy: { start_date: "desc" },
      include: {
        course: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, scheduled_sessions: true } },
      },
    });

    return success(res, 200, "Your batches.", batches);
  } catch (err) {
    next(err);
  }
};

// ── TUTOR: Update batch ───────────────────────────────────
// PATCH /batches/:id
const updateBatch = async (req, res, next) => {
  try {
    const batch = await prisma.batch.findFirst({
      where: { id: req.params.id, tutor_id: req.user.id },
    });
    if (!batch) return error(res, 404, "Batch not found.");

    const { zoom_link, description, max_students, status } = req.body;
    const updateData = {};
    if (zoom_link     !== undefined) updateData.zoom_link     = zoom_link;
    if (description   !== undefined) updateData.description   = description;
    if (max_students  !== undefined) updateData.max_students  = parseInt(max_students);
    if (status        !== undefined) updateData.status        = status;

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data:  updateData,
    });

    return success(res, 200, "Batch updated.", updated);
  } catch (err) {
    next(err);
  }
};

// ── STUDENT: Get my enrolled batches ─────────────────────
// GET /batches/enrolled
const getEnrolledBatches = async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: req.user.id },
      include: {
        batch: {
          include: {
            course: { select: { id: true, name: true, slug: true, thumbnail_url: true } },
            tutor:  { select: { name: true } },
            _count: { select: { scheduled_sessions: true, assignments: true } },
          },
        },
      },
    });

    const result = enrollments.map(e => ({
      enrollment_id:  e.id,
      enrolled_at:    e.enrolled_at,
      payment_status: e.payment_status,
      progress:       e.progress,
      batch:          e.batch,
    }));

    return success(res, 200, "Your enrolled courses.", result);
  } catch (err) {
    next(err);
  }
};

// ── SHARED: Get batch details + syllabus ─────────────────
// GET /batches/:id
const getBatchDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;

    // Verify access: student must be enrolled, tutor must own it, admin can see all
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        course:  { select: { name: true, slug: true, tools_covered: true } },
        tutor:   { select: { name: true } },
        scheduled_sessions: {
          orderBy: { session_number: "asc" },
          include: {
            assignments: { select: { id: true, title: true, due_date: true } },
          },
        },
        assignments: { orderBy: { created_at: "asc" } },
      },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    if (role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { student_id: userId, batch_id: req.params.id },
      });
      if (!enrollment) return error(res, 403, "You are not enrolled in this batch.");
    } else if (role === "TUTOR" && batch.tutor_id !== userId) {
      return error(res, 403, "You do not own this batch.");
    }

    return success(res, 200, "Batch details.", batch);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBatch, getMyBatches, updateBatch, getEnrolledBatches, getBatchDetails };
