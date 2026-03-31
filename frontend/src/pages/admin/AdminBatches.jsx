import { useState } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { ADMIN_BATCHES } from "../../constants/dummyData.js";

const C = { dark:"#1F1A17",navy:"#003C6E",blue:"#024981",primary:"#007BBF",gray:"#6A6B6D",lg:"#7E7F81" };

export default function AdminBatches() {
  const [filter, setFilter] = useState("all");
  const batches = filter==="all" ? ADMIN_BATCHES : ADMIN_BATCHES.filter(b => b.status===filter);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Batch Management</h1>
            <p className="text-sm" style={{ color:C.gray }}>{ADMIN_BATCHES.length} total batches across all tutors</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-white">
            {["all","active","completed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all"
                style={{ background:filter===f ? `linear-gradient(135deg,${C.blue},${C.primary})` : "transparent", color:filter===f ? "white" : C.gray }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map((b, i) => (
            <motion.div key={b.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              {/* Top color bar */}
              <div className="h-1.5" style={{ background: b.status==="active" ? `linear-gradient(90deg,${C.blue},${C.primary})` : "#e5e7eb" }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-extrabold" style={{ color:C.dark }}>{b.name}</p>
                    <p className="text-xs mt-0.5" style={{ color:C.gray }}>{b.tutor}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: b.status==="active" ? "#eff8ff" : "#f0fdf4",
                      color: b.status==="active" ? C.primary : "#16a34a",
                    }}>
                    {b.status==="active" ? "● Active" : "✓ Done"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label:"Students", value:b.students },
                    { label:"Start",    value:b.startDate },
                    { label:"End",      value:b.endDate },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-xl bg-gray-50">
                      <p className="text-xs font-extrabold" style={{ color:C.dark }}>{s.value}</p>
                      <p className="text-[10px] font-semibold" style={{ color:C.lg }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color:C.lg }}>Completion</p>
                    <p className="text-xs font-extrabold" style={{ color:b.progress===100?"#16a34a":C.primary }}>{b.progress}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <motion.div className="h-full rounded-full" style={{ background: b.progress===100 ? "#22c55e" : `linear-gradient(90deg,${C.blue},${C.primary})` }}
                      initial={{ width:0 }} animate={{ width:`${b.progress}%` }} transition={{ duration:0.8, delay:0.2+i*0.06 }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
