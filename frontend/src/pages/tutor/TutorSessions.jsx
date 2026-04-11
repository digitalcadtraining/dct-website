/**
 * TutorSessions.jsx — Enhanced
 * - All tutor's approved batches shown as horizontal selector cards
 * - Time-aware status derived from scheduled_at vs now (not DB status)
 * - Grouped view: Live Now → Today → Upcoming → Completed
 * - Filter tabs with live counts
 * - Right panel: Course progress + Student queries per batch
 */
import { useState, useEffect, useMemo } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { sessionApi, batchApi, queryApi } from "../../services/api.js";
import {
  FileText, HelpCircle, Video, ChevronRight,
  Calendar, Clock, CheckCircle2, Circle, X,
  Zap, Layers, Link,
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
  const now        = new Date();
  const date       = new Date(session.scheduled_at);
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
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700,
      padding:"4px 10px", borderRadius:999, background:s.bg, color:s.color, flexShrink:0 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block",
        animation: s.pulse ? "pulseDot 1.5s infinite" : "none" }}/>
      {s.label}
    </span>
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
    else if (now > end)             batchStatus = "Ended";
  }
  const startStr = start
    ? start.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    : "—";

  return (
    <button onClick={onClick} style={{
      flexShrink:0, minWidth:200, padding:"14px 16px", borderRadius:16,
      border: isSel ? `2px solid ${C.primary}` : "2px solid #e5e7eb",
      background: isSel ? "linear-gradient(135deg,#eff8ff,#dbeafe)" : "#fff",
      cursor:"pointer", textAlign:"left", transition:"all 0.2s",
      boxShadow: isSel ? `0 4px 18px rgba(0,123,191,0.15)` : "0 1px 4px rgba(0,0,0,0.05)",
      position:"relative",
    }}>
      {isSel && (
        <span style={{ position:"absolute", top:10, right:10, width:8, height:8,
          borderRadius:"50%", background:C.primary }}/>
      )}
      <span style={{ display:"inline-block", fontSize:9, fontWeight:700, padding:"2px 8px",
        borderRadius:999, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8,
        background: isSel ? C.primary : "#f3f4f6",
        color: isSel ? "#fff" : C.gray,
      }}>
        {batchStatus}
      </span>
      <p style={{ fontSize:13, fontWeight:700, color: isSel ? C.blue : C.dark, lineHeight:1.35, marginBottom:3 }}>
        {batch.name || "Batch"}
      </p>
      <p style={{ fontSize:11, color:C.lg, marginBottom:6 }}>
        {batch.course?.name || ""}
      </p>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ display:"flex", alignItems:"center", gap:3 }}>
          <Calendar size={9} style={{ color:C.lg }}/>
          <span style={{ fontSize:10, color:C.lg, fontWeight:500 }}>From {startStr}</span>
        </span>
        {batch.enrolled_count !== undefined && (
          <span style={{ fontSize:10, color:C.lg, fontWeight:500 }}>
            👥 {batch.enrolled_count}/{batch.max_students || "—"}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Section Label ────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label, count, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`${color}18`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={14} style={{ color }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{label}</span>
      <span style={{ fontSize:11, fontWeight:600, color, background:`${color}15`,
        padding:"2px 8px", borderRadius:999 }}>
        {count}
      </span>
    </div>
  );
}

/* ─── Add/Edit Link Modal ──────────────────────────────────── */
function LinkModal({ session, onClose, onSaved }) {
  const [url, setUrl]       = useState(session.zoom_link || session.recording_url || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await sessionApi.update(session.id, {
        [session._derivedStatus === "COMPLETED" ? "recording_url" : "zoom_link"]: url.trim(),
      });
      onSaved(url.trim());
      onClose();
    } catch(e) { alert(e.message || "Failed to save link."); }
    finally { setLoading(false); }
  };

  const isComp = session._derivedStatus === "COMPLETED";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center",
      justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(4px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff", borderRadius:20, width:"100%",
        maxWidth:400, padding:24, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", zIndex:10 }}
        initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.dark }}>
            {isComp ? "Add Recording Link" : "Add Session Link"}
          </h3>
          <button onClick={onClose} style={{ width:30, height:30, display:"flex", alignItems:"center",
            justifyContent:"center", borderRadius:8, border:"none", background:"#f3f4f6", cursor:"pointer" }}>
            <X size={14} style={{ color:C.gray }}/>
          </button>
        </div>
        <div style={{ background:"#eff8ff", borderRadius:10, padding:"10px 14px", marginBottom:16,
          fontSize:13, color:C.blue, fontWeight:600 }}>
          Session {session.session_number}: {session.name}
        </div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
          marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>
          {isComp ? "Recording URL" : "Zoom / Meeting Link"}
        </label>
        <input type="url" value={url} onChange={e=>setUrl(e.target.value)}
          placeholder={isComp ? "https://zoom.us/rec/..." : "https://zoom.us/j/..."}
          style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:12,
            fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box", marginBottom:12 }}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <button onClick={handleSave} disabled={loading||!url.trim()}
          style={{ width:"100%", padding:"12px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`,
            color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700,
            cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, fontFamily:"inherit" }}>
          {loading ? "Saving…" : "Save Link"}
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Answer Query Modal ───────────────────────────────────── */
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
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-dct-dark">Answer Query</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={15} style={{ color:C.gray }}/>
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-dct-gray mb-1">Student's Question:</p>
          <p className="text-sm text-dct-dark">{query.question}</p>
        </div>
        <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
          placeholder="Type your answer here…" rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none resize-none mb-4"
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <button onClick={handleSubmit} disabled={loading||!answer.trim()}
          className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
          style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
          {loading ? "Sending…" : "Send Answer"}
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Session Card (Tutor view) ────────────────────────────── */
function SessionCard({ session, timeSlots, onLinkModal, index }) {
  const status   = session._derivedStatus || deriveStatus(session);
  const isComp   = status === "COMPLETED";
  const isLive   = status === "LIVE";
  const hasLink  = !!(session.zoom_link || session.recording_url);
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
            <p style={{ fontSize:13, fontWeight:600, color:C.primary, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {session.name || "Topic TBD"}
            </p>
          </div>
          <StatusBadge status={status}/>
        </div>
      </div>

      <div style={{ padding:"14px 20px" }}>
        {/* Date + Time */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:3 }}>Date</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{fmtDate(session.scheduled_at)}</p>
            <p style={{ fontSize:10, color: isLive ? "#16a34a" : C.primary, fontWeight:600, marginTop:1 }}>
              {fmtDay(session.scheduled_at)}
            </p>
          </div>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:3 }}>Time</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{sessionTime}</p>
          </div>
        </div>

        {/* Link indicator */}
        {hasLink && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
            background:"#f0fdf4", borderRadius:8, marginBottom:10 }}>
            <Link size={11} style={{ color:"#16a34a" }}/>
            <span style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>
              {isComp ? "Recording linked" : "Session link added"}
            </span>
          </div>
        )}

        {/* CTA */}
        {hasLink ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
            <a href={session.zoom_link || session.recording_url} target="_blank" rel="noopener noreferrer"
              style={{ display:"block", padding:"11px 0", background: isComp
                ? "linear-gradient(135deg,#7c3aed,#8b5cf6)"
                : `linear-gradient(135deg,${C.blue},${C.primary})`,
                color:"#fff", borderRadius:10, fontSize:13, fontWeight:700,
                textAlign:"center", textDecoration:"none" }}>
              {isComp ? "▶ View Recording" : "⚡ Start Session"}
            </a>
            <button onClick={() => onLinkModal(session)}
              style={{ padding:"11px 14px", border:`1.5px solid ${C.primary}`, borderRadius:10,
                background:"#fff", color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Edit
            </button>
          </div>
        ) : (
          <button onClick={() => onLinkModal(session)}
            style={{ width:"100%", padding:"11px 0",
              background: isComp
                ? "linear-gradient(135deg,#7c3aed,#8b5cf6)"
                : `linear-gradient(135deg,${C.blue},${C.primary})`,
              color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit" }}>
            {isComp ? "+ Add Recording Link" : "+ Add Session Link"}
          </button>
        )}
      </div>
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </motion.div>
  );
}

/* ─── Query Card (right panel) ─────────────────────────────── */
function QueryCard({ query, index, onAnswer }) {
  return (
    <motion.div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:14,
      cursor:"pointer", transition:"all 0.2s" }}
      initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#bfdbfe"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:30, height:30, borderRadius:"50%",
          background:`linear-gradient(135deg,${C.blue},${C.primary})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
          {query.student?.name?.[0]?.toUpperCase() || "S"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>
            {query.student?.name || "Student"}
          </p>
          <p style={{ fontSize:10, color:C.lg, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            Session {query.session?.session_number || "—"}
          </p>
        </div>
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999,
          background: query.status==="RESOLVED" ? "#f0fdf4" : "#fef2f2",
          color: query.status==="RESOLVED" ? "#16a34a" : "#dc2626", flexShrink:0 }}>
          {query.status === "RESOLVED" ? "Resolved" : "Open"}
        </span>
      </div>
      {query.question && (
        <p style={{ fontSize:11, color:C.dark, lineHeight:1.5,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
          overflow:"hidden", marginBottom:query.status!=="RESOLVED"?8:0 }}>
          {query.question}
        </p>
      )}
      {query.status !== "RESOLVED" && (
        <button onClick={() => onAnswer(query)}
          style={{ padding:"6px 12px", borderRadius:8, border:"none",
            background:`linear-gradient(135deg,${C.blue},${C.primary})`,
            color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Answer
        </button>
      )}
    </motion.div>
  );
}

/* ─── MAIN TUTOR SESSIONS PAGE ─────────────────────────────── */
export default function TutorSessionsPage() {
  const [batches,          setBatches]          = useState([]);
  const [selectedBatch,    setSelectedBatch]    = useState(null);
  const [sessions,         setSessions]         = useState([]);
  const [queries,          setQueries]          = useState([]);
  const [loadingBatches,   setLoadingBatches]   = useState(true);
  const [loadingSessions,  setLoadingSessions]  = useState(false);
  const [filter,           setFilter]           = useState("ALL");
  const [answerQuery,      setAnswerQuery]      = useState(null);
  const [linkModalSession, setLinkModalSession] = useState(null);

  /* Load tutor's approved batches */
  useEffect(() => {
    batchApi.mine()
      .then(r => {
        const approved = (r.data || []).filter(b => b.status !== "PENDING_APPROVAL");
        setBatches(approved);
        if (approved.length > 0) setSelectedBatch(approved[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingBatches(false));
  }, []);

  /* Load sessions + queries when batch changes */
  useEffect(() => {
    if (!selectedBatch) return;
    setLoadingSessions(true);
    setSessions([]);
    setQueries([]);

    Promise.all([
      sessionApi.getForBatch(selectedBatch.id),
      queryApi.getBatchQueries(selectedBatch.id).catch(() => ({ data: [] })),
    ]).then(([sessRes, queryRes]) => {
      setSessions(sessRes.data || []);
      setQueries((queryRes.data || []).map(q => ({ ...q, batch_name: selectedBatch.name })));
    })
    .catch(console.error)
    .finally(() => setLoadingSessions(false));
  }, [selectedBatch]);

  /* Enrich with derived status */
  const enriched = useMemo(() =>
    sessions.map(s => ({ ...s, _derivedStatus: deriveStatus(s) })),
  [sessions]);

  /* Stats */
  const completedCount = enriched.filter(s => s._derivedStatus === "COMPLETED").length;
  const todayCount     = enriched.filter(s => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE").length;
  const upcomingCount  = enriched.filter(s => s._derivedStatus === "UPCOMING").length;
  const progressPct    = enriched.length > 0 ? Math.round((completedCount / enriched.length) * 100) : 0;
  const unresolvedCount = queries.filter(q => q.status !== "RESOLVED").length;

  /* Filter */
  const filtered = useMemo(() => {
    if (filter === "ALL")       return enriched;
    if (filter === "TODAY")     return enriched.filter(s => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE");
    if (filter === "UPCOMING")  return enriched.filter(s => s._derivedStatus === "UPCOMING");
    if (filter === "COMPLETED") return enriched.filter(s => s._derivedStatus === "COMPLETED");
    return enriched;
  }, [enriched, filter]);

  /* Groups for ALL view */
  const grouped = useMemo(() => ({
    live:      enriched.filter(s => s._derivedStatus === "LIVE"),
    today:     enriched.filter(s => s._derivedStatus === "TODAY"),
    upcoming:  enriched.filter(s => s._derivedStatus === "UPCOMING"),
    completed: enriched.filter(s => s._derivedStatus === "COMPLETED"),
  }), [enriched]);

  const timeSlots = selectedBatch?.time_slots || [];

  const FILTERS = [
    { key:"ALL",       label:"All",       count: enriched.length },
    { key:"TODAY",     label:"Today",     count: todayCount,    hide: todayCount === 0 },
    { key:"UPCOMING",  label:"Upcoming",  count: upcomingCount },
    { key:"COMPLETED", label:"Completed", count: completedCount },
  ];

  /* Handlers */
  const handleAnswered = (queryId) => {
    setQueries(q => q.map(query => query.id === queryId ? { ...query, status:"RESOLVED" } : query));
  };

  const handleLinkSaved = (sessionId, url) => {
    const sess = sessions.find(s => s.id === sessionId);
    const field = sess?._derivedStatus === "COMPLETED" ? "recording_url" : "zoom_link";
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, [field]: url } : s));
  };

  return (
    <AppShell>
      <PageWrapper>

        {/* ── Page Header ── */}
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>My Sessions</h2>
          <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>Manage sessions and respond to student queries</p>
        </div>

        {/* ── Batch Selector ── */}
        {loadingBatches && (
          <div style={{ display:"flex", gap:12, marginBottom:24 }}>
            {[1,2].map(i=>(
              <div key={i} style={{ flexShrink:0, minWidth:200, height:100, borderRadius:16, background:"#f3f4f6" }} className="animate-pulse"/>
            ))}
          </div>
        )}

        {!loadingBatches && batches.length === 0 && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:56, textAlign:"center" }}>
            <Layers size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
            <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>No approved batches yet</p>
            <p style={{ fontSize:13, color:C.lg }}>Create a batch and wait for admin approval.</p>
          </div>
        )}

        {!loadingBatches && batches.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.lg, textTransform:"uppercase",
              letterSpacing:"0.8px", marginBottom:10 }}>
              Select Batch
            </p>
            <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:6 }}>
              {batches.map(b => (
                <BatchSelectorCard key={b.id} batch={b} selected={selectedBatch}
                  onClick={() => setSelectedBatch(b)}/>
              ))}
            </div>
          </div>
        )}

        {selectedBatch && (
          <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

            {/* ── LEFT: Sessions ── */}
            <div style={{ flex:1, minWidth:0 }}>

              {/* Filter tabs */}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {FILTERS.filter(f => !f.hide).map(({ key, label, count }) => (
                  <button key={key} onClick={() => setFilter(key)} style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"8px 14px", borderRadius:999,
                    border: filter===key ? "none" : "1.5px solid #e5e7eb",
                    background: filter===key ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff",
                    color: filter===key ? "#fff" : C.gray,
                    fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                    boxShadow: filter===key ? `0 4px 14px rgba(0,123,191,0.25)` : "none",
                  }}>
                    {label}
                    <span style={{ fontSize:10, fontWeight:800,
                      background: filter===key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                      color: filter===key ? "#fff" : C.gray,
                      padding:"1px 6px", borderRadius:999 }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Loading */}
              {loadingSessions && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[1,2,3].map(i=>(
                    <div key={i} style={{ height:220, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>
                  ))}
                </div>
              )}

              {/* Grouped ALL view */}
              {!loadingSessions && filter === "ALL" && (
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {grouped.live.length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <SectionLabel icon={Zap} label="Live Now" count={grouped.live.length} color="#16a34a"/>
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {grouped.live.map((s,i) => (
                          <SessionCard key={s.id} session={s} timeSlots={timeSlots}
                            onLinkModal={setLinkModalSession} index={i}/>
                        ))}
                      </div>
                    </div>
                  )}
                  {grouped.today.length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <SectionLabel icon={Clock} label="Today" count={grouped.today.length} color="#ea580c"/>
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {grouped.today.map((s,i) => (
                          <SessionCard key={s.id} session={s} timeSlots={timeSlots}
                            onLinkModal={setLinkModalSession} index={i}/>
                        ))}
                      </div>
                    </div>
                  )}
                  {grouped.upcoming.length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <SectionLabel icon={Calendar} label="Upcoming" count={grouped.upcoming.length} color={C.primary}/>
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {grouped.upcoming.map((s,i) => (
                          <SessionCard key={s.id} session={s} timeSlots={timeSlots}
                            onLinkModal={setLinkModalSession} index={i}/>
                        ))}
                      </div>
                    </div>
                  )}
                  {grouped.completed.length > 0 && (
                    <div>
                      <SectionLabel icon={CheckCircle2} label="Completed" count={grouped.completed.length} color="#7c3aed"/>
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {grouped.completed.map((s,i) => (
                          <SessionCard key={s.id} session={s} timeSlots={timeSlots}
                            onLinkModal={setLinkModalSession} index={i}/>
                        ))}
                      </div>
                    </div>
                  )}
                  {enriched.length === 0 && (
                    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:56, textAlign:"center" }}>
                      <Calendar size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
                      <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>No sessions yet</p>
                      <p style={{ fontSize:13, color:C.lg }}>Sessions are auto-generated from your syllabus.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Filtered non-ALL view */}
              {!loadingSessions && filter !== "ALL" && (
                filtered.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb", padding:40, textAlign:"center" }}>
                    <Calendar size={32} style={{ color:"#d1d5db", margin:"0 auto 10px" }}/>
                    <p style={{ fontSize:14, color:C.lg }}>No {filter.toLowerCase()} sessions</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {filtered.map((s,i) => (
                      <SessionCard key={s.id} session={s} timeSlots={timeSlots}
                        onLinkModal={setLinkModalSession} index={i}/>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ width:272, flexShrink:0, position:"sticky", top:16, display:"flex", flexDirection:"column", gap:14 }}>

              {/* Course Progress */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb",
                padding:18, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:12 }}>
                  Course Completion
                </p>
                <div style={{ height:8, background:"#e5e7eb", borderRadius:4, overflow:"hidden", marginBottom:8 }}>
                  <motion.div style={{ height:"100%", borderRadius:4,
                    background:`linear-gradient(90deg,${C.blue},${C.primary})` }}
                    initial={{ width:0 }} animate={{ width:`${progressPct}%` }}
                    transition={{ duration:1.2, ease:[0.16,1,0.3,1] }}/>
                </div>
                <p style={{ fontSize:11, fontWeight:600, color:C.gray, marginBottom:12 }}>
                  {progressPct}% completed
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { val:completedCount,          label:"Done",     bg:"#eff8ff", color:C.primary },
                    { val:enriched.length-completedCount, label:"Remaining", bg:"#f9fafb", color:C.dark },
                    { val:todayCount,              label:"Today",    bg:"#fff7ed", color:"#ea580c" },
                    { val:upcomingCount,           label:"Upcoming", bg:"#f5f3ff", color:"#7c3aed" },
                  ].map(({ val, label, bg, color }) => (
                    <div key={label} style={{ textAlign:"center", padding:"10px 8px", borderRadius:12, background:bg }}>
                      <p style={{ fontSize:20, fontWeight:800, color }}>{val}</p>
                      <p style={{ fontSize:10, fontWeight:600, color:C.lg }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Queries */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb",
                padding:18, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.dark }}>Student Queries</p>
                  {unresolvedCount > 0 && (
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999,
                      background:"#fef2f2", color:"#dc2626" }}>
                      {unresolvedCount} open
                    </span>
                  )}
                </div>

                {queries.length === 0 && (
                  <div style={{ textAlign:"center", padding:"24px 0" }}>
                    <HelpCircle size={28} style={{ color:"#d1d5db", margin:"0 auto 8px" }}/>
                    <p style={{ fontSize:12, color:C.lg }}>No queries yet</p>
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:440, overflowY:"auto" }}>
                  {queries.map((query, i) => (
                    <QueryCard key={query.id} query={query} index={i} onAnswer={q => setAnswerQuery(q)}/>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Modals ── */}
        <AnimatePresence>
          {answerQuery && (
            <AnswerModal
              query={answerQuery}
              onClose={() => setAnswerQuery(null)}
              onAnswered={handleAnswered}
            />
          )}
          {linkModalSession && (
            <LinkModal
              session={linkModalSession}
              onClose={() => setLinkModalSession(null)}
              onSaved={(url) => handleLinkSaved(linkModalSession.id, url)}
            />
          )}
        </AnimatePresence>

      </PageWrapper>
    </AppShell>
  );
}