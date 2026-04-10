/**
 * Application constants
 * Single source of truth for magic numbers / string values
 */

module.exports = {
  // JWT
  ACCESS_TOKEN_EXPIRES:  process.env.JWT_ACCESS_EXPIRES  || "15m",
  REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  REFRESH_TOKEN_EXPIRES_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // OTP
  OTP_LENGTH:           6,
  OTP_EXPIRES_MINUTES:  parseInt(process.env.OTP_EXPIRES_MINUTES) || 10,
  OTP_MAX_ATTEMPTS:     parseInt(process.env.OTP_MAX_ATTEMPTS)    || 3,

  // File uploads
  ALLOWED_FILE_TYPES:   ["image/jpeg", "image/png", "application/pdf"],
  MAX_FILE_SIZE:        20 * 1024 * 1024, // 20 MB

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE:     100,

  // Roles
  ROLES: {
    STUDENT: "STUDENT",
    TUTOR:   "TUTOR",
    ADMIN:   "ADMIN",
  },

  // Batch status flow
  BATCH_STATUS: {
    UPCOMING:  "UPCOMING",
    ACTIVE:    "ACTIVE",
    COMPLETED: "COMPLETED",
  },

  // HTTP status codes (just for readability)
  HTTP: {
    OK:           200,
    CREATED:      201,
    BAD_REQUEST:  400,
    UNAUTHORIZED: 401,
    FORBIDDEN:    403,
    NOT_FOUND:    404,
    CONFLICT:     409,
    SERVER_ERROR: 500,
  },
};
