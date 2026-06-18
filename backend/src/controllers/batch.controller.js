const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

function generateSessionDates(startDate, totalSessions, altDays, sundayOff) {
  const dates = [];
  const current = new Date(startDate);
  let count = 0;
  while (count < totalSessions) {
    const day = current.getDay();
    if (sundayOff && day === 0) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    dates.push(new Date(current));
    count++;
    current.setDate(current.getDate() + (altDays ? 2 : 1));
  }
  return dates;
}

function generateBatchName(courseName, startDate) {
  const d = new Date(startDate);
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "long" });
  const year = String(d.getFullYear()).slice(2);
  return `${courseName} - ${day} ${month} ${year}`;
}

function projectMeta(project) {
  const h = project?.highlights;
  if (h && typeof h === "object" && !Array.isArray(h)) return h;
  if (Array.isArray(h)) {
    const isRecorded = h.includes("RECORDED_DATA");
    return { is_recorded: isRecorded, delivery_mode: isRecorded ? "RECORDED" : "LIVE", unlock_rule: isRecorded ? "FIRST_LIVE_PROJECT_START" : null, sessions: [] };
  }
  return { is_recorded: false, delivery_mode: "LIVE", unlock_rule: null, sessions: [] };
}

function isRecordedProject(project) {
  const meta = projectMeta(project);
  return Boolean(meta.is_recorded || meta.delivery_mode === "RECORDED");
}

function projectToStudent(project) {
  const meta = projectMeta(project);
  return {
    id: project.id,
    name: project.name,
    is_recorded: isRecordedProject(project),
    delivery_mode: isRecordedProject(project) ? "RECORDED" : "LIVE",
    unlock_rule: meta.unlock_rule || (isRecordedProject(project) ? "FIRST_LIVE_PROJECT_START" : null),
  };
}

function liveProjectSessions(project) {
  const meta = projectMeta(project);
  if (isRecordedProject(project)) return [];
  return Array.isArray(meta.sessions) ? meta.sessions.filter((s) => s?.name) : [];
}

function buildLiveSessionItems(syllabusSessions = [], syllabusProjects = []) {
  const general = syllabusSessions.map((s) => ({ name: s.name, type: s.type || "BOTH" }));
  const projectItems = [];
  for (const project of syllabusProjects) {
    liveProjectSessions(project).forEach((s) => {
      projectItems.push({ name: `Project: ${project.name} - ${s.name}`, type: "CAD" });
    });
  }
  return [...general, ...projectItems].map((item, idx) => ({ ...item, session_number: idx + 1 }));
}

