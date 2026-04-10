/**
 * Batch Controller - Updated
 * Auto-generates session schedule from tutor's syllabus when batch is created
 * Batch name format: "Plastic Product Design - 1 April 2026"
 * Schedule logic: each syllabus session = 1 day, respecting alt_days and sunday_off
 */

const { prisma }         = require("../config/db");
const { success, error } = require("../utils/response");

// ── Helper: generate session dates from start date ────────
function generateSessionDates(startDate, totalSessions, altDays, sundayOff) {
  const dates = [];
  const current = new Date(startDate);
  let count = 0;

  while (count < totalSessions) {
    const day = current.getDay(); // 0=Sun, 6=Sat

    // Skip Sunday if sundayOff is true
    if (sundayOff && day === 0) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    dates.push(new Date(current));
    count++;

    // If alternate days, skip one day after each session
    if (altDays) {
      current.setDate(current.getDate() + 2);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}

// ── Helper: generate batch name ───────────────────────────
function generateBatchName(courseName, startDate) {
  const d     = new Date(startDate);
  const day   = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "long" });
  const year  = String(d.getFullYear()).slice(2); // "26" from 2026
  return `${courseName} - ${day} ${month} ${year}`;
}

// ── TUTOR: Create a batch ──────────────────────────────────
const createBatch = async (req, res, next) => {
  try {
    const {
      course_id, start_date, max_students,
      description, zoom_link, time_slots,
      alt_days = false, sunday_off = true,
    } = req.body;

    const tutorId = req.user.id;

    if (!course_id)  return error(res, 400, "course_id is required.");
    if (!start_date) return error(res, 400, "start_date is required.");

    // Verify tutor is approved for this course
    const application = await prisma.tutorApplication.findFirst({
      where:   { user_id: tutorId, course_id, status: "APPROVED" },
      include: {
        syllabus_sessions: { orderBy: { session_number: "asc" } },
        course:            { select: { name: true, short_name: true } },
      },
    });

    if (!application) {
      return error(res, 403, "You are not approved to teach this course.");
    }

    // Generate batch name
    const batchName = generateBatchName(application.course.name, start_date);

    // Check for duplicate
    const duplicate = await prisma.batch.findFirst({
      where: { tutor_id: tutorId, course_id, name: batchName },
    });
    if (duplicate) {
      return error(res, 409, `Batch "${batchName}" already exists.`);
    }

    const syllabusSessions = application.syllabus_sessions;
    const totalSessions    = syllabusSessions.length;

    // Generate dates for each session
    const sessionDates = generateSessionDates(start_date, totalSessions, alt_days, sunday_off);

    // Calculate end date (last session date)
    const endDate = sessionDates.length > 0
      ? sessionDates[sessionDates.length - 1]
      : new Date(new Date(start_date).setMonth(new Date(start_date).getMonth() + 4));

    // Create batch + sessions in transaction
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: {
          course_id,
          tutor_id:     tutorId,
          name:         batchName,
          start_date:   new Date(start_date),
          end_date:     endDate,
          max_students: parseInt(max_students) || 50,
          description,
          zoom_link,
          time_slots:   time_slots || [],
          status:       "PENDING_APPROVAL",
        },
      });

      // Auto-create scheduled sessions from syllabus with dates
      if (syllabusSessions.length > 0) {
        await tx.scheduledSession.createMany({
          data: syllabusSessions.map((s, idx) => ({
            batch_id:        newBatch.id,
            session_number:  s.session_number,
            name:            s.name,
            type:            s.type,
            scheduled_at:    sessionDates[idx] || null,
            status:          "UPCOMING",
          })),
        });
      }

      return newBatch;
    });

    const fullBatch = await prisma.batch.findUnique({
      where:   { id: batch.id },
      include: {
        course:             { select: { name: true } },
        scheduled_sessions: { orderBy: { session_number: "asc" } },
        _count:             { select: { scheduled_sessions: true } },
      },
    });

    return success(res, 201,
      `Batch "${batchName}" created with ${totalSessions} sessions scheduled. Awaiting admin approval.`,
      fullBatch
    );
  } catch (err) {
    next(err);
  }
};

// ── TUTOR: List my batches ────────────────────────────────
const getMyBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const batches = await prisma.batch.findMany({
      where:   { tutor_id: req.user.id, ...(status && { status }) },
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
const updateBatch = async (req, res, next) => {
  try {
    const batch = await prisma.batch.findFirst({
      where: { id: req.params.id, tutor_id: req.user.id },
    });
    if (!batch) return error(res, 404, "Batch not found.");

    const { zoom_link, description, max_students, status } = req.body;
    const updateData = {};
    if (zoom_link    !== undefined) updateData.zoom_link    = zoom_link;
    if (description  !== undefined) updateData.description  = description;
    if (max_students !== undefined) updateData.max_students = parseInt(max_students);
    if (status       !== undefined) updateData.status       = status;

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data:  updateData,
    });
    return success(res, 200, "Batch updated.", updated);
  } catch (err) {
    next(err);
  }
};

// ── STUDENT: Get enrolled batches ─────────────────────────
const getEnrolledBatches = async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where:   { student_id: req.user.id },
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

// ── SHARED: Batch details + full schedule ─────────────────
const getBatchDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;

    const batch = await prisma.batch.findUnique({
      where:   { id: req.params.id },
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

// ── PUBLIC: Get batches for course (student registration) ─
// Only show UPCOMING batches for current + next 2 months
const getCourseBatchesForRegistration = async (req, res, next) => {
  try {
    const now     = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2); // next 2 months

    const batches = await prisma.batch.findMany({
      where: {
        course_id:  req.params.courseId,
        status:     "UPCOMING",
        start_date: { gte: now, lte: maxDate },
      },
      orderBy: { start_date: "asc" },
      select: {
        id: true, name: true, start_date: true, end_date: true,
        status: true, max_students: true, time_slots: true,
        tutor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });

    const result = batches.map(b => ({
      id:              b.id,
      name:            b.name,
      start_date:      b.start_date,
      end_date:        b.end_date,
      status:          b.status,
      tutor_name:      b.tutor.name,
      time_slots:      b.time_slots || [],
      enrolled:        b._count.enrollments,
      available_seats: b.max_students - b._count.enrollments,
      is_full:         b._count.enrollments >= b.max_students,
    }));

    return success(res, 200, "Available batches.", result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBatch, getMyBatches, updateBatch,
  getEnrolledBatches, getBatchDetails,
  getCourseBatchesForRegistration,
};
