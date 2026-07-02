const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

const REWARD_AMOUNT = Number(process.env.REFERRAL_REWARD_AMOUNT || 2000);

function normalizeReferralCode(value = "") {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function shortName(name = "") {
  return String(name || "DCT").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "DCT";
}

function last4(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
}

async function ensureStudentReferralCode(userId, tx = prisma) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true, name: true, phone: true, referral_code: true, role: true } });
  if (!user) throw new Error("Student not found.");
  if (user.referral_code) return user.referral_code;

  const base = `DCT${shortName(user.name)}${last4(user.phone)}`;
  for (let i = 0; i < 12; i += 1) {
    const suffix = i === 0 ? "" : String(Math.floor(10 + Math.random() * 90));
    const code = normalizeReferralCode(`${base}${suffix}`);
    const existing = await tx.user.findFirst({ where: { referral_code: code }, select: { id: true } });
    if (!existing) {
      await tx.user.update({ where: { id: user.id }, data: { referral_code: code } });
      return code;
    }
  }
  const fallback = normalizeReferralCode(`DCT${user.id.slice(-8)}`);
  await tx.user.update({ where: { id: user.id }, data: { referral_code: fallback } });
  return fallback;
}

async function validateReferralCode(req, res, next) {
  try {
    const code = normalizeReferralCode(req.body.code || req.query.code);
    if (!code) return error(res, 400, "Referral code is required.");

    const referrer = await prisma.user.findFirst({
      where: { referral_code: code, role: "STUDENT", is_active: true },
      select: { id: true, name: true, referral_code: true },
    });

    if (!referrer) return error(res, 404, "Invalid referral code.");
    return success(res, 200, "Referral code verified.", {
      code: referrer.referral_code,
      referrer_name: referrer.name,
      reward_amount: REWARD_AMOUNT,
    });
  } catch (err) {
    next(err);
  }
}

async function createReferralReward(tx, { pending, user, enrollmentId }) {
  const code = normalizeReferralCode(pending?.referral_code);
  if (!code || !user?.id) return null;

  const referrer = await tx.user.findFirst({
    where: { referral_code: code, role: "STUDENT", is_active: true },
    select: { id: true, referral_code: true },
  });

  if (!referrer || referrer.id === user.id) return null;

  const existing = await tx.referralReward.findFirst({
    where: {
      OR: [
        { referred_student_id: user.id },
        { pending_registration_id: pending.id },
      ],
    },
  });

  const data = {
    referrer_id: referrer.id,
    referred_student_id: user.id,
    pending_registration_id: pending.id,
    enrollment_id: enrollmentId || null,
    referral_code: referrer.referral_code,
    reward_amount: REWARD_AMOUNT,
    status: "PENDING",
    eligible_at: pending.emi_second_due || null,
  };

  if (existing) return tx.referralReward.update({ where: { id: existing.id }, data });
  return tx.referralReward.create({ data });
}

function decorateReward(row) {
  const now = new Date();
  const eligibleAt = row.eligible_at ? new Date(row.eligible_at) : null;
  const canCredit = row.status !== "CREDITED" && eligibleAt && eligibleAt <= now;
  return { ...row, is_eligible_now: Boolean(canCredit) };
}

async function getMyReferralDashboard(req, res, next) {
  try {
    const referralCode = await ensureStudentReferralCode(req.user.id);
    const rows = await prisma.referralReward.findMany({
      where: { referrer_id: req.user.id },
      orderBy: { created_at: "desc" },
      include: {
        referred_student: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const referrals = rows.map(decorateReward);
    const earned = referrals
      .filter((r) => r.status === "CREDITED")
      .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
    const pending = referrals
      .filter((r) => r.status !== "CREDITED")
      .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
    const eligible = referrals
      .filter((r) => r.is_eligible_now)
      .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);

    return success(res, 200, "Referral dashboard fetched.", {
      referral_code: referralCode,
      reward_amount: REWARD_AMOUNT,
      share_link: `${process.env.FRONTEND_URL || "https://digitalcadtraining.com"}/auth/register?ref=${referralCode}`,
      summary: { total_referrals: referrals.length, earned, pending, eligible },
      referrals,
    });
  } catch (err) {
    next(err);
  }
}

async function adminListReferrals(req, res, next) {
  try {
    const rows = await prisma.referralReward.findMany({
      orderBy: { created_at: "desc" },
      include: {
        referrer: { select: { id: true, name: true, email: true, phone: true, referral_code: true } },
        referred_student: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    return success(res, 200, "Referral records fetched.", rows.map(decorateReward));
  } catch (err) {
    next(err);
  }
}

async function adminMarkCredited(req, res, next) {
  try {
    const { id } = req.params;
    const row = await prisma.referralReward.update({
      where: { id },
      data: { status: "CREDITED", credited_at: new Date(), notes: req.body.notes || null },
    });
    return success(res, 200, "Referral reward marked as credited.", row);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  normalizeReferralCode,
  ensureStudentReferralCode,
  validateReferralCode,
  createReferralReward,
  getMyReferralDashboard,
  adminListReferrals,
  adminMarkCredited,
};
