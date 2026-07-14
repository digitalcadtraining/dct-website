const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const admin = require("../controllers/admin.controller");

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", admin.getStats);
router.get("/applications", admin.listApplications);
router.post("/applications/:id/approve", admin.approveApplication);
router.post("/applications/:id/reject", admin.rejectApplication);
router.get("/students", admin.listStudents);
router.get("/installments/tracker", admin.feeTracker);
router.patch("/installments/:id/paid", admin.markInstallmentPaid);
router.patch("/installments/:id/pending", admin.markInstallmentPending);
router.patch(
  "/enrollments/:id/installments",
  admin.updateEnrollmentInstallments,
);

router.get("/tutors", admin.listTutors);
router.get("/batches/pending", admin.listPendingBatches);
router.get("/batches", admin.listAllBatches);
router.patch("/batches/:id/pricing", admin.updateBatchPricing);
router.post("/batches/:id/approve", admin.approveBatch);
router.post("/batches/:id/reject", admin.rejectBatch);
router.get("/queries", admin.listAllQueries);
router.patch("/queries/:id/resolve", admin.resolveQuery);
router.patch("/users/:id/status", admin.toggleUserStatus);

module.exports = router;
