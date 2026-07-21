const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const admin = require("../controllers/admin.controller");
const cadToolAccess = require("../controllers/cadToolAccess.controller");
const manualRegistration = require(
  "../controllers/manualRegistration.controller",
);

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", admin.getStats);
router.get("/applications", admin.listApplications);
router.post("/applications/:id/approve", admin.approveApplication);
router.post("/applications/:id/reject", admin.rejectApplication);
router.get("/students", admin.listStudents);

// Use the registration-aware tracker so manually received registration
// amounts are counted correctly. Existing EMI/receipt behaviour is preserved.
router.get("/installments/tracker", manualRegistration.feeTracker);
router.patch("/installments/:id/paid", admin.markInstallmentPaid);
router.patch("/installments/:id/pending", admin.markInstallmentPending);
router.patch(
  "/enrollments/:id/installments",
  admin.updateEnrollmentInstallments,
);

// Admin-only direct student registration. No OTP or online payment is used.
router.get(
  "/manual-registrations/batches",
  manualRegistration.listManualRegistrationBatches,
);
router.post(
  "/manual-registrations/preview",
  manualRegistration.previewManualRegistration,
);
router.post(
  "/manual-registrations",
  manualRegistration.createManualRegistration,
);

router.get(
  "/cad-tools/students/:studentId/access",
  cadToolAccess.getCadAccess,
);
router.put(
  "/cad-tools/students/:studentId/access",
  cadToolAccess.updateCadAccess,
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
