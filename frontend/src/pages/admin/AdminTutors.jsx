import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Check,
  X,
  Eye,
  MapPin,
  Clock,
  Briefcase,
  BookOpen,
  Languages,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const C = {
  dark: "#1F1A17",
  navy: "#003C6E",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#7E7F81",
};

function TutorDetailModal({ tutor, onClose, onApprove, onReject }) {
  return (
    <AnimatePresence>
      {tutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl z-10 max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg,${C.blue},${C.primary})`,
                }}
              >
                {tutor.name[0]}
              </div>
              <div className="flex-1">
                <h2
                  className="text-base font-extrabold"
                  style={{ color: C.dark }}
                >
                  {tutor.name}
                </h2>
                <p className="text-xs" style={{ color: C.gray }}>
                  {tutor.occupation} · {tutor.yearsExp} years experience
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <Mail size={14} style={{ color: C.primary }} />
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: C.lg }}
                    >
                      Email
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.dark }}
                    >
                      {tutor.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <Phone size={14} style={{ color: C.primary }} />
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: C.lg }}
                    >
                      Phone
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.dark }}
                    >
                      {tutor.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <MapPin size={14} style={{ color: C.primary }} />
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: C.lg }}
                    >
                      Location
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.dark }}
                    >
                      {tutor.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <Clock size={14} style={{ color: C.primary }} />
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: C.lg }}
                    >
                      Time Slots
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.dark }}
                    >
                      {tutor.timeSlots.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work exp */}
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: C.lg }}
                >
                  Work Experience
                </p>
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: C.dark }}
                  >
                    {tutor.workExp}
                  </p>
                </div>
                <p className="text-xs mt-1.5" style={{ color: C.lg }}>
                  Companies:{" "}
                  <span className="font-semibold" style={{ color: C.dark }}>
                    {tutor.companies}
                  </span>
                </p>
              </div>

              {/* Languages */}
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: C.lg }}
                >
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {tutor.languages.map((l) => (
                    <span
                      key={l}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: "#eff8ff", color: C.primary }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Syllabus summary */}
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: C.lg }}
                >
                  Submitted Syllabus
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: "#eff8ff" }}
                  >
                    <p
                      className="text-2xl font-black"
                      style={{ color: C.primary }}
                    >
                      {tutor.sessions}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.gray }}
                    >
                      Sessions
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: "#f5f3ff" }}
                  >
                    <p
                      className="text-2xl font-black"
                      style={{ color: "#8b5cf6" }}
                    >
                      {tutor.projects}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: C.gray }}
                    >
                      Projects
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  onReject(tutor.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:bg-red-50"
                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => {
                  onApprove(tutor.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg,#16a34a,#22c55e)`,
                  boxShadow: "0 4px 16px #22c55e44",
                }}
              >
                <CheckCircle2 size={16} /> Approve & Send Password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminTutors() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load real data from backend
  useEffect(() => {
    setLoading(true);
    Promise.all([adminApi.applications("PENDING"), adminApi.tutors()])
      .then(([pendingRes, approvedRes]) => {
        // Map backend fields to what the UI expects
        setPending(
          (pendingRes.data || []).map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            phone: a.phone,
            occupation: a.occupation,
            yearsExp: a.years_exp,
            companies: a.companies,
            workExp: a.work_experience,
            location: a.location,
            timeSlots: a.time_slots || [],
            course: a.course?.name || "",
            sessions: a.syllabus_sessions?.length || 0,
            projects: a.syllabus_projects?.length || 0,
            appliedOn: new Date(a.applied_on).toLocaleDateString("en-IN"),
            languages: (a.languages || []).map((l) =>
              typeof l === "string" ? l : `${l.name} (${l.proficiency || ""})`,
            ),
          })),
        );
        setApproved(
          (approvedRes.data || []).map((t) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            occupation: t.tutor_application?.course?.name || "Tutor",
            yearsExp: t.tutor_application?.years_exp || 0,
            location: t.tutor_application?.location || "",
            activeBatches:
              t.tutor_batches?.filter((b) => b.status === "ACTIVE").length || 0,
            totalStudents:
              t.tutor_batches?.reduce(
                (s, b) => s + (b._count?.enrollments || 0),
                0,
              ) || 0,
            rating: null,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveApp(id);
      const tutor = pending.find((t) => t.id === id);
      setPending((p) => p.filter((t) => t.id !== id));
      setApproved((a) => [
        ...a,
        { ...tutor, activeBatches: 0, totalStudents: 0, rating: null },
      ]);
      alert(`✅ Tutor approved! Check backend terminal for temp password.`);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await adminApi.rejectApp(id, "");
      setPending((p) => p.filter((t) => t.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-extrabold mb-1"
              style={{ color: C.dark }}
            >
              Tutor Management
            </h1>
            <p className="text-sm" style={{ color: C.gray }}>
              Review applications and manage approved tutors
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-white">
            {[
              { id: "pending", label: `Pending (${pending.length})` },
              { id: "approved", label: `Approved (${approved.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background:
                    tab === t.id
                      ? `linear-gradient(135deg,${C.blue},${C.primary})`
                      : "transparent",
                  color: tab === t.id ? "white" : C.gray,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pending */}
        {loading && (
          <p className="text-center py-8 text-sm" style={{ color: "#6A6B6D" }}>
            Loading applications…
          </p>
        )}
        {!loading && tab === "pending" && (
          <div className="space-y-4">
            {pending.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <CheckCircle2
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: "#22c55e" }}
                />
                <p className="font-bold" style={{ color: C.dark }}>
                  All caught up!
                </p>
                <p className="text-sm mt-1" style={{ color: C.gray }}>
                  No pending tutor applications.
                </p>
              </div>
            )}
            {pending.map((tutor, i) => (
              <motion.div
                key={tutor.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${C.blue},${C.primary})`,
                    }}
                  >
                    {tutor.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-extrabold" style={{ color: C.dark }}>
                          {tutor.name}
                        </p>
                        <p className="text-xs" style={{ color: C.gray }}>
                          {tutor.occupation} · {tutor.yearsExp}y exp ·{" "}
                          {tutor.companies}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: "#fff7ed", color: "#c2410c" }}
                      >
                        Applied {tutor.appliedOn}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#eff8ff", color: C.primary }}
                      >
                        📍 {tutor.location}
                      </span>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#f0fdf4", color: "#16a34a" }}
                      >
                        📚 {tutor.sessions} sessions
                      </span>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#f5f3ff", color: "#7c3aed" }}
                      >
                        🛠 {tutor.projects} projects
                      </span>
                      {tutor.timeSlots.slice(0, 1).map((s) => (
                        <span
                          key={s}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "#fef9c3", color: "#854d0e" }}
                        >
                          ⏰ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => setSelected(tutor)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-gray-50"
                    style={{ borderColor: "#e5e7eb", color: C.gray }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                  <button
                    onClick={() => handleReject(tutor.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-red-50"
                    style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(tutor.id)}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg,#16a34a,#22c55e)`,
                    }}
                  >
                    <CheckCircle2 size={15} /> Approve
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Approved */}
        {tab === "approved" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {approved.map((tutor, i) => (
              <motion.div
                key={tutor.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${C.blue},${C.primary})`,
                    }}
                  >
                    {tutor.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-extrabold text-sm truncate"
                      style={{ color: C.dark }}
                    >
                      {tutor.name}
                    </p>
                    <p className="text-xs" style={{ color: C.gray }}>
                      {tutor.occupation}
                    </p>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: "#22c55e" }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Batches", value: tutor.activeBatches },
                    { label: "Students", value: tutor.totalStudents },
                    {
                      label: "Rating",
                      value: tutor.rating ? `⭐ ${tutor.rating}` : "New",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="text-center p-2 rounded-xl"
                      style={{ background: "#f9fafb" }}
                    >
                      <p
                        className="text-base font-black"
                        style={{ color: C.dark }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-[10px] font-semibold"
                        style={{ color: C.lg }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-xs" style={{ color: C.gray }}>
                  <span>{tutor.email}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <TutorDetailModal
          tutor={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </PageWrapper>
    </AppShell>
  );
}
