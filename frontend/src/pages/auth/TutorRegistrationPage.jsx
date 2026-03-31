import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, tutorApi, courseApi } from "../../services/api.js";
import {
  User, Mail, Phone, Briefcase, Building2, Clock, MapPin,
  Eye, EyeOff, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle2, X, BookOpen, Layers, Shield, Send, Check,
  GraduationCap, Info, AlertCircle
} from "lucide-react";

// ─── Brand ─────────────────────────────────────────────────
const C = {
  dark: "#1F1A17", navy: "#003C6E", blue: "#024981",
  primary: "#007BBF", gray: "#6A6B6D", lg: "#7E7F81",
};

// ─── Steps ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Personal",     icon: User },
  { id: 2, label: "Professional", icon: Briefcase },
  { id: 3, label: "Syllabus",     icon: BookOpen },
  { id: 4, label: "Availability", icon: Clock },
  { id: 5, label: "Preferences",  icon: Shield },
];

const TIME_SLOTS = [
  { id: "s1", label: "8:00 – 9:00 PM" },
  { id: "s2", label: "8:30 – 9:30 PM" },
  { id: "s3", label: "9:00 – 10:00 PM" },
  { id: "s4", label: "9:30 – 10:30 PM" },
  { id: "s5", label: "Need to Discuss" },
];

const LANGUAGES = [
  { id: "hindi",    label: "Hindi",     hasRating: true },
  { id: "english",  label: "English",   hasRating: true },
  { id: "marathi",  label: "Marathi",   hasRating: false },
  { id: "telugu",   label: "Telugu",    hasRating: false },
  { id: "malayalam",label: "Malayalam", hasRating: false },
  { id: "kannada",  label: "Kannada",   hasRating: false },
];

const PROFICIENCY = ["Beginner", "Intermediate", "Native"];
const SESSION_TYPES = [
  { id: "theory",   label: "Theory" },
  { id: "cad",      label: "CAD" },
  { id: "combined", label: "Theory + CAD" },
];
const OCCUPATION = ["Full-time Tutor","Working Professional","Freelancer","Retired Expert","Student (Post-grad)"];

// ─── Tiny reusable inputs ───────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold mb-1.5" style={{ color: C.dark }}>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: C.lg }}>{hint}</p>}
    </div>
  );
}

function TInput({ placeholder, value, onChange, type = "text", readOnly = false, right }) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        readOnly={readOnly}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none"
        style={{ borderColor: "#e5e7eb", color: C.dark, background: readOnly ? "#f9fafb" : "white" }}
        onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
        onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
      />
      {right && <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">{right}</span>}
    </div>
  );
}

function TTextarea({ placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors outline-none"
      style={{ borderColor: "#e5e7eb", color: C.dark }}
      onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
      onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function TSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none cursor-pointer transition-colors"
        style={{ borderColor: "#e5e7eb", color: value ? C.dark : C.lg }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: C.lg }}>▾</span>
    </div>
  );
}

