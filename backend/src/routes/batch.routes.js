const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  createBatch,
  getMyBatches,
  updateBatch,
  updateBatchFull,
  getEnrolledBatches,
  getBatchDetails,
} = require("../controllers/batch.controller");

router.post("/", authenticate, authorize("TUTOR"), createBatch);
router.get("/mine", authenticate, authorize("TUTOR"), getMyBatches);
router.get("/enrolled", authenticate, authorize("STUDENT"), getEnrolledBatches);

// Full batch management for tutor-owned batches.
// Keep this BEFORE "/:id" so Express does not treat "full" as another route.
router.patch("/:id/full", authenticate, authorize("TUTOR"), updateBatchFull);

router.get("/:id", authenticate, getBatchDetails);
router.patch("/:id", authenticate, authorize("TUTOR"), updateBatch);

module.exports = router;
