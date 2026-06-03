import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { Modal, Textarea, Button, PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, sessionApi, queryApi, mediaUrl } from "../../services/api.js";
import { Plus, Paperclip, RefreshCw, MessageCircle, CheckCircle2, Clock, FileText, X } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function fmtDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStudentToken() {
  return localStorage.getItem("dct_student_access_token") || localStorage.getItem("dct_access_token") || "";
}

async function submitQueryWithAttachment({ batchId, sessionId, question, file }) {
  const fd = new FormData();
  fd.append("batch_id", batchId);
  if (sessionId) fd.append("session_id", sessionId);
  fd.append("question", question);
  if (file) fd.append("attachment", file);

  const token = getStudentToken();
  const res = await fetch(`${API_BASE}/queries`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to submit query.");
  return data;
}

function AskQueryModal({ isOpen, onClose, batches, selectedBatchId, onSubmitted }) {
  const [batchId, setBatchId] = useState(selectedBatchId || "");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isOpen) setBatchId(selectedBatchId || batches?.[0]?.id || "");
  }, [isOpen, selectedBatchId, batches]);

  useEffect(() => {
    if (!batchId) { setSessions([]); setSessionId(""); return; }
    sessionApi.getForBatch(batchId)
      .then((res) => setSessions(res.data || []))
      .catch(() => setSessions([]));
  }, [batchId]);

  const reset = () => {
    setSessionId("");
    setQuestion("");
    setFile(null);
    setErr("");
  };

  const submit = async () => {
    setErr("");
    if (!batchId) return setErr("Please select batch.");
    if (!sessionId) return setErr("Please select session.");
    if (!question.trim()) return setErr("Please write your query.");

    setLoading(true);
    try {
      await submitQueryWithAttachment({ batchId, sessionId, question: question.trim(), file });
      reset();
      onSubmitted?.();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a Query" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Batch</label>
          <select className="dct-input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Session Name</label>
          <select className="dct-input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">Select session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>Session {s.session_number}: {s.name}</option>
            ))}
          </select>
          <p className="text-xs text-dct-lightgray mt-1">Date is not required. Tutor will see the query raised date automatically.</p>
        </div>

        <Textarea
          label="Your Query"
          placeholder="Explain your doubt clearly. Mention what you tried and where you are stuck."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={5}
        />

        <label className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-dct-primary transition-colors">
          <Paperclip size={22} className="text-dct-primary" />
          <span className="text-sm font-semibold text-dct-dark">{file ? file.name : "Attach screenshot / video / PDF / ZIP"}</span>
          <span className="text-xs text-dct-lightgray">Optional. Max 50MB.</span>
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {file && (
          <button type="button" onClick={() => setFile(null)} className="text-xs text-red-600 font-semibold flex items-center gap-1">
            <X size={12} /> Remove attachment
          </button>
        )}

        {err && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">{err}</div>}
        <Button fullWidth onClick={submit} disabled={loading}>{loading ? "Submitting..." : "Submit Query"}</Button>
      </div>
    </Modal>
  );
}

function QueryCard({ q, index }) {
  const isResolved = q.status === "RESOLVED";
  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,.05)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold text-dct-primary">{q.batch?.name || "Batch"}</p>
          <h3 className="font-extrabold text-dct-dark mt-1">{q.session ? `Session ${q.session.session_number}: ${q.session.name}` : "General Query"}</h3>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isResolved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{isResolved ? "Resolved" : "Open"}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-dct-lightgray mb-3">
        <Clock size={12} /> Raised: {fmtDateTime(q.created_at)}
      </div>

      <p className="text-sm text-dct-dark leading-relaxed whitespace-pre-line mb-3">{q.question}</p>

      {q.attachment_url && (
        <button onClick={() => window.open(mediaUrl(q.attachment_url), "_blank")} className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-dct-primary bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <FileText size={13} /> Open Attachment
        </button>
      )}

      {q.answer ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-3">
          <div className="flex items-center gap-2 mb-2 text-green-700 font-bold text-xs"><CheckCircle2 size={14}/> Tutor Answer</div>
          <p className="text-sm text-green-900 whitespace-pre-line">{q.answer}</p>
          {q.answered_at && <p className="text-[11px] text-green-700 mt-2">Answered: {fmtDateTime(q.answered_at)}</p>}
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700 font-semibold">Tutor has not answered yet.</div>
      )}
    </motion.div>
  );
}

export default function MyQueriesPage() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [queries, setQueries] = useState([]);
  const [askOpen, setAskOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBatches = async () => {
    const res = await batchApi.enrolled();
    const list = (res.data || []).map((e) => e.batch).filter(Boolean);
    setBatches(list);
    if (!batchId && list[0]) setBatchId(list[0].id);
    return list;
  };

  const loadQueries = async (id = batchId) => {
    if (!id) return;
    const res = await queryApi.mine(id);
    setQueries(res.data || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await loadBatches();
      const id = batchId || list[0]?.id || "";
      if (id) await loadQueries(id);
    } catch (e) {
      setError(e.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (batchId) loadQueries(batchId).catch((e) => setError(e.message)); }, [batchId]);

  const openCount = useMemo(() => queries.filter(q => q.status !== "RESOLVED").length, [queries]);
  const resolvedCount = queries.length - openCount;

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">My Queries</h1>
            <p className="text-sm text-dct-gray">Raise session-wise doubts and track tutor answers</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} className="px-4 py-2 rounded-xl border bg-white text-sm font-bold flex items-center gap-2"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh</button>
            <Button onClick={() => setAskOpen(true)} size="sm"><Plus size={14} className="mr-1.5" /> Ask Query</Button>
          </div>
        </div>

        {batches.length > 0 && (
          <select className="dct-input max-w-md mb-5" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 max-w-xl">
          <div className="bg-white border rounded-2xl p-4"><p className="text-xl font-black text-dct-dark">{queries.length}</p><p className="text-xs text-dct-lightgray">Total Queries</p></div>
          <div className="bg-white border rounded-2xl p-4"><p className="text-xl font-black text-orange-600">{openCount}</p><p className="text-xs text-dct-lightgray">Open</p></div>
          <div className="bg-white border rounded-2xl p-4"><p className="text-xl font-black text-green-600">{resolvedCount}</p><p className="text-xs text-dct-lightgray">Resolved</p></div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">{error}</div>}
        {loading ? <p className="text-sm text-dct-gray">Loading...</p> : queries.length === 0 ? (
          <div className="bg-white rounded-2xl border p-14 text-center">
            <MessageCircle size={42} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-dct-dark mb-1">No queries yet</p>
            <p className="text-sm text-dct-lightgray mb-5">Ask your first session-wise doubt.</p>
            <Button onClick={() => setAskOpen(true)}>Ask Query</Button>
          </div>
        ) : (
          <div className="max-w-4xl space-y-4">
            {queries.map((q, i) => <QueryCard key={q.id} q={q} index={i} />)}
          </div>
        )}

        <AskQueryModal isOpen={askOpen} onClose={() => setAskOpen(false)} batches={batches} selectedBatchId={batchId} onSubmitted={() => loadQueries(batchId)} />
      </PageWrapper>
    </AppShell>
  );
}
