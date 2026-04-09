import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { ALL_STUDENTS } from "../../constants/dummyData.js";

const C = { dark:"#1F1A17",navy:"#003C6E",blue:"#024981",primary:"#007BBF",gray:"#6A6B6D",lg:"#7E7F81" };

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const filtered = ALL_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.batch.toLowerCase().includes(search.toLowerCase()) ||
    s.tutor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Student Management</h1>
            <p className="text-sm" style={{ color:C.gray }}>{ALL_STUDENTS.length} total students enrolled</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:C.lg }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students, batch, tutor…"
              className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none w-64"
              style={{ borderColor:"#e5e7eb", color:C.dark }}
              onFocus={e => e.target.style.borderColor=C.primary}
              onBlur={e => e.target.style.borderColor="#e5e7eb"} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            {["Student","Batch","Tutor","Progress","Status"].map((h,i) => (
              <p key={h} className={`text-[11px] font-extrabold uppercase tracking-wider ${i===0?"col-span-3":i===1?"col-span-3":i===2?"col-span-2":i===3?"col-span-2":"col-span-2"}`}
                style={{ color:C.lg }}>{h}</p>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map((s, i) => (
              <motion.div key={s.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50/60 transition-colors"
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}>
                {/* Student */}
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>{s.name[0]}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color:C.dark }}>{s.name}</p>
                    <p className="text-[11px] truncate" style={{ color:C.lg }}>{s.email}</p>
                  </div>
                </div>
                {/* Batch */}
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color:C.dark }}>{s.batch}</p>
                  <p className="text-[11px]" style={{ color:C.lg }}>Joined {s.joinedOn}</p>
                </div>
                {/* Tutor */}
                <div className="col-span-2">
                  <p className="text-xs font-semibold truncate" style={{ color:C.dark }}>{s.tutor}</p>
                </div>
                {/* Progress */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width:`${s.progress}%`, background:`linear-gradient(90deg,${C.blue},${C.primary})` }} />
                    </div>
                    <span className="text-[11px] font-bold flex-shrink-0" style={{ color:C.primary }}>{s.progress}%</span>
                  </div>
                </div>
                {/* Status */}
                <div className="col-span-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: s.status==="completed" ? "#f0fdf4" : "#eff8ff",
                      color: s.status==="completed" ? "#16a34a" : C.primary,
                    }}>
                    {s.status==="completed" ? "✓ Completed" : "● Active"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length===0 && (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto mb-3" style={{ color:"#d1d5db" }} />
              <p className="font-semibold" style={{ color:C.dark }}>No students found</p>
              <p className="text-sm mt-1" style={{ color:C.lg }}>Try a different search</p>
            </div>
          )}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
