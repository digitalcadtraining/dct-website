import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, sessionApi, queryApi } from "../../services/api.js";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  RefreshCw,
  Plus,
  HelpCircle,
  Layers,
  Edit3,
  X,
  Save,
  Trash2,
  Settings,
} from "lucide-react";

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBD";
}

function fmtTime(d, fallback) {
  if (!d) return fallback || "TBD";
  const x = new Date(d);
  const hasTime = x.getHours() || x.getMinutes();
  return hasTime ? x.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : (fallback || "TBD");
}

function toDateInput(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const off = x.getTimezoneOffset();
  const local = new Date(x.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function toTimeInput(d, fallback) {
  if (d) {
    const x = new Date(d);
    if (!Number.isNaN(x.getTime()) && (x.getHours() || x.getMinutes())) {
      return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
    }
  }

  if (fallback) {
    const m = String(fallback).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      let h = Number(m[1]);
      const mm = m[2];
      const ap = m[3]?.toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${mm}`;
    }
  }

  return "";
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

  if (s.status === "CANCELLED") return "CANCELLED";
  if (d < t) return "COMPLETED";
  if (d >= t && d < tm) return d <= now ? "LIVE" : "TODAY";
  return "UPCOMING";
}

function Badge({ s }) {
  const m = {
    LIVE: "bg-green-100 text-green-700",
    TODAY: "bg-orange-100 text-orange-700",
    UPCOMING: "bg-blue-100 text-dct-primary",
    COMPLETED: "bg-purple-100 text-purple-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m[s] || m.UPCOMING}`}>{s}</span>;
}

function to12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
}

function parseSlot(slot = "") {
  const parts = String(slot).split(/[–-]/).map((s) => s.trim());
  return {
    start: toTimeInput(null, parts[0] || ""),
    end: toTimeInput(null, parts[1] || ""),
  };
}

function makeSlot(start, end) {
  return start && end ? `${to12Hour(start)} – ${to12Hour(end)}` : "";
}

function sessionToForm(session) {
  return {
    id: session.id || "",
    name: session.name || "",
    type: session.type || "BOTH",
    date: toDateInput(session.scheduled_at),
    time: toTimeInput(session.scheduled_at),
    status: session.status || "UPCOMING",
    duration_minutes: session.duration_minutes || 90,
    zoom_link: session.zoom_link || "",
    recording_url: session.recording_url || "",
    notes_url: session.notes_url || "",
  };
}

function formToSessionPayload(row) {
  return {
    id: row.id || undefined,
    name: String(row.name || "").trim(),
    type: row.type || "BOTH",
    scheduled_at: row.date ? combineDateTime(row.date, row.time || "00:00") : null,
    status: row.status || "UPCOMING",
    duration_minutes: Number(row.duration_minutes) || 90,
    zoom_link: row.zoom_link || null,
    recording_url: row.recording_url || null,
    notes_url: row.notes_url || null,
  };
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
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10">
        <h3 className="font-extrabold mb-3">{completed ? "Add Recording" : "Add Class Link"}</h3>
        <p className="text-sm text-dct-gray mb-3">Session {session.session_number}: {session.name}</p>
        <input className="dct-input mb-4" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        <button onClick={save} disabled={loading || !url.trim()} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">
          {loading ? "Saving..." : "Save Link"}
        </button>
      </div>
    </div>
  );
}

