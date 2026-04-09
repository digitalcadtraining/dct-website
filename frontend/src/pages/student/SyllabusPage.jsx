/**
 * SyllabusPage.jsx — Fixed
 * Fetches real sessions from the enrolled batch via API
 * Sessions were auto-generated from tutor's submitted syllabus
 */
import { useState, useEffect } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi, sessionApi } from "../../services/api.js";
import { BookOpen, CheckCircle2, Circle, Clock, Download } from "lucide-react";

// ── Session Row ────────────────────────────────────────────
function SessionRow({ session, index }) {
  const isCompleted = session.status === "COMPLETED";
  const isLive      = session.status === "LIVE";
  const isUpcoming  = session.status === "UPCOMING";

  const sessionDate = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    : "TBD";

  return (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl transition-all border"
      style={{
        background: isLive ? "#eff8ff" : isCompleted ? "#f0fdf4" : "#fafafa",
        borderColor: isLive ? "#bfdbfe" : isCompleted ? "#bbf7d0" : "#f0f0f0",
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}>

      {/* Number circle */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
        style={{
          background: isCompleted ? "#22c55e" : isLive ? "#007BBF" : "#e5e7eb",
          color: isCompleted || isLive ? "#fff" : "#9ca3af",
        }}>
        {isCompleted ? <CheckCircle2 size={16} /> : session.session_number}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-bold text-dct-dark leading-tight">{session.name}</p>
            <p className="text-xs text-dct-lightgray mt-0.5">
              Session {session.session_number}
              {session.type && ` · ${session.type === "BOTH" ? "Theory + CAD" : session.type}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge */}
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                Completed
              </span>
            )}
            {isUpcoming && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Upcoming
              </span>
            )}
            {/* Date */}
            <span className="text-[10px] text-dct-lightgray font-semibold">{sessionDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function SyllabusPage() {
  const [enrollment, setEnrollment] = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState("ALL"); // ALL | UPCOMING | COMPLETED

  useEffect(() => {
    // 1. Get enrolled batch
    batchApi.enrolled()
      .then(res => {
        const enrollments = res.data || [];
        if (enrollments.length === 0) { setLoading(false); return; }

        const firstEnrollment = enrollments[0];
        setEnrollment(firstEnrollment);
        const batchId = firstEnrollment.batch?.id;
        if (!batchId) { setLoading(false); return; }

        // 2. Get sessions for that batch (generated from tutor's syllabus)
        return sessionApi.getForBatch(batchId);
      })
      .then(res => {
        if (res) setSessions(res.data || []);
      })
      .catch(e => setError(e.message || "Failed to load syllabus."))
      .finally(() => setLoading(false));
  }, []);

  const batch  = enrollment?.batch;
  const course = batch?.course;

  const filtered = filter === "ALL"
    ? sessions
    : sessions.filter(s => s.status === filter);

  const completedCount = sessions.filter(s => s.status === "COMPLETED").length;
  const progressPct    = sessions.length > 0
    ? Math.round((completedCount / sessions.length) * 100)
    : 0;

  return (
    <AppShell>
      <PageWrapper>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-dct-dark mb-1">
            {course?.name || "Course Syllabus"}
          </h1>
          {batch && (
            <p className="text-sm text-dct-lightgray">
              {batch.name} · {sessions.length} sessions total
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Not enrolled */}
        {!loading && !error && !enrollment && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"
            style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-dct-dark mb-1">Not enrolled in any course</p>
            <p className="text-sm text-dct-lightgray">Enroll in a course to see the syllabus here.</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && enrollment && (
          <div className="flex gap-5 items-start">

            {/* Sessions list */}
            <div className="flex-1 min-w-0">

              {/* Progress + filters */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4"
                style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-dct-dark">Overall Progress</p>
                  <span className="text-sm font-bold text-dct-primary">{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <motion.div className="h-full rounded-full"
                    style={{ background:"linear-gradient(90deg,#024981,#007BBF)" }}
                    initial={{ width:0 }}
                    animate={{ width:`${progressPct}%` }}
                    transition={{ duration:1.2, ease:[0.16,1,0.3,1] }} />
                </div>
                <p className="text-xs text-dct-lightgray">
                  {completedCount} of {sessions.length} sessions completed
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 mb-4">
                {[["ALL","All"],["UPCOMING","Upcoming"],["COMPLETED","Completed"]].map(([key,label])=>(
                  <button key={key} onClick={()=>setFilter(key)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: filter===key ? "linear-gradient(135deg,#024981,#007BBF)" : "#f3f4f6",
                      color: filter===key ? "white" : "#6A6B6D",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Session list */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Circle size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-dct-lightgray">No {filter.toLowerCase()} sessions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((session, i) => (
                    <SessionRow key={session.id} session={session} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="w-64 flex-shrink-0 space-y-4 sticky top-4">

              {/* Batch info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-sm font-bold text-dct-dark mb-3">Batch Info</p>
                <div className="space-y-2.5">
                  {[
                    ["Course", course?.name],
                    ["Batch",  batch?.name],
                    ["Start",  batch?.start_date ? new Date(batch.start_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                    ["End",    batch?.end_date ? new Date(batch.end_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                    ["Timing", batch?.time_slots?.[0] || "—"],
                    ["Tutor",  batch?.tutor?.name || "—"],
                  ].map(([label,value])=>(
                    <div key={label} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-dct-lightgray flex-shrink-0">{label}</span>
                      <span className="text-xs font-semibold text-dct-dark text-right">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-sm font-bold text-dct-dark mb-3">Quick Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:"Total",     value: sessions.length,              color:"#024981" },
                    { label:"Done",      value: completedCount,               color:"#22c55e" },
                    { label:"Remaining", value: sessions.length-completedCount, color:"#f59e0b" },
                    { label:"Progress",  value: `${progressPct}%`,            color:"#007BBF" },
                  ].map(s=>(
                    <div key={s.label} className="text-center p-2.5 rounded-xl bg-gray-50">
                      <p className="text-base font-black" style={{ color:s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold text-dct-lightgray">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download */}
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-dct-gray hover:border-dct-primary hover:text-dct-primary transition-all">
                <Download size={14} /> Download Syllabus
              </button>

            </div>
          </div>
        )}

      </PageWrapper>
    </AppShell>
  );
}
