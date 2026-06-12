import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw, CheckCircle2, AlertCircle, User } from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { prerequisiteApi } from "../../services/api.js";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#7E7F81",
};

function statusFor(pct) {
  if (pct >= 100) return { label: "Completed", bg: "#f0fdf4", color: "#16a34a" };
  if (pct > 0) return { label: "In Progress", bg: "#eff8ff", color: C.primary };
  return { label: "Not Started", bg: "#f3f4f6", color: C.gray };
}

export default function AdminPrerequisiteProgress() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setErr("");

    prerequisiteApi
      .adminProgress()
      .then((res) => setRows(res.data || []))
      .catch((e) => setErr(e.message || "Failed to load prerequisite progress."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((r) =>
      [r.name, r.email, r.phone, ...(r.enrolled_courses || [])]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => (r.catia_progress_percent || 0) >= 100).length;
    const started = rows.filter(
      (r) => (r.catia_progress_percent || 0) > 0 && (r.catia_progress_percent || 0) < 100
    ).length;

    return { total, completed, started };
  }, [rows]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-dct-dark">Pre-Requisite Progress</h1>
            <p className="text-sm text-dct-gray mt-1">
              Live CATIA basics completion tracking for every registered student.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-4 py-2 text-xs font-black"
            style={{ color: C.primary }}
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            ["Total Students", totals.total],
            ["In Progress", totals.started],
            ["Completed CATIA", totals.completed],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-2xl font-black" style={{ color: C.dark }}>
                {value}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: C.gray }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: C.lg }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, phone, email, course..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm outline-none"
            />
          </div>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 font-semibold text-sm mb-5">
            {err}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-4 bg-blue-50 border-b border-blue-100">
            <p className="col-span-3 text-xs font-black text-dct-dark">Student</p>
            <p className="col-span-3 text-xs font-black text-dct-dark">Enrolled Course</p>
            <p className="col-span-3 text-xs font-black text-dct-dark">CATIA Basics</p>
            <p className="col-span-3 text-xs font-black text-dct-dark">Status</p>
          </div>

          {loading &&
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-50 animate-pulse border-b border-gray-100" />
            ))}

          {!loading && !err && filtered.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle size={34} className="mx-auto mb-3 text-gray-300" />
              <p className="font-black text-dct-dark">No progress data yet</p>
              <p className="text-sm text-dct-gray mt-1">
                Once a student marks CATIA videos complete, progress will appear here.
              </p>
            </div>
          )}

          {!loading &&
            !err &&
            filtered.map((row) => {
              const pct = row.catia_progress_percent || 0;
              const st = statusFor(pct);

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black"
                      style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
                    >
                      {row.name?.[0] || <User size={16} />}
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: C.dark }}>
                        {row.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: C.gray }}>
                        {row.email} · {row.phone}
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <p className="text-sm font-bold" style={{ color: C.dark }}>
                      {row.enrolled_courses?.[0] || "No course assigned"}
                    </p>
                    <p className="text-xs" style={{ color: C.gray }}>
                      Student dashboard prerequisite tracking
                    </p>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: C.gray }}>
                        {row.catia_completed_lessons || 0}/{row.catia_total_lessons || 10} videos
                      </span>
                      <span className="text-xs font-black" style={{ color: C.primary }}>
                        {pct}%
                      </span>
                    </div>

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg,${C.blue},${C.primary})`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex flex-wrap gap-2">
                    <span
                      className="text-xs font-black px-3 py-1 rounded-full"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>

                    {pct >= 100 && (
                      <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-green-50 text-green-700">
                        <CheckCircle2 size={13} />
                        Ready for live sessions
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
