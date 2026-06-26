import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { prerequisiteApi, adminApi } from "../../services/api.js";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#7E7F81",
};

function statusFor(pct) {
  if (pct >= 100) return { label: "Completed", bg: "#f0fdf4", color: "#16a34a" };
  if (pct > 0) return { label: "In Progress", bg: "#eff8ff", color: C.primary };
  return { label: "Not Started", bg: "#f3f4f6", color: C.gray };
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function rowKey(row) {
  return row.id || row.email || normalizePhone(row.phone);
}

function buildEnrollmentLookup(students = []) {
  const lookup = new Map();

  students.forEach((student) => {
    const keys = [
      student.id,
      student.email,
      normalizePhone(student.phone),
      String(student.phone || "").replace(/\D/g, ""),
    ].filter(Boolean);

    keys.forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key).push(...(student.enrollments || []));
    });
  });

  return lookup;
}

function getEnrollmentsForRow(row, lookup) {
  const keys = [
    row.id,
    row.email,
    normalizePhone(row.phone),
    String(row.phone || "").replace(/\D/g, ""),
  ].filter(Boolean);

  for (const key of keys) {
    const found = lookup.get(key);
    if (found?.length) return found;
  }

  return [];
}

function buildGroups(rows = [], students = [], search = "") {
  const lookup = buildEnrollmentLookup(students);
  const q = search.trim().toLowerCase();
  const map = new Map();

  rows.forEach((row) => {
    const enrollments = getEnrollmentsForRow(row, lookup);
    const text = [
      row.name,
      row.email,
      row.phone,
      ...(row.enrolled_courses || []),
      ...enrollments.flatMap((e) => [e.batch?.name, e.batch?.course?.name, e.batch?.tutor?.name]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (q && !text.includes(q)) return;

    if (!enrollments.length) {
      const fallbackCourseName = row.enrolled_courses?.[0] || "No Course Assigned";
      const courseKey = fallbackCourseName;
      const batchKey = "no-batch";

      if (!map.has(courseKey)) {
        map.set(courseKey, { id: courseKey, name: fallbackCourseName, batches: new Map() });
      }

      const course = map.get(courseKey);
      if (!course.batches.has(batchKey)) {
        course.batches.set(batchKey, {
          id: batchKey,
          name: "No Batch Assigned",
          tutorName: "—",
          startDate: null,
          endDate: null,
          rows: [],
        });
      }

      course.batches.get(batchKey).rows.push(row);
      return;
    }

    enrollments.forEach((enrollment) => {
      const batch = enrollment.batch || {};
      const courseData = batch.course || {};
      const courseKey = courseData.id || courseData.name || row.enrolled_courses?.[0] || "unknown-course";
      const batchKey = batch.id || batch.name || "unknown-batch";

      if (!map.has(courseKey)) {
        map.set(courseKey, {
          id: courseKey,
          name: courseData.name || row.enrolled_courses?.[0] || "Unknown Course",
          batches: new Map(),
        });
      }

      const course = map.get(courseKey);
      if (!course.batches.has(batchKey)) {
        course.batches.set(batchKey, {
          id: batchKey,
          name: batch.name || "Unknown Batch",
          tutorName: batch.tutor?.name || "—",
          startDate: batch.start_date || null,
          endDate: batch.end_date || null,
          rows: [],
        });
      }

      course.batches.get(batchKey).rows.push(row);
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

function StudentProgressRow({ row }) {
  const pct = row.catia_progress_percent || 0;
  const st = statusFor(pct);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
      <div className="lg:col-span-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black"
          style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
        >
          {row.name?.[0]?.toUpperCase() || <User size={16} />}
        </div>

        <div className="min-w-0">
          <p className="font-black text-sm truncate" style={{ color: C.dark }}>
            {row.name}
          </p>
          <p className="text-xs truncate" style={{ color: C.gray }}>
            {row.email} · {row.phone}
          </p>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold" style={{ color: C.gray }}>
            {row.catia_completed_lessons || 0}/{row.catia_total_lessons || 10} videos
          </span>
          <span className="text-xs font-black" style={{ color: C.primary }}>
            {pct}%
          </span>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg,${C.blue},${C.primary})`,
            }}
          />
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-wrap gap-2">
        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
          {st.label}
        </span>

        {pct >= 100 && (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-green-50 text-green-700">
            <CheckCircle2 size={13} />
            Ready for live sessions
          </span>
        )}
      </div>
    </div>
  );
}

function BatchProgressGroup({ batch }) {
  const [open, setOpen] = useState(true);
  const completed = batch.rows.filter((r) => (r.catia_progress_percent || 0) >= 100).length;

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
              {batch.rows.length} students
            </span>
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-green-50 text-green-700">
              {completed} completed
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: C.gray }}>
            Tutor: {batch.tutorName} · {fmtDate(batch.startDate)} → {fmtDate(batch.endDate)}
          </p>
        </div>
      </button>

      {open && (
        <div>
          <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-4 bg-blue-50 border-t border-blue-100">
            <p className="col-span-4 text-xs font-black text-dct-dark">Student</p>
            <p className="col-span-4 text-xs font-black text-dct-dark">CATIA Basics</p>
            <p className="col-span-4 text-xs font-black text-dct-dark">Status</p>
          </div>

          {batch.rows.map((row) => (
            <StudentProgressRow key={rowKey(row)} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseProgressGroup({ course }) {
  const [open, setOpen] = useState(true);
  const total = course.batches.reduce((sum, b) => sum + b.rows.length, 0);

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
              {course.batches.length} batches · {total} students
            </p>
          </div>
        </div>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {open && (
        <div className="space-y-4">
          {course.batches.map((batch) => (
            <BatchProgressGroup key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminPrerequisiteProgress() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setErr("");

    Promise.all([prerequisiteApi.adminProgress(), adminApi.students()])
      .then(([progressRes, studentRes]) => {
        setRows(progressRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((e) => setErr(e.message || "Failed to load prerequisite progress."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const grouped = useMemo(() => buildGroups(rows, students, search), [rows, students, search]);

  const totals = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => (r.catia_progress_percent || 0) >= 100).length;
    const started = rows.filter(
      (r) => (r.catia_progress_percent || 0) > 0 && (r.catia_progress_percent || 0) < 100
    ).length;

    return { total, completed, started, groups: grouped.length };
  }, [rows, grouped.length]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-dct-dark">Pre-Requisite Progress</h1>
            <p className="text-sm text-dct-gray mt-1">
              Batch-wise CATIA basics completion tracking for registered students.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-4 py-2 text-xs font-black"
            style={{ color: C.primary }}
            type="button"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            ["Total Students", totals.total],
            ["In Progress", totals.started],
            ["Completed CATIA", totals.completed],
            ["Course Groups", totals.groups],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-2xl font-black" style={{ color: C.dark }}>
                {value}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: C.gray }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: C.lg }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, phone, email, course, batch..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm outline-none"
            />
          </div>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 font-semibold text-sm mb-5">
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
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <AlertCircle size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="font-black text-dct-dark">No progress data yet</p>
            <p className="text-sm text-dct-gray mt-1">
              Once a student marks CATIA videos complete, progress will appear here.
            </p>
          </div>
        )}

        {!loading && !err && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((course) => (
              <CourseProgressGroup key={course.id} course={course} />
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
