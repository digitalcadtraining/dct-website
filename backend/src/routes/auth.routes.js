const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const {
  sendOtpHandler, verifyOtpHandler, registerStudent,
  login, adminLogin, refreshToken, logout, getMe
} = require("../controllers/auth.controller");

// Strict OTP rate limit: 5 requests per 15 min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { success: false, message: "Too many OTP requests. Please wait 15 minutes." }
});

router.post("/otp/send",    otpLimiter, sendOtpHandler);
router.post("/otp/verify",  otpLimiter, verifyOtpHandler);
router.post("/register",    registerStudent);
router.post("/login",       login);
router.post("/admin/login", adminLogin);
router.post("/refresh",     refreshToken);
router.post("/logout",      logout);
router.get("/me",           authenticate, getMe);

module.exports = router;
