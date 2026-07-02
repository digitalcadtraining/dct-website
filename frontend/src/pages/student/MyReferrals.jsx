import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { referralApi } from "../../services/api.js";
import { Copy, Gift, Share2, Wallet, Clock3, CheckCircle2 } from "lucide-react";

const C = { dark: "#1F1A17", blue: "#024981", primary: "#007BBF", gray: "#6A6B6D" };
const money = (v) => Number(v || 0).toLocaleString("en-IN");
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "After 2nd EMI payment";

export default function MyReferrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    setErr("");
    referralApi.me()
      .then((res) => setData(res.data))
      .catch((e) => setErr(e.message || "Failed to load referral dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const shareMessage = `Join Digital CAD Training with my referral code ${data?.referral_code || ""}. Use this link: ${data?.share_link || ""}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-dct-dark">Refer & Earn</h1>
          <p className="text-sm text-dct-gray">Invite friends and earn ₹2,000 after their second EMI is completed.</p>
        </div>

        {loading && <div className="bg-white rounded-2xl p-10 border text-center text-dct-gray">Loading referral details…</div>}
        {!loading && err && <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-600 font-semibold">{err}</div>}

        {!loading && !err && data && (
          <>
            <div className="rounded-3xl p-6 mb-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})`, color: "#fff" }}>
              <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-80 mb-2">Your referral code</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between relative z-10">
                <div>
                  <h2 className="text-4xl font-black tracking-wider">{data.referral_code}</h2>
                  <p className="text-sm opacity-85 mt-2">Share this code or direct link with your friends.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => copy(data.referral_code)} className="inline-flex items-center gap-2 rounded-xl bg-white text-dct-dark px-4 py-3 text-sm font-bold"><Copy size={16}/>{copied ? "Copied" : "Copy Code"}</button>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#1E2023] text-white px-4 py-3 text-sm font-bold"><Share2 size={16}/>WhatsApp</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Stat icon={<Wallet size={18}/>} label="Credited earnings" value={`₹${money(data.summary?.earned)}`} />
              <Stat icon={<Clock3 size={18}/>} label="Pending rewards" value={`₹${money(data.summary?.pending)}`} />
              <Stat icon={<Gift size={18}/>} label="Total referrals" value={data.summary?.total_referrals || 0} />
            </div>

            <div className="bg-white rounded-3xl border border-blue-100 p-5 mb-5" style={{ boxShadow: "0 12px 34px rgba(2,73,129,.07)" }}>
              <h2 className="text-lg font-extrabold text-dct-dark mb-3">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Step n="1" title="Share your code" text="Send your referral code or WhatsApp link to your friend." />
                <Step n="2" title="Friend enrolls" text="Your friend uses your code during registration and pays ₹999 registration." />
                <Step n="3" title="Bonus unlocks" text="Your ₹2,000 bonus becomes payable after their second EMI is completed." />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5" style={{ boxShadow: "0 12px 34px rgba(0,0,0,.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-dct-dark">Referral history</h2>
                <button onClick={load} className="text-xs font-bold text-dct-primary">Refresh</button>
              </div>
              {data.referrals?.length === 0 ? (
                <div className="text-center py-10 text-dct-gray">
                  <Gift className="mx-auto mb-3 text-gray-300" size={40}/>
                  <p className="font-bold text-dct-dark">No referrals yet</p>
                  <p className="text-sm">Share your code today and start earning.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.referrals.map((r) => (
                    <div key={r.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-dct-dark">{r.referred_student?.name || "Referred student"}</p>
                        <p className="text-xs text-dct-gray">Bonus unlock date: {fmt(r.eligible_at)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-black text-dct-primary">₹{money(r.reward_amount)}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${r.status === "CREDITED" ? "bg-green-100 text-green-700" : r.is_eligible_now ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                          {r.status === "CREDITED" && <CheckCircle2 size={12}/>} {r.status === "CREDITED" ? "Credited" : r.is_eligible_now ? "Eligible now" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </PageWrapper>
    </AppShell>
  );
}

function Stat({ icon, label, value }) {
  return <div className="bg-white rounded-2xl border border-blue-100 p-5" style={{ boxShadow: "0 10px 26px rgba(2,73,129,.06)" }}><div className="w-10 h-10 rounded-xl bg-blue-50 text-dct-primary grid place-items-center mb-3">{icon}</div><p className="text-2xl font-black text-dct-dark">{value}</p><p className="text-xs font-bold text-dct-gray uppercase tracking-wider">{label}</p></div>;
}
function Step({ n, title, text }) { return <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4"><div className="w-8 h-8 rounded-full bg-dct-primary text-white grid place-items-center text-sm font-black mb-3">{n}</div><p className="font-bold text-dct-dark">{title}</p><p className="text-sm text-dct-gray mt-1">{text}</p></div>; }
