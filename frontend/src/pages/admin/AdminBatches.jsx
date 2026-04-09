import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Users, BookOpen } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

const STATUS_STYLE = {
  PENDING_APPROVAL: { bg:"bg-yellow-100", text:"text-yellow-700", label:"Pending Approval" },
  UPCOMING:         { bg:"bg-blue-100",   text:"text-blue-700",   label:"Upcoming"         },
  ACTIVE:           { bg:"bg-green-100",  text:"text-green-700",  label:"Active"           },
  COMPLETED:        { bg:"bg-gray-100",   text:"text-gray-500",   label:"Completed"        },
};

export default function AdminBatches() {
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("PENDING_APPROVAL");

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

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["PENDING_APPROVAL","ALL","UPCOMING","ACTIVE","COMPLETED"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter === f ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#f3f4f6",
                color:      filter === f ? "white" : C.gray,
              }}>
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
            const st    = STATUS_STYLE[batch.status] || STATUS_STYLE.UPCOMING;
            const slots = batch.time_slots || [];
            return (
              <motion.div key={batch.id} className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.05 }}>

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

                    {/* Time slots */}
                    {slots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map(s => (
                          <span key={s} className="flex items-center gap-1 bg-blue-50 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ color:C.primary }}>
                            <Clock size={10}/> {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Approve/Reject only for pending */}
                  {batch.status === "PENDING_APPROVAL" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(batch.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                        style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)" }}>
                        <CheckCircle2 size={13}/> Approve
                      </button>
                      <button onClick={() => handleReject(batch.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:bg-red-50"
                        style={{ borderColor:"#fca5a5", color:"#dc2626" }}>
                        <XCircle size={13}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
