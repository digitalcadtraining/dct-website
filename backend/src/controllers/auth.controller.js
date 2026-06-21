/**
 * Auth Controller
 * Separate refresh cookies for Admin, Tutor and Student.
 * Student self-registration is payment-gated through /registration-payments/start.
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { sendOtp, verifyOtp } = require("../services/otp.service");
const { success, error } = require("../utils/response");
const { normalizePhone, hashString } = require("../utils/helpers");
const { ROLES, REFRESH_TOKEN_EXPIRES_MS } = require("../config/constants");

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

function cookieNameForRole(role) {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return "admin_refresh_token";
  if (r === ROLES.TUTOR) return "tutor_refresh_token";
  return "student_refresh_token";
}

function setRefreshCookie(res, role, token) {
  res.cookie(cookieNameForRole(role), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  });
}

function clearRefreshCookie(res, role) {
  res.clearCookie(cookieNameForRole(role));
}

const generateTokens = async (user) => {
  const payload = { userId: user.id, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

  const rawRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: hashString(rawRefreshToken),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

const sendOtpHandler = async (req, res, next) => {
  try {
    const { phone, purpose } = req.body;
    if (!phone || !purpose)
      return error(res, 400, "Phone and purpose are required.");

    const normalizedPhone = normalizePhone(phone);
    if (purpose === "STUDENT_REGISTER" || purpose === "TUTOR_REGISTER") {
      const existing = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (existing) return error(res, 409, "Phone number already registered.");
    }

    const result = await sendOtp(normalizedPhone, purpose);
    const responseData =
      process.env.NODE_ENV === "development" ? { dev_otp: result.otp } : null;
    return success(res, 200, "OTP sent successfully.", responseData);
  } catch (err) {
    next(err);
  }
};

const verifyOtpHandler = async (req, res, next) => {
  try {
    const { phone, otp, purpose } = req.body;
    if (!phone || !otp || !purpose)
      return error(res, 400, "Phone, OTP, and purpose are required.");

    const normalizedPhone = normalizePhone(phone);
    const result = await verifyOtp(normalizedPhone, otp, purpose);
    if (!result.valid) return error(res, 400, result.message);

    const phoneToken = jwt.sign(
      { phone: normalizedPhone, purpose, verified: true },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    return success(res, 200, "OTP verified successfully.", {
      phone_token: phoneToken,
    });
  } catch (err) {
    next(err);
  }
};

const registerStudent = async (req, res) => {
  return error(
    res,
    403,
    "Direct registration is disabled. Please verify phone and pay ₹999 registration fee to activate dashboard access.",
  );
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email_or_phone } = req.body;
    if (!email_or_phone) return error(res, 400, "Email or phone is required.");

    const isPhone = /^\d+$/.test(
      String(email_or_phone).replace(/[\s\-\+]/g, ""),
    );
    let user;

    if (isPhone) {
      const normalizedPhone = normalizePhone(email_or_phone);
      const digits = String(email_or_phone).replace(/\D/g, "");

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: `91${normalizedPhone}` },
            { phone: digits },
          ],
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: email_or_phone.toLowerCase() },
      });
    }

    if (!user || !user.is_active) {
      return error(
        res,
        404,
        "No active account found with this email or phone.",
      );
    }

    await sendOtp(user.phone, "PASSWORD_RESET");

    return success(res, 200, "OTP sent successfully on WhatsApp.", {
      phone: user.phone,
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, new_password } = req.body;

    if (!phone || !otp || !new_password) {
      return error(res, 400, "Phone, OTP and new password are required.");
    }

    if (String(new_password).length < 6) {
      return error(res, 400, "Password must be at least 6 characters.");
    }

    const normalizedPhone = normalizePhone(phone);

    const result = await verifyOtp(normalizedPhone, otp, "PASSWORD_RESET");
    if (!result.valid) return error(res, 400, result.message);

    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { phone: normalizedPhone },
      data: { password_hash: passwordHash },
    });

    return success(res, 200, "Password reset successfully. Please login.");
  } catch (err) {
    next(err);
  }
};
const login = async (req, res, next) => {
  try {
    const { email_or_phone, password } = req.body;
    if (!email_or_phone || !password)
      return error(res, 400, "Email/phone and password are required.");

    const isPhone = /^\d+$/.test(email_or_phone.replace(/[\s\-\+]/g, ""));
    const user = isPhone
      ? await prisma.user.findUnique({
          where: { phone: normalizePhone(email_or_phone) },
        })
      : await prisma.user.findUnique({
          where: { email: email_or_phone.toLowerCase() },
        });

    if (!user) return error(res, 401, "Invalid credentials.");
    if (!user.is_active)
      return error(res, 403, "Account deactivated. Contact support.");
    if (user.role === ROLES.ADMIN)
      return error(res, 403, "Please use the admin login portal.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, "Invalid credentials.");

    const tokens = await generateTokens(user);
    setRefreshCookie(res, user.role, tokens.refreshToken);

    return success(res, 200, "Logged in successfully.", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      access_token: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return error(res, 400, "Email and password required.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== ROLES.ADMIN)
      return error(res, 401, "Invalid credentials.");
    if (!user.is_active) return error(res, 403, "Account deactivated.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, "Invalid credentials.");

    const tokens = await generateTokens(user);
    setRefreshCookie(res, ROLES.ADMIN, tokens.refreshToken);

    return success(res, 200, "Admin logged in.", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      access_token: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const requestedRole = normalizeRole(
      req.query.role || req.body?.role || ROLES.STUDENT,
    );
    const token =
      req.cookies?.[cookieNameForRole(requestedRole)] ||
      req.body?.refresh_token;
    if (!token) return error(res, 401, "Refresh token not found.");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return error(res, 401, "Invalid or expired refresh token.");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashString(token) },
    });
    if (!storedToken || storedToken.expires_at < new Date()) {
      return error(res, 401, "Refresh token revoked or expired.");
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
      },
    });
    if (!user || !user.is_active) return error(res, 401, "User not found.");

    const tokens = await generateTokens(user);
    setRefreshCookie(res, user.role, tokens.refreshToken);

    return success(res, 200, "Token refreshed.", {
      access_token: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const requestedRole = normalizeRole(req.query.role || req.body?.role || "");
    const roles = requestedRole
      ? [requestedRole]
      : [ROLES.ADMIN, ROLES.TUTOR, ROLES.STUDENT];

    for (const role of roles) {
      const token =
        req.cookies?.[cookieNameForRole(role)] || req.body?.refresh_token;
      if (token) {
        await prisma.refreshToken
          .deleteMany({ where: { token: hashString(token) } })
          .catch(() => {});
      }
      clearRefreshCookie(res, role);
    }

    return success(res, 200, "Logged out successfully.");
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar_url: true,
        created_at: true,
      },
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
  forgotPassword,
  resetPassword,
  login,
  adminLogin,
  refreshToken,
  logout,
  getMe,
};
