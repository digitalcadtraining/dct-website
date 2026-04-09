/**
 * TutorSessions Page
 * Matches Figma: session cards on left, completion + queries panel on right
 * Sessions loaded from enrolled batch's scheduled_sessions (auto-generated from syllabus)
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { sessionApi, batchApi, queryApi } from "../../services/api.js";
import {
  FileText, HelpCircle, Video, ChevronRight,
  Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, X,
} from "lucide-react";

const C = {
  dark: "#1F1A17", navy: "#003C6E", blue: "#024981",
  primary: "#007BBF", gray: "#6A6B6D", lg: "#9ca3af",
};

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    UPCOMING:  { bg:"#eff8ff", color:C.primary,  dot:"#007BBF", label:"Upcoming"  },
    LIVE:      { bg:"#f0fdf4", color:"#16a34a",  dot:"#22c55e", label:"Live"      },
    COMPLETED: { bg:"#f5f3ff", color:"#7c3aed",  dot:"#8b5cf6", label:"Completed" },
    CANCELLED: { bg:"#fef2f2", color:"#dc2626",  dot:"#ef4444", label:"Cancelled" },
  };
  const s = map[status] || map.UPCOMING;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── Session Card — matches figma design ──────────────────
function SessionCard({ session, batchName, tutorName, timeSlots, onViewQuery, index }) {
  const [expanded, setExpanded] = useState(false);

  const sessionDate = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "TBD";

  const sessionTime = timeSlots?.length > 0 ? timeSlots[0] : "TBD";

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}>

      {/* Card Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-dct-dark leading-snug">
              {session.batch?.course?.name || "Course"} Session {session.session_number}
            </h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: C.primary }}>
              Topic : {session.name}
            </p>
          </div>
          <StatusBadge status={session.status} />
        </div>

        {/* Date + Time grid — exactly like figma */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
          <div className="border border-gray-100 rounded-xl p-3" style={{ background: "#fafafa" }}>
            <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wider mb-1">Session Date</p>
            <p className="text-sm font-bold text-dct-dark">{sessionDate}</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3" style={{ background: "#fafafa" }}>
            <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wider mb-1">Session Time</p>
            <p className="text-sm font-bold text-dct-dark">{sessionTime}</p>
          </div>
        </div>

        {/* Mentor + Session type row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}>
              {tutorName?.[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <p className="text-xs font-bold text-dct-dark leading-tight">{tutorName}</p>
              <p className="text-[10px]" style={{ color: C.primary }}>Mentor</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#eff8ff" }}>
              <Video size={14} style={{ color: C.primary }} />
            </div>
            <div>
              <p className="text-xs font-bold text-dct-dark leading-tight">Live Session</p>
              <p className="text-[10px]" style={{ color: C.gray }}>1hr 30 minutes</p>
            </div>
          </div>
        </div>

        {/* Action buttons — figma style */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all hover:bg-blue-50"
            style={{ borderColor: "#bfdbfe", color: C.primary }}>
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span>Assignment</span>
            </div>
            <ChevronRight size={14} />
          </button>
          <button onClick={() => onViewQuery(session)}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all hover:bg-blue-50"
            style={{ borderColor: "#bfdbfe", color: C.primary }}>
            <div className="flex items-center gap-2">
              <HelpCircle size={14} />
              <span>View Queries</span>
            </div>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Go to Session button */}
        {session.zoom_link || session.recording_url ? (
          <a href={session.zoom_link || session.recording_url} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})`, boxShadow: `0 4px 16px ${C.primary}44` }}>
            {session.status === "COMPLETED" ? "View Recording" : "Go to Session"}
          </a>
        ) : (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})`, boxShadow: `0 4px 16px ${C.primary}44` }}>
            {session.status === "COMPLETED" ? "Add Recording Link" : "Go to Session"}
          </button>
        )}
      </div>

      {/* Expandable: add zoom link */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-dct-gray mb-2">Add Zoom / Recording Link</p>
            <div className="flex gap-2">
              <input type="url" placeholder="https://zoom.us/j/..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                id={`zoom-${session.id}`}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              <button className="px-4 py-2 rounded-xl text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
                onClick={() => {
                  const val = document.getElementById(`zoom-${session.id}`)?.value;
                  if (val) { /* TODO: call sessionApi.update */ setExpanded(false); }
                }}>
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Query Card — right panel ──────────────────────────────
function QueryCard({ query, index, onAnswer }) {
  return (
    <motion.div
      className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-200 transition-all"
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}>
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}>
          {query.student?.name?.[0]?.toUpperCase() || "S"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-dct-dark">{query.student?.name || "Student"}</p>
          <p className="text-[10px] text-dct-lightgray truncate">{query.batch_name || "Batch"}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${
          query.status === "RESOLVED"
            ? "bg-green-50 text-green-600"
            : "bg-red-50 text-red-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${query.status === "RESOLVED" ? "bg-green-500" : "bg-red-500"}`} />
          {query.status === "RESOLVED" ? "Resolved" : "Unresolved"}
        </span>
      </div>

      <p className="text-[10px] text-dct-lightgray mb-2">
        {query.created_at ? new Date(query.created_at).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}
      </p>

      {query.question && (
        <p className="text-xs text-dct-dark leading-relaxed line-clamp-3 mb-3">{query.question}</p>
      )}

      {query.status !== "RESOLVED" && (
        <button onClick={() => onAnswer(query)}
          className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}>
          Answer Query
        </button>
      )}
    </motion.div>
  );
}

