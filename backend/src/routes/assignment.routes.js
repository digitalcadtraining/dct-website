const router    = require("express").Router();
const multer    = require("multer");
const { authenticate, authorize } = require("../middleware/auth");
const { assignmentController: c } = require("../controllers/session.controller");

const upload = multer({ dest: "uploads/", limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/",                     authenticate, authorize("TUTOR"),   upload.single("file"), c.createAssignment);
router.get("/batch/:batchId",        authenticate,                       c.getBatchAssignments);
router.post("/:id/submit",           authenticate, authorize("STUDENT"), upload.single("file"), c.submitAssignment);
router.patch("/submissions/:id/review", authenticate, authorize("TUTOR"), c.reviewSubmission);

module.exports = router;
