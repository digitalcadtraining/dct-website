import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  RefreshCcw,
  Power,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#7E7F81",
};

const money = (v) => Number(v || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

function enrollmentsOf(student) {
  return Array.isArray(student?.enrollments) ? student.enrollments : [];
}

function searchable(student, enrollment = null) {
  const batch = enrollment?.batch || {};
  const course = batch.course || {};
  const tutor = batch.tutor || {};
  return [
    student.name,
    student.email,
    student.phone,
    course.name,
    batch.name,
    tutor.name,
    enrollment?.discount_code,
    enrollment?.payment_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildGroups(students = [], search = "") {
  const q = search.trim().toLowerCase();
  const map = new Map();

  students.forEach((student) => {
    const enrollments = enrollmentsOf(student);

    if (!enrollments.length) {
      if (q && !searchable(student).includes(q)) return;
      const courseKey = "unassigned-course";
      const batchKey = "unassigned-batch";

      if (!map.has(courseKey)) {
        map.set(courseKey, { id: courseKey, name: "No Course Assigned", batches: new Map() });
      }

      const course = map.get(courseKey);
      if (!course.batches.has(batchKey)) {
        course.batches.set(batchKey, {
          id: batchKey,
          name: "No Batch Assigned",
          tutorName: "—",
          startDate: null,
          endDate: null,
          students: [],
        });
      }

      course.batches.get(batchKey).students.push({ student, enrollment: null });
      return;
    }

    enrollments.forEach((enrollment) => {
      if (q && !searchable(student, enrollment).includes(q)) return;

      const batch = enrollment.batch || {};
      const courseData = batch.course || {};
      const tutor = batch.tutor || {};
      const courseKey = courseData.id || courseData.name || "unknown-course";
      const batchKey = batch.id || batch.name || "unknown-batch";

      if (!map.has(courseKey)) {
        map.set(courseKey, {
          id: courseKey,
          name: courseData.name || "Unknown Course",
          batches: new Map(),
        });
      }

      const course = map.get(courseKey);
      if (!course.batches.has(batchKey)) {
        course.batches.set(batchKey, {
          id: batchKey,
          name: batch.name || "Unknown Batch",
          tutorName: tutor.name || "—",
          startDate: batch.start_date || null,
          endDate: batch.end_date || null,
          students: [],
        });
      }

      course.batches.get(batchKey).students.push({ student, enrollment });
    });
  });

  return Array.from(map.values())
    .map((course) => ({
      ...course,
      batches: Array.from(course.batches.values()).sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      ),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-2xl font-black" style={{ color: C.dark }}>
        {value}
      </p>
      <p className="text-xs font-semibold mt-1" style={{ color: C.gray }}>
        {label}
      </p>
    </div>
  );
}

function StudentRow({ student, enrollment, onToggleStatus, index }) {
  const batch = enrollment?.batch || {};
  const tutor = batch.tutor || {};
  const progress = Math.max(0, Math.min(100, Number(enrollment?.progress || 0)));

  return (
    <motion.div
      className="grid grid-cols-1 xl:grid-cols-12 gap-3 px-4 py-4 items-center border-t border-gray-50 hover:bg-gray-50/70 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.015, 0.2) }}
    >
      <div className="xl:col-span-3 flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
        >
          {student.name?.[0]?.toUpperCase() || "S"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black truncate" style={{ color: C.dark }}>
            {student.name || "Student"}
          </p>
          <p className="text-xs truncate" style={{ color: C.gray }}>
            {student.email || "—"} · {student.phone || "—"}
          </p>
        </div>
      </div>

      <div className="xl:col-span-2">
        <p className="text-xs font-bold" style={{ color: C.dark }}>
          {tutor.name || "—"}
        </p>
        <p className="text-[11px]" style={{ color: C.lg }}>
          Tutor
        </p>
      </div>

      <div className="xl:col-span-2">
        <p className="text-xs font-bold" style={{ color: C.dark }}>
          {enrollment?.payment_status || "—"}
        </p>
        <p className="text-[11px]" style={{ color: C.lg }}>
          Joined {fmtDate(enrollment?.enrolled_at || student.created_at)}
        </p>
      </div>

      <div className="xl:col-span-2">
        <p className="text-xs font-bold" style={{ color: C.blue }}>
          ₹{money(enrollment?.enrolled_price)}
        </p>
        <p className="text-[11px]" style={{ color: C.lg }}>
          Enrolled price
        </p>
      </div>

      <div className="xl:col-span-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg,${C.blue},${C.primary})`,
              }}
            />
          </div>
          <span className="text-[11px] font-black flex-shrink-0" style={{ color: C.primary }}>
            {progress}%
          </span>
        </div>
      </div>

      <div className="xl:col-span-1 flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-black px-2.5 py-1 rounded-full"
          style={{
            background: student.is_active ? "#f0fdf4" : "#fee2e2",
            color: student.is_active ? "#16a34a" : "#dc2626",
          }}
        >
          {student.is_active ? "Active" : "Inactive"}
        </span>
        <button
          onClick={() => onToggleStatus(student.id)}
          className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50"
          title="Toggle student status"
          type="button"
        >
          <Power size={13} style={{ color: student.is_active ? "#dc2626" : "#16a34a" }} />
        </button>
      </div>
    </motion.div>
  );
}

function BatchGroup({ batch, onToggleStatus }) {
  const [open, setOpen] = useState(true);
  const paid = batch.students.filter((x) => x.enrollment?.payment_status === "PAID").length;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <h3 className="text-sm font-black truncate" style={{ color: C.dark }}>
              {batch.name}
            </h3>
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-dct-primary">
              {batch.students.length} students
            </span>
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-green-50 text-green-700">
              {paid} paid
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: C.gray }}>
            Tutor: {batch.tutorName} · {fmtDate(batch.startDate)} → {fmtDate(batch.endDate)}
          </p>
        </div>
      </button>

      {open && (
        <div>
          <div className="hidden xl:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100">
            {["Student", "Tutor", "Payment", "Price", "Progress", "Status"].map((h, i) => (
              <p
                key={h}
                className={`text-[10px] font-black uppercase tracking-wider ${
                  i === 0
                    ? "col-span-3"
                    : i === 1 || i === 2 || i === 3 || i === 4
                      ? "col-span-2"
                      : "col-span-1"
                }`}
                style={{ color: C.lg }}
              >
                {h}
              </p>
            ))}
          </div>
          {batch.students.map((item, i) => (
            <StudentRow
              key={`${item.student.id}-${item.enrollment?.id || i}`}
              student={item.student}
              enrollment={item.enrollment}
              index={i}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseGroup({ course, onToggleStatus }) {
  const [open, setOpen] = useState(true);
  const studentCount = course.batches.reduce((sum, b) => sum + b.students.length, 0);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
          >
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black truncate" style={{ color: C.dark }}>
              {course.name}
            </h2>
            <p className="text-xs font-semibold" style={{ color: C.gray }}>
              {course.batches.length} batches · {studentCount} students
            </p>
          </div>
        </div>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {open && (
        <div className="space-y-4">
          {course.batches.map((batch) => (
            <BatchGroup key={batch.id} batch={batch} onToggleStatus={onToggleStatus} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    setErr("");
    adminApi
      .students()
      .then((res) => setStudents(res.data || []))
      .catch((e) => setErr(e.message || "Failed to load students."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const grouped = useMemo(() => buildGroups(students, search), [students, search]);

  const stats = useMemo(() => {
    const enrollmentCount = students.reduce((sum, s) => sum + enrollmentsOf(s).length, 0);
    const activeCount = students.filter((s) => s.is_active).length;
    return {
      students: students.length,
      enrollments: enrollmentCount,
      active: activeCount,
      courses: grouped.length,
    };
  }, [students, grouped.length]);

  const toggleStatus = async (id) => {
    try {
      const res = await adminApi.toggleUserStatus(id);
      const updated = res.data;
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: updated.is_active } : s))
      );
    } catch (e) {
      alert(e.message || "Failed to update user status.");
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>
              Student Management
            </h1>
            <p className="text-sm" style={{ color: C.gray }}>
              Course → batch → student wise live database view.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: C.lg }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, batch, course, tutor..."
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none w-72 max-w-[72vw]"
                style={{ borderColor: "#e5e7eb", color: C.dark }}
              />
            </div>
            <button
              onClick={load}
              className="p-2.5 bg-white border border-gray-100 rounded-xl"
              style={{ color: C.primary }}
              type="button"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Students" value={stats.students} />
          <StatCard label="Total Enrollments" value={stats.enrollments} />
          <StatCard label="Active Students" value={stats.active} />
          <StatCard label="Course Groups" value={stats.courses} />
        </div>

        {err && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-red-600 text-sm font-semibold">
            {err}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-gray-50 rounded-3xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !err && grouped.length === 0 && (
          <div
            className="bg-white rounded-3xl border border-gray-100 p-12 text-center"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <Users size={34} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
            <p className="font-black" style={{ color: C.dark }}>
              No students found
            </p>
            <p className="text-sm mt-1" style={{ color: C.lg }}>
              Try another search.
            </p>
          </div>
        )}

        {!loading && !err && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((course) => (
              <CourseGroup key={course.id} course={course} onToggleStatus={toggleStatus} />
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
