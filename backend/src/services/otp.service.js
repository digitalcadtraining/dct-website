/**
 * OTP Service
 * WhatsApp OTP via AiSensy + safe development fallback.
 *
 * Required .env:
 * OTP_DEV_MODE=true
 * AISENSY_API_KEY=your_api_key
 * AISENSY_CAMPAIGN_NAME=dct_login_otp
 * AISENSY_API_URL=https://backend.aisensy.com/campaign/t1/api/v2
 */

const { prisma } = require("../config/db");
const { hashString, normalizePhone } = require("../utils/helpers");
const {
  OTP_LENGTH,
  OTP_EXPIRES_MINUTES,
  OTP_MAX_ATTEMPTS,
} = require("../config/constants");

function isDevOtpMode() {
  return String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true";
}

function getAiSensyDestination(phone) {
  const normalizedPhone = normalizePhone(phone);
  return `91${normalizedPhone}`;
}

async function sendViaAiSensy(phone, otp) {
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName = process.env.AISENSY_CAMPAIGN_NAME;
  const apiUrl =
    process.env.AISENSY_API_URL ||
    "https://backend.aisensy.com/campaign/t1/api/v2";

  if (!apiKey) {
    throw new Error("AISENSY_API_KEY is missing in backend .env");
  }

  if (!campaignName) {
    throw new Error("AISENSY_CAMPAIGN_NAME is missing in backend .env");
  }

  const destination = getAiSensyDestination(phone);

  const body = {
    apiKey,
    campaignName,
    destination,
    userName: "Digital CAD Training and Services",

    // Body OTP parameter
    templateParams: [String(otp)],

    source: process.env.AISENSY_SOURCE || "new-landing-page form",
    media: {},

    // AiSensy generated curl uses this button structure for Copy Code.
    // Keep sub_type as "url" because this is what AiSensy generated for your campaign.
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: String(otp),
          },
        ],
      },
    ],

    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: String(otp),
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `AiSensy OTP error (${response.status}): ${data?.message || data?.error || text || "Request failed"}`
    );
  }

  const statusText = String(data?.status || data?.success || data?.message || "").toLowerCase();
  if (
    data?.success === false ||
    statusText.includes("failed") ||
    statusText.includes("error")
  ) {
    throw new Error(`AiSensy OTP failed: ${data?.message || data?.error || text}`);
  }

  console.log("AiSensy OTP response:", JSON.stringify(data, null, 2));
  return data;
}

const sendOtp = async (phone, purpose) => {
  const normalizedPhone = normalizePhone(phone);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await prisma.otpVerification.updateMany({
    where: { phone: normalizedPhone, purpose, is_used: false },
    data: { is_used: true },
  });

  await prisma.otpVerification.create({
    data: {
      phone: normalizedPhone,
      otp: hashString(otp),
      purpose,
      expires_at: expiresAt,
    },
  });

  if (isDevOtpMode()) {
    console.log(
      `\n📱 DCT OTP for ${normalizedPhone} [${purpose}]: \x1b[33m${otp}\x1b[0m (expires in ${OTP_EXPIRES_MINUTES} min)\n`
    );
    return { success: true, otp };
  }

  await sendViaAiSensy(normalizedPhone, otp);
  return { success: true };
};

const verifyOtp = async (phone, otp, purpose) => {
  const normalizedPhone = normalizePhone(phone);

  const record = await prisma.otpVerification.findFirst({
    where: {
      phone: normalizedPhone,
      purpose,
      is_used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!record) {
    return {
      valid: false,
      message: "OTP expired or not found. Please request a new one.",
    };
  }

  const attemptsAfterThisTry = Number(record.attempts || 0) + 1;

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  if (record.otp !== hashString(String(otp))) {
    if (attemptsAfterThisTry >= OTP_MAX_ATTEMPTS) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { is_used: true },
      });

      return {
        valid: false,
        message: "Too many wrong attempts. Please request a new OTP.",
      };
    }

    const remaining = OTP_MAX_ATTEMPTS - attemptsAfterThisTry;
    return {
      valid: false,
      message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { is_used: true },
  });

  return { valid: true };
};

module.exports = { sendOtp, verifyOtp };
