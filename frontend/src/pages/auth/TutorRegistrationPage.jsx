import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, tutorApi, courseApi } from "../../services/api.js";
import {
  User, Briefcase, Clock, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle2, BookOpen, Shield, Check, AlertCircle
,
  PlayCircle} from "lucide-react";

const C = { dark:"#1F1A17", navy:"#003C6E", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

const STEPS = [
  { id:1, label:"Personal", icon:User },
  { id:2, label:"Professional", icon:Briefcase },
  { id:3, label:"Syllabus", icon:BookOpen },
  { id:4, label:"Availability", icon:Clock },
  { id:5, label:"Submit", icon:Shield },
];

const SESSION_TYPES = [
  { id:"THEORY", label:"Theory" },
  { id:"CAD", label:"CAD" },
  { id:"BOTH", label:"Theory + CAD" },
];


const OCCUPATION = ["Full-time Tutor","Working Professional","Freelancer","Retired Expert","Student (Post-grad)"];

const SHIFT_OPTIONS = [
  { id:"morning", label:"Morning" },
  { id:"afternoon", label:"Afternoon" },
  { id:"evening", label:"Evening" },
];

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function makeSession() {
  return { id: uid(), name: "", type: "BOTH" };
}

function makeProject() {
  return { id: uid(), name: "", highlights: [""] };
}

function addMinutes(time, mins = 60) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  d.setMinutes(d.getMinutes() + mins);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function to12(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2,"0")} ${p}`;
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color:C.dark }}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color:C.lg }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type="text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none"
      style={{ borderColor:"#e5e7eb", color:C.dark }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors outline-none"
      style={{ borderColor:"#e5e7eb", color:C.dark }}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white"
      style={{ borderColor:"#e5e7eb", color:value ? C.dark : C.lg }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: done ? C.primary : active ? `linear-gradient(135deg,${C.blue},${C.primary})` : "#f3f4f6",
                color: done || active ? "white" : C.lg,
              }}
            >
              {done ? <Check size={12}/> : s.id}
            </div>
            {active && <span className="text-xs font-bold hidden sm:block whitespace-nowrap" style={{ color:C.primary }}>{s.label}</span>}
            {i < STEPS.length - 1 && <div className="flex-1 h-1 rounded-full min-w-[6px]" style={{ background:done ? C.primary : "#e5e7eb" }}/>}
          </div>
        );
      })}
    </div>
  );
}

function OtpBox({ form, phoneToken, onVerified }) {
  const [otp,setOtp] = useState("");
  const [sending,setSending] = useState(false);
  const [verifying,setVerifying] = useState(false);
  const [sent,setSent] = useState(false);
  const [err,setErr] = useState("");

  const sendOtp = async () => {
    if (!form.phone) return setErr("Enter phone number first.");
    setSending(true);
    setErr("");
    try {
      await authApi.sendOtp(form.phone, "TUTOR_REGISTER");
      setSent(true);
    } catch (e) {
      setErr(e.message || "Failed to send OTP.");
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (otp.length < 6) return setErr("Enter complete 6 digit OTP.");
    setVerifying(true);
    setErr("");
    try {
      const res = await authApi.verifyOtp(form.phone, otp, "TUTOR_REGISTER");
      onVerified(res.data.phone_token);
    } catch (e) {
      setErr(e.message || "Invalid OTP.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor:"#bfdbfe", background:"#eff8ff" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color:C.dark }}>Phone Verification</p>
          <p className="text-xs" style={{ color:C.gray }}>Verify WhatsApp OTP before continuing.</p>
        </div>
        {phoneToken ? (
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-green-700 bg-green-100">
            <CheckCircle2 size={14}/> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}
          >
            {sending ? "Sending..." : sent ? "Resend OTP" : "Send OTP"}
          </button>
        )}
      </div>

      {sent && !phoneToken && (
        <div className="flex gap-2">
          <input
            value={otp}
            onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
            placeholder="Enter OTP"
            className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
            style={{ borderColor:"#bfdbfe" }}
          />
          <button
            type="button"
            onClick={verify}
            disabled={verifying}
            className="px-4 py-3 rounded-xl text-xs font-bold text-white"
            style={{ background:"#16a34a" }}
          >
            {verifying ? "..." : "Verify"}
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-600 font-semibold mt-2">{err}</p>}
    </div>
  );
}

function SyllabusBuilder({ sessions, setSessions, projects, setProjects }) {
  const addSession = () => setSessions((prev) => [...prev, makeSession()]);
  const updateSession = (id, key, val) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: val } : s)));
  const removeSession = (id) =>
    setSessions((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));

  const addProject = () => setProjects((prev) => [...prev, makeProject()]);
  const updateProject = (id, key, val) =>
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        if (key === "is_recorded") {
          return {
            ...p,
            is_recorded: val,
            sessions: val ? [] : (p.sessions && p.sessions.length ? p.sessions : [makeProjectSession()]),
            unlock_rule: val ? "FIRST_LIVE_PROJECT_START" : null,
          };
        }

        return { ...p, [key]: val };
      }),
    );

  const removeProject = (id) => setProjects((prev) => prev.filter((p) => p.id !== id));

  const updateProjectSession = (projectId, sessionId, value) =>
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          sessions: (p.sessions || []).map((s) =>
            s.id === sessionId ? { ...s, name: value } : s,
          ),
        };
      }),
    );

  const addProjectSession = (projectId) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, sessions: [...(p.sessions || []), makeProjectSession()] }
          : p,
      ),
    );

  const removeProjectSession = (projectId, sessionId) =>
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextSessions = (p.sessions || []).filter((s) => s.id !== sessionId);
        return { ...p, sessions: nextSessions.length ? nextSessions : [makeProjectSession()] };
      }),
    );

  const liveProjects = projects.filter((p) => !p.is_recorded).length;
  const recordedProjects = projects.filter((p) => p.is_recorded).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-extrabold" style={{ color: C.dark }}>Course Sessions</h3>
            <p className="text-xs" style={{ color: C.gray }}>Add every general live session in sequence.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#eff8ff", color: C.primary }}>
            {sessions.length} sessions
          </span>
        </div>

        <div className="space-y-3">
          {sessions.map((s, idx) => (
            <motion.div
              key={s.id}
              className="rounded-2xl border bg-white overflow-hidden"
              style={{ borderColor: "#e5e7eb" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f0f0f0", background: "#fafbff" }}>
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg,${C.navy},${C.primary})` }}
                >
                  {idx + 1}
                </span>
                <span className="text-xs font-bold flex-1" style={{ color: C.gray }}>Session {idx + 1}</span>
                {sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                <Input
                  value={s.name}
                  onChange={(e) => updateSession(s.id, "name", e.target.value)}
                  placeholder={`e.g. CATIA Surfacing Basics - Session ${idx + 1}`}
                />
                <div className="grid grid-cols-3 gap-2">
                  {SESSION_TYPES.map((t) => {
                    const sel = s.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateSession(s.id, "type", t.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                        style={{
                          borderColor: sel ? C.primary : "#e5e7eb",
                          background: sel ? "#eff8ff" : "white",
                          color: sel ? C.primary : C.gray,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSession}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold"
          style={{ borderColor: C.primary, color: C.primary, background: "#f0f8ff" }}
        >
          <Plus size={15} /> Add Next Session
        </button>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-extrabold" style={{ color: C.dark }}>Projects</h3>
            <p className="text-xs max-w-xl" style={{ color: C.gray }}>
              Tick Recorded Data for projects that students will practice from recordings. These projects will not increase live session schedule days.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#eff8ff", color: C.primary }}>
              {liveProjects} live
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
              {recordedProjects} recorded
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {projects.map((p, idx) => {
            const isRecorded = Boolean(p.is_recorded);
            return (
              <div key={p.id} className="rounded-2xl border p-4 bg-white" style={{ borderColor: isRecorded ? "#ede9fe" : "#dbeafe" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{ background: isRecorded ? "linear-gradient(135deg,#7c3aed,#a78bfa)" : `linear-gradient(135deg,${C.navy},${C.primary})` }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <Input value={p.name} onChange={(e) => updateProject(p.id, "name", e.target.value)} placeholder="Project name e.g. Map Pocket / Door Trim" />
                  </div>
                  <button type="button" onClick={() => removeProject(p.id)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>

                <label
                  className="flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer mb-3"
                  style={{
                    borderColor: isRecorded ? "#8b5cf6" : "#e5e7eb",
                    background: isRecorded ? "#f5f3ff" : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isRecorded}
                    onChange={(e) => updateProject(p.id, "is_recorded", e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-extrabold" style={{ color: isRecorded ? "#7c3aed" : C.dark }}>
                      Recorded Data
                    </span>
                    <span className="block text-xs leading-5 mt-1" style={{ color: C.gray }}>
                      This project will show in student syllabus as recorded practice and will not be included in live session schedule.
                    </span>
                  </span>
                </label>

                {isRecorded ? (
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: "#ede9fe", background: "#faf5ff" }}>
                    <p className="text-xs font-bold" style={{ color: C.dark }}>
                      Unlock date: same date when first live project starts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold" style={{ color: C.dark }}>Live project sessions</p>
                    {(p.sessions || []).map((session, sessionIndex) => (
                      <div key={session.id} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: "#eff8ff", color: C.primary }}>
                          {sessionIndex + 1}
                        </span>
                        <div className="flex-1">
                          <Input
                            value={session.name}
                            onChange={(e) => updateProjectSession(p.id, session.id, e.target.value)}
                            placeholder={`Project session ${sessionIndex + 1} e.g. Class-A analysis / Close body / B-side features`}
                          />
                        </div>
                        <button type="button" onClick={() => removeProjectSession(p.id, session.id)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addProjectSession(p.id)}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold"
                      style={{ borderColor: C.primary, color: C.primary, background: "#f0f8ff" }}
                    >
                      <Plus size={14} /> Add Project Session
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addProject}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold"
          style={{ borderColor: "#8b5cf6", color: "#8b5cf6", background: "#f5f3ff" }}
        >
          <Plus size={15} /> Add Project
        </button>
      </div>
    </div>
  );
}

function AvailabilityStep({
  slots, setSlots, draftStart, setDraftStart, draftEnd, setDraftEnd,
  form, setField, shiftPrefs, setShiftPrefs, availabilityErr, setAvailabilityErr
}) {
  const onStartChange = (value) => {
    setDraftStart(value);
    setDraftEnd(value ? addMinutes(value, 60) : "");
    setAvailabilityErr("");
  };

  const addSlot = () => {
    if (!draftStart || !draftEnd) {
      setAvailabilityErr("Please select start time first.");
      return;
    }
    if (draftStart >= draftEnd) {
      setAvailabilityErr("End time must be after start time.");
      return;
    }

    setSlots((prev)=>[
      ...prev,
      { id:uid(), start:draftStart, end:draftEnd, label:`${to12(draftStart)} – ${to12(draftEnd)}` },
    ]);

    setDraftStart("");
    setDraftEnd("");
    setAvailabilityErr("");
  };

  const toggleShift = (id) => setShiftPrefs((prev)=>prev.includes(id) ? prev.filter((x)=>x !== id) : [...prev, id]);

  return (
    <motion.div key="step4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
      <h2 className="text-2xl font-extrabold" style={{ color:C.dark }}>Availability</h2>

      <Field label="Available Class Slots" required hint="Select start time. End time will automatically become 60 minutes later. You can add multiple slots.">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <Input type="time" value={draftStart} onChange={(e)=>onStartChange(e.target.value)}/>
          <Input type="time" value={draftEnd} onChange={(e)=>setDraftEnd(e.target.value)}/>
          <button type="button" onClick={addSlot} className="px-5 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
            <Plus size={15}/> Add Slot
          </button>
        </div>

        {slots.length > 0 && (
          <div className="mt-3 space-y-2">
            {slots.map((slot,index)=>(
              <div key={slot.id} className="flex items-center gap-3 justify-between rounded-xl border bg-white px-4 py-3" style={{ borderColor:"#dbeafe" }}>
                <div>
                  <p className="text-sm font-bold" style={{ color:C.dark }}>Slot {index + 1}</p>
                  <p className="text-xs" style={{ color:C.gray }}>{slot.label}</p>
                </div>
                <button type="button" onClick={()=>setSlots((prev)=>prev.filter((x)=>x.id !== slot.id))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50">
                  <Trash2 size={14} className="text-red-500"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="Location" required>
        <Input value={form.location} onChange={(e)=>setField("location", e.target.value)} placeholder="Pune / Mumbai / Remote"/>
      </Field>

      <Field label="Languages">
        <Input value={form.languages} onChange={(e)=>setField("languages", e.target.value)} placeholder="Hindi, English, Marathi"/>
      </Field>

      <Field label="Are you working in shifts?">
        <Select value={form.workingInShifts} onChange={(e)=>{setField("workingInShifts", e.target.value); if (e.target.value !== "yes") setShiftPrefs([]);}} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} placeholder="Select yes or no"/>
      </Field>

      {form.workingInShifts === "yes" && (
        <Field label="Which shifts can you manage?" required>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SHIFT_OPTIONS.map((shift)=>{
              const checked = shiftPrefs.includes(shift.id);
              return (
                <button key={shift.id} type="button" onClick={()=>toggleShift(shift.id)} className="px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all" style={{ borderColor:checked ? C.primary : "#e5e7eb", background:checked ? "#eff8ff" : "white", color:checked ? C.primary : C.gray }}>
                  {checked ? "✓ " : ""}{shift.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <Field label="Hide Identity?">
        <Select value={form.hideIdentity} onChange={(e)=>setField("hideIdentity", e.target.value)} options={[{value:"no",label:"No, show my identity"},{value:"yes",label:"Yes, hide company identity"}]} placeholder="Select preference"/>
      </Field>

      {availabilityErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-semibold"><AlertCircle size={15}/>{availabilityErr}</div>}
    </motion.div>
  );
}

export default function TutorRegistrationPage() {
  const [step,setStep] = useState(1);
  const [submitted,setSubmitted] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [submitErr,setSubmitErr] = useState("");
  const [courses,setCourses] = useState([]);
  const [phoneToken,setPhoneToken] = useState("");
  const [sessions,setSessions] = useState([makeSession()]);
  const [projects,setProjects] = useState([]);
  const [slots,setSlots] = useState([]);
  const [draftStart,setDraftStart] = useState("");
  const [draftEnd,setDraftEnd] = useState("");
  const [shiftPrefs,setShiftPrefs] = useState([]);
  const [availabilityErr,setAvailabilityErr] = useState("");

  const [form,setForm] = useState({
    fullName:"",
    email:"",
    phone:"",
    course_id:"",
    occupationStatus:"",
    workExperience:"",
    companies:"",
    yearsExp:"",
    hideIdentity:"no",
    location:"",
    languages:"",
    workingInShifts:"no",
  });

  useEffect(()=>{courseApi.list().then((res)=>setCourses(res.data||[])).catch(()=>setCourses([]));},[]);

  const setField = (key,value) => {
    setSubmitErr("");
    setForm((v)=>({ ...v, [key]:value }));
  };

  const shiftSummary = useMemo(() => {
    if (form.workingInShifts !== "yes") return "No";
    if (!shiftPrefs.length) return "";
    return SHIFT_OPTIONS.filter((s)=>shiftPrefs.includes(s.id)).map((s)=>s.label).join(", ");
  }, [form.workingInShifts, shiftPrefs]);

  const timeSlotSummary = useMemo(()=>slots.map((slot)=>slot.label).join(", "), [slots]);

  const canNext = () => {
    if (step === 1) return Boolean(form.fullName && form.email && form.phone && phoneToken);
    if (step === 2) return Boolean(form.occupationStatus && form.yearsExp && form.course_id && form.workExperience);
    if (step === 3) return sessions.length > 0 && sessions.every((s)=>s.name.trim());
    if (step === 4) {
      const shiftsOk = form.workingInShifts !== "yes" || shiftPrefs.length > 0;
      return Boolean(slots.length > 0 && form.location && shiftsOk);
    }
    return true;
  };

  const goNext = () => {
    setSubmitErr("");
    if (canNext()) setStep((s)=>s + 1);
    else setSubmitErr("Please complete required fields before continuing.");
  };

  const submit = async () => {
    setSubmitErr("");
    if (!canNext()) return setSubmitErr("Please complete all required fields.");
    setSubmitting(true);

    try {
      const timeSlotsPayload = slots.map((slot)=>slot.label);
      if (form.workingInShifts === "yes" && shiftSummary) {
        timeSlotsPayload.push(`Working shifts: ${shiftSummary}`);
      }

      await tutorApi.apply({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        phone_token: phoneToken,
        occupation: form.occupationStatus,
        years_exp: Number(form.yearsExp) || 0,
        companies: form.companies || "Not specified",
        work_experience: form.workExperience,
        course_id: form.course_id,
        time_slots: timeSlotsPayload,
        hide_identity: form.hideIdentity === "yes",
        location: form.location,
        languages: form.languages ? form.languages.split(",").map((x)=>x.trim()).filter(Boolean) : [],
        syllabus_sessions: sessions.map((s,idx)=>({ session_number:idx+1, name:s.name.trim(), type:s.type || "BOTH" })),
        syllabus_projects: projects.filter((p)=>p.name.trim()).map((p)=>({ name:p.name.trim(), highlights:p.highlights.filter(Boolean) })),
      });

      setSubmitted(true);
    } catch (e) {
      setSubmitErr(e.message || "Application submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"linear-gradient(135deg,#f0f7ff 0%,#e8f4fd 100%)" }}>
        <motion.div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-sm w-full" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)" }}>
            <CheckCircle2 size={36} className="text-white"/>
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color:C.dark }}>Application Submitted!</h2>
          <p className="text-sm mb-6" style={{ color:C.gray }}>Admin will review your profile and activate your tutor login after approval.</p>
          <a href="/dct/auth/login" className="inline-block px-8 py-3 rounded-xl text-white text-sm font-bold" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>Back to Login</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(135deg,#f0f7ff 0%,#f9f9ff 100%)" }}>
      <div className="hidden lg:flex w-80 flex-col justify-between p-10 sticky top-0 self-start min-h-screen" style={{ background:`linear-gradient(160deg,${C.dark} 0%,${C.navy} 55%,${C.primary} 100%)` }}>
        <div>
          <div className="text-white font-black text-lg tracking-widest mb-10">DIGITAL CAD TRAINING</div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">Become a DCT Tutor</h1>
          <p className="text-sm leading-7 text-white/75">Apply as a trainer, add your syllabus, available slots and expertise for admin review.</p>
        </div>
        <div className="rounded-3xl bg-white/10 border border-white/15 p-5 text-white">
          <p className="text-sm font-bold mb-2">Review Process</p>
          <p className="text-xs leading-6 text-white/75">Admin checks profile, course, availability and syllabus before approval.</p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <a href="/dct/auth/login" className="inline-flex items-center text-sm mb-6" style={{ color:C.gray }}>← Back</a>
          <div className="bg-white rounded-[2rem] shadow-xl border border-blue-50 p-6 sm:p-8">
            <StepBar current={step}/>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
                  <h2 className="text-2xl font-extrabold" style={{ color:C.dark }}>Personal Details</h2>
                  <Field label="Full Name" required><Input value={form.fullName} onChange={(e)=>setField("fullName", e.target.value)} placeholder="Your full name"/></Field>
                  <Field label="Email" required><Input type="email" value={form.email} onChange={(e)=>setField("email", e.target.value)} placeholder="you@example.com"/></Field>
                  <Field label="Phone" required><Input value={form.phone} onChange={(e)=>setField("phone", e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10 digit WhatsApp number"/></Field>
                  <OtpBox form={form} phoneToken={phoneToken} onVerified={setPhoneToken}/>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
                  <h2 className="text-2xl font-extrabold" style={{ color:C.dark }}>Professional Details</h2>
                  <Field label="Occupation" required><Select value={form.occupationStatus} onChange={(e)=>setField("occupationStatus", e.target.value)} options={OCCUPATION} placeholder="Select occupation"/></Field>
                  <Field label="Years of Experience" required><Input type="number" value={form.yearsExp} onChange={(e)=>setField("yearsExp", e.target.value)} placeholder="12"/></Field>
                  <Field label="Course You Want To Teach" required><Select value={form.course_id} onChange={(e)=>setField("course_id", e.target.value)} options={courses.map((c)=>({ value:c.id, label:c.name }))} placeholder={courses.length ? "Select course" : "Loading courses..."}/></Field>
                  <Field label="Companies Worked With"><Input value={form.companies} onChange={(e)=>setField("companies", e.target.value)} placeholder="Tata, Mahindra, Tier-1 suppliers..."/></Field>
                  <Field label="Work Experience" required><Textarea value={form.workExperience} onChange={(e)=>setField("workExperience", e.target.value)} placeholder="Write your design/domain experience..."/></Field>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
                  <h2 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Syllabus Builder</h2>
                  <p className="text-sm mb-6" style={{ color:C.gray }}>Add course sessions and optional projects.</p>
                  <SyllabusBuilder sessions={sessions} setSessions={setSessions} projects={projects} setProjects={setProjects}/>
                </motion.div>
              )}

              {step === 4 && (
                <AvailabilityStep
                  slots={slots}
                  setSlots={setSlots}
                  draftStart={draftStart}
                  setDraftStart={setDraftStart}
                  draftEnd={draftEnd}
                  setDraftEnd={setDraftEnd}
                  form={form}
                  setField={setField}
                  shiftPrefs={shiftPrefs}
                  setShiftPrefs={setShiftPrefs}
                  availabilityErr={availabilityErr}
                  setAvailabilityErr={setAvailabilityErr}
                />
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
                  <h2 className="text-2xl font-extrabold" style={{ color:C.dark }}>Review & Submit</h2>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                    <p className="text-sm"><strong>Name:</strong> {form.fullName}</p>
                    <p className="text-sm"><strong>Email:</strong> {form.email}</p>
                    <p className="text-sm"><strong>Sessions:</strong> {sessions.length}</p>
                    <p className="text-sm"><strong>Live Project Sessions:</strong> {liveProjectSessions}</p>
                    <p className="text-sm"><strong>Recorded Projects:</strong> {recordedProjectCount}</p>
                    <p className="text-sm"><strong>Available Slots:</strong> {timeSlotSummary || "—"}</p>
                    <p className="text-sm"><strong>Working in shifts:</strong> {shiftSummary || "—"}</p>
                  </div>

                  {submitErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-semibold"><AlertCircle size={15}/>{submitErr}</div>}

                  <button onClick={submit} disabled={submitting} className="w-full py-3.5 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>
                    {submitting ? "Submitting..." : "Submit Tutor Application"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8">
              <button type="button" onClick={()=>{ setSubmitErr(""); setStep((s)=>Math.max(1, s-1)); }} disabled={step===1} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border disabled:opacity-40 bg-white" style={{ color:C.gray, borderColor:"#e5e7eb" }}>
                <ChevronLeft size={15}/> Back
              </button>
              {step < 5 && <button type="button" onClick={goNext} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>Next <ChevronRight size={15}/></button>}
            </div>

            {submitErr && step !== 5 && <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-semibold text-red-600">{submitErr}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
