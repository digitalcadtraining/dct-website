import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { Modal, Textarea, Button, PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, queryApi, mediaUrl } from "../../services/api.js";
import { HelpCircle, RefreshCw, Send, Paperclip, Clock, User, CheckCircle2, MessageSquare, AlertTriangle, Layers } from "lucide-react";

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

function ageHours(value) {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / 36e5);
}

function batchAgeLabel(rank) {
  if (rank === 0) return { label: "High", cls: "bg-red-50 text-red-600 border-red-100" };
  if (rank === 1) return { label: "Medium", cls: "bg-orange-50 text-orange-600 border-orange-100" };
  return { label: "Low", cls: "bg-gray-100 text-dct-gray border-gray-200" };
}

function getPriority(q) {
  const open = q.status !== "RESOLVED";
  const older24 = open && ageHours(q.created_at) >= 24;
  if (older24) return { score: 0, label: "Urgent", cls: "bg-red-600 text-white border-red-600" };
  if (q.batch_rank === 0) return { score: 1, label: "High", cls: "bg-red-50 text-red-600 border-red-100" };
  if (q.batch_rank === 1) return { score: 2, label: "Medium", cls: "bg-orange-50 text-orange-600 border-orange-100" };
  return { score: 3, label: "Low", cls: "bg-gray-100 text-dct-gray border-gray-200" };
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
  const priority = getPriority(q);
  const batchPriority = batchAgeLabel(q.batch_rank || 0);
  return (
    <div className="bg-white rounded-2xl border p-4 sm:p-5" style={{ boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-dct-primary text-white flex items-center justify-center font-black flex-shrink-0">
            {q.student?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-dct-dark truncate">{q.student?.name || "Student"}</p>
            <p className="text-xs text-dct-lightgray truncate">{q.student?.email || q.student?.phone || q.batch_name || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${resolved ? "bg-green-100 text-green-700 border-green-100" : priority.cls}`}>{resolved ? "Resolved" : priority.label}</span>
          {!resolved && ageHours(q.created_at) >= 24 && <span className="text-[10px] font-bold text-red-600">24h+</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase font-bold text-dct-lightgray">Batch Priority</p>
          <p className={`inline-flex mt-1 text-xs font-bold px-2 py-1 rounded-full border ${batchPriority.cls}`}>{batchPriority.label}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase font-bold text-dct-lightgray">Raised On</p>
          <p className="text-xs font-bold text-dct-dark">{fmtDateTime(q.created_at)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 mb-3">
        <p className="text-[10px] uppercase font-bold text-dct-lightgray">Batch</p>
        <p className="text-xs font-bold text-dct-dark line-clamp-2">{q.batch_name || "Batch"}</p>
        {q.session && <p className="text-xs text-dct-primary font-bold mt-1">Session {q.session.session_number}: {q.session.name}</p>}
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
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [filter, setFilter] = useState("OPEN");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const br = await batchApi.mine();
      const batchList = (br.data || []).slice().sort((a, b) => new Date(b.start_date || b.created_at || 0) - new Date(a.start_date || a.created_at || 0));
      setBatches(batchList);

      const settled = await Promise.allSettled(batchList.map((b, index) => queryApi.getBatchQueries(b.id).then((res) => ({ batch: b, index, rows: res.data || [] }))));
      const all = settled.flatMap((item) => {
        if (item.status !== "fulfilled") return [];
        const { batch, index, rows } = item.value;
        return rows.map((q) => ({ ...q, batch_id: batch.id, batch_name: batch.name, batch_rank: index }));
      });
      setQueries(all);
    } catch (e) {
      setErr(e.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...queries].sort((a, b) => {
      const pa = getPriority(a).score;
      const pb = getPriority(b).score;
      if (pa !== pb) return pa - pb;
      if ((a.status === "RESOLVED") !== (b.status === "RESOLVED")) return a.status === "RESOLVED" ? 1 : -1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [queries]);

  const shown = useMemo(() => {
    return sorted.filter((q) => {
      if (filter === "OPEN" && q.status === "RESOLVED") return false;
      if (filter === "RESOLVED" && q.status !== "RESOLVED") return false;
      if (filter === "URGENT" && !(q.status !== "RESOLVED" && ageHours(q.created_at) >= 24)) return false;
      if (batchFilter !== "ALL" && q.batch_id !== batchFilter) return false;
      return true;
    });
  }, [sorted, filter, batchFilter]);

  const open = queries.filter(q => q.status !== "RESOLVED");
  const done = queries.filter(q => q.status === "RESOLVED");
  const urgent = open.filter(q => ageHours(q.created_at) >= 24);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">Student Queries</h1>
            <p className="text-sm text-dct-gray">Priority view across all batches. New batch and 24h+ open queries stay on top.</p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-xl border bg-white text-sm font-bold flex items-center gap-2"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border rounded-2xl p-4"><MessageSquare size={16} className="text-dct-primary mb-2"/><p className="text-xl font-black">{queries.length}</p><p className="text-xs text-dct-lightgray">Total</p></div>
          <div className="bg-white border rounded-2xl p-4"><HelpCircle size={16} className="text-orange-600 mb-2"/><p className="text-xl font-black text-orange-600">{open.length}</p><p className="text-xs text-dct-lightgray">Open</p></div>
          <div className="bg-white border rounded-2xl p-4"><AlertTriangle size={16} className="text-red-600 mb-2"/><p className="text-xl font-black text-red-600">{urgent.length}</p><p className="text-xs text-dct-lightgray">24h+ Urgent</p></div>
          <div className="bg-white border rounded-2xl p-4"><CheckCircle2 size={16} className="text-green-600 mb-2"/><p className="text-xl font-black text-green-600">{done.length}</p><p className="text-xs text-dct-lightgray">Resolved</p></div>
        </div>

        <div className="bg-white border rounded-2xl p-3 sm:p-4 mb-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
            <div className="flex gap-2 flex-wrap">
              {[["OPEN", `Open (${open.length})`], ["URGENT", `24h+ (${urgent.length})`], ["RESOLVED", `Resolved (${done.length})`], ["ALL", `All (${queries.length})`]].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-xl text-xs font-bold ${filter === key ? "bg-dct-primary text-white" : "bg-gray-100 text-dct-gray"}`}>{label}</button>
              ))}
            </div>
            <select className="dct-input" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
              <option value="ALL">All batches</option>
              {batches.map((b, index) => <option key={b.id} value={b.id}>{index === 0 ? "High - " : index === 1 ? "Medium - " : "Low - "}{b.name}</option>)}
            </select>
          </div>
        </div>

        {err && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{err}</div>}

        {loading ? <p className="text-sm text-dct-gray">Loading queries...</p> : shown.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-dct-lightgray"><Layers className="mx-auto mb-3 text-gray-300"/>No queries in this filter.</div>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            {shown.map((q) => <QueryCard key={q.id} q={q} onAnswer={setAnswer} />)}
          </div>
        )}

        <AnswerModal q={answer} onClose={() => setAnswer(null)} onDone={load} />
      </PageWrapper>
    </AppShell>
  );
}
