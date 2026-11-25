// Display-only localization. All payment amounts remain stored in INR.
export function studentMoney(amountInInr, international) {
  if (!international) {
    return `₹${Number(amountInInr || 0).toLocaleString("en-IN")}`;
  }
  const rate = Number(international.fx?.rate);
  if (!Number.isFinite(rate) || rate <= 0) return "USD rate unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountInInr || 0) * rate);
}

export function zonedDateTime(iso, timeZone, options = {}) {
  if (!iso || !timeZone) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      ...options,
    }).format(date);
  } catch {
    return null;
  }
}

export function timeZoneLabel(timeZone) {
  return String(timeZone || "").replaceAll("_", " ");
}
