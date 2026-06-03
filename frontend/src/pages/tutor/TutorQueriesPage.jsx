import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { Modal, Textarea, Button, PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, queryApi, mediaUrl } from "../../services/api.js";
import { HelpCircle, RefreshCw, Send, Paperclip, Clock, User, CheckCircle2, MessageSquare } from "lucide-react";

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

function AnswerModal({ q, onClose, onDone }) {
  const [ans, setAns] = useState(q?.answer || "");
  const [loading, setLoading] = useState(false);
  if (!q) return null;

  const save = async () => {
    if (!ans.trim()) return;
    setLoading(true);
    try {
      await queryApi.answer(q.id, ans.trim());
      onDone();
      onClose();
    } catch (e) {
      alert(e.message || "Failed to answer query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!q} onClose={onClose} title="Answer Student Query" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="text-xs font-bold text-dct-primary">{q.session ? `Session ${q.session.session_number}: ${q.session.name}` : "General Query"}</p>
            <p className="text-xs text-dct-gray">Raised: {fmtDateTime(q.created_at)}</p>
          </div>
          <p className="text-sm text-dct-dark whitespace-pre-line">{q.question}</p>
          {q.attachment_url && (
            <button onClick={() => window.open(mediaUrl(q.attachment_url), "_blank")} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-dct-primary bg-white border border-blue-100 rounded-xl px-3 py-2">
              <Paperclip size={13} /> Open Student Attachment
            </button>
          )}
        </div>
        <Textarea label="Tutor Answer" value={ans} onChange={(e) => setAns(e.target.value)} rows={6} placeholder="Give a clear step-by-step answer..." />
        <Button fullWidth onClick={save} disabled={loading || !ans.trim()}>{loading ? "Sending..." : "Send Answer & Mark Resolved"}</Button>
      </div>
    </Modal>
  );
}

function QueryCard({ q, onAnswer }) {
  const resolved = q.status === "RESOLVED";
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-dct-primary text-white flex items-center justify-center font-black flex-shrink-0">
            {q.student?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-dct-dark truncate">{q.student?.name || "Student"}</p>
            <p className="text-xs text-dct-lightgray truncate">{q.student?.email || q.student?.phone || "—"}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${resolved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{resolved ? "Resolved" : "Open"}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase font-bold text-dct-lightgray">Session</p>
          <p className="text-xs font-bold text-dct-dark">{q.session ? `Session ${q.session.session_number}: ${q.session.name}` : "General Query"}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase font-bold text-dct-lightgray">Raised On</p>
          <p className="text-xs font-bold text-dct-dark">{fmtDateTime(q.created_at)}</p>
        </div>
      </div>

      <p className="text-sm text-dct-dark whitespace-pre-line mb-3">{q.question}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {q.attachment_url && (
          <button onClick={() => window.open(mediaUrl(q.attachment_url), "_blank")} className="inline-flex items-center gap-1.5 text-xs font-bold text-dct-primary bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Paperclip size={13} /> Attachment
          </button>
        )}
        {!resolved && (
          <button onClick={() => onAnswer(q)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-dct-primary rounded-xl px-3 py-2">
            <Send size={13} /> Answer
          </button>
        )}
      </div>

      {resolved && q.answer && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><CheckCircle2 size={13}/> Answer Sent</p>
          <p className="text-sm text-green-900 whitespace-pre-line">{q.answer}</p>
          <p className="text-[11px] text-green-700 mt-2">Answered: {fmtDateTime(q.answered_at)}</p>
        </div>
      )}
    </div>
  );
}

export default function TutorQueriesPage() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [filter, setFilter] = useState("OPEN");
  const [err, setErr] = useState("");

  useEffect(() => {
    batchApi.mine()
      .then((r) => {
        const list = r.data || [];
        setBatches(list);
        if (list[0]) setBatchId(list[0].id);
      })
      .catch((e) => setErr(e.message || "Failed to load batches."))
      .finally(() => setLoading(false));
  }, []);

  const load = async () => {
    if (!batchId) return;
    setLoading(true);
    setErr("");
    try {
      const r = await queryApi.getBatchQueries(batchId);
      setQueries(r.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [batchId]);

  const open = useMemo(() => queries.filter(q => q.status !== "RESOLVED"), [queries]);
  const done = useMemo(() => queries.filter(q => q.status === "RESOLVED"), [queries]);
  const shown = filter === "OPEN" ? open : filter === "RESOLVED" ? done : queries;

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">Student Queries</h1>
            <p className="text-sm text-dct-gray">Handle session-wise doubts with attachments and clear answers</p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-xl border bg-white text-sm font-bold flex items-center gap-2"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh</button>
        </div>

        {batches.length > 0 && (
          <select className="dct-input max-w-md mb-5" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border rounded-2xl p-4"><MessageSquare size={16} className="text-dct-primary mb-2"/><p className="text-xl font-black">{queries.length}</p><p className="text-xs text-dct-lightgray">Total</p></div>
          <div className="bg-white border rounded-2xl p-4"><HelpCircle size={16} className="text-orange-600 mb-2"/><p className="text-xl font-black text-orange-600">{open.length}</p><p className="text-xs text-dct-lightgray">Open</p></div>
          <div className="bg-white border rounded-2xl p-4"><CheckCircle2 size={16} className="text-green-600 mb-2"/><p className="text-xl font-black text-green-600">{done.length}</p><p className="text-xs text-dct-lightgray">Resolved</p></div>
          <div className="bg-white border rounded-2xl p-4"><User size={16} className="text-dct-primary mb-2"/><p className="text-xl font-black">{new Set(queries.map(q => q.student?.id).filter(Boolean)).size}</p><p className="text-xs text-dct-lightgray">Students</p></div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {[["OPEN", `Open (${open.length})`], ["RESOLVED", `Resolved (${done.length})`], ["ALL", `All (${queries.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-xl text-xs font-bold ${filter === key ? "bg-dct-primary text-white" : "bg-gray-100 text-dct-gray"}`}>{label}</button>
          ))}
        </div>

        {err && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{err}</div>}

        {loading ? <p className="text-sm text-dct-gray">Loading...</p> : shown.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-dct-lightgray">No queries in this filter.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {shown.map((q) => <QueryCard key={q.id} q={q} onAnswer={setAnswer} />)}
          </div>
        )}

        <AnswerModal q={answer} onClose={() => setAnswer(null)} onDone={load} />
      </PageWrapper>
    </AppShell>
  );
}
