// Optional settings for admin-created students living outside India.
// Country selection is explicit: calling codes alone are not unique to countries.
const COUNTRIES = [
  { code: "US", name: "United States", dial_code: "+1", time_zones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"] },
  { code: "MX", name: "Mexico", dial_code: "+52", time_zones: ["America/Mexico_City", "America/Cancun", "America/Tijuana", "America/Hermosillo"] },
  { code: "MY", name: "Malaysia", dial_code: "+60", time_zones: ["Asia/Kuala_Lumpur"] },
  { code: "CA", name: "Canada", dial_code: "+1", time_zones: ["America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver", "America/Halifax", "America/St_Johns"] },
  { code: "GB", name: "United Kingdom", dial_code: "+44", time_zones: ["Europe/London"] },
  { code: "AU", name: "Australia", dial_code: "+61", time_zones: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth", "Australia/Darwin"] },
  { code: "AE", name: "United Arab Emirates", dial_code: "+971", time_zones: ["Asia/Dubai"] },
  { code: "SA", name: "Saudi Arabia", dial_code: "+966", time_zones: ["Asia/Riyadh"] },
  { code: "SG", name: "Singapore", dial_code: "+65", time_zones: ["Asia/Singapore"] },
  { code: "DE", name: "Germany", dial_code: "+49", time_zones: ["Europe/Berlin"] },
  { code: "FR", name: "France", dial_code: "+33", time_zones: ["Europe/Paris"] },
  { code: "ZA", name: "South Africa", dial_code: "+27", time_zones: ["Africa/Johannesburg"] },
  { code: "NG", name: "Nigeria", dial_code: "+234", time_zones: ["Africa/Lagos"] },
  { code: "PH", name: "Philippines", dial_code: "+63", time_zones: ["Asia/Manila"] },
  { code: "ID", name: "Indonesia", dial_code: "+62", time_zones: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] },
  { code: "JP", name: "Japan", dial_code: "+81", time_zones: ["Asia/Tokyo"] },
  { code: "TH", name: "Thailand", dial_code: "+66", time_zones: ["Asia/Bangkok"] },
  { code: "BR", name: "Brazil", dial_code: "+55", time_zones: ["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco"] },
  { code: "NZ", name: "New Zealand", dial_code: "+64", time_zones: ["Pacific/Auckland", "Pacific/Chatham"] },
  { code: "QA", name: "Qatar", dial_code: "+974", time_zones: ["Asia/Qatar"] },
];

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function validateInternationalStudent({ student_type, country_code, time_zone, phone }) {
  if (student_type === undefined || student_type === null || student_type === "INDIAN") return null;
  if (student_type !== "FOREIGN") throw badRequest("Invalid student type.");
  const country = COUNTRIES.find((item) => item.code === String(country_code || "").toUpperCase());
  if (!country) throw badRequest("Select a supported country for this international student.");
  if (!country.time_zones.includes(String(time_zone || ""))) {
    throw badRequest("Select a valid time zone for the student's country.");
  }
  const raw = String(phone || "").trim();
  if (raw.startsWith("+")) throw badRequest("Enter only the local phone number; the country code is added automatically.");
  const national = raw.replace(/[\s().-]/g, "");
  if (!/^\d{5,14}$/.test(national) || country.dial_code.length - 1 + national.length > 15) {
    throw badRequest("Enter a valid international phone number (5–15 digits including country code).");
  }
  return {
    country_code: country.code,
    dial_code: country.dial_code,
    time_zone: time_zone,
    normalized_phone: country.dial_code.slice(1) + national,
  };
}

let cachedQuote = null;
let cachedAt = 0;
let pending = null;

// Public bank reference rate, not a payment processor rate.
// A failed provider call never blocks student registration or dashboard loading.
async function getUsdReferenceRate() {
  if (cachedQuote && Date.now() - cachedAt < 4 * 60 * 60 * 1000) return cachedQuote;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch("https://api.frankfurter.dev/v2/rate/INR/USD", {
        signal: AbortSignal.timeout(4500),
      });
      if (!response.ok) throw new Error("FX rate service unavailable");
      const data = await response.json();
      const rate = Number(data.rate);
      if (!Number.isFinite(rate) || rate <= 0 || rate >= 1 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date || "")) {
        throw new Error("Invalid FX rate response");
      }
      cachedQuote = {
        rate,
        date: data.date,
        currency: "USD",
        base_currency: "INR",
        source: "Frankfurter reference rate",
        stale: false,
      };
      cachedAt = Date.now();
      return cachedQuote;
    } catch (err) {
      // Reuse a previously verified rate rather than inventing a live one.
      cachedAt = Date.now() - 3 * 60 * 60 * 1000;
      return cachedQuote ? { ...cachedQuote, stale: true } : null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

module.exports = { COUNTRIES, validateInternationalStudent, getUsdReferenceRate };
