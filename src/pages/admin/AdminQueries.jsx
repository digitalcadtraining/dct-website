import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Check } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { ADMIN_ALL_QUERIES } from "../../constants/dummyData.js";

const C = { dark:"#1F1A17",navy:"#003C6E",blue:"#024981",primary:"#007BBF",gray:"#6A6B6D",lg:"#7E7F81" };

export default function AdminQueries() {
  const [filter, setFilter] = useState("all");
  const [queries, setQueries] = useState(ADMIN_ALL_QUERIES);

  const filtered = filter==="all" ? queries : queries.filter(q => q.status===filter);
  const markResolved = id => setQueries(qs => qs.map(q => q.id===id ? {...q, status:"resolved"} : q));

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Student Queries</h1>
            <p className="text-sm" style={{ color:C.gray }}>{queries.filter(q=>q.status==="unresolved").length} unresolved of {queries.length} total</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-white">
            {["all","unresolved","resolved"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all"
                style={{ background:filter===f ? `linear-gradient(135deg,${C.blue},${C.primary})` : "transparent", color:filter===f ? "white" : C.gray }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((q, i) => (
            <motion.div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-snug mb-2" style={{ color:C.dark }}>{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#eff8ff", color:C.primary }}>
                      👤 {q.student}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#f3f4f6", color:C.gray }}>
                      📚 {q.batch}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#f3f4f6", color:C.gray }}>
                      🎓 {q.tutor}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:"#f3f4f6", color:C.gray }}>
                      📅 {q.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: q.status==="resolved" ? "#f0fdf4" : "#fef3c7",
                      color: q.status==="resolved" ? "#16a34a" : "#92400e",
                    }}>
                    {q.status==="resolved" ? "✓ Resolved" : "⚠ Open"}
                  </span>
                  {q.status==="unresolved" && (
                    <button onClick={() => markResolved(q.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
                      style={{ background:`linear-gradient(135deg,#16a34a,#22c55e)` }}>
                      <Check size={12} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length===0 && (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <MessageSquare size={36} className="mx-auto mb-3" style={{ color:"#d1d5db" }} />
              <p className="font-bold" style={{ color:C.dark }}>No queries</p>
              <p className="text-sm mt-1" style={{ color:C.lg }}>Nothing to show for this filter.</p>
            </div>
          )}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
