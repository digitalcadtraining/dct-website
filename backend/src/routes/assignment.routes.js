const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { authenticate, authorize } = require("../middleware/auth");
const {
  resolveCompletedSessionAssignment,
} = require("../middleware/sessionAssignment.middleware");
const {
  assignmentController: c,
} = require("../controllers/session.controller");

const router = express.Router();
const tempDir = path.join(os.tmpdir(), "dct-assignment-uploads");

fs.mkdirSync(tempDir, { recursive: true });

const blockedExtensions = new Set([
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".ps1",
  ".vbs",
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".htm",
  ".php",
  ".sh",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const maxFileMb = Math.max(
  1,
  Number(process.env.ASSIGNMENT_MAX_FILE_MB || 80),
);

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (blockedExtensions.has(ext)) {
      return cb(new Error("This file type is not allowed."));
    }

    return cb(null, true);
  },
});

function uploadSingle(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (
      err instanceof multer.MulterError &&
      err.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        success: false,
        message: `File is too large. Maximum allowed size is ${maxFileMb} MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  });
}

router.get(
  "/tutor/submissions",
  authenticate,
  authorize("TUTOR"),
  c.getTutorSubmissions,
);

router.get(
  "/submissions/:id/download",
  authenticate,
  c.downloadSubmissionFile,
);

router.get(
  "/batch/:batchId",
  authenticate,
  c.getBatchAssignments,
);

/**
 * New flow:
 * Completed session -> student uploads directly.
 * The middleware silently finds/creates the internal assignment record.
 */
router.post(
  "/session/:sessionId/submit",
  authenticate,
  authorize("STUDENT"),
  uploadSingle,
  resolveCompletedSessionAssignment,
  c.submitAssignment,
);

/**
 * Keep old assignment-ID endpoint for existing assignment pages and records.
 */
router.post(
  "/:id/submit",
  authenticate,
  authorize("STUDENT"),
  uploadSingle,
  c.submitAssignment,
);

router.patch(
  "/submissions/:id/review",
  authenticate,
  authorize("TUTOR"),
  c.reviewSubmission,
);

module.exports = router;
