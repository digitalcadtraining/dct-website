/**
 * Auth Controller
 * Handles: Student registration, Login (Student+Tutor), OTP, Token refresh, Logout
 *
 * Flow for Student Registration:
 * 1. POST /auth/otp/send       → sends OTP to phone
 * 2. POST /auth/otp/verify     → verifies OTP, returns temp token
 * 3. POST /auth/register       → creates account (requires verified phone)
 *
 * Flow for Login:
 * 1. POST /auth/login          → returns access + refresh tokens
 * 2. POST /auth/refresh        → rotates access token using refresh token
 * 3. POST /auth/logout         → invalidates refresh token
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { prisma }      = require("../config/db");
const { sendOtp, verifyOtp } = require("../services/otp.service");
const { success, error }     = require("../utils/response");
const { normalizePhone, hashString } = require("../utils/helpers");
const { ROLES, REFRESH_TOKEN_EXPIRES_MS } = require("../config/constants");

// ── HELPER: Generate JWT tokens ──────────────────────────
const generateTokens = async (user) => {
  const payload = { userId: user.id, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

  const rawRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

  // Store hashed refresh token in DB (so we can invalidate it)
  await prisma.refreshToken.create({
    data: {
      user_id:    user.id,
      token:      hashString(rawRefreshToken),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

// ── OTP: Send ─────────────────────────────────────────────
// POST /auth/otp/send
// Body: { phone, purpose: "STUDENT_REGISTER" | "LOGIN" | "PASSWORD_RESET" }
const sendOtpHandler = async (req, res, next) => {
  try {
    const { phone, purpose } = req.body;
    if (!phone || !purpose) {
      return error(res, 400, "Phone and purpose are required.");
    }

    const normalizedPhone = normalizePhone(phone);

    // For registration: ensure phone not already taken
    if (purpose === "STUDENT_REGISTER" || purpose === "TUTOR_REGISTER") {
      const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
      if (existing) return error(res, 409, "Phone number already registered.");
    }

    const result = await sendOtp(normalizedPhone, purpose);

    // In development, return OTP for easy testing
    const responseData = process.env.NODE_ENV === "development" ? { dev_otp: result.otp } : null;
    return success(res, 200, "OTP sent successfully.", responseData);
  } catch (err) {
    next(err);
  }
};

// ── OTP: Verify ───────────────────────────────────────────
// POST /auth/otp/verify
// Body: { phone, otp, purpose }
// Returns: { phone_verified_token } — short-lived token proving phone ownership
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { phone, otp, purpose } = req.body;
    if (!phone || !otp || !purpose) {
      return error(res, 400, "Phone, OTP, and purpose are required.");
    }

    const normalizedPhone = normalizePhone(phone);
    const result = await verifyOtp(normalizedPhone, otp, purpose);

    if (!result.valid) {
      return error(res, 400, result.message);
    }

    // Issue a short-lived "phone verified" token
    const phoneToken = jwt.sign(
      { phone: normalizedPhone, purpose, verified: true },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return success(res, 200, "OTP verified successfully.", { phone_token: phoneToken });
  } catch (err) {
    next(err);
  }
};

// ── STUDENT REGISTER ─────────────────────────────────────
// POST /auth/register
// Body: { name, email, phone, password, course_id, batch_id, phone_token }
const registerStudent = async (req, res, next) => {
  try {
    const { name, email, phone, password, course_id, batch_id, phone_token } = req.body;

    if (!name || !email || !phone || !password || !course_id || !batch_id || !phone_token) {
      return error(res, 400, "All fields are required.");
    }

    // Verify the phone_token (proves phone OTP was verified)
    let decoded;
    try {
      decoded = jwt.verify(phone_token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return error(res, 400, "Phone verification expired. Please verify OTP again.");
    }

    const normalizedPhone = normalizePhone(phone);
    if (decoded.phone !== normalizedPhone || decoded.purpose !== "STUDENT_REGISTER") {
      return error(res, 400, "Invalid phone verification token.");
    }

    // Check duplicates
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone: normalizedPhone } }),
    ]);
    if (existingEmail) return error(res, 409, "Email already registered.");
    if (existingPhone) return error(res, 409, "Phone number already registered.");

    // Validate batch belongs to course and is upcoming/active
    const batch = await prisma.batch.findFirst({
      where: {
        id:        batch_id,
        course_id,
        status:    { in: ["UPCOMING", "ACTIVE"] },
      },
      include: { course: { select: { name: true } } },
    });
    if (!batch) return error(res, 404, "Selected batch not found or no longer available.");

    // Check batch capacity
    const enrollmentCount = await prisma.enrollment.count({ where: { batch_id } });
    if (enrollmentCount >= batch.max_students) {
      return error(res, 409, "This batch is full. Please choose another batch.");
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user + enrollment in a transaction
    const { user, enrollment } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone:        normalizedPhone,
          password_hash,
          role:         ROLES.STUDENT,
          is_verified:  true, // Phone verified via OTP
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      const enrollment = await tx.enrollment.create({
        data: { student_id: user.id, batch_id, payment_status: "PENDING" },
      });

      return { user, enrollment };
    });

    // Issue tokens
    const tokens = await generateTokens(user);

    return success(res, 201, "Account created successfully.", {
      user,
      batch_name: batch.name,
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ────────────────────────────────────────────────
// POST /auth/login
// Body: { email_or_phone, password }
// Works for Student AND Tutor — Admin has separate /admin/login
const login = async (req, res, next) => {
  try {
    const { email_or_phone, password } = req.body;

    if (!email_or_phone || !password) {
      return error(res, 400, "Email/phone and password are required.");
    }

    // Find user by email or phone
    const isPhone = /^\d+$/.test(email_or_phone.replace(/[\s\-\+]/g, ""));
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: normalizePhone(email_or_phone) } })
      : await prisma.user.findUnique({ where: { email: email_or_phone.toLowerCase() } });

    if (!user) return error(res, 401, "Invalid credentials.");
    if (!user.is_active) return error(res, 403, "Account deactivated. Contact support.");

    // Block admin login through this endpoint
    if (user.role === ROLES.ADMIN) {
      return error(res, 403, "Please use the admin login portal.");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, "Invalid credentials.");

    // Generate tokens
    const tokens = await generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   REFRESH_TOKEN_EXPIRES_MS,
    });

    return success(res, 200, "Logged in successfully.", {
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
      access_token: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN LOGIN ──────────────────────────────────────────
// POST /auth/admin/login
// Body: { email, password }
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 400, "Email and password required.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== ROLES.ADMIN) return error(res, 401, "Invalid credentials.");
    if (!user.is_active) return error(res, 403, "Account deactivated.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, "Invalid credentials.");

    const tokens = await generateTokens(user);

    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   REFRESH_TOKEN_EXPIRES_MS,
    });

    return success(res, 200, "Admin logged in.", {
      user:  { id: user.id, name: user.name, email: user.email, role: user.role },
      access_token: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── REFRESH TOKEN ────────────────────────────────────────
// POST /auth/refresh
// Uses refresh token from httpOnly cookie OR body
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    if (!token) return error(res, 401, "Refresh token not found.");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return error(res, 401, "Invalid or expired refresh token.");
    }

    // Check token exists in DB (rotation pattern)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashString(token) },
    });
    if (!storedToken || storedToken.expires_at < new Date()) {
      return error(res, 401, "Refresh token revoked or expired.");
    }

    // Delete old token (rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, is_active: true },
    });
    if (!user || !user.is_active) return error(res, 401, "User not found.");

    const tokens = await generateTokens(user);

    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   REFRESH_TOKEN_EXPIRES_MS,
    });

    return success(res, 200, "Token refreshed.", { access_token: tokens.accessToken });
  } catch (err) {
    next(err);
  }
};

// ── LOGOUT ───────────────────────────────────────────────
// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;

    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token: hashString(token) },
      }).catch(() => {}); // Ignore if already deleted
    }

    res.clearCookie("refresh_token");
    return success(res, 200, "Logged out successfully.");
  } catch (err) {
    next(err);
  }
};

// ── GET CURRENT USER ─────────────────────────────────────
// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar_url: true, created_at: true },
    });
    return success(res, 200, "User profile.", user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendOtpHandler,
  verifyOtpHandler,
  registerStudent,
  login,
  adminLogin,
  refreshToken,
  logout,
  getMe,
};
