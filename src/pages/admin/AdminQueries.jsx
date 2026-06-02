import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, RefreshCw } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper, Modal, Textarea, Button } from "../../components/ui/index.jsx";
import { adminApi, queryApi } from "../../services/api.js";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

function fmtDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function AnswerModal({ query, onClose, onSaved }) {
  const [answer, setAnswer] = useState(query?.answer || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  if (!query) return null;

  const submit = async () => {
    if (!answer.trim()) return setErr("Please write an answer.");
    setSaving(true);
    setErr("");
    try {
      await queryApi.answer(query.id, answer.trim());
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save answer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!query} onClose={onClose} title="Answer Student Query" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-bold mb-1" style={{ color:C.gray }}>Student Question</p>
          <p className="text-sm leading-relaxed" style={{ color:C.dark }}>{query.question}</p>
        </div>
        <Textarea label="Your Answer" value={answer} onChange={e => setAnswer(e.target.value)} rows={6} placeholder="Write a clear answer for the student..." />
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <Button onClick={submit} disabled={saving} variant="primary">
          {saving ? "Saving..." : "Send Answer"}
        </Button>
      </div>
    </Modal>
  );
}

export default function AdminQueries() {
  const [filter, setFilter] = useState("all");
  const [queries, setQueries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const status = filter === "open" ? "OPEN" : filter === "resolved" ? "RESOLVED" : "";
      const res = await adminApi.queries(status);
      setQueries(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => {
    const open = queries.filter(q => q.status === "OPEN").length;
    const resolved = queries.filter(q => q.status === "RESOLVED").length;
    return { open, resolved, total: queries.length };
  }, [queries]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Student Queries</h1>
            <p className="text-sm" style={{ color:C.gray }}>{counts.open} open of {counts.total} loaded</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-white">
              {["all","open","resolved"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all" style={{ background:filter===f ? `linear-gradient(135deg,${C.blue},${C.primary})` : "transparent", color:filter===f ? "white" : C.gray }}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 bg-white">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} style={{ color:C.gray }} />
            </button>
          </div>
        </div>

        {err && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">{err}</div>}

        <div className="space-y-3">
          {loading ? [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          )) : queries.map((q, i) => (
            <motion.div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-snug mb-2" style={{ color:C.dark }}>{q.question}</p>
                  {q.answer && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-3">
                      <p className="text-xs font-bold mb-1" style={{ color:C.primary }}>Answer</p>
                      <p className="text-sm leading-relaxed" style={{ color:C.dark }}>{q.answer}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#eff8ff", color:C.primary }}>👤 {q.student?.name || "Student"}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#f3f4f6", color:C.gray }}>📚 {q.session?.name || "General Query"}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#f3f4f6", color:C.gray }}>📅 {fmtDate(q.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background:q.status==="RESOLVED" ? "#f0fdf4" : "#fef3c7", color:q.status==="RESOLVED" ? "#16a34a" : "#92400e" }}>
                    {q.status==="RESOLVED" ? "✓ Resolved" : "⚠ Open"}
                  </span>
                  {q.status==="OPEN" && (
                    <button onClick={() => setSelected(q)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:-translate-y-0.5" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
                      <Send size={12} /> Answer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {!loading && queries.length===0 && (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <MessageSquare size={36} className="mx-auto mb-3" style={{ color:"#d1d5db" }} />
              <p className="font-bold" style={{ color:C.dark }}>No queries</p>
              <p className="text-sm mt-1" style={{ color:C.lg }}>Nothing to show for this filter.</p>
            </div>
          )}
        </div>

        <AnswerModal query={selected} onClose={() => setSelected(null)} onSaved={load} />
      </PageWrapper>
    </AppShell>
  );
}
