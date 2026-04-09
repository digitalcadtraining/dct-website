/**
 * SessionsPages.jsx — Fixed
 * Real sessions from backend via batchApi.enrolled() + sessionApi.getForBatch()
 * Shows actual sessions auto-generated from tutor's syllabus for the enrolled batch
 */
import { useState, useEffect } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { batchApi, sessionApi, queryApi } from "../../services/api.js";
import { Calendar, FileText, HelpCircle, Video, ChevronRight, X } from "lucide-react";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#9ca3af" };

// ── Ask Query Modal ────────────────────────────────────────
function AskQueryModal({ session, batchId, onClose, onSubmitted }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return setErr("Please enter your question.");
    setLoading(true); setErr("");
    try {
      await queryApi.create({ batch_id: batchId, session_id: session.id, question: question.trim() });
      onSubmitted?.();
      onClose();
    } catch(e) { setErr(e.message || "Failed to submit query."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff", borderRadius:20, width:"100%", maxWidth:420, padding:28, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", zIndex:10 }} initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ fontSize:17, fontWeight:700, color:C.dark }}>Ask a Question</h3>
          <button onClick={onClose} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"none", background:"#f3f4f6", cursor:"pointer" }}><X size={14} style={{ color:C.gray }}/></button>
        </div>
        {session && (
          <div style={{ background:"#eff8ff", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.blue, fontWeight:600 }}>
            Session {session.session_number}: {session.name}
          </div>
        )}
        <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.gray, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Your Question</label>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Describe your question in detail…" rows={4}
          style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e5e7eb", borderRadius:12, fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", marginBottom:4 }}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        {err && <p style={{ fontSize:12, color:"#dc2626", marginBottom:8 }}>{err}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, fontFamily:"inherit", marginTop:8 }}>
          {loading ? "Submitting…" : "Submit Question"}
        </button>
      </motion.div>
    </div>
  );
}

