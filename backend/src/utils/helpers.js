/**
 * General utility helpers
 */

const crypto = require("crypto");

/**
 * Generate a random N-digit OTP
 */
const generateOtp = (length = 6) => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Generate batch name from course short name + start date
 * e.g. "Plastic Product Design - April 2025"
 */
const generateBatchName = (courseName, startDate) => {
  const date = new Date(startDate);
  const month = date.toLocaleString("en-IN", { month: "long" });
  const year  = date.getFullYear();
  return `${courseName} - ${month} ${year}`;
};

/**
 * Generate URL-friendly slug from a string
 * e.g. "Plastic Product Design" → "plastic-product-design"
 */
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Paginate helper — returns skip/take for Prisma
 */
const getPagination = (page = 1, pageSize = 20) => {
  const safePage     = Math.max(1, parseInt(page));
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize)));
  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
    page: safePage,
    pageSize: safePageSize,
  };
};

/**
 * Hash a string with SHA-256 (for refresh tokens, OTPs stored in DB)
 */
const hashString = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Normalize phone number (removes spaces, dashes, +91 prefix)
 * Always stores as 10-digit Indian mobile number
 */
const normalizePhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0"))  return digits.slice(1);
  return digits.slice(-10);
};

module.exports = {
  generateOtp,
  generateBatchName,
  slugify,
  getPagination,
  hashString,
  normalizePhone,
};
