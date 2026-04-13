/**
 * TutorSessions.jsx — v5 (definitive)
 * Fixes:
 *  - Upload Assignment button on every session card
 *  - Query count badge per session → click goes to /tutor/queries?session_id=...
 *  - Student photo/video attachments shown correctly (mediaUrl fix)
 *  - Queries sorted oldest-first so urgent ones surface first
 *  - Priority badges: Ultra High (2d+), High (1d+), Medium (recent)
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { sessionApi, batchApi, queryApi, assignmentApi } from "../../services/api.js";
import { mediaUrl } from "../../services/api.js";
import {
  FileText, HelpCircle, ChevronRight, Calendar, Clock,
  CheckCircle2, X, Zap, Layers, Link, Upload, AlertCircle,
  RefreshCw, BookOpen, PlayCircle, Flame, AlertTriangle, Minus,
} from "lucide-react";

const C = {
  dark:"#1F1A17", navy:"#003C6E", blue:"#024981",
  primary:"#007BBF", gray:"#6A6B6D", lg:"#9ca3af",
};

/* ─── Helpers ──────────────────────────────────────────────── */
function deriveStatus(session) {
  if (!session.scheduled_at) return session.status || "UPCOMING";
  const now        = new Date();
  const date       = new Date(session.scheduled_at);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  if (date < todayStart)                     return "COMPLETED";
  if (date >= todayStart && date < todayEnd) return date <= now ? "LIVE" : "TODAY";
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

function fmtRelative(iso) {
  if (!iso) return "";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getQueryPriority(q) {
  if (q.status === "RESOLVED") return "resolved";
  const ageH = (Date.now() - new Date(q.created_at).getTime()) / 3600000;
  if (ageH >= 48) return "ultra";
  if (ageH >= 24) return "high";
  return "medium";
}

const PRIORITY_MAP = {
  ultra:   { label:"Ultra High", bg:"#fef2f2", color:"#dc2626", border:"#fecaca", dot:"#ef4444", Icon:Flame },
  high:    { label:"High",       bg:"#fff7ed", color:"#ea580c", border:"#fed7aa", dot:"#f97316", Icon:AlertTriangle },
  medium:  { label:"Medium",     bg:"#fefce8", color:"#ca8a04", border:"#fde68a", dot:"#eab308", Icon:Minus },
  resolved:{ label:"Resolved",   bg:"#f0fdf4", color:"#16a34a", border:"#86efac", dot:"#22c55e", Icon:CheckCircle2 },
};

/* ─── Status Badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const MAP = {
    LIVE:      { bg:"#dcfce7", color:"#16a34a", dot:"#22c55e", label:"Live Now", pulse:true  },
    TODAY:     { bg:"#fff7ed", color:"#ea580c", dot:"#f97316", label:"Today",    pulse:false },
    UPCOMING:  { bg:"#eff8ff", color:C.primary, dot:C.primary, label:"Upcoming", pulse:false },
    COMPLETED: { bg:"#f5f3ff", color:"#7c3aed", dot:"#8b5cf6", label:"Completed",pulse:false },
  };
  const s = MAP[status] || MAP.UPCOMING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10,
      fontWeight:700, padding:"4px 10px", borderRadius:999, background:s.bg,
      color:s.color, flexShrink:0 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot,
        display:"inline-block", animation:s.pulse?"pulseDot 1.5s infinite":"none" }}/>
      {s.label}
    </span>
  );
}

/* ─── Upload / Edit Assignment Modal ──────────────────────── */
function UploadAssignmentModal({ session, batchId, existingAssignment, onClose, onUploaded }) {
  const isEdit = !!existingAssignment;
  const [title, setTitle]     = useState(existingAssignment?.title       || "");
  const [desc,  setDesc]      = useState(existingAssignment?.description || "");
  const [due,   setDue]       = useState(
    existingAssignment?.due_date
      ? new Date(existingAssignment.due_date).toISOString().split("T")[0]
      : ""
  );
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!title.trim()) return setErr("Assignment title is required.");
    setLoading(true); setErr("");
    try {
      // For now create always (update endpoint can be added later)
      await assignmentApi.create(
        { batch_id:batchId, session_id:session.id,
          title:title.trim(), description:desc.trim()||undefined, due_date:due||undefined },
        file||undefined
      );
      setDone(true);
      setTimeout(() => { onUploaded?.(); onClose(); }, 1600);
    } catch(e) { setErr(e.message || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(4px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff", borderRadius:20,
        width:"100%", maxWidth:440, zIndex:10, overflow:"hidden",
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}
        initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${C.blue},${C.primary})` }}/>
        <div style={{ padding:"20px 22px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:`linear-gradient(135deg,${C.blue},${C.primary})`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BookOpen size={15} style={{ color:"#fff" }}/>
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:800, color:C.dark }}>
                  {isEdit ? "Edit Assignment" : "Upload Assignment"}
                </p>
                <p style={{ fontSize:11, color:C.lg }}>Session {session.session_number}: {session.name}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:8,
              border:"none", background:"#f3f4f6", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={13} style={{ color:C.gray }}/>
            </button>
          </div>

          {done ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"#dcfce7",
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                <CheckCircle2 size={26} style={{ color:"#16a34a" }}/>
              </div>
              <p style={{ fontSize:15, fontWeight:800, color:"#16a34a" }}>
                {isEdit ? "Assignment updated!" : "Assignment uploaded!"}
              </p>
              <p style={{ fontSize:12, color:C.lg, marginTop:4 }}>Students can now see and submit this.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
                  marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>Title *</label>
                <input type="text" value={title} onChange={e=>setTitle(e.target.value)}
                  placeholder="e.g. Surfacing Exercise – Session 3"
                  style={{ width:"100%", padding:"10px 13px", border:"1.5px solid #e5e7eb",
                    borderRadius:11, fontSize:13, outline:"none", fontFamily:"inherit",
                    color:C.dark, boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=C.primary}
                  onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
                  marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                  Instructions <span style={{ fontWeight:400 }}>(optional)</span>
                </label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)}
                  placeholder="Describe what students need to do…" rows={3}
                  style={{ width:"100%", padding:"10px 13px", border:"1.5px solid #e5e7eb",
                    borderRadius:11, fontSize:13, resize:"none", outline:"none",
                    fontFamily:"inherit", color:C.dark, boxSizing:"border-box", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor=C.primary}
                  onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
                    marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    Due Date
                  </label>
                  <input type="date" value={due} onChange={e=>setDue(e.target.value)}
                    style={{ width:"100%", padding:"10px 13px", border:"1.5px solid #e5e7eb",
                      borderRadius:11, fontSize:12, outline:"none", fontFamily:"inherit",
                      color: due ? C.dark : C.lg, boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor=C.primary}
                    onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
                    marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    File (optional)
                  </label>
                  {file ? (
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 10px",
                      background:"#eff8ff", borderRadius:11, border:"1px solid #bfdbfe",
                      height:40, boxSizing:"border-box" }}>
                      <FileText size={12} style={{ color:C.primary, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:C.dark, flex:1, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                      <button onClick={()=>setFile(null)}
                        style={{ border:"none", background:"none", cursor:"pointer", padding:0 }}>
                        <X size={11} style={{ color:"#dc2626" }}/>
                      </button>
                    </div>
                  ) : (
                    <button onClick={()=>fileRef.current?.click()}
                      style={{ width:"100%", height:40, border:"2px dashed #d1d5db",
                        borderRadius:11, background:"#fafafa", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        gap:6, boxSizing:"border-box" }}>
                      <Upload size={13} style={{ color:C.lg }}/>
                      <span style={{ fontSize:11, color:C.lg }}>Attach file</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" style={{ display:"none" }}
                    onChange={e=>setFile(e.target.files[0])}/>
                </div>
              </div>
              {err && (
                <div style={{ display:"flex", gap:6, alignItems:"center",
                  padding:"9px 12px", background:"#fef2f2", borderRadius:10 }}>
                  <AlertCircle size={13} style={{ color:"#dc2626", flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:"#dc2626" }}>{err}</span>
                </div>
              )}
              <button onClick={handleSubmit} disabled={loading||!title.trim()}
                style={{ width:"100%", padding:"13px 0",
                  background: !title.trim() ? "#e5e7eb" : `linear-gradient(135deg,${C.blue},${C.primary})`,
                  color: !title.trim() ? C.lg : "#fff",
                  border:"none", borderRadius:12, fontSize:14, fontWeight:800,
                  cursor: !title.trim() ? "not-allowed" : "pointer",
                  fontFamily:"inherit", display:"flex", alignItems:"center",
                  justifyContent:"center", gap:8 }}>
                {loading
                  ? <><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> Saving…</>
                  : <><Upload size={14}/> {isEdit ? "Save Changes" : "Upload Assignment"}</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Link Modal ───────────────────────────────────────────── */
function LinkModal({ session, onClose, onSaved }) {
  const [url, setUrl]     = useState(session.zoom_link || session.recording_url || "");
  const [loading, setLoading] = useState(false);
  const isComp = session._derivedStatus === "COMPLETED";

  const handleSave = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await sessionApi.update(session.id, { [isComp ? "recording_url" : "zoom_link"]: url.trim() });
      onSaved(url.trim()); onClose();
    } catch(e) { alert(e.message || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(4px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff", borderRadius:20,
        width:"100%", maxWidth:400, padding:24, zIndex:10, boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}
        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.dark }}>
            {isComp ? "Add Recording Link" : "Add Session Link"}
          </h3>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8,
            border:"none", background:"#f3f4f6", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={14} style={{ color:C.gray }}/>
          </button>
        </div>
        <div style={{ background:"#eff8ff", borderRadius:10, padding:"10px 14px",
          marginBottom:16, fontSize:13, color:C.blue, fontWeight:600 }}>
          Session {session.session_number}: {session.name}
        </div>
        <input type="url" value={url} onChange={e=>setUrl(e.target.value)}
          placeholder={isComp ? "https://zoom.us/rec/..." : "https://zoom.us/j/..."}
          style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e7eb",
            borderRadius:12, fontSize:13, outline:"none", fontFamily:"inherit",
            boxSizing:"border-box", marginBottom:12 }}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <button onClick={handleSave} disabled={loading||!url.trim()}
          style={{ width:"100%", padding:"12px 0",
            background:`linear-gradient(135deg,${C.blue},${C.primary})`,
            color:"#fff", border:"none", borderRadius:12, fontSize:14,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          {loading ? "Saving…" : "Save Link"}
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Answer Modal — shows media attachment ────────────────── */
function AnswerModal({ query, onClose, onAnswered }) {
  const [answer, setAnswer]   = useState("");
  const [loading, setLoading] = useState(false);

  const attachUrl = mediaUrl(query.media_url);
  const isVideo   = query.media_url &&
    (query.media_url.match(/\.(mp4|mov|webm|avi)$/i) || query.media_url.includes("video"));

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try { await queryApi.answer(query.id, answer); onAnswered(query.id); onClose(); }
    catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(4px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff", borderRadius:20,
        width:"100%", maxWidth:480, zIndex:10, padding:24,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto" }}
        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <h3 style={{ fontWeight:800, color:C.dark, fontSize:16 }}>Answer Query</h3>
            <p style={{ fontSize:11, color:C.lg, marginTop:2 }}>
              {query.student?.name} · Session {query.session?.session_number || "—"} · {fmtRelative(query.created_at)}
            </p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8,
            background:"#f3f4f6", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={14} style={{ color:C.gray }}/>
          </button>
        </div>
        <div style={{ background:"#f9fafb", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.gray, marginBottom:5,
            textTransform:"uppercase", letterSpacing:"0.4px" }}>Question</p>
          <p style={{ fontSize:13, color:C.dark, lineHeight:1.6 }}>{query.question}</p>
        </div>
        {/* Student media attachment */}
        {attachUrl && (
          <div style={{ marginBottom:14, borderRadius:12, overflow:"hidden", border:"1px solid #e5e7eb" }}>
            {isVideo ? (
              <video src={attachUrl} controls
                style={{ width:"100%", maxHeight:220, display:"block", background:"#000" }}/>
            ) : (
              <img src={attachUrl} alt="Student attachment"
                style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block" }}
                onError={e=>e.target.style.display="none"}/>
            )}
            <div style={{ padding:"5px 12px", background:"#f9fafb", fontSize:10, color:C.lg }}>
              📎 Student attachment
            </div>
          </div>
        )}
        <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
          placeholder="Type your answer…" rows={4}
          style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e5e7eb",
            borderRadius:12, fontSize:14, outline:"none", resize:"none",
            marginBottom:14, boxSizing:"border-box", fontFamily:"inherit", lineHeight:1.6 }}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <button onClick={handleSubmit} disabled={loading||!answer.trim()}
          style={{ width:"100%", padding:"13px 0", border:"none", borderRadius:12,
            color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", opacity: loading||!answer.trim() ? 0.6 : 1,
            background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
          {loading ? "Sending…" : "Send Answer"}
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Query Card — right panel ─────────────────────────────── */
function QueryCard({ query, index, onAnswer }) {
  const priority = getQueryPriority(query);
  const P        = PRIORITY_MAP[priority];
  const thumbUrl = mediaUrl(query.media_url);
  const isVideo  = query.media_url &&
    (query.media_url.match(/\.(mp4|mov|webm|avi)$/i) || query.media_url.includes("video"));

  return (
    <motion.div style={{ borderRadius:12, padding:"11px 12px",
      border:`1px solid ${P.border}`, background:P.bg }}
      initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.04 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${C.blue},${C.primary})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontSize:10, fontWeight:700 }}>
          {query.student?.name?.[0]?.toUpperCase() || "S"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{query.student?.name || "Student"}</p>
          <p style={{ fontSize:10, color:C.lg }}>
            Session {query.session?.session_number || "—"} · {fmtRelative(query.created_at)}
          </p>
        </div>
        {priority !== "resolved" && (
          <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:9,
            fontWeight:800, padding:"2px 7px", borderRadius:999, background:P.color, color:"#fff" }}>
            <P.Icon size={9}/> {P.label}
          </span>
        )}
      </div>
      <p style={{ fontSize:11, color:C.dark, lineHeight:1.5, marginBottom:6,
        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
        {query.question}
      </p>
      {/* Show media thumbnail */}
      {thumbUrl && (
        <div style={{ marginBottom:8, borderRadius:8, overflow:"hidden",
          border:"1px solid #e5e7eb", maxHeight:80 }}>
          {isVideo ? (
            <div style={{ background:"#111", height:80, display:"flex",
              alignItems:"center", justifyContent:"center" }}>
              <PlayCircle size={20} style={{ color:"#fff", opacity:0.8 }}/>
            </div>
          ) : (
            <img src={thumbUrl} alt="attachment"
              style={{ width:"100%", maxHeight:80, objectFit:"cover", display:"block" }}
              onError={e=>e.target.style.display="none"}/>
          )}
        </div>
      )}
      {priority !== "resolved" && (
        <button onClick={() => onAnswer(query)}
          style={{ width:"100%", padding:"6px 0", borderRadius:8, border:"none",
            background:`linear-gradient(135deg,${C.blue},${C.primary})`,
            color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Answer Query
        </button>
      )}
    </motion.div>
  );
}

/* ─── Batch Selector Card ──────────────────────────────────── */
function BatchSelectorCard({ batch, selected, onClick }) {
  const isSel = selected?.id === batch.id;
  const now = new Date();
  const start = batch.start_date ? new Date(batch.start_date) : null;
  const end   = batch.end_date   ? new Date(batch.end_date)   : null;
  // Derive real-time status from dates
  let label = "Upcoming";
  if (start && end) {
    if (now < start)  label = "Upcoming";
    else if (now > end) label = "Ended";
    else label = "Active";
  }
  const startStr = start ? start.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  return (
    <button onClick={onClick} style={{
      flexShrink:0, minWidth:200, padding:"14px 16px", borderRadius:16, position:"relative",
      border: isSel ? `2px solid ${C.primary}` : "2px solid #e5e7eb",
      background: isSel ? "linear-gradient(135deg,#eff8ff,#dbeafe)" : "#fff",
      cursor:"pointer", textAlign:"left", transition:"all 0.2s",
      boxShadow: isSel ? `0 4px 18px rgba(0,123,191,0.15)` : "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {isSel && <span style={{ position:"absolute", top:10, right:10, width:8, height:8,
        borderRadius:"50%", background:C.primary }}/>}
      <span style={{ display:"inline-block", fontSize:9, fontWeight:700, padding:"2px 8px",
        borderRadius:999, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8,
        background: isSel ? C.primary : "#f3f4f6", color: isSel ? "#fff" : C.gray }}>
        {label}
      </span>
      <p style={{ fontSize:13, fontWeight:700, color: isSel ? C.blue : C.dark,
        lineHeight:1.35, marginBottom:3 }}>{batch.name || "Batch"}</p>
      <p style={{ fontSize:11, color:C.lg, marginBottom:6 }}>{batch.course?.name || ""}</p>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <Calendar size={9} style={{ color:C.lg }}/>
        <span style={{ fontSize:10, color:C.lg }}>From {startStr}</span>
      </div>
    </button>
  );
}

/* ─── Section Label ────────────────────────────────────────── */
function SectionLabel({ icon:Icon, label, count, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`${color}18`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={14} style={{ color }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{label}</span>
      <span style={{ fontSize:11, fontWeight:600, color,
        background:`${color}15`, padding:"2px 8px", borderRadius:999 }}>{count}</span>
    </div>
  );
}

/* ─── Session Card ─────────────────────────────────────────── */
function SessionCard({ session, timeSlots, onLinkModal, onAssignmentUpload,
  sessionQueryCount, onViewSessionQueries, assignmentBySession, index }) {
  const status      = session._derivedStatus || deriveStatus(session);
  const isComp      = status === "COMPLETED";
  const isLive      = status === "LIVE";
  const hasLink     = !!(session.zoom_link || session.recording_url);
  const sessionTime = timeSlots?.length > 0 ? timeSlots[0] : "TBD";
  const assignment  = assignmentBySession?.[session.id] || null; // null = not yet uploaded

  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:Math.min(index*0.06,0.4) }}>
      {isLive && <div style={{ height:3, background:"linear-gradient(90deg,#22c55e,#16a34a)" }}/>}

      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:12, marginBottom:4 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.dark, lineHeight:1.35, marginBottom:3 }}>
              Session {session.session_number}
            </h3>
            <p style={{ fontSize:13, fontWeight:600, color:C.primary,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {session.name || "Topic TBD"}
            </p>
          </div>
          <StatusBadge status={status}/>
        </div>
      </div>

      <div style={{ padding:"14px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:3 }}>Date</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{fmtDate(session.scheduled_at)}</p>
            <p style={{ fontSize:10, color:isLive?"#16a34a":C.primary, fontWeight:600, marginTop:1 }}>
              {fmtDay(session.scheduled_at)}
            </p>
          </div>
          <div style={{ border:"1px solid #e8ecf0", borderRadius:10, padding:"10px 12px" }}>
            <p style={{ fontSize:10, color:C.lg, fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:3 }}>Time</p>
            <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{sessionTime}</p>
          </div>
        </div>

        {hasLink && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
            background:"#f0fdf4", borderRadius:8, marginBottom:10 }}>
            <Link size={11} style={{ color:"#16a34a" }}/>
            <span style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>
              {isComp ? "Recording linked" : "Session link added"}
            </span>
          </div>
        )}

        {/* Primary CTA */}
        {isComp ? (
          session.recording_url ? (
            <a href={mediaUrl(session.recording_url) || session.recording_url}
              target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                width:"100%", padding:"11px 0", textDecoration:"none",
                background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",
                color:"#fff", borderRadius:10, fontSize:13, fontWeight:700 }}>
              <PlayCircle size={15}/> View Recording
            </a>
          ) : (
            <button onClick={() => onLinkModal(session)}
              style={{ width:"100%", padding:"11px 0",
                background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",
                color:"#fff", border:"none", borderRadius:10, fontSize:13,
                fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              + Add Recording Link
            </button>
          )
        ) : hasLink ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
            <a href={session.zoom_link} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"11px 0", textDecoration:"none",
                background:`linear-gradient(135deg,${C.blue},${C.primary})`,
                color:"#fff", borderRadius:10, fontSize:13, fontWeight:700 }}>
              {isLive ? "⚡ " : ""}Start Session
            </a>
            <button onClick={() => onLinkModal(session)}
              style={{ padding:"11px 14px", border:`1.5px solid ${C.primary}`,
                borderRadius:10, background:"#fff", color:C.primary,
                fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Edit
            </button>
          </div>
        ) : (
          <button onClick={() => onLinkModal(session)}
            style={{ width:"100%", padding:"11px 0",
              background:`linear-gradient(135deg,${C.blue},${C.primary})`,
              color:"#fff", border:"none", borderRadius:10, fontSize:13,
              fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            + Add Session Link
          </button>
        )}

        {/* Assignment button: Edit if uploaded, Upload if not */}
        {assignment ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:6, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 12px",
              background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10 }}>
              <CheckCircle2 size={13} style={{ color:"#16a34a", flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:700, color:"#16a34a",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {assignment.title}
              </span>
            </div>
            <button onClick={() => onAssignmentUpload(session, assignment)}
              style={{ padding:"9px 12px", background:"#fff",
                border:"1.5px solid #d1d5db", borderRadius:10,
                fontSize:11, fontWeight:700, color:C.gray,
                cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.color=C.gray;}}>
              Edit
            </button>
          </div>
        ) : (
          <button onClick={() => onAssignmentUpload(session, null)}
            style={{ width:"100%", marginTop:8, padding:"9px 0",
              background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:10,
              fontSize:12, fontWeight:700, color:C.gray, cursor:"pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center",
              justifyContent:"center", gap:6, transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color=C.gray;}}>
            <BookOpen size={13}/> Upload Assignment
          </button>
        )}

        {/* Session query count — navigates to TutorQueriesPage filtered by this session */}
        <button onClick={() => onViewSessionQueries(session)}
          style={{ width:"100%", marginTop:6, padding:"8px 0",
            background: sessionQueryCount > 0 ? "#fff7ed" : "#f9fafb",
            border: `1.5px solid ${sessionQueryCount > 0 ? "#fed7aa" : "#e5e7eb"}`,
            borderRadius:10, fontSize:12, fontWeight:700,
            color: sessionQueryCount > 0 ? "#ea580c" : C.lg,
            cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <HelpCircle size={13}/>
          {sessionQueryCount > 0
            ? `${sessionQueryCount} Quer${sessionQueryCount===1?"y":"ies"} — View All`
            : "No queries yet"}
        </button>
      </div>
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function TutorSessionsPage() {
  const navigate   = useNavigate();
  const { batchId: urlBatchId } = useParams(); // set when navigated from /tutor/batches/:batchId/sessions

  const [batches,          setBatches]         = useState([]);
  const [selectedBatch,    setSelectedBatch]   = useState(null);
  const [sessions,         setSessions]        = useState([]);
  const [queries,          setQueries]         = useState([]);
  const [assignments,      setAssignments]     = useState([]); // tutor's assignments for this batch
  const [loadingBatches,   setLoadingBatches]  = useState(true);
  const [loadingSessions,  setLoadingSessions] = useState(false);
  const [filter,           setFilter]          = useState("ALL");
  const [answerQuery,      setAnswerQuery]     = useState(null);
  const [linkModalSession, setLinkModalSession]= useState(null);
  const [assignmentModal,  setAssignmentModal] = useState(null);

  useEffect(() => {
    batchApi.mine()
      .then(r => {
        const approved = (r.data||[]).filter(b => b.status !== "PENDING_APPROVAL");
        setBatches(approved);
        if (urlBatchId) {
          // Navigated from a specific batch card — auto-select that batch
          const match = approved.find(b => b.id === urlBatchId);
          setSelectedBatch(match || approved[0] || null);
        } else {
          setSelectedBatch(approved[0] || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBatches(false));
  }, [urlBatchId]);

  useEffect(() => {
    if (!selectedBatch) return;
    setLoadingSessions(true);
    setSessions([]); setQueries([]); setAssignments([]);
    Promise.all([
      sessionApi.getForBatch(selectedBatch.id),
      queryApi.getBatchQueries(selectedBatch.id).catch(() => ({ data:[] })),
      assignmentApi.getTutorBatch(selectedBatch.id).catch(() => ({ data:[] })),
    ]).then(([sessRes, queryRes, assignRes]) => {
      setSessions(sessRes.data || []);
      const sorted = (queryRes.data||[])
        .map(q => ({ ...q, batch_name:selectedBatch.name }))
        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      setQueries(sorted);
      setAssignments(assignRes.data || []);
    })
    .catch(console.error)
    .finally(() => setLoadingSessions(false));
  }, [selectedBatch]);

  const enriched = useMemo(() =>
    sessions.map(s => ({ ...s, _derivedStatus: deriveStatus(s) })), [sessions]);

  const completedCount  = enriched.filter(s => s._derivedStatus === "COMPLETED").length;
  const todayCount      = enriched.filter(s => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE").length;
  const upcomingCount   = enriched.filter(s => s._derivedStatus === "UPCOMING").length;
  const progressPct     = enriched.length > 0 ? Math.round((completedCount/enriched.length)*100) : 0;
  const unresolvedCount = queries.filter(q => q.status !== "RESOLVED").length;
  const ultraCount      = queries.filter(q => getQueryPriority(q) === "ultra").length;

  // Per-session open query counts for badges
  const sessionQueryCounts = useMemo(() => {
    const map = {};
    queries.filter(q => q.status !== "RESOLVED").forEach(q => {
      if (q.session_id) map[q.session_id] = (map[q.session_id]||0) + 1;
    });
    return map;
  }, [queries]);

  const handleViewSessionQueries = (session) => {
    navigate(`/tutor/queries?session_id=${session.id}&session_num=${session.session_number}&batch_id=${selectedBatch?.id||""}`);
  };

  const filtered = useMemo(() => {
    if (filter === "ALL")       return enriched;
    if (filter === "TODAY")     return enriched.filter(s => s._derivedStatus==="TODAY"||s._derivedStatus==="LIVE");
    if (filter === "UPCOMING")  return enriched.filter(s => s._derivedStatus==="UPCOMING");
    if (filter === "COMPLETED") return enriched.filter(s => s._derivedStatus==="COMPLETED");
    return enriched;
  }, [enriched, filter]);

  const grouped = useMemo(() => ({
    live:     enriched.filter(s=>s._derivedStatus==="LIVE"),
    today:    enriched.filter(s=>s._derivedStatus==="TODAY"),
    upcoming: enriched.filter(s=>s._derivedStatus==="UPCOMING"),
    completed:enriched.filter(s=>s._derivedStatus==="COMPLETED"),
  }), [enriched]);

  const timeSlots = selectedBatch?.time_slots || [];

  // Map session_id → assignment for "Edit vs Upload" logic
  const assignmentBySession = useMemo(() => {
    const map = {};
    assignments.forEach(a => { if (a.session_id) map[a.session_id] = a; });
    return map;
  }, [assignments]);

  const FILTERS = [
    { key:"ALL",       label:"All",       count:enriched.length },
    { key:"TODAY",     label:"Today",     count:todayCount,    hide:todayCount===0 },
    { key:"UPCOMING",  label:"Upcoming",  count:upcomingCount },
    { key:"COMPLETED", label:"Completed", count:completedCount },
  ];

  const handleAnswered = (queryId) => {
    setQueries(q => q.map(x => x.id===queryId ? {...x, status:"RESOLVED"} : x));
  };
  const handleLinkSaved = (sessionId, url) => {
    const sess = sessions.find(s=>s.id===sessionId);
    const field = sess?._derivedStatus==="COMPLETED" ? "recording_url" : "zoom_link";
    setSessions(prev => prev.map(s => s.id===sessionId ? {...s,[field]:url} : s));
  };

  const cardProps = { timeSlots, onLinkModal:setLinkModalSession,
    onAssignmentUpload: (session, assignment) => setAssignmentModal({ session, assignment }),
    onViewSessionQueries:handleViewSessionQueries,
    sessionQueryCounts, assignmentBySession };

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>My Sessions</h2>
          <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>
            Manage sessions · upload assignments · answer queries
          </p>
        </div>

        {/* Batch Selector */}
        {loadingBatches && (
          <div style={{ display:"flex", gap:12, marginBottom:24 }}>
            {[1,2].map(i=><div key={i} style={{ flexShrink:0,minWidth:200,height:100,
              borderRadius:16,background:"#f3f4f6" }} className="animate-pulse"/>)}
          </div>
        )}
        {!loadingBatches && batches.length===0 && (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e5e7eb",
            padding:56, textAlign:"center" }}>
            <Layers size={40} style={{ color:"#d1d5db", margin:"0 auto 12px" }}/>
            <p style={{ fontWeight:700, color:C.dark, marginBottom:6 }}>No approved batches yet</p>
            <p style={{ fontSize:13, color:C.lg }}>Create a batch and wait for admin approval.</p>
          </div>
        )}
        {!loadingBatches && batches.length>0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.lg, textTransform:"uppercase",
              letterSpacing:"0.8px", marginBottom:10 }}>Select Batch</p>
            <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:6 }}>
              {batches.map(b=>(
                <BatchSelectorCard key={b.id} batch={b} selected={selectedBatch}
                  onClick={()=>setSelectedBatch(b)}/>
              ))}
            </div>
          </div>
        )}

        {selectedBatch && (
          <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
            {/* LEFT — Sessions */}
            <div style={{ flex:1, minWidth:0 }}>
              {/* Filter tabs */}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {FILTERS.filter(f=>!f.hide).map(({ key,label,count }) => (
                  <button key={key} onClick={()=>setFilter(key)} style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"8px 14px", borderRadius:999,
                    border: filter===key ? "none" : "1.5px solid #e5e7eb",
                    background: filter===key ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff",
                    color: filter===key ? "#fff" : C.gray,
                    fontSize:12, fontWeight:700, cursor:"pointer",
                    boxShadow: filter===key ? `0 4px 14px rgba(0,123,191,0.25)` : "none" }}>
                    {label}
                    <span style={{ fontSize:10, fontWeight:800,
                      background: filter===key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                      color: filter===key ? "#fff" : C.gray,
                      padding:"1px 6px", borderRadius:999 }}>{count}</span>
                  </button>
                ))}
              </div>

              {loadingSessions && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[1,2,3].map(i=><div key={i} style={{ height:220,background:"#f3f4f6",
                    borderRadius:16 }} className="animate-pulse"/>)}
                </div>
              )}

              {!loadingSessions && filter==="ALL" && (
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {grouped.live.length>0 && (<div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Zap} label="Live Now" count={grouped.live.length} color="#16a34a"/>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      {grouped.live.map((s,i)=><SessionCard key={s.id} session={s} index={i}
                        sessionQueryCount={sessionQueryCounts[s.id]||0} {...cardProps}/>)}
                    </div></div>)}
                  {grouped.today.length>0 && (<div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Clock} label="Today" count={grouped.today.length} color="#ea580c"/>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      {grouped.today.map((s,i)=><SessionCard key={s.id} session={s} index={i}
                        sessionQueryCount={sessionQueryCounts[s.id]||0} {...cardProps}/>)}
                    </div></div>)}
                  {grouped.upcoming.length>0 && (<div style={{ marginBottom:16 }}>
                    <SectionLabel icon={Calendar} label="Upcoming" count={grouped.upcoming.length} color={C.primary}/>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      {grouped.upcoming.map((s,i)=><SessionCard key={s.id} session={s} index={i}
                        sessionQueryCount={sessionQueryCounts[s.id]||0} {...cardProps}/>)}
                    </div></div>)}
                  {grouped.completed.length>0 && (<div>
                    <SectionLabel icon={CheckCircle2} label="Completed" count={grouped.completed.length} color="#7c3aed"/>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      {grouped.completed.map((s,i)=><SessionCard key={s.id} session={s} index={i}
                        sessionQueryCount={sessionQueryCounts[s.id]||0} {...cardProps}/>)}
                    </div></div>)}
                  {enriched.length===0 && (
                    <div style={{ background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",
                      padding:56,textAlign:"center" }}>
                      <Calendar size={40} style={{ color:"#d1d5db",margin:"0 auto 12px" }}/>
                      <p style={{ fontWeight:700,color:C.dark,marginBottom:6 }}>No sessions yet</p>
                    </div>
                  )}
                </div>
              )}

              {!loadingSessions && filter!=="ALL" && (
                filtered.length===0 ? (
                  <div style={{ background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",
                    padding:40,textAlign:"center" }}>
                    <Calendar size={32} style={{ color:"#d1d5db",margin:"0 auto 10px" }}/>
                    <p style={{ fontSize:14,color:C.lg }}>No {filter.toLowerCase()} sessions</p>
                  </div>
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    {filtered.map((s,i)=><SessionCard key={s.id} session={s} index={i}
                      sessionQueryCount={sessionQueryCounts[s.id]||0} {...cardProps}/>)}
                  </div>
                )
              )}
            </div>

            {/* RIGHT PANEL */}
            <div style={{ width:272, flexShrink:0, position:"sticky", top:16,
              display:"flex", flexDirection:"column", gap:14 }}>
              {/* Progress */}
              <div style={{ background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",
                padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:12 }}>Course Progress</p>
                <div style={{ height:8,background:"#e5e7eb",borderRadius:4,overflow:"hidden",marginBottom:8 }}>
                  <motion.div style={{ height:"100%",borderRadius:4,
                    background:`linear-gradient(90deg,${C.blue},${C.primary})` }}
                    initial={{ width:0 }} animate={{ width:`${progressPct}%` }}
                    transition={{ duration:1.2, ease:[0.16,1,0.3,1] }}/>
                </div>
                <p style={{ fontSize:11,fontWeight:600,color:C.gray,marginBottom:12 }}>{progressPct}% completed</p>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {[
                    { val:completedCount, label:"Done",     bg:"#eff8ff", color:C.primary },
                    { val:enriched.length-completedCount, label:"Left", bg:"#f9fafb", color:C.dark },
                    { val:todayCount,     label:"Today",    bg:"#fff7ed", color:"#ea580c" },
                    { val:upcomingCount,  label:"Upcoming", bg:"#f5f3ff", color:"#7c3aed" },
                  ].map(({val,label,bg,color})=>(
                    <div key={label} style={{ textAlign:"center",padding:"10px 8px",borderRadius:12,background:bg }}>
                      <p style={{ fontSize:20,fontWeight:800,color }}>{val}</p>
                      <p style={{ fontSize:10,fontWeight:600,color:C.lg }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queries */}
              <div style={{ background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",
                padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                  <p style={{ fontSize:13,fontWeight:700,color:C.dark }}>Student Queries</p>
                  {unresolvedCount>0 && (
                    <span style={{ fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:999,
                      background:"#fef2f2",color:"#dc2626" }}>{unresolvedCount} open</span>
                  )}
                </div>
                {ultraCount>0 && (
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:10,
                    padding:"6px 10px",background:"#fef2f2",borderRadius:8 }}>
                    <Flame size={12} style={{ color:"#dc2626" }}/>
                    <span style={{ fontSize:11,fontWeight:700,color:"#dc2626" }}>
                      {ultraCount} urgent (2d+ unanswered)
                    </span>
                  </div>
                )}
                {queries.length===0 && (
                  <div style={{ textAlign:"center",padding:"24px 0" }}>
                    <HelpCircle size={28} style={{ color:"#d1d5db",margin:"0 auto 8px" }}/>
                    <p style={{ fontSize:12,color:C.lg }}>No queries yet</p>
                  </div>
                )}
                <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:480,overflowY:"auto" }}>
                  {queries.map((query,i)=>(
                    <QueryCard key={query.id} query={query} index={i}
                      onAnswer={q=>setAnswerQuery(q)}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {answerQuery && <AnswerModal query={answerQuery}
            onClose={()=>setAnswerQuery(null)} onAnswered={handleAnswered}/>}
          {linkModalSession && <LinkModal session={linkModalSession}
            onClose={()=>setLinkModalSession(null)}
            onSaved={url=>handleLinkSaved(linkModalSession.id, url)}/>}
          {assignmentModal && <UploadAssignmentModal
            session={assignmentModal.session}
            existingAssignment={assignmentModal.assignment}
            batchId={selectedBatch?.id}
            onClose={()=>setAssignmentModal(null)}
            onUploaded={() => {
              setAssignmentModal(null);
              // Reload assignments so Edit/Upload state refreshes
              if (selectedBatch) {
                assignmentApi.getTutorBatch(selectedBatch.id)
                  .then(r => setAssignments(r.data || []))
                  .catch(console.error);
              }
            }}/>}
        </AnimatePresence>
      </PageWrapper>
    </AppShell>
  );
}