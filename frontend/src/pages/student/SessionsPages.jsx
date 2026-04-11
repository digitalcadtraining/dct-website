/**
 * SessionsPages.jsx — Enhanced
 * - Loads ALL enrolled batches (not just first)
 * - Beautiful horizontal batch-selector cards
 * - Time-aware status derived from scheduled_at vs now
 * - Grouped sections: Live → Today → Upcoming → Completed
 * - Filter tabs: All | Today | Upcoming | Completed
 */
import { useState, useEffect, useMemo } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { batchApi, sessionApi, queryApi } from "../../services/api.js";
import {
  Calendar, FileText, HelpCircle, Video,
  ChevronRight, X, Clock, CheckCircle2,
  Layers, Zap,
} from "lucide-react";

const C = {
  dark: "#1F1A17",
  navy: "#003C6E",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#9ca3af",
};

/* ─── helpers ─────────────────────────────────────────────── */
function deriveStatus(session) {
  if (!session.scheduled_at) return session.status || "UPCOMING";
  const now      = new Date();
  const date     = new Date(session.scheduled_at);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  if (date < todayStart)                      return "COMPLETED";
  if (date >= todayStart && date < todayEnd)  return date <= now ? "LIVE" : "TODAY";
  return "UPCOMING";
}

function fmtDate(iso) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime())    return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"short" });
}

/* ─── Ask Query Modal ──────────────────────────────────────── */
function AskQueryModal({ session, batchId, onClose, onSubmitted }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return setErr("Please enter your question.");
    setLoading(true); setErr("");
    try {
      await queryApi.create({ batch_id: batchId, session_id: session.id, question: question.trim() });
      onSubmitted?.(); onClose();
    } catch(e) { setErr(e.message || "Failed to submit query."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }}
        initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div
        style={{ position:"relative", background:"#fff", borderRadius:20, width:"100%", maxWidth:420, padding:28, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", zIndex:10 }}
        initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ fontSize:17, fontWeight:700, color:C.dark }}>Ask a Question</h3>
          <button onClick={onClose} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"none", background:"#f3f4f6", cursor:"pointer" }}>
            <X size={14} style={{ color:C.gray }}/>
          </button>
        </div>
        {session && (
          <div style={{ background:"#eff8ff", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.blue, fontWeight:600 }}>
            Session {session.session_number}: {session.name}
          </div>
        )}
        <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.gray, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Your Question</label>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Describe your question in detail…" rows={4}
          style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e5e7eb", borderRadius:12, fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", marginBottom:4, boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        {err && <p style={{ fontSize:12, color:"#dc2626", marginBottom:8 }}>{err}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, fontFamily:"inherit", marginTop:8 }}>
          {loading ? "Submitting…" : "Submit Question"}
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Status Badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const MAP = {
    LIVE:      { bg:"#dcfce7", color:"#16a34a", dot:"#22c55e", label:"Live Now",  pulse:true  },
    TODAY:     { bg:"#fff7ed", color:"#ea580c", dot:"#f97316", label:"Today",     pulse:false },
    UPCOMING:  { bg:"#eff8ff", color:C.primary, dot:C.primary, label:"Upcoming",  pulse:false },
    COMPLETED: { bg:"#f5f3ff", color:"#7c3aed", dot:"#8b5cf6", label:"Completed", pulse:false },
    CANCELLED: { bg:"#fef2f2", color:"#dc2626", dot:"#ef4444", label:"Cancelled", pulse:false },
  };
  const s = MAP[status] || MAP.UPCOMING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:999, background:s.bg, color:s.color, flexShrink:0 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block", animation:s.pulse?"pulseDot 1.5s infinite":"none" }}/>
      {s.label}
    </span>
  );
}