function EditSessionModal({ session, batch, onClose, onSaved }) {
  const [name, setName] = useState(session.name || "");
  const [type, setType] = useState(session.type || "BOTH");
  const [date, setDate] = useState(toDateInput(session.scheduled_at));
  const [time, setTime] = useState(toTimeInput(session.scheduled_at, batch?.time_slots?.[0]));
  const [status, setStatus] = useState(session.status || "UPCOMING");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return alert("Please enter session/topic name.");
    if (!date) return alert("Please select session date.");
    setLoading(true);
    try {
      const scheduled_at = combineDateTime(date, time);
      const res = await sessionApi.update(session.id, { name: name.trim(), type, scheduled_at, status });
      onSaved(res.data || { ...session, name: name.trim(), type, scheduled_at, status });
      onClose();
    } catch (e) {
      alert(e.message || "Failed to update session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10">
        <h3 className="font-extrabold mb-1">Edit Session / Syllabus Topic</h3>
        <p className="text-sm text-dct-gray mb-4">Session {session.session_number}</p>

        <div className="mb-4">
          <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Topic / Session Name</label>
          <input className="dct-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Type</label>
            <select className="dct-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="THEORY">Theory</option>
              <option value="CAD">CAD</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Status</label>
            <select className="dct-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="UPCOMING">Upcoming</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Date</label>
            <input type="date" className="dct-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Time</label>
            <input type="time" className="dct-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <button onClick={save} disabled={loading} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">
          {loading ? "Saving..." : "Save Session"}
        </button>
      </div>
    </div>
  );
}

function ManageBatchModal({ batch, sessions, onClose, onSaved }) {
  const slot = parseSlot(batch?.time_slots?.[0] || "");
  const [form, setForm] = useState({
    name: batch?.name || "",
    start_date: toDateInput(batch?.start_date),
    end_date: toDateInput(batch?.end_date),
    max_students: batch?.max_students || 50,
    description: batch?.description || "",
    zoom_link: batch?.zoom_link || "",
    status: batch?.status || "UPCOMING",
    start_time: slot.start,
    end_time: slot.end,
  });
  const [rows, setRows] = useState(() => (sessions || []).map(sessionToForm));
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateRow = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows((prev) => [
      ...prev,
      {
        id: "",
        name: "",
        type: "BOTH",
        date: last?.date || form.start_date || "",
        time: last?.time || form.start_time || "",
        status: "UPCOMING",
        duration_minutes: 90,
        zoom_link: "",
        recording_url: "",
        notes_url: "",
      },
    ]);
  };

  const removeRow = (idx) => {
    const row = rows[idx];
    if (row?.id) {
      const ok = window.confirm("This existing session will be removed if it has no assignments/queries. If it already has student activity, it will be marked as Cancelled instead. Continue?");
      if (!ok) return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    const timeSlot = makeSlot(form.start_time, form.end_time);

    if (!form.name.trim()) return alert("Batch name is required.");
    if (!form.start_date) return alert("Start date is required.");
    if (!form.end_date) return alert("End date is required.");
    if (!form.start_time || !form.end_time) return alert("Batch timing is required.");
    if (form.start_time >= form.end_time) return alert("End time must be later than start time.");

    const cleanRows = rows
      .map((r) => ({ ...r, name: String(r.name || "").trim() }))
      .filter((r) => r.name);

    if (!cleanRows.length) return alert("At least one session/topic is required.");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        max_students: Number(form.max_students) || 50,
        description: form.description,
        zoom_link: form.zoom_link,
        status: form.status,
        time_slots: [timeSlot],
        sessions: cleanRows.map(formToSessionPayload),
      };

      const res = await batchApi.updateFull(batch.id, payload);
      onSaved(res.data);
      onClose();
    } catch (e) {
      alert(e.message || "Failed to update batch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl z-10 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b flex justify-between items-start gap-3">
          <div>
            <h3 className="font-extrabold text-dct-dark text-lg">Edit Full Batch</h3>
            <p className="text-xs text-dct-lightgray">Change timings, batch details, syllabus topics and session schedule. Student side updates automatically.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Batch Name</label>
              <input className="dct-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Student Limit</label>
              <input type="number" min="1" max="1000" className="dct-input" value={form.max_students} onChange={(e) => set("max_students", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Start Date</label>
              <input type="date" className="dct-input" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">End Date</label>
              <input type="date" className="dct-input" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Batch Start Time</label>
              <input type="time" className="dct-input" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Batch End Time</label>
              <input type="time" className="dct-input" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Batch Status</label>
              <select className="dct-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Zoom / Common Link</label>
              <input className="dct-input" value={form.zoom_link} onChange={(e) => set("zoom_link", e.target.value)} placeholder="https://..." />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-dct-gray mb-1 uppercase">Description</label>
              <textarea rows={3} className="dct-input resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-5">
            <div className="flex justify-between items-center gap-3 mb-3">
              <div>
                <h4 className="font-extrabold text-dct-dark">Syllabus / Sessions</h4>
                <p className="text-xs text-dct-lightgray">Edit topic names, type, date and time. Add new topics when required.</p>
              </div>
              <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-dct-primary text-white text-xs font-bold">
                <Plus size={14} /> Add Topic
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.id || `new-${idx}`} className="rounded-2xl border p-3 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-dct-primary">Session {idx + 1}</span>
                    <button onClick={() => removeRow(idx)} className="text-red-600 text-xs font-bold flex items-center gap-1">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Topic Name</label>
                      <input className="dct-input" value={row.name} onChange={(e) => updateRow(idx, "name", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Type</label>
                      <select className="dct-input" value={row.type} onChange={(e) => updateRow(idx, "type", e.target.value)}>
                        <option value="THEORY">Theory</option>
                        <option value="CAD">CAD</option>
                        <option value="BOTH">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Date</label>
                      <input type="date" className="dct-input" value={row.date} onChange={(e) => updateRow(idx, "date", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Time</label>
                      <input type="time" className="dct-input" value={row.time} onChange={(e) => updateRow(idx, "time", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Status</label>
                      <select className="dct-input" value={row.status} onChange={(e) => updateRow(idx, "status", e.target.value)}>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="LIVE">Live</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="px-5 py-3 rounded-xl border text-sm font-bold">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-3 rounded-xl bg-dct-primary text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            <Save size={15} /> {loading ? "Saving..." : "Save Full Batch"}
          </button>
        </div>
      </div>
    </div>
  );
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
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full z-10">
        <h3 className="font-extrabold mb-3">Answer Query</h3>
        <div className="bg-blue-50 rounded-xl p-3 text-sm mb-3">{query.question}</div>
        <textarea rows={4} className="dct-input resize-none mb-4" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write answer..." />
        <button onClick={save} disabled={loading || !answer.trim()} className="w-full py-3 rounded-xl bg-dct-primary text-white font-bold disabled:opacity-50">
          {loading ? "Sending..." : "Send Answer"}
        </button>
      </div>
    </div>
  );
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
  const [manage, setManage] = useState(false);
  const [answer, setAnswer] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const r = await batchApi.mine();
      const list = r.data || [];
      setBatches(list);
      let sel = batchId ? list.find((b) => b.id === batchId) : list[0];
      if (!sel && batchId) {
        try {
          sel = (await batchApi.get(batchId)).data;
        } catch {}
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

  const enriched = useMemo(() => sessions.map((s) => ({ ...s, _status: statusOf(s) })), [sessions]);
  const shown = filter === "ALL" ? enriched : enriched.filter((s) => s._status === filter || (filter === "TODAY" && s._status === "LIVE"));
  const openQueries = queries.filter((q) => q.status !== "RESOLVED");

  const handleFullBatchSaved = (updatedBatch) => {
    if (!updatedBatch) return;

    const normalizedBatch = {
      ...updatedBatch,
      _count: updatedBatch._count || selected?._count || {},
    };

    setSelected(normalizedBatch);
    setSessions(updatedBatch.scheduled_sessions || []);

    setBatches((prev) =>
      prev.map((b) =>
        b.id === updatedBatch.id
          ? {
              ...b,
              ...updatedBatch,
              _count: updatedBatch._count || b._count,
              course: updatedBatch.course || b.course,
            }
          : b
      )
    );
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">Tutor Sessions</h1>
            <p className="text-sm text-dct-gray">Open batch, edit date/time, add links, create assignments and answer doubts</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {selected && (
              <button onClick={() => setManage(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dct-primary text-white text-sm font-bold">
                <Settings size={15} /> Edit Batch
              </button>
            )}
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-bold">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {batches.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
            {batches.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelected(b); nav(`/tutor/batches/${b.id}/sessions`); }}
                className={`min-w-[220px] text-left rounded-2xl border p-4 ${selected?.id === b.id ? "border-dct-primary bg-blue-50" : "bg-white"}`}
              >
                <p className="text-xs font-bold text-dct-primary mb-1">{b.status}</p>
                <p className="text-sm font-extrabold text-dct-dark line-clamp-2">{b.name}</p>
                <p className="text-xs text-dct-lightgray mt-1">{b.time_slots?.[0] || "No time"}</p>
              </button>
            ))}
          </div>
        )}

        {!selected && !loading && (
          <div className="bg-white rounded-2xl p-14 text-center border">
            <Layers size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold">No batches found</p>
          </div>
        )}

        {selected && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {["ALL", "TODAY", "UPCOMING", "COMPLETED"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold ${filter === f ? "bg-dct-primary text-white" : "bg-gray-100 text-dct-gray"}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-dct-gray">Loading...</p>
                ) : shown.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl border p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-dct-dark">Session {s.session_number}</h3>
                        <p className="text-sm font-semibold text-dct-primary">{s.name}</p>
                      </div>
                      <Badge s={s._status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="border rounded-xl p-3">
                        <Calendar size={14} />
                        <p className="text-xs font-bold mt-1">{fmtDate(s.scheduled_at)}</p>
                      </div>
                      <div className="border rounded-xl p-3">
                        <Clock size={14} />
                        <p className="text-xs font-bold mt-1">{fmtTime(s.scheduled_at, selected.time_slots?.[0])}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setEdit(s)} className="py-2.5 rounded-xl border border-dct-primary text-dct-primary text-xs font-bold flex items-center justify-center gap-1">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button onClick={() => setLink(s)} className="py-2.5 rounded-xl bg-dct-primary text-white text-xs font-bold flex items-center justify-center gap-1">
                        <LinkIcon size={13} /> {s.zoom_link || s.recording_url ? "Link" : "Link"}
                      </button>
                      <button onClick={() => nav(`/tutor/assignments?batch_id=${selected.id}&session_id=${s.id}`)} className="py-2.5 rounded-xl border border-dct-primary text-dct-primary text-xs font-bold flex items-center justify-center gap-1">
                        <Plus size={13} /> Task
                      </button>
                    </div>
                  </div>
                ))}

                {!loading && shown.length === 0 && (
                  <div className="bg-white rounded-2xl border p-12 text-center text-dct-gray">No sessions in this filter.</div>
                )}
              </div>

              <div className="bg-white rounded-2xl border p-4 h-fit">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle size={16} className="text-dct-primary" />
                  <h3 className="font-extrabold">Open Queries</h3>
                  <span className="text-xs font-bold bg-red-50 text-red-600 px-2 rounded-full">{openQueries.length}</span>
                </div>

                <div className="space-y-3">
                  {openQueries.slice(0, 8).map((q) => (
                    <div key={q.id} className="border rounded-xl p-3">
                      <p className="text-xs font-bold">{q.student?.name || "Student"}</p>
                      <p className="text-xs text-dct-gray line-clamp-2 my-2">{q.question}</p>
                      <button onClick={() => setAnswer(q)} className="text-xs font-bold text-white bg-dct-primary px-3 py-1.5 rounded-lg">Answer</button>
                    </div>
                  ))}
                  {openQueries.length === 0 && <p className="text-sm text-dct-lightgray text-center py-8">No open queries</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {link && (
          <LinkModal
            session={link}
            onClose={() => setLink(null)}
            onSaved={(id, url, completed) => setSessions((v) => v.map((s) => s.id === id ? { ...s, [completed ? "recording_url" : "zoom_link"]: url } : s))}
          />
        )}

        {edit && (
          <EditSessionModal
            session={edit}
            batch={selected}
            onClose={() => setEdit(null)}
            onSaved={(updated) => setSessions((v) => v.map((s) => s.id === updated.id ? { ...s, ...updated } : s))}
          />
        )}

        {manage && selected && (
          <ManageBatchModal
            batch={selected}
            sessions={sessions}
            onClose={() => setManage(false)}
            onSaved={handleFullBatchSaved}
          />
        )}

        {answer && (
          <AnswerModal
            query={answer}
            onClose={() => setAnswer(null)}
            onSaved={(id) => setQueries((q) => q.map((x) => x.id === id ? { ...x, status: "RESOLVED" } : x))}
          />
        )}
      </PageWrapper>
    </AppShell>
  );
}