// ─── OTP Modal ──────────────────────────────────────────────
function OTPModal({ phone, onVerify, onClose }) {
  const [otp, setOtp]         = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr]         = useState("");
  const [countdown, setCountdown] = useState(0);
  const refs = useRef([]);

  // Send OTP when modal opens
  useEffect(() => {
    sendOtp();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async () => {
    setSending(true); setErr("");
    try {
      await authApi.sendOtp(phone, "TUTOR_REGISTER");
      setCountdown(60);
    } catch (e) {
      setErr(e.message || "Failed to send OTP.");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...otp]; n[i] = v; setOtp(n);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) return setErr("Enter the complete 6-digit OTP.");
    setLoading(true); setErr("");
    try {
      const res = await authApi.verifyOtp(phone, otpString, "TUTOR_REGISTER");
      onVerify(res.data.phone_token); // pass phone_token back to parent
      onClose();
    } catch (e) {
      setErr(e.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 z-10"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
          <X size={15} style={{ color: C.gray }} />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>
            <Phone size={22} className="text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: C.dark }}>Verify Phone Number</h3>
          <p className="text-sm" style={{ color: C.gray }}>
            {sending ? "Sending OTP…" : <>OTP sent to <strong style={{ color: C.dark }}>{phone}</strong></>}
          </p>
          <p className="text-xs mt-1" style={{ color: C.lg }}>Check backend terminal for OTP in dev mode</p>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {otp.map((v, i) => (
            <input key={i} ref={el => refs.current[i] = el} value={v} maxLength={1}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all"
              style={{ borderColor: v ? C.primary : "#e5e7eb", color: C.dark, background: v ? "#eff8ff" : "white" }}
            />
          ))}
        </div>
        {err && <p className="text-red-500 text-sm text-center mb-3">{err}</p>}
        <button onClick={handleVerify} disabled={loading}
          className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: C.gray }}>
          {countdown > 0
            ? `Resend in ${countdown}s`
            : <button onClick={sendOtp} disabled={sending} className="font-bold" style={{ color: C.primary }}>
                {sending ? "Sending…" : "Resend OTP"}
              </button>
          }
        </p>
      </motion.div>
    </div>
  );
}

