/**
 * Authentication & Authorization Middleware
 *
 * authenticate  → verifies JWT access token, attaches req.user
 * authorize     → checks user role (STUDENT, TUTOR, ADMIN)
 */

const jwt    = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { error }  = require("../utils/response");

/**
 * Verify JWT access token from Authorization header
 * Attaches decoded user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, 401, "Access token required. Please log in.");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return error(res, 401, "Access token expired. Please refresh your session.");
      }
      return error(res, 401, "Invalid access token.");
    }

    // Fetch fresh user from DB (catches deactivated accounts)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id:          true,
        name:        true,
        email:       true,
        phone:       true,
        role:        true,
        is_verified: true,
        is_active:   true,
      },
    });

    if (!user)              return error(res, 401, "User not found.");
    if (!user.is_active)    return error(res, 403, "Account has been deactivated.");
    if (!user.is_verified)  return error(res, 403, "Phone number not verified. Please verify your OTP.");

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return error(res, 500, "Authentication error.");
  }
};

/**
 * Role-based access control
 * Usage: authorize("ADMIN") or authorize("TUTOR", "ADMIN")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, "Not authenticated.");
    }
    if (!roles.includes(req.user.role)) {
      return error(res, 403, `Access denied. Required role: ${roles.join(" or ")}.`);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
