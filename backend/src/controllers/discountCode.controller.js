const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

function normalizeCode(code = "") {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isCodeUsable(codeRow, { course_id, batch_id } = {}) {
  const now = new Date();
  if (!codeRow || !codeRow.is_active) return { ok: false, message: "Invalid discount code." };
  if (codeRow.starts_at && now < new Date(codeRow.starts_at)) return { ok: false, message: "This discount code is not active yet." };
  if (codeRow.expires_at && now > new Date(codeRow.expires_at)) return { ok: false, message: "This discount code has expired." };
  if (codeRow.max_uses && Number(codeRow.used_count || 0) >= Number(codeRow.max_uses)) return { ok: false, message: "This discount code usage limit is over." };
  if (codeRow.course_id && course_id && codeRow.course_id !== course_id) return { ok: false, message: "This code is not valid for selected course." };
  if (codeRow.batch_id && batch_id && codeRow.batch_id !== batch_id) return { ok: false, message: "This code is not valid for selected batch." };
  return { ok: true };
}

async function listDiscountCodes(req, res, next) {
  try {
    const rows = await prisma.discountCode.findMany({
      orderBy: { created_at: "desc" },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        batch: { select: { id: true, name: true } },
      },
    });
    return success(res, 200, "Discount codes fetched.", rows);
  } catch (err) {
    next(err);
  }
}

async function createDiscountCode(req, res, next) {
  try {
    const {
      code,
      purpose,
      discount_price,
      original_price,
      course_id,
      batch_id,
      starts_at,
      expires_at,
      max_uses,
      is_active = true,
    } = req.body;

    const cleanCode = normalizeCode(code);
    if (!cleanCode) return error(res, 400, "Discount code is required.");
    if (!discount_price || asNumber(discount_price) <= 0) return error(res, 400, "Discount price is required.");
    if (!expires_at) return error(res, 400, "Expiry date and time is required.");

    const expiry = new Date(expires_at);
    if (Number.isNaN(expiry.getTime())) return error(res, 400, "Invalid expiry date.");

    const row = await prisma.discountCode.create({
      data: {
        code: cleanCode,
        purpose: purpose ? String(purpose).trim() : null,
        discount_price: asNumber(discount_price),
        original_price: original_price ? asNumber(original_price) : null,
        course_id: course_id || null,
        batch_id: batch_id || null,
        starts_at: starts_at ? new Date(starts_at) : null,
        expires_at: expiry,
        max_uses: max_uses ? Math.max(1, parseInt(max_uses)) : null,
        is_active: Boolean(is_active),
        created_by_id: req.user?.id || null,
      },
    });

    return success(res, 201, "Discount code created.", row);
  } catch (err) {
    if (String(err?.code) === "P2002") return error(res, 409, "This discount code already exists.");
    next(err);
  }
}

async function updateDiscountCode(req, res, next) {
  try {
    const { id } = req.params;
    const data = {};
    const allowed = ["purpose", "discount_price", "original_price", "course_id", "batch_id", "starts_at", "expires_at", "max_uses", "is_active"];
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (["discount_price", "original_price"].includes(key)) data[key] = req.body[key] ? asNumber(req.body[key]) : null;
      else if (["starts_at", "expires_at"].includes(key)) data[key] = req.body[key] ? new Date(req.body[key]) : null;
      else if (key === "max_uses") data[key] = req.body[key] ? Math.max(1, parseInt(req.body[key])) : null;
      else if (key === "is_active") data[key] = Boolean(req.body[key]);
      else data[key] = req.body[key] || null;
    }
    const row = await prisma.discountCode.update({ where: { id }, data });
    return success(res, 200, "Discount code updated.", row);
  } catch (err) {
    next(err);
  }
}

async function validateDiscountCode(req, res, next) {
  try {
    const code = normalizeCode(req.body.code || req.query.code);
    const course_id = req.body.course_id || req.query.course_id;
    const batch_id = req.body.batch_id || req.query.batch_id;
    const current_price = asNumber(req.body.current_price || req.query.current_price);

    if (!code) return error(res, 400, "Discount code is required.");

    const codeRow = await prisma.discountCode.findUnique({ where: { code } });
    const check = isCodeUsable(codeRow, { course_id, batch_id });
    if (!check.ok) return error(res, 400, check.message);

    const discountPrice = asNumber(codeRow.discount_price);
    const finalPrice = current_price > 0 ? Math.min(current_price, discountPrice) : discountPrice;

    return success(res, 200, "Discount code applied.", {
      id: codeRow.id,
      code: codeRow.code,
      purpose: codeRow.purpose,
      original_price: codeRow.original_price || current_price || null,
      discount_price: discountPrice,
      final_price: finalPrice,
      expires_at: codeRow.expires_at,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  validateDiscountCode,
  normalizeCode,
  isCodeUsable,
};
