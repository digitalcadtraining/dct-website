import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, sessionApi, queryApi } from "../../services/api.js";
import { Calendar, Clock, Link as LinkIcon, RefreshCw, Plus, HelpCircle, Layers, Edit3 } from "lucide-react";

function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBD"; }

function parseSlotStart(slot) {
  if (!slot) return "";
  const first = String(slot).split(/[–-]/)[0]?.trim();
  const m = first.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "";
  let h = Number(m[1]);
  const mm = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${mm}`;
}

function displaySlotStart(slot) {
  const t = parseSlotStart(slot);
  if (!t) return "TBD";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh >= 12 ? "PM" : "AM";
  return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${p}`;
}

function fmtTime(d, fallback) {
  if (!d) return displaySlotStart(fallback);
  const x = new Date(d);

  // Old DB rows saved at UTC midnight become 05:30 in IST.
  // In that case, display the official batch slot instead.
  if (x.getUTCHours() === 0 && x.getUTCMinutes() === 0) {
    return displaySlotStart(fallback);
  }

  return x.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function toDateInput(d) {
  if (!d) return "";
  const x = new Date(d);
  const local = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toTimeInput(d, fallback) {
  if (!d) return parseSlotStart(fallback);
  const x = new Date(d);
  if (x.getUTCHours() === 0 && x.getUTCMinutes() === 0) return parseSlotStart(fallback);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date, time) {
  if (!date) return null;
  const t = time || "00:00";
  return new Date(`${date}T${t}:00`).toISOString();
}

function statusOf(s) {
  if (!s.scheduled_at) return s.status || "UPCOMING";
  const now = new Date();
  const d = new Date(s.scheduled_at);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const tm = new Date(t);
  tm.setDate(tm.getDate() + 1);
  if (d < t) return "COMPLETED";
  if (d >= t && d < tm) return d <= now ? "LIVE" : "TODAY";
  return s.status || "UPCOMING";
}

function Badge({ s }) {
  const m = { LIVE: "bg-green-100 text-green-700", TODAY: "bg-orange-100 text-orange-700", UPCOMING: "bg-blue-100 text-dct-primary", COMPLETED: "bg-purple-100 text-purple-700", CANCELLED: "bg-red-100 text-red-700" };
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m[s] || m.UPCOMING}`}>{s}</span>;
}

function LinkModal({ session, onClose, onSaved }) {
  const [url, setUrl] = useState(session.zoom_link || session.recording_url || "");
  const [loading, setLoading] = useState(false);
  const completed = statusOf(session) === "COMPLETED";
  const save = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await sessionApi.update(session.id, { [completed ? "recording_url" : "zoom_link"]: url.trim() });
      onSaved(session.id, url.trim(), completed);
      onClose();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={onClose} /><div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10"><h3 className="font-extrabold mb-3">{completed ? "Add Recording" : "Add Class Link"}</h3><p className="text-sm text-dct-gray mb-3">Session {session.session_number}: {session.name}</p><input className="dct-input mb-4" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /><button onClick={save} disabled={loading || !url.trim()} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">{loading ? "Saving..." : "Save Link"}</button></div></div>;
}

function EditSessionModal({ session, batch, onClose, onSaved }) {
  const [date, setDate] = useState(toDateInput(session.scheduled_at));
  const [time, setTime] = useState(toTimeInput(session.scheduled_at, batch?.time_slots?.[0]));
  const [status, setStatus] = useState(session.status || "UPCOMING");
  const [loading, setLoading] = useState(false);
  const save = async () => {
    if (!date) return alert("Please select session date.");
    setLoading(true);
    try {
      const scheduled_at = combineDateTime(date, time || parseSlotStart(batch?.time_slots?.[0]));
      const res = await sessionApi.update(session.id, { scheduled_at, status });
      onSaved(res.data || { ...session, scheduled_at, status });
      onClose();
    } catch (e) { alert(e.message || "Failed to update session."); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={onClose} /><div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10"><h3 className="font-extrabold mb-1">Edit Session Date & Timing</h3><p className="text-sm text-dct-gray mb-4">Session {session.session_number}: {session.name}</p><div className="grid grid-cols-2 gap-3 mb-4"><div><label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Date</label><input type="date" className="dct-input" value={date} onChange={e => setDate(e.target.value)} /></div><div><label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Time</label><input type="time" className="dct-input" value={time} onChange={e => setTime(e.target.value)} /></div></div><div className="mb-4"><label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Manual Status</label><select className="dct-input" value={status} onChange={e => setStatus(e.target.value)}><option value="UPCOMING">Upcoming</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select><p className="text-[11px] text-dct-lightgray mt-1">Student side updates automatically.</p></div><button onClick={save} disabled={loading} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">{loading ? "Saving..." : "Save Session"}</button></div></div>;
}

function AnswerModal({ query, onClose, onSaved }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const save = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      await queryApi.answer(query.id, answer.trim());
      onSaved(query.id);
      onClose();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={onClose} /><div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10"><h3 className="font-extrabold mb-3">Answer Query</h3><div className="bg-blue-50 rounded-xl p-3 text-sm mb-3">{query.question}</div><textarea rows={4} className="dct-input resize-none mb-4" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write answer..." /><button onClick={save} disabled={loading || !answer.trim()} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">{loading ? "Sending..." : "Send Answer"}</button></div></div>;
}

export default function TutorSessionsPage() {
  const { batchId } = useParams();
  const nav = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [link, setLink] = useState(null);
  const [edit, setEdit] = useState(null);
  const [answer, setAnswer] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const r = await batchApi.mine();
      const list = r.data || [];
      setBatches(list);
      let sel = batchId ? list.find(b => b.id === batchId) : list[0];
      if (!sel && batchId) {
        try { sel = (await batchApi.get(batchId)).data; } catch {}
      }
      setSelected(sel || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBatches(); }, [batchId]);

  const loadData = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [s, q] = await Promise.all([
        sessionApi.getForBatch(selected.id),
        queryApi.getBatchQueries(selected.id).catch(() => ({ data: [] })),
      ]);
      setSessions(s.data || []);
      setQueries(q.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selected?.id]);

  const enriched = useMemo(() => sessions.map(s => ({ ...s, _status: statusOf(s) })), [sessions]);
  const shown = filter === "ALL" ? enriched : enriched.filter(s => s._status === filter || (filter === "TODAY" && s._status === "LIVE"));
  const openQueries = queries.filter(q => q.status !== "RESOLVED");

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">Tutor Sessions</h1>
            <p className="text-sm text-dct-gray">Edit individual session date/time, add links, create assignments and answer doubts</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end"><button onClick={() => nav("/tutor/batches")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dct-primary text-white text-sm font-bold"><Edit3 size={15} />Edit Batch</button><button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-bold"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button></div>
        </div>

        {batches.length > 0 && <div className="flex gap-3 overflow-x-auto pb-2 mb-5">{batches.map(b => <button key={b.id} onClick={() => { setSelected(b); nav(`/tutor/batches/${b.id}/sessions`); }} className={`min-w-[220px] text-left rounded-2xl border p-4 ${selected?.id === b.id ? "border-dct-primary bg-blue-50" : "bg-white"}`}><p className="text-xs font-bold text-dct-primary mb-1">{b.status}</p><p className="text-sm font-extrabold text-dct-dark line-clamp-2">{b.name}</p><p className="text-xs text-dct-lightgray mt-1">{b.time_slots?.[0] || "No time"}</p></button>)}</div>}

        {!selected && !loading && <div className="bg-white rounded-2xl p-14 text-center border"><Layers size={40} className="mx-auto mb-3 text-gray-300" /><p className="font-bold">No batches found</p></div>}

        {selected && <>
          <div className="flex gap-2 mb-5 flex-wrap">{["ALL", "TODAY", "UPCOMING", "COMPLETED"].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold ${filter === f ? "bg-dct-primary text-white" : "bg-gray-100 text-dct-gray"}`}>{f}</button>)}</div>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
            <div className="space-y-3">
              {loading ? <p className="text-sm text-dct-gray">Loading...</p> : shown.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                  <div className="flex justify-between gap-3"><div><h3 className="font-extrabold text-dct-dark">Session {s.session_number}</h3><p className="text-sm font-semibold text-dct-primary">{s.name}</p></div><Badge s={s._status} /></div>
                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="border rounded-xl p-3"><Calendar size={14} /><p className="text-xs font-bold mt-1">{fmtDate(s.scheduled_at)}</p></div>
                    <div className="border rounded-xl p-3"><Clock size={14} /><p className="text-xs font-bold mt-1">{fmtTime(s.scheduled_at, selected.time_slots?.[0])}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setEdit(s)} className="py-2.5 rounded-xl border border-dct-primary text-dct-primary text-xs font-bold flex items-center justify-center gap-1"><Edit3 size={13} />Edit</button>
                    <button onClick={() => setLink(s)} className="py-2.5 rounded-xl bg-dct-primary text-white text-xs font-bold flex items-center justify-center gap-1"><LinkIcon size={13} />Link</button>
                    <button onClick={() => nav(`/tutor/assignments?batch_id=${selected.id}&session_id=${s.id}`)} className="py-2.5 rounded-xl border border-dct-primary text-dct-primary text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} />Task</button>
                  </div>
                </div>
              ))}
              {!loading && shown.length === 0 && <div className="bg-white rounded-2xl border p-12 text-center text-dct-gray">No sessions in this filter.</div>}
            </div>

            <div className="bg-white rounded-2xl border p-4 h-fit">
              <div className="flex items-center gap-2 mb-3"><HelpCircle size={16} className="text-dct-primary" /><h3 className="font-extrabold">Open Queries</h3><span className="text-xs font-bold bg-red-50 text-red-600 px-2 rounded-full">{openQueries.length}</span></div>
              <div className="space-y-3">{openQueries.slice(0, 8).map(q => <div key={q.id} className="border rounded-xl p-3"><p className="text-xs font-bold">{q.student?.name || "Student"}</p><p className="text-xs text-dct-gray line-clamp-2 my-2">{q.question}</p><button onClick={() => setAnswer(q)} className="text-xs font-bold text-white bg-dct-primary px-3 py-1.5 rounded-lg">Answer</button></div>)}{openQueries.length === 0 && <p className="text-sm text-dct-lightgray text-center py-8">No open queries</p>}</div>
            </div>
          </div>
        </>}

        {link && <LinkModal session={link} onClose={() => setLink(null)} onSaved={(id, url, completed) => setSessions(v => v.map(s => s.id === id ? { ...s, [completed ? "recording_url" : "zoom_link"]: url } : s))} />}
        {edit && <EditSessionModal session={edit} batch={selected} onClose={() => setEdit(null)} onSaved={(updated) => setSessions(v => v.map(s => s.id === updated.id ? { ...s, ...updated } : s))} />}
        {answer && <AnswerModal query={answer} onClose={() => setAnswer(null)} onSaved={id => setQueries(q => q.map(x => x.id === id ? { ...x, status: "RESOLVED" } : x))} />}
      </PageWrapper>
    </AppShell>
  );
}