// ── Session Card matching Figma design ────────────────────
function SessionCard({ session, batchName, tutorName, timeSlots, onAskQuestion, index }) {
  const isCompleted = session.status === "COMPLETED";
  const isLive      = session.status === "LIVE";
  const statusLabel = isLive ? "Live" : isCompleted ? "Completed" : "Upcoming";

  const sessionDate = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString("en-IN",{ day:"2-digit", month:"2-digit", year:"numeric" })
    : "TBD";
  const sessionTime = timeSlots?.length > 0 ? timeSlots[0] : "TBD";

  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:index*0.07 }}>
      <div style={{ padding:"20px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:4 }}>
          <div style={{ flex:1 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.dark, lineHeight:1.3 }}>
              {session.batch?.course?.name || "Course"} Session {session.session_number}
            </h3>
            <p style={{ fontSize:13, fontWeight:600, color:C.primary, marginTop:3 }}>Topic : {session.name}</p>
          </div>
          <span style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:999, flexShrink:0, background:isLive?"#dcfce7":isCompleted?"#ede9fe":"#eff8ff", color:isLive?"#16a34a":isCompleted?"#7c3aed":C.primary }}>
            {isLive && <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#22c55e", marginRight:4, animation:"pulse2 1.5s infinite" }}/>}
            {statusLabel}
          </span>
        </div>
      </div>

      <div style={{ padding:"14px 20px" }}>
        {/* Date + Time */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>Session Date</p>
            <p style={{ fontSize:13, fontWeight:700, color:C.dark }}>{sessionDate}</p>
          </div>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>Session Time</p>
            <p style={{ fontSize:13, fontWeight:700, color:C.dark }}>{sessionTime}</p>
          </div>
        </div>

        {/* Mentor + Live */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>
              {tutorName?.[0]?.toUpperCase()||"T"}
            </div>
            <div><p style={{ fontSize:12, fontWeight:700, color:C.dark, lineHeight:1.2 }}>{tutorName||"Tutor"}</p><p style={{ fontSize:10, color:C.primary }}>Mentor</p></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"#fff0f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Video size={13} style={{ color:"#FF5652" }}/>
            </div>
            <div><p style={{ fontSize:12, fontWeight:700, color:C.dark }}>Live Session</p><p style={{ fontSize:10, color:C.gray }}>1hr 30 minutes</p></div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <button style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#F0F7FF", border:"1px solid #c3ebff", borderRadius:8, fontSize:12, fontWeight:600, color:C.primary, cursor:"pointer" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><FileText size={13}/> Assignment</span><ChevronRight size={13}/>
          </button>
          <button onClick={() => onAskQuestion(session)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#F0F7FF", border:"1px solid #c3ebff", borderRadius:8, fontSize:12, fontWeight:600, color:C.primary, cursor:"pointer" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><HelpCircle size={13}/> View Queries</span><ChevronRight size={13}/>
          </button>
        </div>

        {/* Go to Session */}
        {session.zoom_link ? (
          <a href={session.zoom_link} target="_blank" rel="noopener noreferrer"
            style={{ display:"block", width:"100%", padding:"12px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", borderRadius:10, fontSize:13, fontWeight:700, textAlign:"center", textDecoration:"none" }}>
            {isCompleted ? "View Recording" : "Go to Session"}
          </a>
        ) : (
          <button style={{ width:"100%", padding:"12px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 16px rgba(0,123,191,0.25)` }}>
            {isCompleted ? "View Recording" : "Go to Session"}
          </button>
        )}
      </div>
      <style>{`@keyframes pulse2{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </motion.div>
  );
}

// ── Core sessions loader hook ─────────────────────────────
function useEnrolledSessions() {
  const [batch, setBatch]       = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    batchApi.enrolled()
      .then(res => {
        const enrollments = res.data || [];
        if (enrollments.length === 0) { setLoading(false); return; }
        const firstBatch = enrollments[0].batch;
        setBatch(firstBatch);
        return sessionApi.getForBatch(firstBatch.id);
      })
      .then(res => { if (res) setSessions(res.data || []); })
      .catch(e  => setError(e.message || "Failed to load sessions."))
      .finally(() => setLoading(false));
  }, []);

  return { batch, sessions, loading, error };
}

// ── Session List UI ───────────────────────────────────────
function SessionList({ filter, title }) {
  const { batch, sessions, loading, error } = useEnrolledSessions();
  const [askSession, setAskSession]         = useState(null);

  const filtered = filter === "ALL" ? sessions : sessions.filter(s => s.status === filter);

  const tutorName = batch?.tutor?.name || "Tutor";
  const timeSlots = batch?.time_slots  || [];
  const batchId   = batch?.id;

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.dark }}>{title}</h2>
            {batch && <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>{batch.name} · {sessions.length} sessions total</p>}
          </div>
          {sessions.length > 0 && (
            <div style={{ fontSize:13, color:C.gray, fontWeight:600 }}>
              {sessions.filter(s=>s.status==="COMPLETED").length}/{sessions.length} completed
            </div>
          )}
        </div>

        {/* Completion progress */}
        {sessions.length > 0 && (
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", padding:"14px 20px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.dark }}>Course Completion Status</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.primary }}>
                {Math.round((sessions.filter(s=>s.status==="COMPLETED").length/sessions.length)*100)}%
              </span>
            </div>
            <div style={{ height:8, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
              <motion.div style={{ height:"100%", background:`linear-gradient(90deg,${C.blue},${C.primary})`, borderRadius:4 }}
                initial={{ width:0 }}
                animate={{ width:`${Math.round((sessions.filter(s=>s.status==="COMPLETED").length/sessions.length)*100)}%` }}
                transition={{ duration:1.2, ease:[0.16,1,0.3,1] }}/>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[1,2].map(i=><div key={i} style={{ height:300, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:16, padding:24, textAlign:"center" }}>
            <p style={{ color:"#dc2626", fontWeight:600 }}>{error}</p>
          </div>
        )}

        {/* No enrollment */}
        {!loading && !error && !batch && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:56, textAlign:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <Calendar size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
            <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>Not enrolled in any batch</p>
            <p style={{ fontSize:13, color:C.lg }}>Enroll in a course to see your sessions here.</p>
          </div>
        )}

        {/* Empty filtered */}
        {!loading && !error && batch && filtered.length === 0 && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:40, textAlign:"center" }}>
            <Calendar size={32} style={{ color:"#d1d5db", margin:"0 auto 10px" }}/>
            <p style={{ fontSize:14, color:C.lg }}>No {filter.toLowerCase()} sessions</p>
          </div>
        )}

        {/* Sessions */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {filtered.map((session, i) => (
              <SessionCard
                key={session.id}
                session={{ ...session, batch }}
                batchName={batch?.name}
                tutorName={tutorName}
                timeSlots={timeSlots}
                onAskQuestion={s => setAskSession(s)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Ask Query Modal */}
        <AnimatePresence>
          {askSession && (
            <AskQueryModal
              session={askSession}
              batchId={batchId}
              onClose={() => setAskSession(null)}
              onSubmitted={() => {}}
            />
          )}
        </AnimatePresence>

      </PageWrapper>
    </AppShell>
  );
}

// ── Exports ───────────────────────────────────────────────
export function AllSessionsPage()       { return <SessionList filter="ALL"       title="All Sessions" />; }
export function UpcomingSessionsPage()  { return <SessionList filter="UPCOMING"  title="Upcoming Sessions" />; }
export function CompletedSessionsPage() { return <SessionList filter="COMPLETED" title="Completed Sessions" />; }
