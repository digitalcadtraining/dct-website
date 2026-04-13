/**
 * MyQueriesPage.jsx — Real API, mobile-first
 * - Reads ?session_id=... from URL (navigated from session card badge)
 * - Shows session filter banner with clear button
 * - Chat-bubble layout: your question / tutor reply
 * - Ask query with optional photo/video attachment
 * - Mark Resolved button after tutor replies
 * - Query numbered #1 #2 automatically
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { batchApi, queryApi } from "../../services/api.js";
import { mediaUrl } from "../../services/api.js";
import {
  Plus, X, Send, CheckCircle2, HelpCircle,
  Clock, Image, Video, AlertCircle,
  RefreshCw, MessageCircle, Flame, AlertTriangle, Minus,
  PlayCircle, Filter,
} from "lucide-react";

const C = {
  dark:"#1F1A17", blue:"#024981", primary:"#007BBF",
  gray:"#6A6B6D", lg:"#9ca3af",
};

/* ─── Helpers ──────────────────────────────────────────────── */
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

function getStatus(query) {
  if (query.status === "RESOLVED") return "resolved";
  if (query.answer) return "answered";
  return "open";
}

/* ─── Ask Query Sheet (bottom-sheet) ──────────────────────── */
function AskQuerySheet({ batches, selectedBatchId, sessionId, queryNumber, onClose, onSubmitted }) {
  const [batchId,   setBatchId]   = useState(selectedBatchId || batches[0]?.id || "");
  const [question,  setQuestion]  = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMediaFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const isVideo = preview && mediaFile?.type?.startsWith("video/");

  const handleSubmit = async () => {
    if (!question.trim()) return setErr("Please write your query.");
    if (!batchId)          return setErr("Select a batch.");
    setLoading(true); setErr("");
    try {
      await queryApi.create(
        { batch_id:batchId, session_id:sessionId||undefined, question:question.trim() },
        mediaFile||undefined
      );
      onSubmitted(); onClose();
    } catch(e) { setErr(e.message || "Failed to submit."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, display:"flex",
      flexDirection:"column", justifyContent:"flex-end" }}>
      <motion.div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)",
        backdropFilter:"blur(3px)" }}
        initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose}/>
      <motion.div style={{ position:"relative", background:"#fff",
        borderRadius:"24px 24px 0 0", maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.15)", zIndex:10 }}
        initial={{ y:"100%" }} animate={{ y:0 }}
        transition={{ type:"spring", stiffness:300, damping:32 }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:"#e5e7eb" }}/>
        </div>
        <div style={{ padding:"0 20px 32px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:`linear-gradient(135deg,${C.blue},${C.primary})`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <HelpCircle size={16} style={{ color:"#fff" }}/>
              </div>
              <div>
                <p style={{ fontSize:16, fontWeight:800, color:C.dark }}>Ask a Query</p>
                <p style={{ fontSize:11, color:C.lg }}>Query #{queryNumber}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10,
              border:"none", background:"#f3f4f6", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={14} style={{ color:C.gray }}/>
            </button>
          </div>

          {batches.length > 1 && (
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
                marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Batch</label>
              <select value={batchId} onChange={e=>setBatchId(e.target.value)}
                style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e7eb",
                  borderRadius:12, fontSize:13, outline:"none", fontFamily:"inherit",
                  color:C.dark, background:"#fff", boxSizing:"border-box" }}>
                {batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
              marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Your Question</label>
            <textarea value={question} onChange={e=>setQuestion(e.target.value)}
              placeholder="Describe your doubt clearly so the tutor can help you better…" rows={5}
              style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e5e7eb",
                borderRadius:14, fontSize:14, resize:"none", outline:"none",
                fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box", color:C.dark }}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            <p style={{ fontSize:11, color:C.lg, marginTop:4 }}>
              {question.length} chars
            </p>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gray,
              marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px" }}>
              Attach Photo / Video <span style={{ fontWeight:400 }}>(optional)</span>
            </label>
            {preview ? (
              <div style={{ position:"relative", display:"inline-block", marginBottom:8 }}>
                {isVideo
                  ? <video src={preview} controls style={{ maxWidth:"100%", maxHeight:160,
                      borderRadius:12, display:"block", border:"1px solid #e5e7eb" }}/>
                  : <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:180,
                      borderRadius:12, display:"block", border:"1px solid #e5e7eb", objectFit:"cover" }}/>}
                <button onClick={()=>{setMediaFile(null);setPreview(null);}}
                  style={{ position:"absolute", top:6, right:6, width:24, height:24,
                    borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"none",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <X size={11} style={{ color:"#fff" }}/>
                </button>
              </div>
            ) : (
              <button onClick={()=>fileRef.current?.click()}
                style={{ width:"100%", padding:"18px 14px", border:"2px dashed #d1d5db",
                  borderRadius:14, background:"#fafafa", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  gap:12, marginBottom:8, boxSizing:"border-box" }}>
                <Image size={20} style={{ color:C.lg }}/>
                <Video size={20} style={{ color:C.lg }}/>
                <span style={{ fontSize:13, color:C.lg }}>Tap to attach photo or video</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,video/*"
              capture="environment" style={{ display:"none" }} onChange={handleFile}/>
          </div>

          {err && (
            <div style={{ display:"flex", gap:6, alignItems:"center",
              padding:"10px 12px", background:"#fef2f2", borderRadius:10, marginBottom:10 }}>
              <AlertCircle size={13} style={{ color:"#dc2626", flexShrink:0 }}/>
              <span style={{ fontSize:12, color:"#dc2626" }}>{err}</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading||!question.trim()}
            style={{ width:"100%", padding:"15px 0",
              background: loading||!question.trim() ? "#e5e7eb"
                : `linear-gradient(135deg,${C.blue},${C.primary})`,
              color: loading||!question.trim() ? C.lg : "#fff",
              border:"none", borderRadius:14, fontSize:15, fontWeight:800,
              cursor: loading||!question.trim() ? "not-allowed" : "pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center",
              justifyContent:"center", gap:8 }}>
            {loading
              ? <><RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }}/> Submitting…</>
              : <><Send size={16}/> Submit Query #{queryNumber}</>}
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Query Card — chat bubble style ──────────────────────── */
function QueryCard({ query, number, onResolve, index }) {
  const st       = getStatus(query);
  const [resolving, setResolving] = useState(false);
  const [resolved,  setResolved]  = useState(query.status === "RESOLVED");

  const attachUrl = mediaUrl(query.media_url);
  const isVideo   = query.media_url &&
    (query.media_url.match(/\.(mp4|mov|webm|avi)$/i) || query.media_url.includes("video"));

  const handleResolve = async () => {
    setResolving(true);
    try {
      await queryApi.resolve(query.id);
      setResolved(true);
      onResolve?.(query.id);
    } catch(e) { console.error(e); }
    finally { setResolving(false); }
  };

  const effectiveSt = resolved ? "resolved" : st;

  const STATUS_COLORS = {
    open:     { bg:"#fff7ed", color:"#ea580c", label:"Waiting" },
    answered: { bg:"#eff8ff", color:C.primary, label:"Answered" },
    resolved: { bg:"#f0fdf4", color:"#16a34a", label:"Resolved" },
  };
  const sc = STATUS_COLORS[effectiveSt] || STATUS_COLORS.open;

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.07 }}
      style={{ marginBottom:24 }}>

      {/* Query number + session label */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:28, height:28, borderRadius:8,
          background:`linear-gradient(135deg,${C.blue},${C.primary})`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>#{number}</span>
        </div>
        <p style={{ fontSize:12, fontWeight:700, color:C.gray, flex:1 }}>
          {query.session
            ? `Session ${query.session.session_number}: ${query.session.name}`
            : "General Query"}
        </p>
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999,
          background:sc.bg, color:sc.color }}>
          {sc.label}
        </span>
      </div>

      {/* Your question bubble */}
      <div style={{ background:"#fff", borderRadius:"4px 18px 18px 18px",
        border:"1px solid #e5e7eb", padding:"14px 16px",
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)", marginBottom:query.answer ? 10 : 0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.blue},${C.primary})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>You</div>
            <span style={{ fontSize:12, fontWeight:700, color:C.dark }}>You</span>
          </div>
          <span style={{ fontSize:10, color:C.lg }}>{fmtRelative(query.created_at)}</span>
        </div>
        <p style={{ fontSize:14, color:C.dark, lineHeight:1.65, whiteSpace:"pre-wrap" }}>
          {query.question}
        </p>
        {/* Attached media */}
        {attachUrl && (
          <div style={{ marginTop:10, borderRadius:12, overflow:"hidden",
            maxWidth:220, border:"1px solid #e5e7eb" }}>
            {isVideo
              ? <video src={attachUrl} controls style={{ width:"100%", maxHeight:160,
                  display:"block", background:"#000" }}/>
              : <img src={attachUrl} alt="attachment"
                  style={{ width:"100%", maxHeight:200, objectFit:"cover", display:"block" }}
                  onError={e=>e.target.style.display="none"}/>}
          </div>
        )}
      </div>

      {/* Tutor reply bubble */}
      {query.answer && (
        <div style={{ marginLeft:24 }}>
          <div style={{ background:"linear-gradient(135deg,#eff8ff,#e0f0ff)",
            borderRadius:"18px 18px 18px 4px", border:"1px solid #bfdbfe",
            padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,123,191,0.08)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:"50%",
                  background:`linear-gradient(135deg,#003C6E,${C.blue})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>T</div>
                <span style={{ fontSize:12, fontWeight:700, color:C.blue }}>Tutor Reply</span>
              </div>
              <span style={{ fontSize:10, color:C.lg }}>{fmtRelative(query.answered_at)}</span>
            </div>
            <p style={{ fontSize:14, color:C.dark, lineHeight:1.65, whiteSpace:"pre-wrap" }}>
              {query.answer}
            </p>

            {/* Resolve action */}
            {!resolved && (
              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #bfdbfe",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                flexWrap:"wrap", gap:8 }}>
                <p style={{ fontSize:11, color:C.gray }}>Did this answer your question?</p>
                <button onClick={handleResolve} disabled={resolving}
                  style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"7px 14px", borderRadius:999,
                    background: resolving ? "#e5e7eb" : "#f0fdf4",
                    border:`1.5px solid ${resolving ? "#e5e7eb" : "#86efac"}`,
                    color: resolving ? C.lg : "#16a34a",
                    fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  <CheckCircle2 size={13}/>
                  {resolving ? "Marking…" : "Mark Resolved"}
                </button>
              </div>
            )}
            {resolved && (
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={13} style={{ color:"#16a34a" }}/>
                <span style={{ fontSize:11, fontWeight:600, color:"#16a34a" }}>
                  You marked this resolved
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiting indicator */}
      {!query.answer && (
        <div style={{ marginLeft:24, display:"flex", alignItems:"center", gap:6,
          padding:"8px 14px", background:"#fafafa", borderRadius:10,
          border:"1px dashed #e5e7eb" }}>
          <Clock size={12} style={{ color:C.lg }}/>
          <span style={{ fontSize:11, color:C.lg }}>Waiting for tutor's reply…</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Empty State ──────────────────────────────────────────── */
function EmptyState({ onAsk }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"48px 24px", textAlign:"center" }}>
      <div style={{ width:80, height:80, borderRadius:24,
        background:"linear-gradient(135deg,#eff8ff,#dbeafe)",
        display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
        <MessageCircle size={36} style={{ color:C.primary }}/>
      </div>
      <h3 style={{ fontSize:18, fontWeight:800, color:C.dark, marginBottom:8 }}>
        No queries yet
      </h3>
      <p style={{ fontSize:14, color:C.lg, lineHeight:1.6, maxWidth:260, marginBottom:28 }}>
        Got a doubt? Ask your tutor and get a reply.
      </p>
      <button onClick={onAsk}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"13px 24px",
          background:`linear-gradient(135deg,${C.blue},${C.primary})`,
          color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:700,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 6px 20px rgba(0,123,191,0.3)` }}>
        <Plus size={16}/> Ask Your First Query
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function MyQueriesPage() {
  const [searchParams]  = useSearchParams();
  const urlSessionId    = searchParams.get("session_id")  || "";
  const urlSessionNum   = searchParams.get("session_num") || "";

  const [batches,       setBatches]       = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [queries,       setQueries]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [askOpen,       setAskOpen]       = useState(false);
  const [filter,        setFilter]        = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState(urlSessionId);

  /* Load batches */
  useEffect(() => {
    batchApi.enrolled()
      .then(res => {
        const list = (res.data||[]).map(e=>e.batch).filter(Boolean);
        setBatches(list);
        if (list.length > 0) setSelectedBatch(list[0]);
      })
      .catch(console.error);
  }, []);

  /* Load queries */
  useEffect(() => {
    if (!selectedBatch) return;
    setLoading(true);
    queryApi.mine(selectedBatch.id)
      .then(res => setQueries((res.data||[]).reverse())) // oldest first for numbering
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBatch]);

  const onSubmitted = () => {
    if (!selectedBatch) return;
    queryApi.mine(selectedBatch.id)
      .then(res => setQueries((res.data||[]).reverse()))
      .catch(console.error);
  };

  const onResolved = (id) => {
    setQueries(prev => prev.map(q => q.id===id ? {...q, status:"RESOLVED"} : q));
  };

  /* Apply filters */
  const filtered = useMemo(() => {
    let q = queries;
    if (sessionFilter) q = q.filter(x => x.session_id === sessionFilter);
    if (filter === "OPEN")     return q.filter(x => !x.answer && x.status !== "RESOLVED");
    if (filter === "ANSWERED") return q.filter(x =>  x.answer && x.status !== "RESOLVED");
    if (filter === "RESOLVED") return q.filter(x =>  x.status === "RESOLVED");
    return q; // ALL
  }, [queries, filter, sessionFilter]);

  /* Stats */
  const openCount     = queries.filter(q => !q.answer && q.status !== "RESOLVED").length;
  const answeredCount = queries.filter(q =>  q.answer && q.status !== "RESOLVED").length;
  const resolvedCount = queries.filter(q =>  q.status === "RESOLVED").length;

  const FILTERS = [
    { key:"ALL",      label:"All",      count:queries.length },
    { key:"OPEN",     label:"Waiting",  count:openCount,     hide:openCount===0 },
    { key:"ANSWERED", label:"Answered", count:answeredCount, hide:answeredCount===0 },
    { key:"RESOLVED", label:"Resolved", count:resolvedCount, hide:resolvedCount===0 },
  ];

  return (
    <AppShell>
      <PageWrapper>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>My Queries</h2>
            <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>
              {queries.length} total · {openCount} waiting for reply
            </p>
          </div>
          {queries.length > 0 && (
            <button onClick={() => setAskOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"10px 18px", borderRadius:14,
                background:`linear-gradient(135deg,${C.blue},${C.primary})`,
                color:"#fff", border:"none", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 4px 14px rgba(0,123,191,0.3)` }}>
              <Plus size={15}/> Ask Query #{queries.length + 1}
            </button>
          )}
        </div>

        {/* Session filter banner */}
        {sessionFilter && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", background:"#eff8ff", borderRadius:12,
            border:"1px solid #bfdbfe", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Filter size={14} style={{ color:C.primary }}/>
              <span style={{ fontSize:13, fontWeight:700, color:C.blue }}>
                Showing queries for Session {urlSessionNum} only
              </span>
            </div>
            <button onClick={() => setSessionFilter("")}
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:11,
                fontWeight:700, color:C.gray, background:"none", border:"none",
                cursor:"pointer", fontFamily:"inherit" }}>
              <X size={13}/> Show all
            </button>
          </div>
        )}

        {/* Batch pills */}
        {batches.length > 1 && (
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20 }}>
            {batches.map(b => {
              const isSel = selectedBatch?.id === b.id;
              return (
                <button key={b.id} onClick={() => setSelectedBatch(b)}
                  style={{ flexShrink:0, padding:"6px 14px", borderRadius:999,
                    border: isSel ? "none" : "1.5px solid #e5e7eb",
                    background: isSel ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff",
                    color: isSel ? "#fff" : C.gray, fontSize:12, fontWeight:700, cursor:"pointer",
                    boxShadow: isSel ? `0 3px 12px rgba(0,123,191,0.25)` : "none" }}>
                  {b.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {queries.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
            gap:10, marginBottom:20 }}>
            {[
              { val:openCount,     label:"Waiting",  bg:"#fff7ed", color:"#ea580c" },
              { val:answeredCount, label:"Answered",  bg:"#eff8ff", color:C.primary },
              { val:resolvedCount, label:"Resolved",  bg:"#f0fdf4", color:"#16a34a" },
            ].map(({ val,label,bg,color }) => (
              <div key={label} style={{ textAlign:"center", padding:"12px 8px",
                borderRadius:14, background:bg }}>
                <p style={{ fontSize:22, fontWeight:800, color }}>{val}</p>
                <p style={{ fontSize:10, fontWeight:600, color, opacity:0.75 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter pills */}
        {queries.length > 0 && (
          <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto" }}>
            {FILTERS.filter(f => !f.hide).map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5,
                  padding:"7px 14px", borderRadius:999, cursor:"pointer",
                  border: filter===key ? "none" : "1.5px solid #e5e7eb",
                  background: filter===key
                    ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff",
                  color: filter===key ? "#fff" : C.gray,
                  fontSize:12, fontWeight:700,
                  boxShadow: filter===key ? `0 3px 12px rgba(0,123,191,0.25)` : "none" }}>
                {label}
                <span style={{ fontSize:10, fontWeight:800,
                  background: filter===key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                  color: filter===key ? "#fff" : C.gray,
                  padding:"1px 6px", borderRadius:999 }}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[1,2].map(i=>(
              <div key={i} style={{ height:160, background:"#f3f4f6", borderRadius:18 }}
                className="animate-pulse"/>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && queries.length === 0 && (
          <EmptyState onAsk={() => setAskOpen(true)}/>
        )}

        {/* Query list */}
        {!loading && filtered.length > 0 && (
          <div>
            {filtered.map((q, i) => (
              <QueryCard key={q.id} query={q}
                number={queries.indexOf(q) + 1}
                onResolve={onResolved}
                index={i}/>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && queries.length > 0 && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <p style={{ fontSize:14, color:C.lg }}>
              No {filter.toLowerCase()} queries
              {sessionFilter ? ` for Session ${urlSessionNum}` : ""}
            </p>
          </div>
        )}
      </PageWrapper>

      {/* Ask sheet */}
      <AnimatePresence>
        {askOpen && (
          <AskQuerySheet
            batches={batches}
            selectedBatchId={selectedBatch?.id}
            sessionId={sessionFilter || undefined}
            queryNumber={queries.length + 1}
            onClose={() => setAskOpen(false)}
            onSubmitted={onSubmitted}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}