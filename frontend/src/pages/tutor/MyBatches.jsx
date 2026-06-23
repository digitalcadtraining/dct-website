import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { Plus, Users, BookOpen, Calendar, Clock, X, ChevronRight, RefreshCw, Edit3, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { batchApi, tutorApi } from "../../services/api.js";

function buildBatchName(courseName, startDate) {
  if (!courseName || !startDate) return "";
  const d = new Date(startDate);
  return `${courseName} - ${d.getDate()} ${d.toLocaleString("en-IN", { month: "long" })} ${String(d.getFullYear()).slice(2)}`;
}

function to12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
}

function makeSlot(start, end) {
  return start && end ? `${to12Hour(start)} – ${to12Hour(end)}` : "";
}

function statusOf(b) {
  if (b.status === "PENDING_APPROVAL") return "PENDING_APPROVAL";
  const n = new Date();
  const s = b.start_date ? new Date(b.start_date) : null;
  const e = b.end_date ? new Date(b.end_date) : null;
  if (s && e) {
    if (n < s) return "UPCOMING";
    if (n > e) return "COMPLETED";
    return "ACTIVE";
  }
  return b.status || "UPCOMING";
}

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

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

function parseSlotEnd(slot) {
  if (!slot) return "";
  const parts = String(slot).split(/[–-]/);
  const last = (parts[1] || "").trim();
  const m = last.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "";
  let h = Number(m[1]);
  const mm = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${mm}`;
}

function toTimeInput(value, fallbackSlot) {
  if (!value) return parseSlotStart(fallbackSlot);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return parseSlotStart(fallbackSlot);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";

  if ((hour === "00" && minute === "00") || (hour === "05" && minute === "30")) {
    return parseSlotStart(fallbackSlot);
  }

  return `${hour}:${minute}`;
}

function combineDateTime(date, time) {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "00:00").split(":").map(Number);

  // Selected date/time is India business time in the browser.
  // Store once as ISO; do not manually subtract 5:30, or it shifts twice.
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function NewBatchModal({ isOpen, onClose, onCreated }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ course_id: "", start_date: "", max_students: 50, start_time: "", end_time: "", alt_days: false, sunday_off: true });

  useEffect(() => {
    if (!isOpen) return;
    tutorApi.approvedCourses()
      .then((r) => {
        const list = r.data || [];
        setCourses(list);
        if (list.length === 1) setForm((f) => ({ ...f, course_id: list[0].id }));
      })
      .catch((e) => {
        setErr(e.message || "Failed to load approved courses");
        setCourses([]);
      });
  }, [isOpen]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const course = courses.find((c) => c.id === form.course_id);
  const slot = makeSlot(form.start_time, form.end_time);
  const batchName = buildBatchName(course?.name, form.start_date);

  const submit = async () => {
    setErr("");
    if (!form.course_id) return setErr("No approved course found for your tutor account.");
    if (!form.start_date) return setErr("Select start date.");
    if (!form.start_time || !form.end_time) return setErr("Select start and end time.");
    if (form.start_time >= form.end_time) return setErr("End time must be later than start time.");
    setLoading(true);
    try {
      const r = await batchApi.create({
        course_id: form.course_id,
        start_date: form.start_date,
        max_students: Number(form.max_students) || 50,
        time_slots: [slot],
        alt_days: form.alt_days,
        sunday_off: form.sunday_off,
      });
      onCreated(r.data);
      onClose();
      setForm({ course_id: courses.length === 1 ? courses[0].id : "", start_date: "", max_students: 50, start_time: "", end_time: "", alt_days: false, sunday_off: true });
    } catch (e) {
      setErr(e.message || "Failed to create batch.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[92vh] flex flex-col" initial={{ opacity: 0, scale: .95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-dct-dark">Create New Batch</h2>
            <p className="text-xs text-dct-lightgray">Only your approved course is shown</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Approved Course *</label>
            <select className="dct-input" value={form.course_id} onChange={(e) => set("course_id", e.target.value)} disabled={courses.length <= 1}>
              <option value="">{courses.length ? "Select course" : "Loading approved course..."}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {courses.length === 0 && !err && <p className="text-xs text-orange-600 mt-2">No approved course found. Ask admin to approve your tutor application first.</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Start Date *</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} className="dct-input" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          {batchName && <div className="rounded-xl p-4 border border-blue-200 bg-blue-50"><p className="text-[10px] font-bold uppercase text-blue-400">Batch name</p><p className="text-sm font-bold text-dct-dark">{batchName}</p></div>}
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-2 uppercase">Class Timing *</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="time" className="dct-input" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
              <input type="time" className="dct-input" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
            </div>
            {slot && <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border border-blue-200 bg-blue-50 text-dct-primary"><Clock size={12} />{slot}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => set("alt_days", !form.alt_days)} className={`p-3 rounded-xl border-2 text-left ${form.alt_days ? "border-dct-primary bg-blue-50" : "border-gray-200"}`}><p className="text-xs font-bold">Alternate Days</p><p className="text-[10px] text-dct-lightgray">Every 2 days</p></button>
            <button type="button" onClick={() => set("sunday_off", !form.sunday_off)} className={`p-3 rounded-xl border-2 text-left ${form.sunday_off ? "border-dct-primary bg-blue-50" : "border-gray-200"}`}><p className="text-xs font-bold">Sunday Off</p><p className="text-[10px] text-dct-lightgray">Skip Sundays</p></button>
          </div>
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Max Students</label>
            <input type="number" min="1" max="200" className="dct-input" value={form.max_students} onChange={(e) => set("max_students", e.target.value)} />
          </div>
          {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">{err}</div>}
        </div>
        <div className="px-6 py-4 border-t">
          <button onClick={submit} disabled={loading || courses.length === 0} className="w-full py-3.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 bg-dct-primary">{loading ? "Creating..." : "Submit for Admin Approval →"}</button>
        </div>
      </motion.div>
    </div>
  );
}

function EditFullBatchModal({ batch, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(null);
  const originalBatchSlot = batch?.time_slots?.[0] || "";

  useEffect(() => {
    let alive = true;
    setLoading(true);
    batchApi.get(batch.id)
      .then((r) => {
        if (!alive) return;
        const b = r.data || {};
        setForm({
          name: b.name || "",
          start_date: toDateInput(b.start_date),
          end_date: toDateInput(b.end_date),
          max_students: b.max_students || 50,
          start_time: parseSlotStart(b.time_slots?.[0] || originalBatchSlot),
          end_time: parseSlotEnd(b.time_slots?.[0] || originalBatchSlot),
          status: b.status || "UPCOMING",
          description: b.description || "",
          sessions: (b.scheduled_sessions || []).map((s, index) => ({
            id: s.id,
            session_number: s.session_number || index + 1,
            name: s.name || "",
            type: s.type || "BOTH",
            date: toDateInput(s.scheduled_at),
            time: toTimeInput(s.scheduled_at, b.time_slots?.[0]),
            status: s.status || "UPCOMING",
          })),
        });
      })
      .catch((e) => setErr(e.message || "Failed to load batch."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [batch.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSession = (i, k, v) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  const removeSession = (i) => setForm((f) => ({ ...f, sessions: f.sessions.filter((_, idx) => idx !== i) }));
  const addSession = () => setForm((f) => ({
    ...f,
    sessions: [
      ...f.sessions,
      {
        id: null,
        session_number: f.sessions.length + 1,
        name: `New Session ${f.sessions.length + 1}`,
        type: "BOTH",
        date: f.sessions[f.sessions.length - 1]?.date || f.start_date,
        time: f.start_time || parseSlotStart(originalBatchSlot),
        status: "UPCOMING",
      },
    ],
  }));

  const setBatchStartTime = (newTime) => {
    setForm((f) => {
      const oldTime = f.start_time;
      return {
        ...f,
        start_time: newTime,
        sessions: f.sessions.map((s) => ({
          ...s,
          time: !s.time || s.time === oldTime ? newTime : s.time,
        })),
      };
    });
  };

  const setBatchEndTime = (newTime) => setForm((f) => ({ ...f, end_time: newTime }));

  const save = async () => {
    if (!form.name.trim()) return setErr("Batch name is required.");
    if (!form.start_date || !form.end_date) return setErr("Start and end date are required.");
    if (!form.start_time || !form.end_time) return setErr("Batch start and end timing are required.");
    if (form.start_time >= form.end_time) return setErr("Batch end time must be later than start time.");
    if (!form.sessions.length) return setErr("At least one session is required.");
    if (form.sessions.some((s) => !String(s.name || "").trim())) return setErr("Every session topic needs a name.");
    setErr("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        start_date: combineDateTime(form.start_date, "00:00"),
        end_date: combineDateTime(form.end_date, "23:59"),
        max_students: Number(form.max_students) || 50,
        time_slots: [makeSlot(form.start_time, form.end_time)],
        status: form.status,
        description: form.description,
        sessions: form.sessions.map((s, index) => ({
          id: s.id || undefined,
          session_number: index + 1,
          name: String(s.name || "").trim(),
          type: s.type || "BOTH",
          scheduled_at: combineDateTime(s.date, s.time || form.start_time),
          status: s.status || "UPCOMING",
        })),
      };
      const r = await batchApi.updateFull(batch.id, payload);
      onSaved(r.data || {});
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save batch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl z-10 max-h-[94vh] flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-dct-dark">Edit Full Batch</h2>
            <p className="text-xs text-dct-gray mt-1">Edit batch details and session-wise syllabus. Students see updates automatically.</p>
            {form?.start_time && form?.end_time && <p className="text-xs font-bold text-dct-primary mt-2">Batch slot: {makeSlot(form.start_time, form.end_time)}</p>}
          </div>
          <button onClick={onClose} className="p-2"><X size={18} /></button>
        </div>

        {loading && <div className="p-10 text-center text-sm text-dct-gray">Loading batch...</div>}

        {!loading && form && (
          <>
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Batch Name</label><input className="dct-input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Student Limit</label><input type="number" min="1" className="dct-input" value={form.max_students} onChange={(e) => set("max_students", e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Start Date</label><input type="date" className="dct-input" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">End Date</label><input type="date" className="dct-input" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Batch Start Time</label><input type="time" className="dct-input" value={form.start_time} onChange={(e) => setBatchStartTime(e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Batch End Time</label><input type="time" className="dct-input" value={form.end_time} onChange={(e) => setBatchEndTime(e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Batch Status</label><select className="dct-input" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="PENDING_APPROVAL">Pending Approval</option><option value="UPCOMING">Upcoming</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option></select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase">Description</label><textarea rows={3} className="dct-input resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              </div>

              <div className="border-t pt-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-dct-dark">Syllabus / Sessions</h3>
                    <p className="text-xs text-dct-gray">Default time uses batch slot. Change session time only for exceptions.</p>
                  </div>
                  <button type="button" onClick={addSession} className="px-4 py-2.5 rounded-xl bg-dct-primary text-white text-xs font-bold flex items-center gap-2"><Plus size={14} /> Add Topic</button>
                </div>

                <div className="space-y-3">
                  {form.sessions.map((s, i) => (
                    <div key={s.id || `new-${i}`} className="rounded-2xl border p-4 bg-gray-50/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-extrabold text-dct-primary">Session {i + 1}</p>
                        <button type="button" onClick={() => removeSession(i)} className="text-xs font-bold text-red-600 flex items-center gap-1"><Trash2 size={13} /> Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3">
                        <div><label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Topic Name</label><input className="dct-input" value={s.name} onChange={(e) => setSession(i, "name", e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Type</label><select className="dct-input" value={s.type} onChange={(e) => setSession(i, "type", e.target.value)}><option value="THEORY">Theory</option><option value="CAD">CAD</option><option value="BOTH">Both</option></select></div>
                        <div><label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Date</label><input type="date" className="dct-input" value={s.date} onChange={(e) => setSession(i, "date", e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Time</label><input type="time" className="dct-input" value={s.time} onChange={(e) => setSession(i, "time", e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-dct-gray mb-1 uppercase">Status</label><select className="dct-input" value={s.status} onChange={(e) => setSession(i, "status", e.target.value)}><option value="UPCOMING">Upcoming</option><option value="LIVE">Live</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">{err}</div>}
            </div>

            <div className="px-7 py-4 border-t bg-white flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-3 rounded-xl border text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={saving} className="px-6 py-3 rounded-xl bg-dct-primary text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2"><Save size={15} /> {saving ? "Saving..." : "Save Full Batch"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BatchCard({ batch, index, onEdit }) {
  const nav = useNavigate();
  const st = statusOf(batch);
  const slots = batch.time_slots || [];
  const enrolled = batch._count?.enrollments || 0;
  const sessions = batch._count?.scheduled_sessions || 0;
  const pct = Math.round(enrolled / (batch.max_students || 1) * 100);
  const map = {
    PENDING_APPROVAL: ["Pending Approval", "bg-yellow-50 text-yellow-700 border-yellow-200"],
    UPCOMING: ["Upcoming", "bg-blue-50 text-blue-700 border-blue-200"],
    ACTIVE: ["Active", "bg-green-50 text-green-700 border-green-200"],
    COMPLETED: ["Completed", "bg-gray-50 text-gray-600 border-gray-200"],
  };
  const [label, cls] = map[st] || [st, "bg-gray-50 text-gray-600 border-gray-200"];

  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-dct-primary/30 transition-all" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.05)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} whileHover={{ y: -3 }}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cls}`}>{label}</span>
        <span className="text-[10px] text-dct-lightgray">{new Date(batch.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
      </div>
      <h3 className="font-extrabold text-dct-dark text-sm mb-0.5 leading-snug">{batch.name}</h3>
      <p className="text-xs text-dct-lightgray mb-3">{batch.course?.name}</p>
      {slots.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{slots.map((s) => <span key={s} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-dct-primary"><Clock size={9} />{s}</span>)}</div>}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border rounded-lg p-2.5"><p className="text-xs font-bold">{batch.start_date ? new Date(batch.start_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</p><p className="text-[10px] text-dct-lightgray">Start</p></div>
        <div className="border rounded-lg p-2.5"><p className="text-xs font-bold">{batch.end_date ? new Date(batch.end_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</p><p className="text-[10px] text-dct-lightgray">End</p></div>
      </div>
      <div className="flex items-center gap-4 text-xs text-dct-gray mb-3"><span className="flex items-center gap-1"><Users size={11} />{enrolled}/{batch.max_students}</span><span className="flex items-center gap-1"><BookOpen size={11} />{sessions} sessions</span></div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4"><div className="h-full bg-dct-primary" style={{ width: `${pct}%` }} /></div>
      <div className="flex items-center justify-between pt-3 border-t gap-2">
        <button type="button" onClick={() => nav(`/tutor/batches/${batch.id}/sessions`)} className="text-xs font-bold text-dct-primary flex items-center gap-1">Open Sessions <ChevronRight size={14} /></button>
        <button type="button" onClick={() => onEdit(batch)} className="text-xs font-bold text-dct-primary border border-dct-primary rounded-lg px-3 py-1.5 flex items-center gap-1"><Edit3 size={13} />Edit Batch</button>
      </div>
    </motion.div>
  );
}

export default function MyBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    batchApi.mine()
      .then((r) => setBatches(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const list = filter === "ALL" ? batches : batches.filter((b) => statusOf(b) === filter);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">My Batches</h1>
            <p className="text-sm text-dct-gray">{batches.length} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm font-bold"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button>
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-dct-primary"><Plus size={16} />New Batch</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[["ALL", "All"], ["PENDING_APPROVAL", "Pending"], ["UPCOMING", "Upcoming"], ["ACTIVE", "Active"], ["COMPLETED", "Completed"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-4 py-2 rounded-xl text-xs font-semibold ${filter === k ? "bg-dct-primary text-white" : "bg-gray-100 text-dct-gray"}`}>{l}</button>
          ))}
        </div>

        {loading && <div className="text-center py-16 text-dct-gray text-sm">Loading...</div>}
        {!loading && list.length === 0 && <div className="bg-white rounded-2xl p-16 text-center border"><Calendar size={40} className="mx-auto mb-3 text-gray-300" /><p className="font-bold">No batches</p></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((b, i) => <BatchCard key={b.id} batch={b} index={i} onEdit={setEditBatch} />)}
        </div>

        <AnimatePresence>{open && <NewBatchModal isOpen={open} onClose={() => setOpen(false)} onCreated={(b) => setBatches((x) => [b, ...x])} />}</AnimatePresence>
        {editBatch && <EditFullBatchModal batch={editBatch} onClose={() => setEditBatch(null)} onSaved={(updated) => setBatches((items) => items.map((b) => b.id === updated.id ? { ...b, ...updated } : b))} />}
      </PageWrapper>
    </AppShell>
  );
}
