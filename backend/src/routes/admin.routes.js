const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const admin = require("../controllers/admin.controller");

router.use(authenticate, authorize("ADMIN"));

router.get("/stats",                       admin.getStats);
router.get("/applications",                admin.listApplications);
router.post("/applications/:id/approve",   admin.approveApplication);
router.post("/applications/:id/reject",    admin.rejectApplication);
router.get("/students",                    admin.listStudents);
router.get("/tutors",                      admin.listTutors);

// ⚠️ Specific routes BEFORE wildcard :id routes
router.get("/batches/pending",             admin.listPendingBatches);
router.get("/batches",                     admin.listAllBatches);
router.post("/batches/:id/approve",        admin.approveBatch);
router.post("/batches/:id/reject",         admin.rejectBatch);

router.get("/queries",                     admin.listAllQueries);
router.patch("/users/:id/status",          admin.toggleUserStatus);

module.exports = router;