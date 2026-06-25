import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi } from "../../services/api.js";
import { BookOpen, ChevronRight, PlayCircle } from "lucide-react";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#9ca3af",
};
const money = (v) => Number(v || 0).toLocaleString("en-IN");

function normalizeDate(d) {
  if (!d) return null;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function deriveBatchStatus(batch) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = normalizeDate(batch?.start_date);
  const end = normalizeDate(batch?.end_date);
  if (start && end) {
    if (now < start)
      return { code: "UPCOMING", label: "Upcoming", active: false };
    if (now > end)
      return { code: "COMPLETED", label: "Completed", active: false };
    return { code: "ACTIVE", label: "Active", active: true };
  }
  const code = String(batch?.status || "UPCOMING").toUpperCase();
  if (code === "ACTIVE") return { code, label: "Active", active: true };
  if (code === "COMPLETED") return { code, label: "Completed", active: false };
  return { code, label: "Upcoming", active: false };
}
function safeProgress(value) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
function emiAmount(enrollment) {
  const total = Number(enrollment.enrolled_price || 0);
  return Math.ceil(Math.max(0, total - 999) / 2);
}

function CourseCard({ enrollment, index }) {
  const batch = enrollment.batch || {};
  const course = batch.course || {};
  const tutor = batch.tutor || {};
  const total = batch._count?.scheduled_sessions || 0;
  const pct = safeProgress(enrollment.progress);
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  const status = deriveBatchStatus(batch);
  const firstEmi = emiAmount(enrollment);
  const secondEmi = Math.max(
    0,
    Number(enrollment.enrolled_price || 0) - 999 - firstEmi,
  );

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
    >
      <div
        style={{
          height: 110,
          background: `linear-gradient(135deg,${C.blue},${C.primary})`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          style={{
            fontSize: 36,
            opacity: 0.7,
            position: "relative",
            zIndex: 1,
          }}
        >
          ⚙
        </div>
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: status.active
              ? "rgba(34,197,94,0.95)"
              : "rgba(255,255,255,0.22)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {status.label}
        </span>
        {enrollment.discount_code && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(255,235,58,.95)",
              color: C.dark,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {enrollment.discount_code}
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.dark,
            marginBottom: 3,
            lineHeight: 1.3,
          }}
        >
          {course.name || "Course"}
        </h3>
        <p style={{ fontSize: 11, color: C.gray, marginBottom: 12 }}>
          {batch.name}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 7,
            marginBottom: 12,
          }}
        >
          {[
            ["Start", fmt(batch.start_date)],
            ["End", fmt(batch.end_date)],
            ["Sessions", total],
            ["Assignments", batch._count?.assignments || 0],
            [
              "First EMI",
              enrollment.emi_first_due ? `₹${money(firstEmi)}` : "—",
              enrollment.emi_first_due
                ? `Due on ${fmt(enrollment.emi_first_due)}`
                : "",
            ],
            [
              "Second EMI",
              enrollment.emi_second_due ? `₹${money(secondEmi)}` : "—",
              enrollment.emi_second_due
                ? `Due on ${fmt(enrollment.emi_second_due)}`
                : "",
            ],
          ].map(([l, v, sub]) => (
            <div
              key={l}
              style={{
                border: "1px solid #e8ecf0",
                borderRadius: 9,
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>
                {v}
              </p>
              <p style={{ fontSize: 10, color: C.lg }}>{sub || l}</p>
            </div>
          ))}
        </div>
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#f8fbff",
            border: "1px solid #dbeafe",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 800, color: C.blue }}>
            Enrolled price: ₹{money(enrollment.enrolled_price)}
          </p>
          <p style={{ fontSize: 10, color: C.lg }}>Registration paid: ₹999</p>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 11, color: C.gray }}>Your Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 5,
              background: "#e5e7eb",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: `linear-gradient(90deg,${C.blue},${C.primary})`,
                borderRadius: 4,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p style={{ marginTop: 5, fontSize: 10, color: C.lg }}>
            Progress increases as submitted assignments are counted.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {tutor.name?.[0]?.toUpperCase() || "T"}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>
              {tutor.name || "Tutor"}
            </p>
            <p style={{ fontSize: 10, color: C.lg }}>Your Mentor</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to="/student/sessions/all"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "9px 0",
              background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              color: "#fff",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sessions <ChevronRight size={12} />
          </Link>
          <Link
            to="/student/syllabus"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "9px 0",
              background: "#eff8ff",
              color: C.primary,
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #bfdbfe",
            }}
          >
            Syllabus <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    batchApi
      .enrolled()
      .then((res) => setEnrollments(res.data || []))
      .catch((e) => setError(e.message || "Failed to load courses."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  const hasActive = enrollments.some(
    (e) => deriveBatchStatus(e.batch).code === "ACTIVE",
  );
  return (
    <AppShell>
      <PageWrapper>
        <motion.div
          className="rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#024981,#007BBF)" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            style={{
              position: "absolute",
              right: -28,
              top: -28,
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <h2
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 4,
            }}
          >
            Refer and{" "}
            <span style={{ color: "#fde047", textDecoration: "underline" }}>
              Earn ₹2000/-
            </span>{" "}
            reference bonus.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Feel free to recommend your friend
          </p>
          <button
            style={{
              background: "#1E2023",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get Reward
          </button>
        </motion.div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-dct-dark">My Courses</h2>
          {!loading && enrollments.length > 0 && (
            <span
              className={`${hasActive ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"} text-xs font-bold px-3 py-1 rounded-full`}
            >
              {hasActive ? "Active" : "Enrolled"}
            </span>
          )}
        </div>
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,320px))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ height: 360, background: "#f3f4f6", borderRadius: 16 }}
                className="animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
            <p className="text-red-600 font-semibold mb-3">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && enrollments.length === 0 && (
          <div
            className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-14 text-center mb-8"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-dct-dark mb-1">
              No courses enrolled yet
            </p>
            <p className="text-sm text-dct-lightgray mb-5">
              Browse our courses and enroll to start learning.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 text-white text-sm font-bold rounded-xl"
              style={{
                background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              }}
            >
              Browse Courses
            </Link>
          </div>
        )}
        {!loading && !error && enrollments.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,320px))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {enrollments.map((e, i) => (
              <CourseCard key={e.enrollment_id || i} enrollment={e} index={i} />
            ))}
          </div>
        )}
        <div
          className="rounded-3xl border border-blue-100 bg-white p-5 sm:p-6"
          style={{ boxShadow: "0 12px 34px rgba(2,73,129,.07)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-dct-primary">
                Start before batch begins
              </p>
              <h2 className="mt-1 text-xl font-bold text-dct-dark">
                Complete Pre-Requisite Video Courses
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-dct-gray">
                CATIA basics, UG NX basics and mould design fundamentals are now
                available in a structured video player. Complete lessons in
                sequence to build confidence before live domain training starts.
              </p>
            </div>
            <Link
              to="/student/prerequisites"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-dct-primary px-5 py-3 text-sm font-bold text-white hover:bg-dct-blue"
            >
              <PlayCircle size={18} /> Open Pre-Requisites
            </Link>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
