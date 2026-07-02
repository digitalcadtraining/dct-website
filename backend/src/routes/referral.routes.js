const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const referral = require("../controllers/referral.controller");

router.post("/validate", referral.validateReferralCode);

router.get("/me", authenticate, authorize("STUDENT"), referral.getMyReferralDashboard);

router.get("/admin", authenticate, authorize("ADMIN"), referral.adminListReferrals);
router.patch("/admin/:id/credit", authenticate, authorize("ADMIN"), referral.adminMarkCredited);

module.exports = router;
