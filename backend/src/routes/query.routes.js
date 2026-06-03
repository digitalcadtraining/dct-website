const router = require("express").Router();
const multer = require("multer");
const { authenticate, authorize } = require("../middleware/auth");
const { queryController: c } = require("../controllers/session.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
      "video/mp4", "video/webm", "video/quicktime",
      "application/pdf",
      "application/zip", "application/x-zip-compressed",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only image, video, PDF or ZIP attachments are allowed."));
  },
});

router.post("/",              authenticate, authorize("STUDENT"), upload.single("attachment"), c.createQuery);
router.get("/mine",           authenticate, authorize("STUDENT"), c.getMyQueries);
router.get("/batch/:batchId", authenticate, authorize("TUTOR", "ADMIN"), c.getBatchQueries);
router.patch("/:id/answer",   authenticate, authorize("TUTOR", "ADMIN"), c.answerQuery);

module.exports = router;
