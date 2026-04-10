const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { listCourses, getCourse, getCourseBatches, createCourse, updateCourse } = require("../controllers/course.controller");

router.get("/",                       listCourses);          // Public
router.get("/:slug",                  getCourse);            // Public - by slug
router.get("/:courseId/batches",      getCourseBatches);     // Public - for registration dropdown
router.post("/",        authenticate, authorize("ADMIN"), createCourse);
router.patch("/:id",    authenticate, authorize("ADMIN"), updateCourse);

module.exports = router;
