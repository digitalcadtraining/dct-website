/** Routes Index - mounts modules under /api/v1 */
const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/courses", require("./course.routes"));
router.use("/batches", require("./batch.routes"));
router.use("/sessions", require("./session.routes"));
router.use("/assignments", require("./assignment.routes"));
router.use("/queries", require("./query.routes"));
router.use("/registration-payments", require("./registrationPayment.routes"));
router.use("/discount-codes", require("./discountCode.routes"));
router.use("/referrals", require("./referral.routes"));
router.use("/prerequisites", require("./prerequisite.routes"));
router.use("/tutor-applications", require("./tutor.routes"));
router.use("/installments", require("./installment.routes"));
router.use("/admin", require("./admin.routes"));

router.get("/", (req, res) => {
  res.json({ success: true, message: "DigitalCAD Training API v1" });
});

module.exports = router;
