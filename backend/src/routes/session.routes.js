const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { getBatchSessions, updateSession } = require("../controllers/session.controller");

router.get("/batch/:batchId", authenticate, getBatchSessions);
router.patch("/:id",          authenticate, authorize("TUTOR"), updateSession);

module.exports = router;
