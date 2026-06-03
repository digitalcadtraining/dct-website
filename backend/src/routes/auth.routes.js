const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const {
  sendOtpHandler, verifyOtpHandler, registerStudent,
  login, adminLogin, refreshToken, logout, getMe
} = require("../controllers/auth.controller");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: process.env.NODE_ENV === "development"
      ? "Too many OTP test requests. Restart backend or wait a few minutes."
      : "Too many OTP requests. Please wait 15 minutes.",
  },
});

router.post("/otp/send", otpLimiter, sendOtpHandler);
router.post("/otp/verify", otpLimiter, verifyOtpHandler);
router.post("/register", registerStudent);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

module.exports = router;
