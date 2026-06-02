import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper, Modal, Textarea, Button } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi, queryApi } from "../../services/api.js";
import { Plus, X, Send, CheckCircle2, Clock, HelpCircle, RefreshCw, MessageCircle, Filter } from "lucide-react";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#9ca3af" };

function fmtRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function AskQueryModal({ isOpen, batches, selectedBatchId, sessionId, onClose, onSubmitted }) {
  const [batchId, setBatchId] = useState(selectedBatchId || "");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { setBatchId(selectedBatchId || batches[0]?.id || ""); }, [selectedBatchId, batches]);

  const submit = async () => {
    if (!batchId) return setErr("Select a batch.");
    if (!question.trim()) return setErr("Please write your question.");
    setLoading(true);
    setErr("");
    try {
      await queryApi.create({ batch_id: batchId, session_id: sessionId || undefined, question: question.trim() });
      setQuestion("");
      onSubmitted();
      onClose();
    } catch(e) {
      setErr(e.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a Query" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {batches.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-dct-dark mb-1.5">Batch</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} className="dct-input">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <Textarea label="Your Question" value={question} onChange={e => setQuestion(e.target.value)} rows={6} placeholder="Describe your doubt clearly..." />
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <Button onClick={submit} disabled={loading} variant="primary">
          {loading ? "Submitting..." : <span className="inline-flex items-center gap-2"><Send size={15}/> Submit Query</span>}
        </Button>
      </div>
    </Modal>
  );
}