/* ─── Session Card ─────────────────────────────────────────── */
function SessionCard({ session, tutorName, timeSlots, batchId, onAskQuestion, index }) {
  const status    = session._derivedStatus || deriveStatus(session);
  const isComp    = status === "COMPLETED";
  const isLive    = status === "LIVE";
  const sessionTime = timeSlots?.length > 0 ? timeSlots[0] : "TBD";

  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4) }}>

      {isLive && <div style={{ height:3, background:"linear-gradient(90deg,#22c55e,#16a34a)" }}/>}

      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:4 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.dark, lineHeight:1.35, marginBottom:3 }}>
              Session {session.session_number}
            </h3>
            <p style={{ fontSize:13, fontWeight:600, color:C.primary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {session.name || "Topic TBD"}
            </p>
          </div>
          <StatusBadge status={status}/>
        </div>
      </div>

      <div style={{ padding:"14px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>Date</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{fmtDate(session.scheduled_at)}</p>
            <p style={{ fontSize:10, color: isLive ? "#16a34a" : C.primary, fontWeight:600, marginTop:1 }}>{fmtDay(session.scheduled_at)}</p>
          </div>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>Time</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{sessionTime}</p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
            {tutorName?.[0]?.toUpperCase()||"T"}
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark, lineHeight:1.2 }}>{tutorName||"Tutor"}</p>
            <p style={{ fontSize:10, color:C.primary }}>Mentor · Live Session</p>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <button style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 11px", background:"#F0F7FF", border:"1px solid #c3ebff", borderRadius:8, fontSize:11, fontWeight:600, color:C.primary, cursor:"pointer" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><FileText size={12}/> Assignment</span><ChevronRight size={12}/>
          </button>
          <button onClick={() => onAskQuestion(session)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 11px", background:"#F0F7FF", border:"1px solid #c3ebff", borderRadius:8, fontSize:11, fontWeight:600, color:C.primary, cursor:"pointer" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><HelpCircle size={12}/> Ask Query</span><ChevronRight size={12}/>
          </button>
        </div>

        {session.zoom_link || session.recording_url ? (
          <a href={session.zoom_link || session.recording_url} target="_blank" rel="noopener noreferrer"
            style={{ display:"block", width:"100%", padding:"11px 0", background: isComp ? "linear-gradient(135deg,#7c3aed,#8b5cf6)" : `linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", borderRadius:10, fontSize:13, fontWeight:700, textAlign:"center", textDecoration:"none" }}>
            {isComp ? "▶ View Recording" : isLive ? "⚡ Join Live Session" : "Go to Session"}
          </a>
        ) : (
          <button style={{ width:"100%", padding:"11px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity: isComp ? 0.65 : 1 }}>
            {isComp ? "Recording Unavailable" : isLive ? "⚡ Join Live Session" : "Go to Session"}
          </button>
        )}
      </div>
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </motion.div>
  );
}

/* ─── Batch Selector Card ──────────────────────────────────── */
function BatchSelectorCard({ batch, selected, onClick }) {
  const isSel = selected?.id === batch.id;
  const now   = new Date();
  const start = batch.start_date ? new Date(batch.start_date) : null;
  const end   = batch.end_date   ? new Date(batch.end_date)   : null;
  let batchStatus = "Upcoming";
  if (start && end) {
    if (now >= start && now <= end) batchStatus = "Active";
    else if (now > end)             batchStatus = "Completed";
  }
  const startStr = start ? start.toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <button onClick={onClick} style={{
      flexShrink:0, minWidth:190, padding:"14px 16px", borderRadius:16,
      border: isSel ? `2px solid ${C.primary}` : "2px solid #e5e7eb",
      background: isSel ? "linear-gradient(135deg,#eff8ff,#dbeafe)" : "#fff",
      cursor:"pointer", textAlign:"left", transition:"all 0.2s",
      boxShadow: isSel ? `0 4px 18px rgba(0,123,191,0.15)` : "0 1px 4px rgba(0,0,0,0.05)",
      position:"relative",
    }}>
      {isSel && <span style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:C.primary }}/>}
      <span style={{ display:"inline-block", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:999, background: isSel ? C.primary : "#f3f4f6", color: isSel ? "#fff" : C.gray, marginBottom:8, letterSpacing:"0.5px", textTransform:"uppercase" }}>
        {batchStatus}
      </span>
      <p style={{ fontSize:13, fontWeight:700, color: isSel ? C.blue : C.dark, lineHeight:1.35, marginBottom:4 }}>
        {batch.name || batch.course?.name || "Batch"}
      </p>
      <p style={{ fontSize:11, color:C.lg, marginBottom:4 }}>{batch.course?.name || ""}</p>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <Calendar size={10} style={{ color:C.lg }}/>
        <span style={{ fontSize:10, color:C.lg, fontWeight:500 }}>From {startStr}</span>
      </div>
    </button>
  );
}

/* ─── Section Label ────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label, count, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={14} style={{ color }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{label}</span>
      <span style={{ fontSize:11, fontWeight:600, color, background:`${color}15`, padding:"2px 8px", borderRadius:999 }}>{count}</span>
    </div>
  );
}

/* ─── Shared data hook ─────────────────────────────────────── */
function useBatchSessions() {
  const [batches,         setBatches]         = useState([]);
  const [selectedBatch,   setSelectedBatch]   = useState(null);
  const [sessions,        setSessions]        = useState([]);
  const [loadingBatches,  setLoadingBatches]  = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error,           setError]           = useState("");

  useEffect(() => {
    batchApi.enrolled()
      .then(res => {
        const list = (res.data||[]).map(e=>e.batch).filter(Boolean);
        setBatches(list);
        if (list.length > 0) setSelectedBatch(list[0]);
      })
      .catch(e => setError(e.message || "Failed to load batches."))
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    setLoadingSessions(true);
    setSessions([]);
    sessionApi.getForBatch(selectedBatch.id)
      .then(res => setSessions(res.data||[]))
      .catch(e => setError(e.message || "Failed to load sessions."))
      .finally(() => setLoadingSessions(false));
  }, [selectedBatch]);

  const enriched = useMemo(() => sessions.map(s => ({...s, _derivedStatus: deriveStatus(s)})), [sessions]);

  return { batches, selectedBatch, setSelectedBatch, enriched, loadingBatches, loadingSessions, error };
}

/* ─── Batch Selector UI ────────────────────────────────────── */
function BatchSelector({ batches, selectedBatch, setSelectedBatch }) {
  if (batches.length === 0) return null;
  return (
    <div style={{ marginBottom:24 }}>
      <p style={{ fontSize:11, fontWeight:700, color:C.lg, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:10 }}>
        Select Batch
      </p>
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:6 }}>
        {batches.map(b => (
          <BatchSelectorCard key={b.id} batch={b} selected={selectedBatch} onClick={() => setSelectedBatch(b)}/>
        ))}
      </div>
    </div>
  );
}

/* ─── All Sessions Page ────────────────────────────────────── */
export function AllSessionsPage() {
  const { batches, selectedBatch, setSelectedBatch, enriched, loadingBatches, loadingSessions, error } = useBatchSessions();
  const [filter,      setFilter]      = useState("ALL");
  const [askSession,  setAskSession]  = useState(null);

  const completedCount = enriched.filter(s => s._derivedStatus === "COMPLETED").length;
  const todayCount     = enriched.filter(s => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE").length;
  const upcomingCount  = enriched.filter(s => s._derivedStatus === "UPCOMING").length;
  const progressPct    = enriched.length > 0 ? Math.round((completedCount/enriched.length)*100) : 0;

  const filtered = useMemo(() => {
    if (filter === "ALL")       return enriched;
    if (filter === "TODAY")     return enriched.filter(s => s._derivedStatus==="TODAY"||s._derivedStatus==="LIVE");
    if (filter === "UPCOMING")  return enriched.filter(s => s._derivedStatus==="UPCOMING");
    if (filter === "COMPLETED") return enriched.filter(s => s._derivedStatus==="COMPLETED");
    return enriched;
  }, [enriched, filter]);

  const grouped = useMemo(() => ({
    live:      enriched.filter(s => s._derivedStatus==="LIVE"),
    today:     enriched.filter(s => s._derivedStatus==="TODAY"),
    upcoming:  enriched.filter(s => s._derivedStatus==="UPCOMING"),
    completed: enriched.filter(s => s._derivedStatus==="COMPLETED"),
  }), [enriched]);

  const tutorName = selectedBatch?.tutor?.name || "Tutor";
  const timeSlots = selectedBatch?.time_slots  || [];
  const batchId   = selectedBatch?.id;

  const FILTERS = [
    { key:"ALL",       label:"All",       count:enriched.length },
    { key:"TODAY",     label:"Today",     count:todayCount,    hide:todayCount===0 },
    { key:"UPCOMING",  label:"Upcoming",  count:upcomingCount },
    { key:"COMPLETED", label:"Completed", count:completedCount },
  ];

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>My Sessions</h2>
          <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>Track all your learning sessions across batches</p>
        </div>

        {/* Batch selector skeleton */}
        {loadingBatches && (
          <div style={{ display:"flex", gap:12, marginBottom:24 }}>
            {[1,2].map(i=><div key={i} style={{ flexShrink:0, minWidth:190, height:90, borderRadius:16, background:"#f3f4f6" }} className="animate-pulse"/>)}
          </div>
        )}

        {!loadingBatches && (
          <BatchSelector batches={batches} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch}/>
        )}

        {!loadingBatches && batches.length === 0 && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:56, textAlign:"center" }}>
            <Layers size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
            <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>Not enrolled in any batch</p>
            <p style={{ fontSize:13, color:C.lg }}>Enroll in a course to see your sessions here.</p>
          </div>
        )}

        {selectedBatch && (
          <>
            {/* Progress */}
            {enriched.length > 0 && (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", padding:"16px 20px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>Course Completion</span>
                  <span style={{ fontSize:14, fontWeight:800, color:C.primary }}>{progressPct}%</span>
                </div>
                <div style={{ height:8, background:"#e5e7eb", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
                  <motion.div style={{ height:"100%", background:`linear-gradient(90deg,${C.blue},${C.primary})`, borderRadius:4 }}
                    initial={{ width:0 }} animate={{ width:`${progressPct}%` }} transition={{ duration:1.2, ease:[0.16,1,0.3,1] }}/>
                </div>
                <div style={{ display:"flex", gap:20 }}>
                  {[
                    { val:completedCount, label:"Done",     color:C.primary  },
                    { val:todayCount,     label:"Today",    color:"#ea580c"  },
                    { val:upcomingCount,  label:"Upcoming", color:C.dark     },
                    { val:enriched.length,label:"Total",    color:C.dark     },
                  ].map(({ val, label, color }) => (
                    <div key={label} style={{ textAlign:"center" }}>
                      <p style={{ fontSize:18, fontWeight:800, color }}>{val}</p>
                      <p style={{ fontSize:10, color:C.lg, fontWeight:600 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {FILTERS.filter(f=>!f.hide).map(({ key, label, count }) => (
                <button key={key} onClick={()=>setFilter(key)} style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"8px 14px", borderRadius:999,
                  border: filter===key ? "none" : "1.5px solid #e5e7eb",
                  background: filter===key ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff",
                  color: filter===key ? "#fff" : C.gray,
                  fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                  boxShadow: filter===key ? `0 4px 14px rgba(0,123,191,0.25)` : "none",
                }}>
                  {label}
                  <span style={{ fontSize:10, fontWeight:800, background: filter===key?"rgba(255,255,255,0.2)":"#f3f4f6", color: filter===key?"#fff":C.gray, padding:"1px 6px", borderRadius:999 }}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Loading */}
            {loadingSessions && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[1,2,3].map(i=><div key={i} style={{ height:260, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>)}
              </div>
            )}

            {/* Grouped ALL view */}
            {!loadingSessions && !error && filter==="ALL" && (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {grouped.live.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Zap} label="Live Now" count={grouped.live.length} color="#16a34a"/>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {grouped.live.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
                    </div>
                  </div>
                )}
                {grouped.today.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Clock} label="Today" count={grouped.today.length} color="#ea580c"/>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {grouped.today.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
                    </div>
                  </div>
                )}
                {grouped.upcoming.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Calendar} label="Upcoming" count={grouped.upcoming.length} color={C.primary}/>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {grouped.upcoming.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
                    </div>
                  </div>
                )}
                {grouped.completed.length > 0 && (
                  <div>
                    <SectionLabel icon={CheckCircle2} label="Completed" count={grouped.completed.length} color="#7c3aed"/>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {grouped.completed.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
                    </div>
                  </div>
                )}
                {enriched.length === 0 && (
                  <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:56, textAlign:"center" }}>
                    <Calendar size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
                    <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>No sessions yet</p>
                    <p style={{ fontSize:13, color:C.lg }}>Sessions will appear once scheduled by your tutor.</p>
                  </div>
                )}
              </div>
            )}

            {/* Filtered non-ALL view */}
            {!loadingSessions && !error && filter !== "ALL" && (
              filtered.length === 0 ? (
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:40, textAlign:"center" }}>
                  <Calendar size={32} style={{ color:"#d1d5db", margin:"0 auto 10px" }}/>
                  <p style={{ fontSize:14, color:C.lg }}>No {filter.toLowerCase()} sessions</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {filtered.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
                </div>
              )
            )}
          </>
        )}

        <AnimatePresence>
          {askSession && (
            <AskQueryModal session={askSession} batchId={batchId} onClose={()=>setAskSession(null)} onSubmitted={()=>{}}/>
          )}
        </AnimatePresence>
      </PageWrapper>
    </AppShell>
  );
}

/* ─── Upcoming Sessions Page ───────────────────────────────── */
export function UpcomingSessionsPage() {
  const { batches, selectedBatch, setSelectedBatch, enriched, loadingBatches, loadingSessions } = useBatchSessions();
  const [askSession, setAskSession] = useState(null);

  const filtered = useMemo(()=>enriched.filter(s=>s._derivedStatus==="UPCOMING"||s._derivedStatus==="TODAY"||s._derivedStatus==="LIVE"),[enriched]);
  const tutorName = selectedBatch?.tutor?.name || "Tutor";
  const timeSlots = selectedBatch?.time_slots  || [];
  const batchId   = selectedBatch?.id;

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>Upcoming Sessions</h2>
          <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>{filtered.length} sessions scheduled</p>
        </div>
        {!loadingBatches && <BatchSelector batches={batches} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch}/>}
        {loadingSessions && <div style={{ display:"flex", flexDirection:"column", gap:14 }}>{[1,2].map(i=><div key={i} style={{ height:260, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>)}</div>}
        {!loadingSessions && filtered.length === 0 && selectedBatch && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:40, textAlign:"center" }}>
            <Calendar size={32} style={{ color:"#d1d5db", margin:"0 auto 10px" }}/>
            <p style={{ fontSize:14, color:C.lg }}>No upcoming sessions for this batch</p>
          </div>
        )}
        {!loadingSessions && filtered.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
          </div>
        )}
        <AnimatePresence>
          {askSession && <AskQueryModal session={askSession} batchId={batchId} onClose={()=>setAskSession(null)} onSubmitted={()=>{}}/>}
        </AnimatePresence>
      </PageWrapper>
    </AppShell>
  );
}

/* ─── Completed Sessions Page ──────────────────────────────── */
export function CompletedSessionsPage() {
  const { batches, selectedBatch, setSelectedBatch, enriched, loadingBatches, loadingSessions } = useBatchSessions();
  const [askSession, setAskSession] = useState(null);

  const filtered = useMemo(()=>enriched.filter(s=>s._derivedStatus==="COMPLETED"),[enriched]);
  const tutorName = selectedBatch?.tutor?.name || "Tutor";
  const timeSlots = selectedBatch?.time_slots  || [];
  const batchId   = selectedBatch?.id;

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>Completed Sessions</h2>
          <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>{filtered.length} sessions completed</p>
        </div>
        {!loadingBatches && <BatchSelector batches={batches} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch}/>}
        {loadingSessions && <div style={{ display:"flex", flexDirection:"column", gap:14 }}>{[1,2].map(i=><div key={i} style={{ height:260, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>)}</div>}
        {!loadingSessions && filtered.length === 0 && selectedBatch && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:40, textAlign:"center" }}>
            <CheckCircle2 size={32} style={{ color:"#d1d5db", margin:"0 auto 10px" }}/>
            <p style={{ fontSize:14, color:C.lg }}>No completed sessions yet</p>
          </div>
        )}
        {!loadingSessions && filtered.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.map((s,i)=><SessionCard key={s.id} session={s} tutorName={tutorName} timeSlots={timeSlots} batchId={batchId} onAskQuestion={setAskSession} index={i}/>)}
          </div>
        )}
        <AnimatePresence>
          {askSession && <AskQueryModal session={askSession} batchId={batchId} onClose={()=>setAskSession(null)} onSubmitted={()=>{}}/>}
        </AnimatePresence>
      </PageWrapper>
    </AppShell>
  );
}