import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { referralApi } from "../../services/api.js";
import { Gift, RefreshCw, CheckCircle2 } from "lucide-react";

const money = (v) => Number(v || 0).toLocaleString("en-IN");
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function AdminReferrals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = () => {
    setLoading(true); setErr("");
    referralApi.adminList().then((res) => setRows(res.data || [])).catch((e) => setErr(e.message || "Failed to load referrals.")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const credited = rows.filter(r => r.status === "CREDITED").reduce((s, r) => s + Number(r.reward_amount || 0), 0);
    const pending = rows.filter(r => r.status !== "CREDITED").reduce((s, r) => s + Number(r.reward_amount || 0), 0);
    const eligible = rows.filter(r => r.is_eligible_now && r.status !== "CREDITED").length;
    return { credited, pending, eligible };
  }, [rows]);

  const credit = async (id) => {
    if (!window.confirm("Mark this referral reward as credited?")) return;
    setBusy(id);
    try { await referralApi.markCredited(id); load(); } catch(e) { alert(e.message || "Failed to credit."); } finally { setBusy(""); }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">Refer & Earn</h1>
            <p className="text-sm text-dct-gray">Track who referred whom and credit rewards after second EMI confirmation.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-dct-primary text-white px-4 py-2 text-sm font-bold"><RefreshCw size={15}/>Refresh</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Stat label="Total referrals" value={rows.length} />
          <Stat label="Pending amount" value={`₹${money(summary.pending)}`} />
          <Stat label="Credited amount" value={`₹${money(summary.credited)}`} />
        </div>

        {loading && <div className="bg-white rounded-2xl border p-10 text-center text-dct-gray">Loading referrals…</div>}
        {!loading && err && <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-600 font-semibold">{err}</div>}

        {!loading && !err && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 12px 34px rgba(0,0,0,.05)" }}>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-blue-50 text-dct-dark">
                  <tr>
                    <th className="text-left p-4">Referrer</th>
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Referred Student</th>
                    <th className="text-left p-4">Reward</th>
                    <th className="text-left p-4">Eligible/Credit Date</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan="7" className="p-10 text-center text-dct-gray"><Gift className="mx-auto mb-2 text-gray-300"/>No referral records yet.</td></tr>}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-4"><b>{r.referrer?.name || "—"}</b><br/><span className="text-xs text-dct-gray">{r.referrer?.phone}</span></td>
                      <td className="p-4 font-black text-dct-primary">{r.referral_code}</td>
                      <td className="p-4"><b>{r.referred_student?.name || "—"}</b><br/><span className="text-xs text-dct-gray">{r.referred_student?.phone}</span></td>
                      <td className="p-4 font-black">₹{money(r.reward_amount)}</td>
                      <td className="p-4">{r.status === "CREDITED" ? fmt(r.credited_at) : fmt(r.eligible_at)}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === "CREDITED" ? "bg-green-100 text-green-700" : r.is_eligible_now ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{r.status === "CREDITED" ? "CREDITED" : r.is_eligible_now ? "ELIGIBLE" : "PENDING"}</span></td>
                      <td className="p-4">{r.status === "CREDITED" ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold"><CheckCircle2 size={14}/>Done</span> : <button disabled={busy===r.id} onClick={() => credit(r.id)} className="rounded-xl bg-dct-primary text-white px-3 py-2 text-xs font-bold disabled:opacity-60">Mark Credited</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
function Stat({ label, value }) { return <div className="bg-white rounded-2xl border border-blue-100 p-5"><p className="text-2xl font-black text-dct-dark">{value}</p><p className="text-xs font-bold text-dct-gray uppercase tracking-wider">{label}</p></div>; }
