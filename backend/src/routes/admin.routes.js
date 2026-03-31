const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const admin = require("../controllers/admin.controller");
const { listCourses } = require("../controllers/course.controller");

// All admin routes require ADMIN role
router.use(authenticate, authorize("ADMIN"));

router.get("/stats",                    admin.getStats);
router.get("/applications",             admin.listApplications);
router.post("/applications/:id/approve",admin.approveApplication);
router.post("/applications/:id/reject", admin.rejectApplication);
router.get("/students",                 admin.listStudents);
router.get("/tutors",                   admin.listTutors);
router.get("/batches",                  admin.listAllBatches);
router.get("/queries",                  admin.listAllQueries);
router.patch("/users/:id/status",       admin.toggleUserStatus);

module.exports = router;