async function getTutorCourseProjectMap(pairs) {
  const uniquePairs = [];
  const seen = new Set();

  for (const pair of pairs) {
    if (!pair?.tutor_id || !pair?.course_id) continue;
    const key = `${pair.tutor_id}:${pair.course_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniquePairs.push(pair);
  }

  if (!uniquePairs.length) return new Map();

  const applications = await prisma.tutorApplication.findMany({
    where: {
      status: "APPROVED",
      OR: uniquePairs.map((p) => ({ user_id: p.tutor_id, course_id: p.course_id })),
    },
    include: {
      syllabus_projects: true,
    },
  });

  const map = new Map();
  for (const app of applications) {
    const key = `${app.user_id}:${app.course_id}`;
    const recorded = (app.syllabus_projects || [])
      .filter(isRecordedProject)
      .map(projectToStudent);
    map.set(key, recorded);
  }

  return map;
}

const createBatch = async (req, res, next) => {
  try {
    const { course_id, start_date, max_students, description, zoom_link, time_slots, alt_days = false, sunday_off = true } = req.body;
    const tutorId = req.user.id;

    if (!course_id) return error(res, 400, "course_id is required.");
    if (!start_date) return error(res, 400, "start_date is required.");

    const normalizedSlots = Array.isArray(time_slots)
      ? time_slots.filter(Boolean)
      : typeof time_slots === "string" && time_slots.trim()
        ? [time_slots.trim()]
        : [];

    if (normalizedSlots.length === 0) {
      return error(res, 400, "At least one class time slot is required.");
    }

    const application = await prisma.tutorApplication.findFirst({
      where: { user_id: tutorId, course_id, status: "APPROVED" },
      include: {
        syllabus_sessions: { orderBy: { session_number: "asc" } },
        syllabus_projects: true,
        course: { select: { name: true, short_name: true } },
      },
    });

    if (!application) return error(res, 403, "You are not approved to teach this course.");

    const batchName = generateBatchName(application.course.name, start_date);

    const duplicate = await prisma.batch.findFirst({ where: { tutor_id: tutorId, course_id, name: batchName } });
    if (duplicate) return error(res, 409, `Batch "${batchName}" already exists.`);

    const liveItems = buildLiveSessionItems(application.syllabus_sessions || [], application.syllabus_projects || []);
    const totalSessions = liveItems.length;
    if (totalSessions === 0) return error(res, 400, "No approved live sessions found for this course. Please contact admin.");

    const sessionDates = generateSessionDates(start_date, totalSessions, Boolean(alt_days), Boolean(sunday_off));
    const endDate = sessionDates.length > 0
      ? sessionDates[sessionDates.length - 1]
      : new Date(new Date(start_date).setMonth(new Date(start_date).getMonth() + 4));

    const recordedProjects = (application.syllabus_projects || []).filter(isRecordedProject).map(projectToStudent);

    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: {
          course_id,
          tutor_id: tutorId,
          name: batchName,
          start_date: new Date(start_date),
          end_date: endDate,
          max_students: parseInt(max_students) || 50,
          description: description || null,
          zoom_link: zoom_link || null,
          time_slots: normalizedSlots,
          status: "PENDING_APPROVAL",
        },
      });

      await tx.scheduledSession.createMany({
        data: liveItems.map((s, idx) => ({
          batch_id: newBatch.id,
          session_number: s.session_number,
          name: s.name,
          type: s.type || "CAD",
          scheduled_at: sessionDates[idx] || null,
          status: "UPCOMING",
        })),
      });

      return newBatch;
    });

    const fullBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: { select: { name: true } },
        scheduled_sessions: { orderBy: { session_number: "asc" } },
        _count: { select: { scheduled_sessions: true, enrollments: true } },
      },
    });

    return success(res, 201, `Batch "${batchName}" created with ${totalSessions} live sessions scheduled. ${recordedProjects.length} recorded project(s) will unlock with the first live project. Awaiting admin approval.`, {
      ...fullBatch,
      recorded_projects: recordedProjects,
    });
  } catch (err) {
    next(err);
  }
};

const getMyBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const batches = await prisma.batch.findMany({
      where: { tutor_id: req.user.id, ...(status && { status }) },
      orderBy: { start_date: "desc" },
      include: {
        course: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, scheduled_sessions: true } },
      },
    });
    return success(res, 200, "Your batches.", batches);
  } catch (err) { next(err); }
};

const updateBatch = async (req, res, next) => {
  try {
    const batch = await prisma.batch.findFirst({ where: { id: req.params.id, tutor_id: req.user.id } });
    if (!batch) return error(res, 404, "Batch not found.");

    const { zoom_link, description, max_students, status, time_slots } = req.body;
    const updateData = {};
    if (zoom_link !== undefined) updateData.zoom_link = zoom_link || null;
    if (description !== undefined) updateData.description = description || null;
    if (max_students !== undefined) updateData.max_students = parseInt(max_students);
    if (status !== undefined) updateData.status = status;
    if (time_slots !== undefined) updateData.time_slots = Array.isArray(time_slots) ? time_slots : [];

    const updated = await prisma.batch.update({ where: { id: req.params.id }, data: updateData });
    return success(res, 200, "Batch updated.", updated);
  } catch (err) { next(err); }
};

function progressFromAssignments(batch, storedProgress = 0) {
  const assignments = Array.isArray(batch.assignments) ? batch.assignments : [];
  const total = assignments.length;
  if (total === 0) return Math.max(0, Math.min(100, Math.round(Number(storedProgress || 0))));

  const submitted = assignments.filter((a) => Array.isArray(a.submissions) && a.submissions.length > 0).length;
  return Math.round((submitted / total) * 100);
}

const getEnrolledBatches = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      include: {
        batch: {
          include: {
            course: { select: { id: true, name: true, slug: true, thumbnail_url: true } },
            tutor: { select: { name: true } },
            assignments: {
              select: {
                id: true,
                submissions: {
                  where: { student_id: studentId },
                  select: { id: true, status: true, submitted_at: true },
                },
              },
            },
            _count: { select: { scheduled_sessions: true, assignments: true } },
          },
        },
      },
    });

    const projectMap = await getTutorCourseProjectMap(
      enrollments.map((e) => ({
        tutor_id: e.batch?.tutor_id,
        course_id: e.batch?.course_id,
      })),
    );

    const result = enrollments.map(e => {
      const batch = e.batch || {};
      const progress = progressFromAssignments(batch, e.progress);
      const { assignments, ...cleanBatch } = batch;
      const key = `${batch.tutor_id}:${batch.course_id}`;

      return {
        enrollment_id: e.id,
        enrolled_at: e.enrolled_at,
        payment_status: e.payment_status,
        progress,
        batch: {
          ...cleanBatch,
          recorded_projects: projectMap.get(key) || [],
        },
      };
    });

    return success(res, 200, "Your enrolled courses.", result);
  } catch (err) { next(err); }
};

const getBatchDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { name: true, slug: true, tools_covered: true } },
        tutor: { select: { name: true } },
        scheduled_sessions: {
          orderBy: { session_number: "asc" },
          include: { assignments: { select: { id: true, title: true, due_date: true } } },
        },
        assignments: { orderBy: { created_at: "asc" } },
      },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    if (role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({ where: { student_id: userId, batch_id: req.params.id } });
      if (!enrollment) return error(res, 403, "You are not enrolled in this batch.");
    } else if (role === "TUTOR" && batch.tutor_id !== userId) {
      return error(res, 403, "You do not own this batch.");
    }

    const projectMap = await getTutorCourseProjectMap([{ tutor_id: batch.tutor_id, course_id: batch.course_id }]);
    return success(res, 200, "Batch details.", {
      ...batch,
      recorded_projects: projectMap.get(`${batch.tutor_id}:${batch.course_id}`) || [],
    });
  } catch (err) { next(err); }
};

const getCourseBatchesForRegistration = async (req, res, next) => {
  try {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 10);
    minDate.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    maxDate.setHours(23, 59, 59, 999);

    const batches = await prisma.batch.findMany({
      where: {
        course_id: req.params.courseId,
        status: "UPCOMING",
        start_date: { gte: minDate, lte: maxDate },
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
      id: b.id,
      name: b.name,
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
      tutor_name: b.tutor.name,
      time_slots: b.time_slots || [],
      enrolled: b._count.enrollments,
      available_seats: b.max_students - b._count.enrollments,
      is_full: b._count.enrollments >= b.max_students,
    }));

    return success(res, 200, "Available batches.", result);
  } catch (err) { next(err); }
};

module.exports = {
  createBatch,
  getMyBatches,
  updateBatch,
  getEnrolledBatches,
  getBatchDetails,
  getCourseBatchesForRegistration,
};