// ── Answer Query Modal ────────────────────────────────────
function AnswerModal({ query, onClose, onAnswered }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      await queryApi.answer(query.id, answer);
      onAnswered(query.id);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-dct-dark">Answer Query</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={15} style={{ color: C.gray }} />
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-dct-gray mb-1">Student's Question:</p>
          <p className="text-sm text-dct-dark">{query.question}</p>
        </div>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here…" rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none resize-none mb-4"
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        <button onClick={handleSubmit} disabled={loading || !answer.trim()}
          className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
          style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}>
          {loading ? "Sending…" : "Send Answer"}
        </button>
      </motion.div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function TutorSessionsPage() {
  const [batches, setBatches]         = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sessions, setSessions]       = useState([]);
  const [queries, setQueries]         = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [filter, setFilter]           = useState("ALL"); // ALL | UPCOMING | COMPLETED
  const [answerQuery, setAnswerQuery] = useState(null);

  // Load tutor's batches
  useEffect(() => {
    batchApi.mine().then(r => {
      const approved = (r.data || []).filter(b => b.status !== "PENDING_APPROVAL");
      setBatches(approved);
      if (approved.length > 0) setSelectedBatch(approved[0]);
    }).catch(console.error);
  }, []);

  // Load sessions + queries when batch changes
  useEffect(() => {
    if (!selectedBatch) return;
    setLoadingSessions(true);

    Promise.all([
      sessionApi.getForBatch(selectedBatch.id),
      queryApi.getBatchQueries(selectedBatch.id),
    ]).then(([sessRes, queryRes]) => {
      setSessions(sessRes.data || []);
      // Add batch_name to each query for display
      setQueries((queryRes.data || []).map(q => ({
        ...q,
        batch_name: selectedBatch.name,
      })));
    }).catch(console.error)
    .finally(() => setLoadingSessions(false));
  }, [selectedBatch]);

  const filtered = filter === "ALL"
    ? sessions
    : sessions.filter(s => s.status === filter);

  const completedCount = sessions.filter(s => s.status === "COMPLETED").length;
  const progressPct    = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

  const handleAnswered = (queryId) => {
    setQueries(q => q.map(query =>
      query.id === queryId ? { ...query, status: "RESOLVED" } : query
    ));
  };

  const unresolvedCount = queries.filter(q => q.status !== "RESOLVED").length;

  return (
    <AppShell>
      <PageWrapper>
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-dct-dark">
              {selectedBatch ? selectedBatch.name : "Sessions"}
            </h2>
            <p className="text-sm text-dct-lightgray mt-0.5">
              {sessions.length} sessions · {completedCount} completed
            </p>
          </div>

          {/* Batch selector */}
          {batches.length > 1 && (
            <select value={selectedBatch?.id || ""}
              onChange={e => setSelectedBatch(batches.find(b => b.id === e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none"
              style={{ color: C.dark }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 mb-5">
          {[["ALL","All Sessions"], ["UPCOMING","Upcoming"], ["COMPLETED","Completed"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: filter === key ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#f3f4f6",
                color: filter === key ? "white" : C.gray,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Main Layout: Sessions + Right Panel ── */}
        <div className="flex gap-5 items-start">

          {/* Left — Session Cards */}
          <div className="flex-1 min-w-0 space-y-4">
            {!selectedBatch && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-dct-dark">No approved batches yet</p>
                <p className="text-sm text-dct-lightgray mt-1">Create a batch and wait for admin approval</p>
              </div>
            )}

            {loadingSessions && (
              <div className="text-center py-12 text-sm text-dct-lightgray">Loading sessions…</div>
            )}

            {!loadingSessions && selectedBatch && filtered.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-dct-dark">No {filter.toLowerCase()} sessions</p>
              </div>
            )}

            {!loadingSessions && filtered.map((session, i) => (
              <SessionCard
                key={session.id}
                session={{ ...session, batch: selectedBatch }}
                batchName={selectedBatch?.name}
                tutorName={session.tutor_name || "Tutor"}
                timeSlots={selectedBatch?.time_slots || []}
                onViewQuery={() => {}}
                index={i}
              />
            ))}
          </div>

          {/* Right — Completion + Queries Panel */}
          <div className="w-72 flex-shrink-0 space-y-4 sticky top-4">

            {/* Course Completion Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <p className="text-sm font-bold text-dct-dark mb-3">Course Completion Status</p>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg,${C.blue},${C.primary})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="text-xs font-semibold text-dct-gray">{progressPct}% Completed</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-center p-2.5 rounded-xl" style={{ background:"#eff8ff" }}>
                  <p className="text-lg font-black" style={{ color:C.primary }}>{completedCount}</p>
                  <p className="text-[10px] font-semibold text-dct-lightgray">Done</p>
                </div>
                <div className="text-center p-2.5 rounded-xl" style={{ background:"#f9fafb" }}>
                  <p className="text-lg font-black text-dct-dark">{sessions.length - completedCount}</p>
                  <p className="text-[10px] font-semibold text-dct-lightgray">Remaining</p>
                </div>
              </div>
            </div>

            {/* Session Queries Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-dct-dark">Session Queries</p>
                {unresolvedCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                    {unresolvedCount} unresolved
                  </span>
                )}
              </div>

              {queries.length === 0 && (
                <div className="text-center py-6">
                  <HelpCircle size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-dct-lightgray">No queries yet</p>
                </div>
              )}

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {queries.map((query, i) => (
                  <QueryCard
                    key={query.id}
                    query={query}
                    index={i}
                    onAnswer={q => setAnswerQuery(q)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Answer Modal */}
      <AnimatePresence>
        {answerQuery && (
          <AnswerModal
            query={answerQuery}
            onClose={() => setAnswerQuery(null)}
            onAnswered={handleAnswered}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
