import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, RefreshCw } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

function fmtDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function getPrimaryEnrollment(student) {
  return student.enrollments?.[0] || null;
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async (term = "") => {
    setLoading(true);
    setErr("");
    try {
      const res = await adminApi.students(term);
      setStudents(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(""); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => students, [students]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Student Management</h1>
            <p className="text-sm" style={{ color:C.gray }}>{loading ? "Loading..." : `${students.length} students loaded`}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:C.lg }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none w-72"
                style={{ borderColor:"#e5e7eb", color:C.dark }}
              />
            </div>
            <button onClick={() => load(search.trim())} className="p-2.5 rounded-xl border border-gray-200 bg-white">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} style={{ color:C.gray }} />
            </button>
          </div>
        </div>

        {err && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">{err}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            {["Student","Batch","Tutor","Progress","Status"].map((h,i) => (
              <p key={h} className={`text-[11px] font-extrabold uppercase tracking-wider ${i===0?"col-span-3":i===1?"col-span-3":i===2?"col-span-2":i===3?"col-span-2":"col-span-2"}`} style={{ color:C.lg }}>{h}</p>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? [1,2,3,4].map(i => (
              <div key={i} className="px-5 py-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            )) : filtered.map((s, i) => {
              const enrollment = getPrimaryEnrollment(s);
              const batch = enrollment?.batch;
              const tutor = batch?.tutor;
              const progress = enrollment?.progress ?? 0;
              return (
                <motion.div key={s.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 lg:items-center hover:bg-gray-50/60 transition-colors" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}>
                  <div className="lg:col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>{s.name?.[0] || "S"}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color:C.dark }}>{s.name}</p>
                      <p className="text-[11px] truncate" style={{ color:C.lg }}>{s.email}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color:C.dark }}>{batch?.name || "No batch enrolled"}</p>
                    <p className="text-[11px]" style={{ color:C.lg }}>Joined {fmtDate(enrollment?.enrolled_at || s.created_at)}</p>
                  </div>

                  <div className="lg:col-span-2">
                    <p className="text-xs font-semibold truncate" style={{ color:C.dark }}>{tutor?.name || "—"}</p>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width:`${progress}%`, background:`linear-gradient(90deg,${C.blue},${C.primary})` }} />
                      </div>
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color:C.primary }}>{progress}%</span>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background:s.is_active ? "#eff8ff" : "#f3f4f6", color:s.is_active ? C.primary : C.gray }}>
                      {s.is_active ? "● Active" : "Inactive"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {!loading && filtered.length===0 && (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto mb-3" style={{ color:"#d1d5db" }} />
              <p className="font-semibold" style={{ color:C.dark }}>No students found</p>
              <p className="text-sm mt-1" style={{ color:C.lg }}>Try a different search.</p>
            </div>
          )}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
