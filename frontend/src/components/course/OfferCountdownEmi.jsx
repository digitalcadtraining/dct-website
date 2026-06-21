import { useEffect, useMemo, useState } from "react";

function rupee(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function compactLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (d > 0) return `${d}d ${pad2(h)}h ${pad2(m)}m`;
  if (h > 0) return `${h}h ${pad2(m)}m ${pad2(s)}s`;
  return `${m}m ${pad2(s)}s`;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtEmiDate(date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function CourseOfferCountdown({ batch, offerName, className = "" }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = toDate(batch?.offer_start_at);
  const end = toDate(batch?.offer_end_at);

  const state = useMemo(() => {
    if (!start && !end) return null;
    if (start && now < start.getTime()) {
      return {
        mode: "scheduled",
        label: `${offerName || "Offer"} starts in`,
        left: start.getTime() - now,
        pct: 0,
      };
    }
    if (end && now <= end.getTime()) {
      const total = Math.max(1, end.getTime() - (start?.getTime() || now));
      const elapsed = Math.max(0, now - (start?.getTime() || now));
      return {
        mode: "live",
        label: `${offerName || "Offer"} ends in`,
        left: end.getTime() - now,
        pct: Math.max(4, Math.min(100, 100 - (elapsed / total) * 100)),
      };
    }
    return null;
  }, [batch?.offer_start_at, batch?.offer_end_at, offerName, now]);

  if (!state) return null;

  return (
    <div className={`dct-offer-fomo ${state.mode === "scheduled" ? "scheduled" : "live"} ${className}`}>
      <div className="dct-offer-fomo-row">
        <span className="dct-offer-fomo-dot" />
        <strong>{state.label}</strong>
        <b>{compactLeft(state.left)}</b>
      </div>
      <div className="dct-offer-fomo-track">
        <span style={{ width: `${state.pct}%` }} />
      </div>
    </div>
  );
}

export function CourseEmiDropdown({ batch, currentPrice, registrationFee = 999 }) {
  const [open, setOpen] = useState(false);
  const start = toDate(batch?.start_date) || new Date();
  const first = addDays(start, 2);
  const second = addDays(first, 31);
  const remaining = Math.max(0, Number(currentPrice || 0) - Number(registrationFee || 0));
  const emi = Math.ceil(remaining / 2);

  return (
    <div className="dct-course-emi-box">
      <button type="button" className="dct-course-emi-trigger" onClick={() => setOpen((v) => !v)}>
        <span>Check EMI option</span>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && (
        <div className="dct-course-emi-body">
          <div><strong>Lock price now</strong><span>₹{rupee(registrationFee)} registration</span></div>
          <div><strong>First EMI</strong><span>₹{rupee(emi)} on {fmtEmiDate(first)}</span></div>
          <div><strong>Second EMI</strong><span>₹{rupee(emi)} on {fmtEmiDate(second)}</span></div>
        </div>
      )}
    </div>
  );
}

export const COURSE_OFFER_EMI_CSS = `
.dct-offer-fomo{margin:10px 0 14px;padding:10px 12px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa}
.dct-offer-fomo.scheduled{background:#eff8ff;border-color:#bfdbfe}
.dct-offer-fomo-row{display:flex;align-items:center;gap:8px;font-size:12px;color:#7c2d12}
.dct-offer-fomo.scheduled .dct-offer-fomo-row{color:#024981}
.dct-offer-fomo-row strong{font-weight:900;flex:1}
.dct-offer-fomo-row b{font-weight:900;white-space:nowrap}
.dct-offer-fomo-dot{width:8px;height:8px;border-radius:999px;background:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,.12)}
.dct-offer-fomo.scheduled .dct-offer-fomo-dot{background:#0d92db;box-shadow:0 0 0 4px rgba(13,146,219,.12)}
.dct-offer-fomo-track{height:5px;margin-top:8px;border-radius:999px;background:rgba(0,0,0,.08);overflow:hidden}
.dct-offer-fomo-track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f97316,#ef4444);transition:width .3s}
.dct-offer-fomo.scheduled .dct-offer-fomo-track span{background:linear-gradient(90deg,#024981,#0d92db)}
.dct-course-emi-box{margin:-10px 0 18px;border:1px solid #d9e6ef;border-radius:14px;overflow:hidden;background:#f8fcff}
.dct-course-emi-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:0;background:transparent;color:#024981;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer}
.dct-course-emi-trigger b{width:22px;height:22px;border-radius:8px;display:grid;place-items:center;background:#e5f2f9}
.dct-course-emi-body{display:grid;gap:8px;padding:0 12px 12px}
.dct-course-emi-body div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid #e6eef5;font-size:12px}
.dct-course-emi-body strong{color:#1f1a17}
.dct-course-emi-body span{color:#6a6b6d;font-weight:800;text-align:right}
`;
