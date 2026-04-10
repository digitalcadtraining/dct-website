/**
 * Session Controller
 * Tutor manages scheduled sessions (set date, add recording, mark live/complete)
 * Students view sessions for their enrolled batch
 */

const { prisma }         = require("../config/db");
const { success, error } = require("../utils/response");

// ── STUDENT/TUTOR: Get sessions for a batch ───────────────
// GET /sessions/batch/:batchId?status=UPCOMING|LIVE|COMPLETED
const getBatchSessions = async (req, res, next) => {
  try {
    const { batchId }  = req.params;
    const { status }   = req.query;

    // Access check
    if (req.user.role === "STUDENT") {
      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id: batchId },
      });
      if (!enrolled) return error(res, 403, "You are not enrolled in this batch.");
    } else if (req.user.role === "TUTOR") {
      const owns = await prisma.batch.findFirst({
        where: { id: batchId, tutor_id: req.user.id },
      });
      if (!owns) return error(res, 403, "You do not own this batch.");
    }

    const sessions = await prisma.scheduledSession.findMany({
      where: {
        batch_id: batchId,
        ...(status && { status }),
      },
      orderBy: { session_number: "asc" },
      include: {
        assignments: {
          select: { id: true, title: true, due_date: true },
        },
      },
    });

    return success(res, 200, "Sessions fetched.", sessions);
  } catch (err) {
    next(err);
  }
};

// ── TUTOR: Update a session (add date, zoom link, recording) ──
// PATCH /sessions/:id
const updateSession = async (req, res, next) => {
  try {
    const session = await prisma.scheduledSession.findFirst({
      where: { id: req.params.id },
      include: { batch: { select: { tutor_id: true } } },
    });

    if (!session) return error(res, 404, "Session not found.");
    if (session.batch.tutor_id !== req.user.id) {
      return error(res, 403, "You do not own this session.");
    }

    const { scheduled_at, zoom_link, recording_url, notes_url, status } = req.body;
    const updateData = {};
    if (scheduled_at  !== undefined) updateData.scheduled_at  = new Date(scheduled_at);
    if (zoom_link     !== undefined) updateData.zoom_link     = zoom_link;
    if (recording_url !== undefined) updateData.recording_url = recording_url;
    if (notes_url     !== undefined) updateData.notes_url     = notes_url;
    if (status        !== undefined) updateData.status        = status;

    const updated = await prisma.scheduledSession.update({
      where: { id: req.params.id },
      data:  updateData,
    });

    return success(res, 200, "Session updated.", updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBatchSessions, updateSession };


// ══════════════════════════════════════════════════════════
// ASSIGNMENT CONTROLLER
// ══════════════════════════════════════════════════════════

/**
 * Assignments are created by Tutor per session/batch
 * Students submit files, Tutor reviews and gives feedback
 */

const assignmentController = {

  // TUTOR: Create assignment for a batch
  // POST /assignments
  createAssignment: async (req, res, next) => {
    try {
      const { batch_id, session_id, title, description, due_date } = req.body;

      if (!batch_id || !title) {
        return error(res, 400, "batch_id and title are required.");
      }

      // Verify tutor owns this batch
      const batch = await prisma.batch.findFirst({
        where: { id: batch_id, tutor_id: req.user.id },
      });
      if (!batch) return error(res, 403, "You do not own this batch.");

      const assignment = await prisma.assignment.create({
        data: {
          batch_id,
          session_id: session_id || null,
          title,
          description,
          file_url:   req.file?.path || null,  // Uploaded problem file
          due_date:   due_date ? new Date(due_date) : null,
        },
      });

      return success(res, 201, "Assignment created.", assignment);
    } catch (err) {
      next(err);
    }
  },

  // STUDENT: Get assignments for my batch
  // GET /assignments/batch/:batchId
  getBatchAssignments: async (req, res, next) => {
    try {
      const { batchId } = req.params;

      // Verify enrolled
      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id: batchId },
      });
      if (!enrolled) return error(res, 403, "Not enrolled in this batch.");

      const assignments = await prisma.assignment.findMany({
        where:   { batch_id: batchId },
        orderBy: { created_at: "asc" },
        include: {
          session: { select: { session_number: true, name: true } },
          submissions: {
            where:  { student_id: req.user.id },
            select: { id: true, status: true, grade: true, feedback: true, submitted_at: true },
          },
        },
      });

      return success(res, 200, "Assignments fetched.", assignments);
    } catch (err) {
      next(err);
    }
  },

  // STUDENT: Submit assignment
  // POST /assignments/:id/submit
  submitAssignment: async (req, res, next) => {
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: req.params.id },
      });
      if (!assignment) return error(res, 404, "Assignment not found.");

      // Verify enrolled
      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id: assignment.batch_id },
      });
      if (!enrolled) return error(res, 403, "Not enrolled in this batch.");

      if (!req.file) return error(res, 400, "Please upload your assignment file.");

      const submission = await prisma.assignmentSubmission.upsert({
        where: {
          assignment_id_student_id: {
            assignment_id: req.params.id,
            student_id:    req.user.id,
          },
        },
        create: {
          assignment_id: req.params.id,
          student_id:    req.user.id,
          file_url:      req.file.path,
          status:        "SUBMITTED",
        },
        update: {
          file_url:     req.file.path,
          status:       "SUBMITTED",
          submitted_at: new Date(),
        },
      });

      return success(res, 200, "Assignment submitted.", submission);
    } catch (err) {
      next(err);
    }
  },

  // TUTOR: Review submission (give grade + feedback)
  // PATCH /assignments/submissions/:id/review
  reviewSubmission: async (req, res, next) => {
    try {
      const { grade, feedback, status } = req.body;

      const submission = await prisma.assignmentSubmission.findUnique({
        where:   { id: req.params.id },
        include: { assignment: { include: { batch: { select: { tutor_id: true } } } } },
      });

      if (!submission) return error(res, 404, "Submission not found.");
      if (submission.assignment.batch.tutor_id !== req.user.id) {
        return error(res, 403, "You do not own this batch.");
      }

      const updated = await prisma.assignmentSubmission.update({
        where: { id: req.params.id },
        data: {
          grade,
          feedback,
          status:      status || "REVIEWED",
          reviewed_at: new Date(),
        },
      });

      return success(res, 200, "Submission reviewed.", updated);
    } catch (err) {
      next(err);
    }
  },
};


