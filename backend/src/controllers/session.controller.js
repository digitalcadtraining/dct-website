const fs = require("fs");
const path = require("path");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const drive = require("../services/googleDrive.service");
const {
  ensureCompletedSessionAssignments,
} = require("../services/automaticAssignment.service");

const EDIT_WINDOW_HOURS = Math.max(
  1,
  Number(process.env.ASSIGNMENT_EDIT_WINDOW_HOURS || 48),
);

const cleanUploadPath = (file) => (file ? file.path.replace(/\\/g, "/") : null);

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Temporary file cleanup failed:", err.message);
    }
  }
}

function parseIndiaDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  const parsed = new Date(hasZone ? raw : `${raw}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function normalizedEditableUntil(submission) {
  if (!submission) return null;
  if (submission.editable_until) return new Date(submission.editable_until);
  const base = submission.first_submitted_at || submission.submitted_at;
  return base ? addHours(new Date(base), EDIT_WINDOW_HOURS) : null;
}

function serializeSubmission(submission) {
  if (!submission) return submission;

  const now = new Date();
  const editableUntil = normalizedEditableUntil(submission);
  const isResubmit = submission.status === "RESUBMIT";
  const isReviewed = submission.status === "REVIEWED";
  const timeExpired = Boolean(
    editableUntil && editableUntil.getTime() <= now.getTime(),
  );
  const canReplace = isResubmit || (!isReviewed && !timeExpired);
  const isLocked = isReviewed || (!isResubmit && timeExpired);

  return {
    ...submission,
    file_size:
      submission.file_size === null || submission.file_size === undefined
        ? null
        : Number(submission.file_size),
    editable_until: editableUntil,
    can_replace: canReplace,
    is_locked: isLocked,
    progress_eligible: isLocked && !isResubmit,
    lock_remaining_seconds:
      canReplace && !isResubmit && editableUntil
        ? Math.max(
            0,
            Math.floor((editableUntil.getTime() - now.getTime()) / 1000),
          )
        : 0,
    has_file: Boolean(submission.drive_file_id || submission.file_url),
  };
}

function visibleToTutorWhere(now = new Date()) {
  return {
    OR: [
      { editable_until: null },
      { editable_until: { lte: now } },
      { status: "REVIEWED" },
      { status: "RESUBMIT" },
    ],
  };
}

function legacyLocalPath(fileUrl) {
  if (!fileUrl || String(fileUrl).startsWith("drive:")) return null;
  const projectRoot = path.resolve(process.cwd());
  const uploadsRoot = path.resolve(projectRoot, "uploads");
  const candidate = path.resolve(projectRoot, String(fileUrl));
  if (
    candidate !== uploadsRoot &&
    !candidate.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    return null;
  }
  return candidate;
}

async function sendStoredFile({
  driveFileId,
  fileUrl,
  originalFilename,
  mimeType,
  res,
}) {
  if (driveFileId) {
    return drive.streamDownload({
      fileId: driveFileId,
      fileName: originalFilename || "download",
      mimeType,
      res,
    });
  }

  const localPath = legacyLocalPath(fileUrl);
  if (!localPath || !fs.existsSync(localPath)) {
    const err = new Error("File was not found.");
    err.statusCode = 404;
    throw err;
  }

  return res.download(localPath, originalFilename || path.basename(localPath));
}

const getBatchSessions = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { status } = req.query;

    if (req.user.role === "STUDENT") {
      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id: batchId },
      });
      if (!enrolled)
        return error(res, 403, "You are not enrolled in this batch.");
    } else if (req.user.role === "TUTOR") {
      const owns = await prisma.batch.findFirst({
        where: { id: batchId, tutor_id: req.user.id },
      });
      if (!owns) return error(res, 403, "You do not own this batch.");
    }

    await ensureCompletedSessionAssignments(batchId);

    const sessions = await prisma.scheduledSession.findMany({
      where: { batch_id: batchId, ...(status && { status }) },
      orderBy: { session_number: "asc" },
      include: {
        assignments: {
          select: {
            id: true,
            title: true,
            description: true,
            due_date: true,
            file_url: true,
            drive_file_id: true,
            original_filename: true,
          },
        },
        queries:
          req.user.role === "STUDENT"
            ? {
                where: { student_id: req.user.id },
                select: {
                  id: true,
                  question: true,
                  attachment_url: true,
                  answer: true,
                  status: true,
                  created_at: true,
                  answered_at: true,
                },
              }
            : false,
      },
    });

    return success(res, 200, "Sessions fetched.", sessions);
  } catch (err) {
    next(err);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const session = await prisma.scheduledSession.findFirst({
      where: { id: req.params.id },
      include: { batch: { select: { tutor_id: true } } },
    });
    if (!session) return error(res, 404, "Session not found.");
    if (session.batch.tutor_id !== req.user.id)
      return error(res, 403, "You do not own this session.");

    const { scheduled_at, zoom_link, recording_url, notes_url, status } =
      req.body;
    const data = {};
    if (scheduled_at !== undefined)
      data.scheduled_at = scheduled_at ? new Date(scheduled_at) : null;
    if (zoom_link !== undefined) data.zoom_link = zoom_link || null;
    if (recording_url !== undefined) data.recording_url = recording_url || null;
    if (notes_url !== undefined) data.notes_url = notes_url || null;
    if (status !== undefined) data.status = status;

    const updated = await prisma.scheduledSession.update({
      where: { id: req.params.id },
      data,
    });

    if (updated.status === "COMPLETED") {
      await ensureCompletedSessionAssignments(updated.batch_id);
    }

    return success(res, 200, "Session updated.", updated);
  } catch (err) {
    next(err);
  }
};

const assignmentController = {
  createAssignment: async (req, res, next) => {
    let uploadedDriveFileId = null;

    try {
      const { batch_id, session_id, title, description, due_date } = req.body;
      if (!batch_id || !title)
        return error(res, 400, "Batch and assignment title are required.");

      const batch = await prisma.batch.findFirst({
        where: { id: batch_id, tutor_id: req.user.id },
        include: { course: { select: { name: true } } },
      });
      if (!batch) return error(res, 403, "You do not own this batch.");

      if (session_id) {
        const session = await prisma.scheduledSession.findFirst({
          where: { id: session_id, batch_id },
        });
        if (!session) return error(res, 400, "Invalid session for this batch.");
      }

      const parsedDueDate = due_date ? parseIndiaDateTime(due_date) : null;
      if (due_date && !parsedDueDate)
        return error(res, 400, "Please select a valid assignment due date.");

      let driveFile = null;
      if (req.file) {
        if (!drive.isConfigured()) {
          const missing = drive.getMissingConfig();

          console.error("Missing Google Drive environment variables:", missing);

          return error(
            res,
            503,
            `Google Drive configuration missing: ${missing.join(", ")}`,
          );
        }

        driveFile = await drive.uploadFile({
          localPath: req.file.path,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          folderId: process.env.GOOGLE_DRIVE_ASSIGNMENTS_FOLDER_ID,
          appProperties: {
            type: "TUTOR_ASSIGNMENT",
            batchId: batch_id,
            sessionId: session_id || "",
            tutorId: req.user.id,
          },
        });
        uploadedDriveFileId = driveFile.id;
      }

      const assignment = await prisma.assignment.create({
        data: {
          batch_id,
          session_id: session_id || null,
          title: title.trim(),
          description: description || null,
          file_url: driveFile ? `drive:${driveFile.id}` : null,
          storage_provider: driveFile ? "GOOGLE_DRIVE" : "LOCAL",
          drive_file_id: driveFile?.id || null,
          original_filename: driveFile?.name || req.file?.originalname || null,
          file_mime_type: driveFile?.mimeType || req.file?.mimetype || null,
          file_size: driveFile?.size || req.file?.size || null,
          due_date: parsedDueDate,
        },
      });

      uploadedDriveFileId = null;
      return success(res, 201, "Assignment uploaded successfully.", {
        ...assignment,
        has_file: Boolean(assignment.drive_file_id || assignment.file_url),
      });
    } catch (err) {
      if (uploadedDriveFileId) await drive.deleteFile(uploadedDriveFileId);
      next(err);
    } finally {
      await safeUnlink(req.file?.path);
    }
  },

  getBatchAssignments: async (req, res, next) => {
    try {
      const { batchId } = req.params;
      await ensureCompletedSessionAssignments(batchId);
      if (req.user.role === "STUDENT") {
        const enrolled = await prisma.enrollment.findFirst({
          where: { student_id: req.user.id, batch_id: batchId },
        });
        if (!enrolled) return error(res, 403, "Not enrolled in this batch.");
      } else if (req.user.role === "TUTOR") {
        const owns = await prisma.batch.findFirst({
          where: { id: batchId, tutor_id: req.user.id },
        });
        if (!owns) return error(res, 403, "You do not own this batch.");
      }

      const tutorVisibility =
        req.user.role === "TUTOR" ? visibleToTutorWhere() : {};

      const assignments = await prisma.assignment.findMany({
        where: { batch_id: batchId },
        orderBy: [{ due_date: "asc" }, { created_at: "asc" }],
        include: {
          session: {
            select: { id: true, session_number: true, name: true },
          },
          submissions:
            req.user.role === "STUDENT"
              ? {
                  where: { student_id: req.user.id },
                  select: {
                    id: true,
                    status: true,
                    grade: true,
                    feedback: true,
                    file_url: true,
                    storage_provider: true,
                    drive_file_id: true,
                    original_filename: true,
                    file_mime_type: true,
                    file_size: true,
                    first_submitted_at: true,
                    submitted_at: true,
                    editable_until: true,
                    locked_at: true,
                    replacement_count: true,
                    reviewed_at: true,
                  },
                }
              : {
                  where: tutorVisibility,
                  select: {
                    id: true,
                    status: true,
                    grade: true,
                    feedback: true,
                    file_url: true,
                    storage_provider: true,
                    drive_file_id: true,
                    original_filename: true,
                    file_mime_type: true,
                    file_size: true,
                    first_submitted_at: true,
                    submitted_at: true,
                    editable_until: true,
                    locked_at: true,
                    replacement_count: true,
                    reviewed_at: true,
                    student: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
        },
      });

      const result = assignments.map((assignment) => ({
        ...assignment,
        file_size:
          assignment.file_size === null || assignment.file_size === undefined
            ? null
            : Number(assignment.file_size),
        has_file: Boolean(assignment.drive_file_id || assignment.file_url),
        submissions: (assignment.submissions || []).map(serializeSubmission),
      }));

      return success(res, 200, "Assignments fetched.", result);
    } catch (err) {
      next(err);
    }
  },

  submitAssignment: async (req, res, next) => {
    let uploadedDriveFileId = null;

    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: req.params.id },
        include: {
          batch: {
            select: {
              id: true,
              name: true,
            },
          },
          session: {
            select: {
              id: true,
              session_number: true,
              name: true,
            },
          },
        },
      });
      if (!assignment) return error(res, 404, "Assignment not found.");

      const enrolled = await prisma.enrollment.findFirst({
        where: {
          student_id: req.user.id,
          batch_id: assignment.batch_id,
        },
      });
      if (!enrolled) return error(res, 403, "Not enrolled in this batch.");
      if (!req.file)
        return error(res, 400, "Please upload your assignment file.");
      if (!drive.isConfigured())
        return error(
          res,
          503,
          "Google Drive storage is not configured on the server.",
        );

      const existing = await prisma.assignmentSubmission.findUnique({
        where: {
          assignment_id_student_id: {
            assignment_id: req.params.id,
            student_id: req.user.id,
          },
        },
      });

      const now = new Date();
      if (existing) {
        const state = serializeSubmission(existing);
        if (existing.status === "REVIEWED") {
          return error(
            res,
            409,
            "This submission has already been reviewed and is locked.",
          );
        }
        if (!state.can_replace) {
          return error(
            res,
            403,
            "The 48-hour replacement window has expired. Your submission is locked.",
          );
        }
      }

      const batchFolderId = await drive.findOrCreateFolder({
        parentFolderId: process.env.GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID,
        folderName: assignment.batch?.name || `Batch-${assignment.batch_id}`,
        appProperties: {
          type: "DCT_BATCH_SUBMISSIONS",
          batchId: assignment.batch_id,
        },
      });

      const sessionLabel = assignment.session?.session_number
        ? `Session-${assignment.session.session_number}`
        : "General Assignment";

      const cleanAssignmentTitle = String(assignment.title || "Assignment")
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      const assignmentFolderName =
        `${sessionLabel} - ${cleanAssignmentTitle}`.slice(0, 150);

      /*
       * First student submission creates this folder.
       * Every later submission for the same assignment reuses it.
       *
       * assignmentId in appProperties ensures two assignments with the same
       * visible title do not accidentally share a folder.
       */
      const assignmentFolderId = await drive.findOrCreateFolder({
        parentFolderId: batchFolderId,
        folderName: assignmentFolderName,
        appProperties: {
          type: "DCT_ASSIGNMENT_SUBMISSIONS",
          assignmentId: assignment.id,
          batchId: assignment.batch_id,
          sessionId: assignment.session_id || "",
        },
      });

      const studentLabel = String(
        req.user.name || req.user.email || `Student-${req.user.id}`,
      )
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      const originalFileName = String(
        req.file.originalname || "assignment-file",
      )
        .replace(/[\\/:*?"<>|]/g, "-")
        .trim();

      const driveFile = await drive.uploadFile({
        localPath: req.file.path,
        originalName:
          `${studentLabel} - ${sessionLabel} - ${originalFileName}`.slice(
            0,
            220,
          ),
        mimeType: req.file.mimetype,
        folderId: assignmentFolderId,
        appProperties: {
          type: "STUDENT_SUBMISSION",
          assignmentId: assignment.id,
          batchId: assignment.batch_id,
          sessionId: assignment.session_id || "",
          studentId: req.user.id,
        },
      });
      uploadedDriveFileId = driveFile.id;

      const openingNewWindow = !existing || existing.status === "RESUBMIT";
      const editableUntil = openingNewWindow
        ? addHours(now, EDIT_WINDOW_HOURS)
        : normalizedEditableUntil(existing);

      const submission = existing
        ? await prisma.assignmentSubmission.update({
            where: { id: existing.id },
            data: {
              file_url: `drive:${driveFile.id}`,
              storage_provider: "GOOGLE_DRIVE",
              drive_file_id: driveFile.id,
              original_filename: driveFile.name || req.file.originalname,
              file_mime_type: driveFile.mimeType || req.file.mimetype,
              file_size: driveFile.size || req.file.size,
              first_submitted_at: existing.first_submitted_at || now,
              submitted_at: now,
              editable_until: editableUntil,
              locked_at: null,
              replacement_count: { increment: 1 },
              status: "SUBMITTED",
              reviewed_at: null,
              feedback: null,
              grade: null,
            },
          })
        : await prisma.assignmentSubmission.create({
            data: {
              assignment_id: assignment.id,
              student_id: req.user.id,
              file_url: `drive:${driveFile.id}`,
              storage_provider: "GOOGLE_DRIVE",
              drive_file_id: driveFile.id,
              original_filename: driveFile.name || req.file.originalname,
              file_mime_type: driveFile.mimeType || req.file.mimetype,
              file_size: driveFile.size || req.file.size,
              first_submitted_at: now,
              submitted_at: now,
              editable_until: editableUntil,
              locked_at: null,
              replacement_count: 0,
              status: "SUBMITTED",
            },
          });

      uploadedDriveFileId = null;

      if (
        existing?.drive_file_id &&
        existing.drive_file_id !== submission.drive_file_id
      ) {
        await drive.deleteFile(existing.drive_file_id);
      }

      return success(
        res,
        200,
        existing
          ? "Assignment file replaced successfully."
          : "Assignment submitted successfully.",
        serializeSubmission(submission),
      );
    } catch (err) {
      if (uploadedDriveFileId) await drive.deleteFile(uploadedDriveFileId);
      next(err);
    } finally {
      await safeUnlink(req.file?.path);
    }
  },

  getTutorSubmissions: async (req, res, next) => {
    try {
      const { batch_id, session_id } = req.query;
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            batch: {
              tutor_id: req.user.id,
              ...(batch_id && { id: batch_id }),
            },
            ...(session_id && { session_id }),
          },
        },
        orderBy: { submitted_at: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          assignment: {
            include: {
              batch: { select: { id: true, name: true } },
              session: {
                select: { id: true, session_number: true, name: true },
              },
            },
          },
        },
      });

      return success(
        res,
        200,
        "Tutor submissions fetched.",
        submissions.map(serializeSubmission),
      );
    } catch (err) {
      next(err);
    }
  },

  downloadAssignmentFile: async (req, res, next) => {
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: req.params.id },
        include: {
          batch: { select: { tutor_id: true } },
        },
      });
      if (!assignment) return error(res, 404, "Assignment not found.");
      if (!assignment.drive_file_id && !assignment.file_url)
        return error(res, 404, "No file is attached to this assignment.");

      if (req.user.role === "STUDENT") {
        const enrolled = await prisma.enrollment.findFirst({
          where: {
            student_id: req.user.id,
            batch_id: assignment.batch_id,
          },
        });
        if (!enrolled) return error(res, 403, "Not enrolled in this batch.");
      } else if (
        req.user.role === "TUTOR" &&
        assignment.batch.tutor_id !== req.user.id
      ) {
        return error(res, 403, "You do not own this assignment.");
      }

      return sendStoredFile({
        driveFileId: assignment.drive_file_id,
        fileUrl: assignment.file_url,
        originalFilename:
          assignment.original_filename || `${assignment.title}.zip`,
        mimeType: assignment.file_mime_type,
        res,
      });
    } catch (err) {
      if (!res.headersSent) next(err);
      else console.error("Assignment download stream failed:", err.message);
    }
  },

  downloadSubmissionFile: async (req, res, next) => {
    try {
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: req.params.id },
        include: {
          assignment: {
            include: { batch: { select: { tutor_id: true } } },
          },
        },
      });
      if (!submission) return error(res, 404, "Submission not found.");

      const isOwner =
        req.user.role === "STUDENT" && submission.student_id === req.user.id;
      const isTutor =
        req.user.role === "TUTOR" &&
        submission.assignment.batch.tutor_id === req.user.id;
      const isAdmin = req.user.role === "ADMIN";

      if (!isOwner && !isTutor && !isAdmin)
        return error(res, 403, "You cannot access this submission.");

      return sendStoredFile({
        driveFileId: submission.drive_file_id,
        fileUrl: submission.file_url,
        originalFilename: submission.original_filename || "student-assignment",
        mimeType: submission.file_mime_type,
        res,
      });
    } catch (err) {
      if (!res.headersSent) next(err);
      else console.error("Submission download stream failed:", err.message);
    }
  },

  reviewSubmission: async (req, res, next) => {
    try {
      const { grade, feedback, status } = req.body;
      const safeStatus = status === "RESUBMIT" ? "RESUBMIT" : "REVIEWED";

      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: req.params.id },
        include: {
          assignment: {
            include: { batch: { select: { tutor_id: true } } },
          },
        },
      });
      if (!submission) return error(res, 404, "Submission not found.");
      if (submission.assignment.batch.tutor_id !== req.user.id)
        return error(res, 403, "You do not own this batch.");

      const updated = await prisma.assignmentSubmission.update({
        where: { id: req.params.id },
        data: {
          grade: grade || null,
          feedback: feedback || null,
          status: safeStatus,
          reviewed_at: new Date(),
          locked_at: safeStatus === "REVIEWED" ? new Date() : null,
        },
      });

      return success(
        res,
        200,
        "Submission reviewed.",
        serializeSubmission(updated),
      );
    } catch (err) {
      next(err);
    }
  },
};

const queryController = {
  createQuery: async (req, res, next) => {
    try {
      const { batch_id, session_id, question } = req.body;
      if (!batch_id || !question)
        return error(res, 400, "Batch and question are required.");

      const enrolled = await prisma.enrollment.findFirst({
        where: { student_id: req.user.id, batch_id },
      });
      if (!enrolled) return error(res, 403, "Not enrolled in this batch.");

      if (session_id) {
        const session = await prisma.scheduledSession.findFirst({
          where: { id: session_id, batch_id },
        });
        if (!session) return error(res, 400, "Invalid session for this batch.");
      }

      const query = await prisma.query.create({
        data: {
          student_id: req.user.id,
          batch_id,
          session_id: session_id || null,
          question: question.trim(),
          attachment_url: cleanUploadPath(req.file),
        },
        include: {
          session: {
            select: {
              id: true,
              session_number: true,
              name: true,
              scheduled_at: true,
            },
          },
          batch: { select: { id: true, name: true } },
        },
      });
      return success(res, 201, "Query submitted.", query);
    } catch (err) {
      next(err);
    }
  },

  getMyQueries: async (req, res, next) => {
    try {
      const queries = await prisma.query.findMany({
        where: {
          student_id: req.user.id,
          ...(req.query.batch_id && { batch_id: req.query.batch_id }),
        },
        orderBy: { created_at: "desc" },
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              course: { select: { name: true } },
            },
          },
          session: {
            select: {
              id: true,
              session_number: true,
              name: true,
              scheduled_at: true,
            },
          },
        },
      });
      return success(res, 200, "Your queries.", queries);
    } catch (err) {
      next(err);
    }
  },

  getBatchQueries: async (req, res, next) => {
    try {
      if (req.user.role === "TUTOR") {
        const batch = await prisma.batch.findFirst({
          where: {
            id: req.params.batchId,
            tutor_id: req.user.id,
          },
        });
        if (!batch) return error(res, 403, "You do not own this batch.");
      }

      const queries = await prisma.query.findMany({
        where: { batch_id: req.params.batchId },
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          session: {
            select: {
              id: true,
              session_number: true,
              name: true,
              scheduled_at: true,
            },
          },
          batch: { select: { id: true, name: true } },
        },
      });
      return success(res, 200, "Batch queries.", queries);
    } catch (err) {
      next(err);
    }
  },

  answerQuery: async (req, res, next) => {
    try {
      const { answer, status } = req.body;
      if (!answer) return error(res, 400, "Answer is required.");

      const query = await prisma.query.findUnique({
        where: { id: req.params.id },
      });
      if (!query) return error(res, 404, "Query not found.");

      if (req.user.role === "TUTOR") {
        const batch = await prisma.batch.findFirst({
          where: { id: query.batch_id, tutor_id: req.user.id },
        });
        if (!batch)
          return error(res, 403, "Not authorized to answer this query.");
      }

      const updated = await prisma.query.update({
        where: { id: req.params.id },
        data: {
          answer: answer.trim(),
          status: status || "RESOLVED",
          answered_at: new Date(),
        },
      });
      return success(res, 200, "Query answered.", updated);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = {
  getBatchSessions,
  updateSession,
  assignmentController,
  queryController,
};
