import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { prerequisiteApi } from "../../services/api.js";
import { motion } from "framer-motion";
import { RefreshCw, Search, UserCheck } from "lucide-react";

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#024981] to-[#007BBF]" style={{ width: `${pct}%` }} /></div>;
}

export default function AdminPrerequisiteProgress() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    prerequisiteApi.adminProgress()
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message || "Failed to load prerequisite progress."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.email, r.phone, ...(r.enrolled_courses || [])].join(" ").toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#024981] to-[#007BBF] p-5 text-white sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Admin Tracking</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Pre-Requisite Course Progress</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">See which students completed CATIA, UG NX, and mould design prerequisite video sessions.</p>
          </div>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#024981]">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3" style={{ boxShadow: "0 8px 28px rgba(2,73,129,.06)" }}>
          <Search size={18} className="text-dct-lightgray" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, phone, email, course…" className="w-full bg-transparent text-sm outline-none" />
        </div>

        {loading && <div className="rounded-3xl bg-white p-10 text-center text-dct-lightgray">Loading progress…</div>}
        {!loading && error && <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 font-semibold">{error}</div>}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-dct-lightgray">No student progress found.</div>}
            {filtered.map((student, index) => (
              <motion.div key={student.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-3xl border border-gray-100 bg-white p-5" style={{ boxShadow: "0 10px 34px rgba(2,73,129,.07)" }}>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#024981]"><UserCheck size={22} /></div>
                    <div>
                      <h3 className="font-bold text-dct-dark">{student.name}</h3>
                      <p className="text-xs text-dct-lightgray">{student.email} • {student.phone}</p>
                      {student.enrolled_courses?.length > 0 && <p className="mt-1 text-xs font-semibold text-dct-primary">{student.enrolled_courses.join(", ")}</p>}
                    </div>
                  </div>
                  <div className="min-w-[180px] rounded-2xl bg-slate-50 p-3">
                    <div className="mb-1 flex justify-between text-xs font-semibold text-dct-gray"><span>Overall</span><span>{student.progress_percent}%</span></div>
                    <ProgressBar value={student.progress_percent} />
                    <p className="mt-1 text-xs text-dct-lightgray">{student.completed_lessons}/{student.total_lessons} lessons</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {student.courses.map((course) => (
                    <div key={course.course_id} className="rounded-2xl border border-gray-100 p-4">
                      <div className="mb-2 flex justify-between gap-2 text-sm"><strong className="text-dct-dark">{course.title}</strong><span className="font-bold text-dct-primary">{course.progress_percent}%</span></div>
                      <ProgressBar value={course.progress_percent} />
                      <p className="mt-2 text-xs text-dct-lightgray">{course.completed_lessons}/{course.total_lessons} completed</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
