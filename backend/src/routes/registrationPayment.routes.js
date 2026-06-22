const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const {
  startRegistrationPayment,
  verifyRegistrationPayment,
  instamojoWebhook,
} = require("../controllers/registrationPayment.controller");

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests. Please wait and try again." },
});

router.post("/start", paymentLimiter, startRegistrationPayment);

// Do not rate-limit verify callback.
// Instamojo/browser may hit this after successful payment.
router.post("/verify", verifyRegistrationPayment);
router.get("/verify", verifyRegistrationPayment);

router.post("/instamojo/webhook", instamojoWebhook);

module.exports = router;
