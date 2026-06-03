const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { submitApplication, getApplicationStatus, getApprovedCourses } = require("../controllers/tutor.controller");

router.get("/approved-courses", authenticate, authorize("TUTOR"), getApprovedCourses);
router.post("/", submitApplication);
router.get("/status", getApplicationStatus);

module.exports = router;
