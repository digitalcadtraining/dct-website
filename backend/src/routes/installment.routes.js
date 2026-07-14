const router = require("express").Router();
const {
  authenticate,
  authorize,
} = require("../middleware/auth");
const controller = require("../controllers/installment.controller");

router.get(
  "/mine",
  authenticate,
  authorize("STUDENT"),
  controller.mine,
);

router.patch(
  "/:id/receipt-details",
  authenticate,
  authorize("STUDENT"),
  controller.saveReceiptDetails,
);

router.get(
  "/:id/receipt.pdf",
  authenticate,
  authorize("STUDENT"),
  controller.downloadReceipt,
);

// Existing endpoints retained for compatibility.
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  controller.adminTracker,
);

router.patch(
  "/admin/:id/paid",
  authenticate,
  authorize("ADMIN"),
  controller.markPaid,
);

router.patch(
  "/admin/:id/pending",
  authenticate,
  authorize("ADMIN"),
  controller.markPending,
);

module.exports = router;
