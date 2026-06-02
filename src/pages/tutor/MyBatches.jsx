import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { Plus, Users, BookOpen, Calendar, Clock, X, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { batchApi, courseApi } from "../../services/api.js";

function buildBatchName(courseName, startDate) {
  if (!courseName || !startDate) return "";
  const d = new Date(startDate);
  return `${courseName} - ${d.getDate()} ${d.toLocaleString("en-IN", { month: "long" })} ${String(d.getFullYear()).slice(2)}`;
}

function to12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function makeSlot(start, end) {
  if (!start || !end) return "";
  return `${to12Hour(start)} – ${to12Hour(end)}`;
}

function NewBatchModal({ isOpen, onClose, onCreated }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    course_id: "",
    start_date: "",
    max_students: 50,
    start_time: "",
    end_time: "",
    alt_days: false,
    sunday_off: true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    courseApi.list().then(r => setCourses(r.data || [])).catch(() => setCourses([]));
  }, [isOpen]);

  const selectedCourse = courses.find(c => c.id === form.course_id);
  const batchName = buildBatchName(selectedCourse?.name, form.start_date);
  const slot = makeSlot(form.start_time, form.end_time);
  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const reset = () => {
    setForm({ course_id:"", start_date:"", max_students:50, start_time:"", end_time:"", alt_days:false, sunday_off:true });
    setErr("");
  };

  const handleSubmit = async () => {
    setErr("");
    if (!form.course_id) return setErr("Please select a course.");
    if (!form.start_date) return setErr("Please select batch start date.");
    if (!form.start_time || !form.end_time) return setErr("Please select class start and end time.");
    if (form.start_time >= form.end_time) return setErr("End time must be later than start time.");

    setLoading(true);
    try {
      const res = await batchApi.create({
        course_id: form.course_id,
        start_date: form.start_date,
        max_students: Number(form.max_students) || 50,
        time_slots: [slot],
        alt_days: form.alt_days,
        sunday_off: form.sunday_off,
      });
      onCreated(res.data);
      reset();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to create batch.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[92vh] flex flex-col" initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}>
        <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-dct-dark">Create New Batch</h2>
              <p className="text-xs text-dct-lightgray mt-0.5">Sessions will be auto-scheduled from your approved syllabus</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
              <X size={16}/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase tracking-wider">Course *</label>
            <select value={form.course_id} onChange={e => setField("course_id", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none bg-white">
              <option value="">{courses.length === 0 ? "Loading courses..." : "Select a course"}</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase tracking-wider">Batch Start Date *</label>
            <input type="date" value={form.start_date} min={new Date().toISOString().split("T")[0]} onChange={e => setField("start_date", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none" />
          </div>

          {batchName && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} className="rounded-xl p-4 border border-blue-200" style={{ background:"#eff8ff" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Batch name auto-generated</p>
              <p className="text-sm font-bold text-dct-dark">{batchName}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-bold text-dct-gray mb-2 uppercase tracking-wider">Class Timing *</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-dct-lightgray mb-1"><Clock size={12}/> Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setField("start_time", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-dct-lightgray mb-1"><Clock size={12}/> End Time</label>
                <input type="time" value={form.end_time} onChange={e => setField("end_time", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none" />
              </div>
            </div>
            {slot && <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border border-blue-200" style={{ background:"#eff8ff", color:"#007BBF" }}><Clock size={12}/> {slot}</div>}
          </div>

          <div>
            <label className="block text-xs font-bold text-dct-gray mb-2 uppercase tracking-wider">Schedule Options</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setField("alt_days", !form.alt_days)} className="flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.alt_days ? "#007BBF" : "#e5e7eb", background: form.alt_days ? "#eff8ff" : "white" }}>
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${form.alt_days ? "bg-dct-primary" : "border-2 border-gray-300"}`} />
                <div><p className="text-xs font-bold text-dct-dark">Alternate Days</p><p className="text-[10px] text-dct-lightgray">Session every 2 days</p></div>
              </button>
              <button type="button" onClick={() => setField("sunday_off", !form.sunday_off)} className="flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.sunday_off ? "#007BBF" : "#e5e7eb", background: form.sunday_off ? "#eff8ff" : "white" }}>
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${form.sunday_off ? "bg-dct-primary" : "border-2 border-gray-300"}`} />
                <div><p className="text-xs font-bold text-dct-dark">Sunday Off</p><p className="text-[10px] text-dct-lightgray">Skip Sundays</p></div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dct-gray mb-1.5 uppercase tracking-wider">Max Students</label>
            <input type="number" value={form.max_students} min={1} max={200} onChange={e => setField("max_students", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none" />
          </div>

          {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm text-center">{err}</p></div>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all hover:-translate-y-0.5" style={{ background:"linear-gradient(135deg,#024981,#007BBF)", boxShadow:"0 4px 16px rgba(0,123,191,0.3)" }}>
            {loading ? "Creating batch..." : "Submit for Admin Approval →"}
          </button>
          <p className="text-center text-xs text-dct-lightgray mt-2">Admin reviews → approves → students can enroll</p>
        </div>
      </motion.div>
    </div>
  );
}

function deriveBatchStatus(batch) {
  if (batch.status === "PENDING_APPROVAL") return "PENDING_APPROVAL";
  const now = new Date();
  const start = batch.start_date ? new Date(batch.start_date) : null;
  const end = batch.end_date ? new Date(batch.end_date) : null;
  if (start && end) {
    if (now < start) return "UPCOMING";
    if (now > end) return "COMPLETED";
    return "ACTIVE";
  }
  return batch.status || "UPCOMING";
}

function BatchCard({ batch, index }) {
  const navigate = useNavigate();
  const realStatus = deriveBatchStatus(batch);
  const STATUS = {
    PENDING_APPROVAL: { bg:"bg-yellow-50", text:"text-yellow-700", border:"border-yellow-200", label:"Pending Approval" },
    UPCOMING: { bg:"bg-blue-50", text:"text-blue-700", border:"border-blue-200", label:"Upcoming" },
    ACTIVE: { bg:"bg-green-50", text:"text-green-700", border:"border-green-200", label:"Active" },
    COMPLETED: { bg:"bg-gray-50", text:"text-gray-600", border:"border-gray-200", label:"Completed" },
  }[realStatus] || { bg:"bg-gray-50", text:"text-gray-600", border:"border-gray-200", label:realStatus };

  const enrolled = batch._count?.enrollments || 0;
  const sessions = batch._count?.scheduled_sessions || 0;
  const pct = Math.round((enrolled / (batch.max_students || 1)) * 100);
  const slots = batch.time_slots || [];
  const isApproved = realStatus !== "PENDING_APPROVAL";

  return (
    <motion.div className={`bg-white rounded-2xl border border-gray-100 p-5 transition-all ${isApproved ? "cursor-pointer hover:shadow-lg hover:border-dct-primary/30" : ""}`} style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)", position:"relative" }} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:index*0.07 }} whileHover={isApproved ? { y:-3 } : {}} onClick={() => { if (isApproved) navigate(`/tutor/batches/${batch.id}/sessions`); }}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS.bg} ${STATUS.text} ${STATUS.border}`}>{STATUS.label}</span>
        <span className="text-[10px] text-dct-lightgray">{new Date(batch.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
      </div>
      <h3 className="font-extrabold text-dct-dark text-sm mb-0.5 leading-snug">{batch.name}</h3>
      <p className="text-xs text-dct-lightgray mb-3">{batch.course?.name}</p>
      {slots.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{slots.map(s => <span key={s} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background:"#eff8ff", color:"#007BBF" }}><Clock size={9}/> {s}</span>)}</div>}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border border-gray-100 rounded-lg p-2.5"><p className="text-xs font-bold text-dct-dark">{new Date(batch.start_date).toLocaleDateString("en-IN")}</p><p className="text-[10px] text-dct-lightgray">Start Date</p></div>
        <div className="border border-gray-100 rounded-lg p-2.5"><p className="text-xs font-bold text-dct-dark">{new Date(batch.end_date).toLocaleDateString("en-IN")}</p><p className="text-[10px] text-dct-lightgray">End Date</p></div>
      </div>
      <div className="flex items-center gap-4 text-xs text-dct-gray mb-3">
        <span className="flex items-center gap-1"><Users size={11}/> {enrolled}/{batch.max_students}</span>
        <span className="flex items-center gap-1"><BookOpen size={11}/> {sessions} sessions</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4"><div className="h-full rounded-full bg-dct-primary transition-all" style={{ width:`${pct}%` }}/></div>
      {isApproved ? (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100"><span className="text-xs font-bold text-dct-primary">View Sessions</span><div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:"linear-gradient(135deg,#024981,#007BBF)" }}><ChevronRight size={13} color="white" /></div></div>
      ) : (
        <div className="pt-3 border-t border-gray-100"><span className="text-[10px] text-yellow-600 font-semibold">⏳ Waiting for admin approval before sessions are accessible</span></div>
      )}
    </motion.div>
  );
}

export default function MyBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    batchApi.mine().then(r => setBatches(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? batches : batches.filter(b => deriveBatchStatus(b) === filter);
  const pendingCount = batches.filter(b => deriveBatchStatus(b) === "PENDING_APPROVAL").length;

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark mb-1">My Batches</h1>
            <p className="text-sm text-dct-gray">{pendingCount > 0 && <span className="text-yellow-600 font-bold">{pendingCount} awaiting approval · </span>}{batches.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-dct-gray"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5" style={{ background:"linear-gradient(135deg,#024981,#007BBF)", boxShadow:"0 4px 16px rgba(0,123,191,0.3)" }}><Plus size={16}/> New Batch</button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-6 flex-wrap">{[["ALL","All"],["PENDING_APPROVAL","Pending"],["UPCOMING","Upcoming"],["ACTIVE","Active"],["COMPLETED","Completed"]].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: filter === key ? "linear-gradient(135deg,#024981,#007BBF)" : "#f3f4f6", color: filter === key ? "white" : "#6A6B6D" }}>{label}</button>)}</div>
        {loading && <div className="text-center py-16 text-dct-gray text-sm">Loading batches...</div>}
        {!loading && filtered.length === 0 && <div className="bg-white rounded-2xl p-16 text-center border border-gray-100"><Calendar size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-bold text-dct-dark">No batches yet</p><p className="text-sm text-dct-gray mt-1 mb-5">Create your first batch to get started</p><button onClick={() => setModalOpen(true)} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background:"linear-gradient(135deg,#024981,#007BBF)" }}><Plus size={14} className="inline mr-1"/> Create Batch</button></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((batch, i) => <BatchCard key={batch.id} batch={batch} index={i}/>)}</div>
        <AnimatePresence>{modalOpen && <NewBatchModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={newBatch => setBatches(b => [newBatch, ...b])}/>}</AnimatePresence>
      </PageWrapper>
    </AppShell>
  );
}
