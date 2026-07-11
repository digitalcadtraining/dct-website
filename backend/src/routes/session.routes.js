const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  ensureCompletedSessionAssignments,
} = require("../middleware/autoAssignment.middleware");
const {
  getBatchSessions,
  updateSession,
} = require("../controllers/session.controller");

router.get(
  "/batch/:batchId",
  authenticate,
  ensureCompletedSessionAssignments,
  getBatchSessions,
);

router.patch(
  "/:id",
  authenticate,
  authorize("TUTOR"),
  updateSession,
);

module.exports = router;
