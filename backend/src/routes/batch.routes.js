const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { createBatch, getMyBatches, updateBatch, getEnrolledBatches, getBatchDetails } = require("../controllers/batch.controller");

router.post("/",            authenticate, authorize("TUTOR"),           createBatch);
router.get("/mine",         authenticate, authorize("TUTOR"),           getMyBatches);
router.get("/enrolled",     authenticate, authorize("STUDENT"),         getEnrolledBatches);
router.get("/:id",          authenticate,                               getBatchDetails);
router.patch("/:id",        authenticate, authorize("TUTOR"),           updateBatch);

module.exports = router;