// ══════════════════════════════════════════════════════════
// QUERY CONTROLLER
// ══════════════════════════════════════════════════════════

const queryController = {

  // STUDENT: Ask a question
  // POST /queries
  createQuery: async (req, res, next) => {
    try {
      const { batch_id, session_id, question } = req.body;
      if (!batch_id || !question) {
        return error(res, 400, "batch_id and question are required.");
      }

      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id },
      });
      if (!enrolled) return error(res, 403, "Not enrolled in this batch.");

      const query = await prisma.query.create({
        data: {
          student_id: req.user.id,
          batch_id,
          session_id: session_id || null,
          question,
        },
      });

      return success(res, 201, "Query submitted.", query);
    } catch (err) {
      next(err);
    }
  },

  // STUDENT: Get my queries
  // GET /queries/mine?batch_id=xxx
  getMyQueries: async (req, res, next) => {
    try {
      const queries = await prisma.query.findMany({
        where: {
          student_id: req.user.id,
          ...(req.query.batch_id && { batch_id: req.query.batch_id }),
        },
        orderBy: { created_at: "desc" },
        include: { session: { select: { session_number: true, name: true } } },
      });
      return success(res, 200, "Your queries.", queries);
    } catch (err) {
      next(err);
    }
  },

  // TUTOR: Get queries for my batch
  // GET /queries/batch/:batchId
  getBatchQueries: async (req, res, next) => {
    try {
      const batch = await prisma.batch.findFirst({
        where: { id: req.params.batchId, tutor_id: req.user.id },
      });
      if (!batch) return error(res, 403, "You do not own this batch.");

      const queries = await prisma.query.findMany({
        where:   { batch_id: req.params.batchId },
        orderBy: { created_at: "desc" },
        include: {
          student: { select: { name: true } },
          session: { select: { session_number: true, name: true } },
        },
      });
      return success(res, 200, "Batch queries.", queries);
    } catch (err) {
      next(err);
    }
  },

  // TUTOR: Answer a query
  // PATCH /queries/:id/answer
  answerQuery: async (req, res, next) => {
    try {
      const { answer } = req.body;
      if (!answer) return error(res, 400, "Answer is required.");

      const query = await prisma.query.findUnique({
        where:   { id: req.params.id },
        include: { session: { include: { batch: { select: { tutor_id: true } } } } },
      });

      if (!query) return error(res, 404, "Query not found.");

      // Allow tutor of the batch to answer
      const batch = await prisma.batch.findFirst({
        where: { id: query.batch_id, tutor_id: req.user.id },
      });
      if (!batch && req.user.role !== "ADMIN") {
        return error(res, 403, "Not authorized to answer this query.");
      }

      const updated = await prisma.query.update({
        where: { id: req.params.id },
        data: { answer, status: "RESOLVED", answered_at: new Date() },
      });

      return success(res, 200, "Query answered.", updated);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { getBatchSessions, updateSession, assignmentController, queryController };