// ─── SYLLABUS MODAL (fully self-contained, no routing) ──────
function SyllabusModal({ isOpen, onClose, sessions, setSessions, projects, setProjects }) {
  const sessionListRef = useRef(null);

  // Always start with at least one session when opened
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      setSessions([makeSession()]);
    }
  }, [isOpen]);

  function makeSession() {
    return { id: Date.now() + Math.random(), name: "", types: [] };
  }
  function makeProject() {
    return { id: Date.now() + Math.random(), name: "", highlights: [""] };
  }

  const addSession = () => {
    const newSession = makeSession();
    setSessions(s => [...s, newSession]);
    // scroll to bottom after render
    setTimeout(() => {
      sessionListRef.current?.scrollTo({ top: sessionListRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
  };

  const removeSession = id => setSessions(s => s.filter(x => x.id !== id));

  const updateSession = (id, key, val) =>
    setSessions(s => s.map(x => x.id === id ? { ...x, [key]: val } : x));

  const toggleType = (id, type) =>
    setSessions(s => s.map(x => {
      if (x.id !== id) return x;
      const types = x.types.includes(type) ? x.types.filter(t => t !== type) : [...x.types, type];
      return { ...x, types };
    }));

  const addProject = () => setProjects(p => [...p, makeProject()]);
  const removeProject = id => setProjects(p => p.filter(x => x.id !== id));
  const updateProject = (id, key, val) =>
    setProjects(p => p.map(x => x.id === id ? { ...x, [key]: val } : x));
  const addHighlight = id =>
    setProjects(p => p.map(x => x.id === id ? { ...x, highlights: [...x.highlights, ""] } : x));
  const updateHighlight = (id, i, val) =>
    setProjects(p => p.map(x => {
      if (x.id !== id) return x;
      const h = [...x.highlights]; h[i] = val; return { ...x, highlights: h };
    }));
  const removeHighlight = (id, i) =>
    setProjects(p => p.map(x => {
      if (x.id !== id) return x;
      return { ...x, highlights: x.highlights.filter((_, j) => j !== i) };
    }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop — click outside to close */}
      <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />

      {/* Modal container */}
      <motion.div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        // CRITICAL: stop any clicks inside from bubbling to backdrop
        onClick={e => e.stopPropagation()}>

        {/* ── Header (fixed) ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold" style={{ color: C.dark }}>Course Syllabus Builder</h2>
              <p className="text-xs" style={{ color: C.gray }}>Add sessions and projects for your course</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={16} style={{ color: C.gray }} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div ref={sessionListRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-8 min-h-0">

          {/* ────── SESSIONS SECTION ────── */}
          <div>
            {/* Section label - button moved to BOTTOM of list */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: C.primary }} />
              <span className="text-sm font-extrabold" style={{ color: C.dark }}>Sessions</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "#eff8ff", color: C.primary }}>{sessions.length}</span>
            </div>

            {/* Session cards */}
            <div className="space-y-3">
              {sessions.map((s, idx) => (
                <motion.div key={s.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "#e5e7eb", background: "#fafbff" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}>

                  {/* Session row header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f0f0f0" }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.primary})` }}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold flex-1" style={{ color: C.gray }}>
                      Session {idx + 1}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); removeSession(s.id); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    )}
                  </div>

                  {/* Session inputs */}
                  <div className="p-4 space-y-3">
                    <TInput
                      placeholder={`e.g. CATIA Surfacing Basics – Session ${idx + 1}`}
                      value={s.name}
                      onChange={e => updateSession(s.id, "name", e.target.value)}
                    />

                    {/* Type checkboxes */}
                    <div>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: C.lg }}>Session Type</p>
                      <div className="flex flex-wrap gap-2">
                        {SESSION_TYPES.map(t => {
                          const sel = s.types.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleType(s.id, t.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                              style={{
                                borderColor: sel ? C.primary : "#e5e7eb",
                                background: sel ? "#eff8ff" : "white",
                                color: sel ? C.primary : C.gray,
                              }}>
                              {sel && <Check size={10} />}
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Next Session button – lives at bottom of list, scrolls with content */}
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); addSession(); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ borderColor: C.primary, color: C.primary, background: "#f0f8ff" }}>
              <Plus size={15} /> Add Next Session
            </button>
          </div>

          {/* ────── DIVIDER ────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#f0f0f0" }} />
            <span className="text-[10px] font-black px-3 py-1 rounded-full tracking-widest"
              style={{ background: "#f3f4f6", color: C.lg }}>PROJECTS</span>
            <div className="flex-1 h-px" style={{ background: "#f0f0f0" }} />
          </div>

          {/* ────── PROJECTS SECTION ────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }} />
              <span className="text-sm font-extrabold" style={{ color: C.dark }}>Projects</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "#f5f3ff", color: "#8b5cf6" }}>{projects.length}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#fef9c3", color: "#854d0e" }}>Optional</span>
            </div>

            <div className="space-y-3">
              {projects.map((p, idx) => (
                <motion.div key={p.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "#ede9fe", background: "#fdfcff" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}>

                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f5f0ff" }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold flex-1" style={{ color: C.gray }}>Project {idx + 1}</span>
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); removeProject(p.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <TInput
                      placeholder="Project name (e.g. Car Door Panel Design)"
                      value={p.name}
                      onChange={e => updateProject(p.id, "name", e.target.value)}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold" style={{ color: C.lg }}>
                          Project Highlights / Topics <span className="font-normal">(optional)</span>
                        </p>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); addHighlight(p.id); }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                          style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {p.highlights.map((h, hi) => (
                          <div key={hi} className="flex gap-2">
                            <div className="flex-1">
                              <TInput
                                placeholder={`Topic ${hi + 1} (e.g. Surface Modeling)`}
                                value={h}
                                onChange={e => updateHighlight(p.id, hi, e.target.value)}
                              />
                            </div>
                            {p.highlights.length > 1 && (
                              <button
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); removeHighlight(p.id, hi); }}
                                className="w-11 flex items-center justify-center rounded-xl border hover:bg-red-50 transition-colors flex-shrink-0"
                                style={{ borderColor: "#e5e7eb" }}>
                                <X size={12} className="text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Project button – at bottom of projects list */}
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); addProject(); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ borderColor: "#8b5cf6", color: "#8b5cf6", background: "#f5f3ff" }}>
              <Plus size={15} /> Add Project
            </button>
          </div>

          {/* bottom padding */}
          <div className="h-4" />
        </div>

        {/* ── Footer (fixed) ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          <p className="text-xs font-semibold" style={{ color: C.gray }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>
            <CheckCircle2 size={15} /> Save Syllabus
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Step Progress ──────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300`}
              style={{
                background: done ? C.primary : active ? `linear-gradient(135deg, ${C.blue}, ${C.primary})` : "#f3f4f6",
                color: done || active ? "white" : C.lg,
                boxShadow: active ? `0 4px 12px ${C.primary}44` : "none",
              }}>
              {done ? <Check size={12} /> : s.id}
            </div>
            {active && (
              <motion.span className="text-xs font-bold hidden sm:block whitespace-nowrap"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: C.primary }}>{s.label}</motion.span>
            )}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-1 rounded-full min-w-[6px]"
                style={{ background: done ? C.primary : "#e5e7eb" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Language Selector ──────────────────────────────────────
function LangRow({ lang, selected, proficiency, onToggle, onProficiency }) {
  return (
    <button type="button"
      onClick={e => { e.preventDefault(); onToggle(lang.id); }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
      style={{
        borderColor: selected ? C.primary : "#e5e7eb",
        background: selected ? "#eff8ff" : "white",
      }}>
      <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{ borderColor: selected ? C.primary : "#d1d5db", background: selected ? C.primary : "white" }}>
        {selected && <Check size={10} className="text-white" />}
      </div>
      <span className="text-sm font-semibold flex-1" style={{ color: selected ? C.primary : C.dark }}>
        {lang.label}
      </span>
      {selected && lang.hasRating && (
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {PROFICIENCY.map(p => (
            <button key={p} type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onProficiency(lang.id, p); }}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold border-2 transition-all"
              style={{
                borderColor: proficiency === p ? C.primary : "#e5e7eb",
                background: proficiency === p ? C.primary : "white",
                color: proficiency === p ? "white" : C.gray,
              }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────
export default function TutorRegistrationPage() {
  const [step, setStep]           = useState(1);
  const [otpOpen, setOtpOpen]     = useState(false);
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneToken, setPhoneToken] = useState(""); // from OTP verify
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [courses, setCourses]     = useState([]);

  // sessions & projects lifted to parent so they persist across open/close
  const [sessions, setSessions]   = useState([]);
  const [projects, setProjects]   = useState([]);

  const [form, setForm] = useState({
    fullName:"", email:"", phone:"",
    course_id:"",
    occupationStatus:"", workExperience:"", companies:"", yearsExp:"",
    timeSlots:[],
    hideIdentity:"", location:"",
    languages:{}, langProficiency:{},
  });

  // Load courses from backend
  useEffect(() => {
    courseApi.list()
      .then(res => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, []);

  const set  = k => e => setForm(v => ({ ...v, [k]: e?.target ? e.target.value : e }));
  const toggleSlot = id => setForm(v => ({
    ...v,
    timeSlots: v.timeSlots.includes(id) ? v.timeSlots.filter(x => x !== id) : [...v.timeSlots, id],
  }));
  const toggleLang = id => setForm(v => ({ ...v, languages: { ...v.languages, [id]: !v.languages[id] } }));
  const setLangProf = (id, p) => setForm(v => ({ ...v, langProficiency: { ...v.langProficiency, [id]: p } }));

  const totalSyllabus = sessions.length + projects.length;

  const canNext = () => {
    if (step === 1) return form.fullName && form.email && form.phone && phoneVerified;
    if (step === 2) return form.occupationStatus && form.yearsExp && form.course_id;
    if (step === 3) return sessions.length > 0 && sessions.every(s => s.name.trim());
    return true;
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)", fontFamily: "'DM Sans',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <motion.div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle2 size={36} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: C.dark }}>Application Submitted!</h2>
          <p className="text-sm mb-1" style={{ color: C.gray }}>Sent for admin review. You'll receive login credentials once approved.</p>
          <div className="my-6 p-4 rounded-2xl" style={{ background: "#f0f7ff" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: C.gray }}>Reference ID</p>
            <p className="text-xl font-black" style={{ color: C.primary }}>DCT-TUT-{Math.floor(Math.random()*90000+10000)}</p>
          </div>
          <p className="text-xs mb-6" style={{ color: C.lg }}>
            <strong style={{ color: C.dark }}>{sessions.length} sessions</strong> · <strong style={{ color: C.dark }}>{projects.length} projects</strong> submitted for review
          </p>
          <a href="/dct/auth/login"
            className="inline-block px-8 py-3 rounded-xl text-white text-sm font-bold hover:-translate-y-0.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>
            Back to Login
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans',sans-serif", alignItems: "flex-start" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-72 xl:w-80 flex-col justify-between p-10 relative overflow-hidden flex-shrink-0 sticky top-0 self-start" style={{ minHeight: "100vh" }}
        style={{ background: `linear-gradient(160deg, ${C.dark} 0%, ${C.navy} 55%, ${C.primary} 100%)` }}>
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full" style={{ background: "rgba(0,123,191,0.15)" }} />
        <div className="absolute top-16 -left-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>D</div>
            <span className="text-white font-bold tracking-widest text-sm">
              DIGITAL<span style={{ color: "#5bb8e8" }}>CAD</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
            Join as an<br />Expert Tutor
          </h1>
          <p className="text-white/55 text-sm mb-10 leading-relaxed">
            Share your expertise with 300+ aspiring CAD engineers. Admin reviews your profile before activation.
          </p>

          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const done = i + 1 < step, active = i + 1 === step;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: done ? C.primary : active ? "rgba(0,123,191,0.35)" : "rgba(255,255,255,0.08)" }}>
                    {done ? <Check size={13} className="text-white" /> : <s.icon size={14} className="text-white/60" />}
                  </div>
                  <span className="text-sm font-semibold transition-all"
                    style={{ color: active ? "white" : done ? "#5bb8e8" : "rgba(255,255,255,0.35)" }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-white/25 text-xs relative z-10">© 2025 DigitalCAD Training</p>
      </div>

      {/* ── Right – form ── */}
      <div className="flex-1 flex flex-col"
        style={{ background: "linear-gradient(135deg, #f0f7ff 0%, #f9f9ff 100%)" }}>
        <div className="px-5 sm:px-10 lg:px-14 py-10 pb-24 max-w-xl mx-auto w-full">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})` }}>D</div>
            <span className="font-black text-sm" style={{ color: C.dark }}>
              DIGITAL<span style={{ color: C.primary }}>CAD</span>
            </span>
          </div>

          <StepBar current={step} />

          <AnimatePresence mode="wait">

            {/* ═══ STEP 1 – Personal ═══ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>Personal Information</h2>
                <p className="text-sm mb-7" style={{ color: C.gray }}>Start with your basic contact details</p>

                <div className="space-y-5">
                  <Field label="Full Name" required>
                    <TInput placeholder="e.g. Balkrishna Dhuri" value={form.fullName}
                      onChange={e => setForm(v => ({ ...v, fullName: e.target.value }))} />
                  </Field>
                  <Field label="Email Address" required>
                    <TInput type="email" placeholder="your@email.com" value={form.email}
                      onChange={e => setForm(v => ({ ...v, email: e.target.value }))} />
                  </Field>
                  <Field label="Phone Number" required hint="A 6-digit OTP will be sent for verification">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <TInput placeholder="+91 XXXXXXXXXX" value={form.phone}
                          onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                          right={phoneVerified ? <CheckCircle2 size={15} className="text-green-500" /> : null} />
                      </div>
                      <button type="button"
                        onClick={() => form.phone && setOtpOpen(true)}
                        disabled={!form.phone}
                        className="px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap disabled:opacity-40"
                        style={{
                          background: phoneVerified ? "#f0fdf4" : `linear-gradient(135deg, ${C.blue}, ${C.primary})`,
                          color: phoneVerified ? "#16a34a" : "white",
                          border: phoneVerified ? "2px solid #86efac" : "none",
                        }}>
                        {phoneVerified ? "✓ Verified" : "Send OTP"}
                      </button>
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2 – Professional ═══ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>Professional Background</h2>
                <p className="text-sm mb-7" style={{ color: C.gray }}>Tell us and students about your expertise</p>

                <div className="space-y-5">
                  {/* Course applying for */}
                  <Field label="Course You're Applying to Teach" required>
                    <div className="relative">
                      <select value={form.course_id}
                        onChange={e => setForm(v => ({ ...v, course_id: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none cursor-pointer transition-colors"
                        style={{ borderColor: "#e5e7eb", color: form.course_id ? C.dark : C.lg }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                        <option value="">{courses.length === 0 ? "Loading courses…" : "Select a course"}</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: C.lg }}>▾</span>
                    </div>
                  </Field>

                  <Field label="Current Occupation Status" required>
                    <TSelect value={form.occupationStatus}
                      onChange={e => setForm(v => ({ ...v, occupationStatus: e.target.value }))}
                      options={OCCUPATION} placeholder="Select your occupation" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Years of Experience" required>
                      <TInput type="number" placeholder="e.g. 8" value={form.yearsExp}
                        onChange={e => setForm(v => ({ ...v, yearsExp: e.target.value }))} />
                    </Field>
                    <Field label="Companies Worked At">
                      <TInput placeholder="e.g. Tata Motors, L&T" value={form.companies}
                        onChange={e => setForm(v => ({ ...v, companies: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Work Experience" hint="Describe your professional background and specialisation">
                    <TTextarea rows={4} value={form.workExperience}
                      onChange={e => setForm(v => ({ ...v, workExperience: e.target.value }))}
                      placeholder="e.g. 8 years in automotive product design at Tata Motors. Specialised in CATIA V5 surfacing, BIW design, and plastic part development…" />
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 3 – Syllabus ═══ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>Course Syllabus</h2>
                <p className="text-sm mb-2" style={{ color: C.gray }}>Build your session list and projects — required for admin review</p>

                {/* Mandatory notice */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-6"
                  style={{ background: "#fef9c3", border: "1px solid #fde047" }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#854d0e" }} />
                  <p className="text-xs font-semibold leading-snug" style={{ color: "#854d0e" }}>
                    All session names are required. Admin will review your syllabus before approval. You can edit it anytime from your dashboard.
                  </p>
                </div>

                {/* Summary card or CTA */}
                <div className="rounded-2xl border-2 overflow-hidden transition-all"
                  style={{
                    borderColor: sessions.length > 0 ? C.primary : "#e5e7eb",
                    background: sessions.length > 0 ? "#f0f8ff" : "white",
                  }}>
                  {sessions.length > 0 && (
                    <div className="px-5 pt-5 pb-3">
                      <div className="flex gap-6 mb-4">
                        <div className="text-center">
                          <p className="text-3xl font-black" style={{ color: C.primary }}>{sessions.length}</p>
                          <p className="text-xs font-semibold" style={{ color: C.gray }}>Sessions</p>
                        </div>
                        <div className="w-px" style={{ background: "#e5e7eb" }} />
                        <div className="text-center">
                          <p className="text-3xl font-black" style={{ color: "#8b5cf6" }}>{projects.length}</p>
                          <p className="text-xs font-semibold" style={{ color: C.gray }}>Projects</p>
                        </div>
                      </div>

                      {/* Session preview list */}
                      <div className="space-y-1 mb-4 max-h-44 overflow-y-auto">
                        {sessions.map((s, i) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs py-1.5 border-b last:border-0"
                            style={{ borderColor: "#e0f0ff" }}>
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.primary})` }}>{i + 1}</span>
                            <span className="flex-1 font-medium truncate" style={{ color: s.name ? C.dark : C.lg }}>
                              {s.name || <span className="italic">Unnamed session</span>}
                            </span>
                            {s.types.length > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: "#eff8ff", color: C.primary }}>
                                {s.types.join(" + ")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`p-6 ${sessions.length > 0 ? "pt-0" : ""} text-center`}>
                    {sessions.length === 0 && (
                      <div className="mb-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: "#f3f4f6" }}>
                          <BookOpen size={24} style={{ color: "#d1d5db" }} />
                        </div>
                        <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>No syllabus built yet</p>
                        <p className="text-xs" style={{ color: C.lg }}>Click below to open the syllabus builder</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setSyllabusOpen(true); }}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${C.blue}, ${C.primary})`,
                        boxShadow: `0 6px 20px ${C.primary}44`,
                      }}>
                      <BookOpen size={16} />
                      {sessions.length > 0 ? "Edit Syllabus" : "Open Syllabus Builder"}
                    </button>
                  </div>
                </div>

                {/* Validation hint */}
                {sessions.length > 0 && sessions.some(s => !s.name.trim()) && (
                  <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "#dc2626" }}>
                    <AlertCircle size={13} />
                    Please fill in all session names before continuing
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 4 – Availability ═══ */}
            {step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>Session Availability</h2>
                <p className="text-sm mb-7" style={{ color: C.gray }}>Select all time slots that work for you</p>

                <div className="space-y-3">
                  {TIME_SLOTS.map((slot, i) => {
                    const sel = form.timeSlots.includes(slot.id);
                    return (
                      <motion.button key={slot.id} type="button"
                        onClick={e => { e.preventDefault(); toggleSlot(slot.id); }}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all"
                        style={{
                          borderColor: sel ? C.primary : "#e5e7eb",
                          background: sel ? "#eff8ff" : "white",
                          boxShadow: sel ? `0 4px 16px ${C.primary}22` : "none",
                        }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}>
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ borderColor: sel ? C.primary : "#d1d5db", background: sel ? C.primary : "white" }}>
                          {sel && <Check size={11} className="text-white" />}
                        </div>
                        <span className="flex-1 text-sm font-bold" style={{ color: sel ? C.primary : C.dark }}>
                          {slot.label}
                        </span>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: sel ? C.primary + "22" : "#f3f4f6" }}>
                          <Clock size={14} style={{ color: sel ? C.primary : C.lg }} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 5 – Preferences ═══ */}
            {step === 5 && (
              <motion.div key="s5"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>Preferences & Languages</h2>
                <p className="text-sm mb-7" style={{ color: C.gray }}>Final step — almost done!</p>

                <div className="space-y-7">
                  {/* Identity */}
                  <div>
                    <p className="text-sm font-bold mb-3" style={{ color: C.dark }}>
                      Hide your identity from students?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Yes", "No"].map(opt => (
                        <button key={opt} type="button"
                          onClick={e => { e.preventDefault(); setForm(v => ({ ...v, hideIdentity: opt })); }}
                          className="flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all"
                          style={{
                            borderColor: form.hideIdentity === opt ? C.primary : "#e5e7eb",
                            background: form.hideIdentity === opt ? "#eff8ff" : "white",
                          }}>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: form.hideIdentity === opt ? C.primary : "#d1d5db" }}>
                            {form.hideIdentity === opt && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: form.hideIdentity === opt ? C.primary : C.dark }}>{opt}</p>
                            <p className="text-[10px]" style={{ color: C.lg }}>
                              {opt === "Yes" ? "Shows as 'Expert Tutor'" : "Full profile visible"}
                            </p>
                          </div>
                          {opt === "Yes"
                            ? <EyeOff size={15} className="ml-auto flex-shrink-0" style={{ color: form.hideIdentity === opt ? C.primary : C.lg }} />
                            : <Eye size={15} className="ml-auto flex-shrink-0" style={{ color: form.hideIdentity === opt ? C.primary : C.lg }} />
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <Field label="Current Location">
                    <TInput placeholder="e.g. Pune, Maharashtra" value={form.location}
                      onChange={e => setForm(v => ({ ...v, location: e.target.value }))}
                      right={<MapPin size={15} style={{ color: C.lg }} />} />
                  </Field>

                  {/* Languages */}
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: C.dark }}>Languages You Speak</p>
                    <p className="text-xs mb-3" style={{ color: C.lg }}>
                      For Hindi &amp; English, also select your proficiency level
                    </p>
                    <div className="space-y-2">
                      {LANGUAGES.map(lang => (
                        <LangRow key={lang.id} lang={lang}
                          selected={!!form.languages[lang.id]}
                          proficiency={form.langProficiency[lang.id]}
                          onToggle={toggleLang} onProficiency={setLangProf} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Nav buttons ── */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
            <button type="button"
              onClick={e => { e.preventDefault(); setStep(s => Math.max(1, s - 1)); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-white hover:shadow-sm"}`}
              style={{ color: C.gray }}>
              <ChevronLeft size={16} /> Back
            </button>

            {/* Dot progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i + 1 === step ? 20 : 6, background: i + 1 <= step ? C.primary : "#e5e7eb" }} />
              ))}
            </div>

            {step < 5 ? (
              <button type="button"
                onClick={e => { e.preventDefault(); canNext() && setStep(s => s + 1); }}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})`, boxShadow: canNext() ? `0 6px 20px ${C.primary}44` : "none" }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {submitErr && <p className="text-red-500 text-xs text-center">{submitErr}</p>}
                <button type="button" disabled={submitting}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!form.course_id) return setSubmitErr("Please select a course in Step 2.");
                    setSubmitting(true); setSubmitErr("");
                    try {
                      await tutorApi.apply({
                        name:            form.fullName,
                        email:           form.email,
                        phone:           form.phone,
                        phone_token:     phoneToken,
                        occupation:      form.occupationStatus,
                        years_exp:       form.yearsExp,
                        companies:       form.companies,
                        work_experience: form.workExperience,
                        course_id:       form.course_id,
                        time_slots:      form.timeSlots,
                        hide_identity:   form.hideIdentity === "yes",
                        location:        form.location,
                        languages: Object.entries(form.languages)
                          .filter(([,v]) => v)
                          .map(([id]) => ({ name: id, proficiency: form.langProficiency[id] || "Intermediate" })),
                        syllabus_sessions: sessions.map((s, idx) => ({
                          session_number: idx + 1,
                          name:           s.name,
                          type:           s.types.includes("combined") ? "BOTH" : s.types.includes("cad") ? "CAD" : "THEORY",
                        })),
                        syllabus_projects: projects.map(p => ({
                          name:       p.name,
                          highlights: p.highlights.filter(h => h.trim()),
                        })),
                      });
                      setSubmitted(true);
                    } catch (e) {
                      setSubmitErr(e.message || "Submission failed. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.primary})`, boxShadow: `0 8px 24px ${C.primary}44` }}>
                  {submitting ? "Submitting…" : <><Send size={15} /> Send for Approval</>}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: C.lg }}>
            Already registered?{" "}
            <a href="/dct/auth/login" className="font-bold" style={{ color: C.primary }}>Sign In</a>
          </p>
        </div>
      </div>

      {/* ── OTP Modal ── */}
      {otpOpen && (
        <OTPModal phone={form.phone} onVerify={(token) => { setPhoneVerified(true); setPhoneToken(token); }} onClose={() => setOtpOpen(false)} />
      )}

      {/* ── Syllabus Modal ── */}
      <AnimatePresence>
        {syllabusOpen && (
          <SyllabusModal
            isOpen={syllabusOpen}
            onClose={() => setSyllabusOpen(false)}
            sessions={sessions}
            setSessions={setSessions}
            projects={projects}
            setProjects={setProjects}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
