const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/installment.controller");

router.get("/mine", authenticate, authorize("STUDENT"), controller.mine);
router.get("/admin", authenticate, authorize("ADMIN"), controller.adminTracker);
router.patch("/admin/:id/paid", authenticate, authorize("ADMIN"), controller.markPaid);
router.patch("/admin/:id/pending", authenticate, authorize("ADMIN"), controller.markPending);

module.exports = router;
