/**
 * OTP Service
 * Uses MSG91 in production (popular, India-based SMS provider)
 * Falls back to console.log in development so you can test without SMS credits
 *
 * MSG91 Setup:
 * 1. Sign up at msg91.com
 * 2. Create a template with variable {otp}
 * 3. Set MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID in .env
 */

const { prisma }        = require("../config/db");
const { generateOtp, hashString, normalizePhone } = require("../utils/helpers");
const { OTP_LENGTH, OTP_EXPIRES_MINUTES, OTP_MAX_ATTEMPTS } = require("../config/constants");

/**
 * Send OTP to a phone number
 * Stores hashed OTP in DB, sends raw OTP via SMS
 * Returns { success, otp (dev only) }
 */
const sendOtp = async (phone, purpose) => {
  const normalizedPhone = normalizePhone(phone);
  const otp             = generateOtp(OTP_LENGTH);
  const expiresAt       = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  // Invalidate any existing unused OTPs for this phone+purpose
  await prisma.otpVerification.updateMany({
    where: { phone: normalizedPhone, purpose, is_used: false },
    data:  { is_used: true },
  });

  // Store hashed OTP (never store raw OTP in DB)
  await prisma.otpVerification.create({
    data: {
      phone:      normalizedPhone,
      otp:        hashString(otp),
      purpose,
      expires_at: expiresAt,
    },
  });

  // Send SMS
  if (process.env.NODE_ENV === "production") {
    await sendViaMSG91(normalizedPhone, otp);
    return { success: true };
  } else {
    // ── Development: print OTP to console ────────────────
    console.log(`\n📱 OTP for ${normalizedPhone} [${purpose}]: \x1b[33m${otp}\x1b[0m (expires in ${OTP_EXPIRES_MINUTES} min)\n`);
    return { success: true, otp }; // Return OTP in dev for easy testing
  }
};

/**
 * Verify OTP entered by user
 * Returns { valid: true } or { valid: false, message: "..." }
 */
const verifyOtp = async (phone, otp, purpose) => {
  const normalizedPhone = normalizePhone(phone);

  const record = await prisma.otpVerification.findFirst({
    where: {
      phone:   normalizedPhone,
      purpose,
      is_used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!record) {
    return { valid: false, message: "OTP expired or not found. Please request a new one." };
  }

  // Increment attempt count
  await prisma.otpVerification.update({
    where: { id: record.id },
    data:  { attempts: { increment: 1 } },
  });

  if (record.attempts + 1 >= OTP_MAX_ATTEMPTS) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data:  { is_used: true },
    });
    return { valid: false, message: `Too many wrong attempts. Please request a new OTP.` };
  }

  // Compare hashed OTP
  if (record.otp !== hashString(otp)) {
    const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
    return { valid: false, message: `Incorrect OTP. ${remaining} attempt(s) remaining.` };
  }

  // Mark as used
  await prisma.otpVerification.update({
    where: { id: record.id },
    data:  { is_used: true },
  });

  return { valid: true };
};

/**
 * Send SMS via MSG91 API
 * Docs: https://docs.msg91.com/reference/send-otp
 */
const sendViaMSG91 = async (phone, otp) => {
  const url  = "https://control.msg91.com/api/v5/otp";
  const body = JSON.stringify({
    template_id: process.env.MSG91_TEMPLATE_ID,
    mobile:      `91${phone}`,
    authkey:     process.env.MSG91_AUTH_KEY,
    otp,
  });

  const response = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MSG91 error: ${text}`);
  }

  return response.json();
};

module.exports = { sendOtp, verifyOtp };
