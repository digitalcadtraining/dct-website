import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Users, BookOpen, Pencil, Save } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi, api } from "../../services/api.js";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

const STATUS_STYLE = {
  PENDING_APPROVAL: { bg:"bg-yellow-100", text:"text-yellow-700", label:"Pending Approval" },
  UPCOMING:         { bg:"bg-blue-100",   text:"text-blue-700",   label:"Upcoming"         },
  ACTIVE:           { bg:"bg-green-100",  text:"text-green-700",  label:"Active"           },
  COMPLETED:        { bg:"bg-gray-100",   text:"text-gray-500",   label:"Completed"        },
};

function rupee(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function toLocalInput(value) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  // Always display saved offer time as India business time.
  // Example: saved UTC 2026-06-22T16:40:00Z => input shows 2026-06-22T22:10.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function indiaLocalToISO(value) {
  if (!value) return null;

  const [datePart, timePart] = String(value).split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;

  // Convert India local datetime to UTC ISO before sending to backend.
  // IST is UTC+05:30, so subtract 5h 30m.
  const utcMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0, 0);
  return new Date(utcMs).toISOString();
}

function offerLabel(batch) {
  const start = batch.offer_start_at ? new Date(batch.offer_start_at) : null;
  const end = batch.offer_end_at ? new Date(batch.offer_end_at) : null;
  const now = new Date();
  if (start && now < start) return "Scheduled";
  if (end && now <= end) return "Live";
  if (start || end) return "Expired";
  return "No timer";
}

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.batches()
      .then(r => setBatches(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveBatch(id);
      setBatches(b => b.map(batch => batch.id === id ? { ...batch, status:"UPCOMING" } : batch));
      alert("✅ Batch approved! Students can now enroll.");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this batch?")) return;
    try {
      await adminApi.rejectBatch(id);
      setBatches(b => b.filter(batch => batch.id !== id));
    } catch (e) { alert("Error: " + e.message); }
  };

  const startEdit = (batch) => {
    setEditing({
      id: batch.id,
      name: batch.name,
      offer_name: batch.offer_name || "Limited Batch Offer",
      original_price: batch.original_price || batch.course?.price || "",
      offer_price: batch.offer_price || batch.course?.price || "",
      offer_start_at: toLocalInput(batch.offer_start_at),
      offer_end_at: toLocalInput(batch.offer_end_at),
    });
  };

  const savePricing = async () => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const res = await api.patch(`/admin/batches/${editing.id}/pricing`, {
        offer_name: editing.offer_name,
        original_price: editing.original_price,
        offer_price: editing.offer_price,
        offer_start_at: indiaLocalToISO(editing.offer_start_at),
        offer_end_at: indiaLocalToISO(editing.offer_end_at),
      }, "admin");
      const updated = res.data || {};
      setBatches((items) => items.map((b) => b.id === editing.id ? { ...b, ...updated } : b));
      setEditing(null);
      alert("✅ Batch pricing and offer timer updated.");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === "ALL" ? batches : batches.filter(b => b.status === filter);
  const pendingCount = batches.filter(b => b.status === "PENDING_APPROVAL").length;

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Batch Management</h1>
            <p className="text-sm" style={{ color:C.gray }}>
              {pendingCount > 0 && <span className="text-yellow-600 font-bold">{pendingCount} pending approval · </span>}
              {batches.length} total batches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["PENDING_APPROVAL","ALL","UPCOMING","ACTIVE","COMPLETED"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: filter === f ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#f3f4f6", color: filter === f ? "white" : C.gray }}>
              {f === "PENDING_APPROVAL" ? `Pending (${pendingCount})` : f}
            </button>
          ))}
        </div>

        {loading && <p className="text-center py-12 text-sm" style={{ color:C.gray }}>Loading batches…</p>}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color:"#22c55e" }}/>
            <p className="font-bold" style={{ color:C.dark }}>No batches here</p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((batch, i) => {
            const st = STATUS_STYLE[batch.status] || STATUS_STYLE.UPCOMING;
            const slots = batch.time_slots || [];
            const original = batch.original_price || batch.course?.price || 0;
            const offer = batch.offer_price || batch.course?.price || 0;
            const timer = offerLabel(batch);
            return (
              <motion.div key={batch.id} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                      <h3 className="font-extrabold text-sm" style={{ color:C.dark }}>{batch.name}</h3>
                    </div>

                    <p className="text-xs mb-2" style={{ color:C.gray }}>
                      Tutor: <strong style={{ color:C.dark }}>{batch.tutor?.name}</strong>
                      {" · "}Course: <strong style={{ color:C.dark }}>{batch.course?.name}</strong>
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 font-semibold" style={{ color:C.gray }}>
                        📅 {new Date(batch.start_date).toLocaleDateString("en-IN")} → {new Date(batch.end_date).toLocaleDateString("en-IN")}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 font-semibold" style={{ color:C.gray }}>
                        <Users size={10} className="inline mr-1"/>{batch._count?.enrollments || 0}/{batch.max_students} students
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 font-semibold" style={{ color:C.gray }}>
                        <BookOpen size={10} className="inline mr-1"/>{batch._count?.scheduled_sessions || 0} sessions
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 font-bold" style={{ color:C.blue }}>
                        Offer: {batch.offer_name || "Limited Batch Offer"}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 font-bold text-green-700">
                        Price ₹{rupee(offer)}
                      </span>
                      {Number(original) > Number(offer) && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 font-bold text-red-700">
                          Original ₹{rupee(original)}
                        </span>
                      )}
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                        timer === "Live" ? "bg-orange-50 text-orange-700" :
                        timer === "Scheduled" ? "bg-sky-50 text-sky-700" :
                        timer === "Expired" ? "bg-gray-100 text-gray-600" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        Timer: {timer}
                      </span>
                    </div>

                    {slots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map(s => (
                          <span key={s} className="flex items-center gap-1 bg-blue-50 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color:C.primary }}>
                            <Clock size={10}/> {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(batch)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:bg-blue-50" style={{ borderColor:"#bfdbfe", color:C.blue }}>
                      <Pencil size={13}/> Edit Offer
                    </button>

                    {batch.status === "PENDING_APPROVAL" && (
                      <>
                        <button onClick={() => handleApprove(batch.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5" style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)" }}>
                          <CheckCircle2 size={13}/> Approve
                        </button>
                        <button onClick={() => handleReject(batch.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:bg-red-50" style={{ borderColor:"#fca5a5", color:"#dc2626" }}>
                          <XCircle size={13}/> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-extrabold mb-1" style={{ color:C.dark }}>Edit Batch Offer</h2>
              <p className="text-xs mb-5" style={{ color:C.gray }}>{editing.name}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color:C.gray }}>Offer Name</label>
                  <input value={editing.offer_name} onChange={(e) => setEditing({ ...editing, offer_name:e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="July Reset Offer" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color:C.gray }}>Actual Price / Strike Price</label>
                  <input type="number" value={editing.original_price} onChange={(e) => setEditing({ ...editing, original_price:e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="24999" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color:C.gray }}>Timed Offer Price</label>
                  <input type="number" value={editing.offer_price} onChange={(e) => setEditing({ ...editing, offer_price:e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="16999" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color:C.gray }}>Offer Starts At</label>
                    <input type="datetime-local" value={editing.offer_start_at} onChange={(e) => setEditing({ ...editing, offer_start_at:e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color:C.gray }}>Offer Ends At</label>
                    <input type="datetime-local" value={editing.offer_end_at} onChange={(e) => setEditing({ ...editing, offer_end_at:e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold" style={{ color:C.gray }}>
                  Time is saved exactly as India time. If start date is in future, course page shows “offer will start in…”. If live, it shows “offer ends in…”. Actual price remains strike price.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditing(null)} className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-100" style={{ color:C.gray }}>Cancel</button>
                <button onClick={savePricing} disabled={saving} className="flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
                  <Save size={15}/>{saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
