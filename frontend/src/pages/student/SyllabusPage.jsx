import { useState, useEffect, useMemo } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi, sessionApi } from "../../services/api.js";
import { BookOpen, CheckCircle2, Circle, Download, PlayCircle } from "lucide-react";

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

function deriveSessionStatus(session) {
  if (!session?.scheduled_at) return String(session?.status || "UPCOMING").toUpperCase();
  const today = startOfDay();
  const sessionDay = startOfDay(session.scheduled_at);
  if (sessionDay < today) return "COMPLETED";
  if (sessionDay.getTime() === today.getTime()) return "LIVE";
  return "UPCOMING";
}

function statusMeta(status) {
  if (status === "COMPLETED") return { bg:"#f0fdf4", border:"#bbf7d0", circle:"#22c55e", badgeBg:"#dcfce7", badgeColor:"#16a34a", label:"Completed" };
  if (status === "LIVE") return { bg:"#eff8ff", border:"#bfdbfe", circle:"#007BBF", badgeBg:"#dbeafe", badgeColor:"#2563eb", label:"Live / Today" };
  return { bg:"#fafafa", border:"#f0f0f0", circle:"#e5e7eb", badgeBg:"#f3f4f6", badgeColor:"#6b7280", label:"Upcoming" };
}

function SessionRow({ session, index }) {
  const status = session._status || deriveSessionStatus(session);
  const meta = statusMeta(status);
  const sessionDate = session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "TBD";

  return (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl transition-all border"
      style={{ background: meta.bg, borderColor: meta.border }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black" style={{ background: meta.circle, color: status === "UPCOMING" ? "#9ca3af" : "#fff" }}>
        {status === "COMPLETED" ? <CheckCircle2 size={16} /> : session.session_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-bold text-dct-dark leading-tight">{session.name}</p>
            <p className="text-xs text-dct-lightgray mt-0.5">Session {session.session_number}{session.type && ` · ${session.type === "BOTH" ? "Theory + CAD" : session.type}`}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.badgeBg, color: meta.badgeColor }}>{meta.label}</span>
            <span className="text-[10px] text-dct-lightgray font-semibold">{sessionDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RecordedProjectCard({ project, index, firstLiveDate }) {
  const unlockDate = firstLiveDate
    ? new Date(firstLiveDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    : "When first live project starts";

  return (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl border"
      style={{ background:"#faf5ff", borderColor:"#ede9fe" }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)" }}>
        <PlayCircle size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-bold text-dct-dark leading-tight">{project.name}</p>
            <p className="text-xs text-dct-lightgray mt-0.5">Recorded project practice · Not part of live schedule</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:"#ede9fe", color:"#7c3aed" }}>
            Unlock: {unlockDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function SyllabusPage() {
  const [enrollment, setEnrollment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    batchApi.enrolled()
      .then(res => {
        const enrollments = res.data || [];
        if (enrollments.length === 0) { setLoading(false); return null; }
        const first = enrollments[0];
        setEnrollment(first);
        const batchId = first.batch?.id;
        if (!batchId) { setLoading(false); return null; }
        return sessionApi.getForBatch(batchId);
      })
      .then(res => { if (res) setSessions(res.data || []); })
      .catch(e => setError(e.message || "Failed to load syllabus."))
      .finally(() => setLoading(false));
  }, []);

  const batch = enrollment?.batch;
  const course = batch?.course;
  const recordedProjects = batch?.recorded_projects || [];
  const enriched = useMemo(() => sessions.map(s => ({ ...s, _status: deriveSessionStatus(s) })), [sessions]);
  const filtered = filter === "ALL" ? enriched : enriched.filter(s => s._status === filter || (filter === "LIVE" && s._status === "LIVE"));
  const completedCount = enriched.filter(s => s._status === "COMPLETED").length;
  const progressPct = enriched.length > 0 ? Math.round((completedCount / enriched.length) * 100) : 0;
  const firstLiveDate = enriched.find((s) => s.scheduled_at)?.scheduled_at;

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-dct-dark mb-1">{course?.name || "Course Syllabus"}</h1>
          {batch && <p className="text-sm text-dct-lightgray">{batch.name} · {enriched.length} live sessions{recordedProjects.length ? ` · ${recordedProjects.length} recorded projects` : ""}</p>}
        </div>

        {loading && <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>}

        {!loading && error && <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"><p className="text-red-600 font-semibold">{error}</p></div>}

        {!loading && !error && !enrollment && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-dct-dark mb-1">Not enrolled in any course</p>
            <p className="text-sm text-dct-lightgray">Enroll in a course to see the syllabus here.</p>
          </div>
        )}

        {!loading && !error && enrollment && (
          <div className="flex gap-5 items-start">
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-dct-dark">Overall Progress</p>
                  <span className="text-sm font-bold text-dct-primary">{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#024981,#007BBF)" }} initial={{ width:0 }} animate={{ width:`${progressPct}%` }} transition={{ duration:1.2, ease:[0.16,1,0.3,1] }} />
                </div>
                <p className="text-xs text-dct-lightgray">{completedCount} of {enriched.length} live sessions completed</p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {[["ALL","All"],["UPCOMING","Upcoming"],["LIVE","Today"],["COMPLETED","Completed"]].map(([key,label]) => (
                  <button key={key} onClick={() => setFilter(key)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{ background: filter===key ? "linear-gradient(135deg,#024981,#007BBF)" : "#f3f4f6", color: filter===key ? "white" : "#6A6B6D" }}>
                    {label}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Circle size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-dct-lightgray">No {filter.toLowerCase()} sessions</p>
                </div>
              ) : (
                <div className="space-y-2">{filtered.map((session, i) => <SessionRow key={session.id} session={session} index={i} />)}</div>
              )}

              {recordedProjects.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-dct-dark">Recorded Project Practice</h2>
                      <p className="text-xs text-dct-lightgray">These projects are for practice from recordings and are not included in live session count.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recordedProjects.map((project, i) => (
                      <RecordedProjectCard key={project.id || project.name || i} project={project} index={i} firstLiveDate={firstLiveDate} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-64 flex-shrink-0 space-y-4 sticky top-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-sm font-bold text-dct-dark mb-3">Batch Info</p>
                <div className="space-y-2.5">
                  {[
                    ["Course", course?.name],
                    ["Batch", batch?.name],
                    ["Start", batch?.start_date ? new Date(batch.start_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                    ["End", batch?.end_date ? new Date(batch.end_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                    ["Timing", batch?.time_slots?.[0] || "—"],
                    ["Tutor", batch?.tutor?.name || "—"],
                  ].map(([label,value]) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-dct-lightgray flex-shrink-0">{label}</span>
                      <span className="text-xs font-semibold text-dct-dark text-right">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-sm font-bold text-dct-dark mb-3">Quick Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:"Live", value: enriched.length, color:"#024981" },
                    { label:"Done", value: completedCount, color:"#22c55e" },
                    { label:"Recorded", value: recordedProjects.length, color:"#7c3aed" },
                    { label:"Progress", value: `${progressPct}%`, color:"#007BBF" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2.5 rounded-xl bg-gray-50">
                      <p className="text-base font-black" style={{ color:s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold text-dct-lightgray">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

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