function QueryCard({ query, number, index }) {
  const resolved = query.status === "RESOLVED";
  const answered = !!query.answer;

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:index*0.05 }} style={{ marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${C.blue},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>#{number}</span>
        </div>
        <p style={{ fontSize:12, fontWeight:700, color:C.gray, flex:1 }}>
          {query.session ? `Session ${query.session.session_number}: ${query.session.name}` : "General Query"}
        </p>
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999, background:resolved ? "#f0fdf4" : answered ? "#eff8ff" : "#fff7ed", color:resolved ? "#16a34a" : answered ? C.primary : "#ea580c" }}>
          {resolved ? "Resolved" : answered ? "Answered" : "Waiting"}
        </span>
      </div>

      <div style={{ background:"#fff", borderRadius:"4px 18px 18px 18px", border:"1px solid #e5e7eb", padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", marginBottom:answered ? 10 : 0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.dark }}>You</span>
          <span style={{ fontSize:10, color:C.lg }}>{fmtRelative(query.created_at)}</span>
        </div>
        <p style={{ fontSize:14, color:C.dark, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{query.question}</p>
      </div>

      {answered ? (
        <div style={{ marginLeft:24 }}>
          <div style={{ background:"linear-gradient(135deg,#eff8ff,#e0f0ff)", borderRadius:"18px 18px 18px 4px", border:"1px solid #bfdbfe", padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,123,191,0.08)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.blue }}>Tutor Reply</span>
              <span style={{ fontSize:10, color:C.lg }}>{fmtRelative(query.answered_at)}</span>
            </div>
            <p style={{ fontSize:14, color:C.dark, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{query.answer}</p>
            {resolved && <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}><CheckCircle2 size={13} style={{ color:"#16a34a" }}/><span style={{ fontSize:11, fontWeight:600, color:"#16a34a" }}>Resolved</span></div>}
          </div>
        </div>
      ) : (
        <div style={{ marginLeft:24, display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#fafafa", borderRadius:10, border:"1px dashed #e5e7eb" }}>
          <Clock size={12} style={{ color:C.lg }}/><span style={{ fontSize:11, color:C.lg }}>Waiting for tutor reply...</span>
        </div>
      )}
    </motion.div>
  );
}

export default function MyQueriesPage() {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get("session_id") || "";
  const urlSessionNum = searchParams.get("session_num") || "";

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState(urlSessionId);
  const [err, setErr] = useState("");

  useEffect(() => {
    batchApi.enrolled()
      .then(res => {
        const list = (res.data || []).map(e => e.batch).filter(Boolean);
        setBatches(list);
        if (list.length > 0) setSelectedBatch(list[0]);
        else setLoading(false);
      })
      .catch(e => { setErr(e.message || "Failed to load batches."); setLoading(false); });
  }, []);

  const loadQueries = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    setErr("");
    try {
      const res = await queryApi.mine(selectedBatch.id);
      setQueries((res.data || []).reverse());
    } catch(e) {
      setErr(e.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueries(); }, [selectedBatch]);

  const filtered = useMemo(() => {
    let q = queries;
    if (sessionFilter) q = q.filter(x => x.session_id === sessionFilter);
    if (filter === "OPEN") return q.filter(x => !x.answer && x.status !== "RESOLVED");
    if (filter === "ANSWERED") return q.filter(x => x.answer && x.status !== "RESOLVED");
    if (filter === "RESOLVED") return q.filter(x => x.status === "RESOLVED");
    return q;
  }, [queries, filter, sessionFilter]);

  const openCount = queries.filter(q => !q.answer && q.status !== "RESOLVED").length;
  const answeredCount = queries.filter(q => q.answer && q.status !== "RESOLVED").length;
  const resolvedCount = queries.filter(q => q.status === "RESOLVED").length;

  const FILTERS = [
    { key:"ALL", label:"All", count:queries.length },
    { key:"OPEN", label:"Waiting", count:openCount },
    { key:"ANSWERED", label:"Answered", count:answeredCount },
    { key:"RESOLVED", label:"Resolved", count:resolvedCount },
  ];

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.dark }}>My Queries</h2>
            <p style={{ fontSize:13, color:C.lg, marginTop:2 }}>{queries.length} total · {openCount} waiting for reply</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadQueries} className="p-2.5 rounded-xl border border-gray-200 bg-white"><RefreshCw size={16} className={loading ? "animate-spin" : ""} style={{ color:C.gray }}/></button>
            <button onClick={() => setAskOpen(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:14, background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 14px rgba(0,123,191,0.3)` }}>
              <Plus size={15}/> Ask Query
            </button>
          </div>
        </div>

        {err && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">{err}</div>}

        {sessionFilter && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#eff8ff", borderRadius:12, border:"1px solid #bfdbfe", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Filter size={14} style={{ color:C.primary }}/><span style={{ fontSize:13, fontWeight:700, color:C.blue }}>Showing queries for Session {urlSessionNum || ""}</span>
            </div>
            <button onClick={() => setSessionFilter("")} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:C.gray, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}><X size={13}/> Show all</button>
          </div>
        )}

        {batches.length > 1 && (
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20 }}>
            {batches.map(b => {
              const isSel = selectedBatch?.id === b.id;
              return <button key={b.id} onClick={() => setSelectedBatch(b)} style={{ flexShrink:0, padding:"6px 14px", borderRadius:999, border:isSel ? "none" : "1.5px solid #e5e7eb", background:isSel ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff", color:isSel ? "#fff" : C.gray, fontSize:12, fontWeight:700, cursor:"pointer" }}>{b.name}</button>;
            })}
          </div>
        )}

        {queries.length > 0 && (
          <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto" }}>
            {FILTERS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilter(key)} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:999, cursor:"pointer", border:filter===key ? "none" : "1.5px solid #e5e7eb", background:filter===key ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#fff", color:filter===key ? "#fff" : C.gray, fontSize:12, fontWeight:700 }}>
                {label} <span style={{ opacity:0.75 }}>({count})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 h-32 animate-pulse" />) :
          filtered.map((q, i) => <QueryCard key={q.id} query={q} number={i+1} index={i}/>)}

        {!loading && filtered.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px", textAlign:"center" }}>
            <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg,#eff8ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
              <MessageCircle size={36} style={{ color:C.primary }}/>
            </div>
            <h3 style={{ fontSize:18, fontWeight:800, color:C.dark, marginBottom:8 }}>No queries yet</h3>
            <p style={{ fontSize:14, color:C.lg, lineHeight:1.6, maxWidth:260, marginBottom:28 }}>Got a doubt? Ask your tutor and get a reply.</p>
            <button onClick={() => setAskOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"13px 24px", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}><Plus size={16}/> Ask Query</button>
          </div>
        )}

        <AskQueryModal isOpen={askOpen} batches={batches} selectedBatchId={selectedBatch?.id} sessionId={sessionFilter} onClose={() => setAskOpen(false)} onSubmitted={loadQueries} />
      </PageWrapper>
    </AppShell>
  );
}
