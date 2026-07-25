import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { batchApi, prerequisiteApi } from "../../services/api.js";

const C = {
  blue: "#024981",
  primary: "#007BBF",
  dark: "#1F1A17",
  gray: "#6A6B6D",
};

function fmtDate(date) {
  if (!date) return "Flexible";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function safeDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

function diffDays(from, to) {
  if (!from || !to) return 0;
  const one = 24 * 60 * 60 * 1000;
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b - a) / one);
}

function addDays(date, days) {
  const d = new Date(date || new Date());
  d.setDate(d.getDate() + days);
  return d;
}

function getPlanMessage(enrollment) {
  const now = new Date();
  const start = safeDate(enrollment?.batch?.start_date);
  if (start && diffDays(now, start) < 0) {
    return "Your batch has recently started. First complete only 4 priority basics: Sketcher Session 01-02 and Part Design Session 01-02. Continue remaining videos on alternate non-live days so you stay on track confidently.";
  }
  if (start && diffDays(now, start) <= 4) {
    return "Your batch is starting very soon. Focus on 4 priority basics first: Sketcher Session 01-02 and Part Design Session 01-02.";
  }
  return "Complete 1 CATIA basic video every 2 days. This keeps momentum without last-minute pressure.";
}

function targetDateFor(index, enrollment) {
  const now = new Date();
  const start = safeDate(enrollment?.batch?.start_date);
  const enrolled =
    safeDate(enrollment?.enrolled_at || enrollment?.created_at) || now;
  const afterStart = start && diffDays(now, start) < 0;
  const spacing = afterStart ? 2 : 2;
  return addDays(afterStart ? now : enrolled, index * spacing);
}

const INSTALL_STEPS = [
  [
    "📂",
    "Request access to CATIA setup folder",
    "Open the CATIA R21 setup folder and send an access request from your Gmail account.",
    "https://drive.google.com/drive/folders/1SAhJrH2afyumlxDVoFSE20CwLJdFwEK8?usp=drive_link",
  ],
  [
    "⬇️",
    "Download CATIA_setup.rar",
    "Right click on CATIA_setup.rar and download it. Check the WinRAR file in Downloads folder.",
  ],
  [
    "📦",
    "Copy file to D Drive and extract",
    "Copy CATIA_setup.rar to D drive. Right click and choose Extract All / Extract Here.",
  ],
  [
    "🖥️",
    "Run setup.exe as administrator",
    "Open extracted folder, search setup.exe, right click and run as administrator. Keep clicking Next until setup completes.",
  ],
  [
    "🔧",
    "Copy licence DLL file",
    "Close CATIA. Open extracted folder, go to win32 folder and copy the DLL file.",
  ],
  [
    "📌",
    "Paste DLL in CATIA installation folder",
    "Single click CATIA icon on desktop → right click → Open file location. Paste DLL and replace if popup appears.",
  ],
  [
    "✅",
    "Open CATIA and verify",
    "Open CATIA. Close licence warning popups. If CATIA opens, setup is done.",
  ],
];

function InstallationPanel() {
  return (
    <div className="space-y-5">
      <div
        className="rounded-[28px] p-6 sm:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
      >
        <p className="text-xs font-black tracking-[0.25em] uppercase opacity-90">
          First Step
        </p>
        <h1 className="text-2xl sm:text-4xl font-black mt-2 leading-tight">
          Install CATIA R21 before starting basics
        </h1>
        <p className="mt-3 max-w-2xl text-white/85 text-sm sm:text-base leading-7">
          Complete setup first. After CATIA opens successfully, start the CATIA
          basic videos.
        </p>
        <a
          href={INSTALL_STEPS[0][3]}
          target="_blank"
          rel="noreferrer"
          className="inline-flex mt-5 bg-white text-dct-primary font-black px-5 py-3 rounded-2xl no-underline"
        >
          Open Setup Folder ↗
        </a>
      </div>

      {INSTALL_STEPS.map(([icon, title, text, link], index) => (
        <div
          key={title}
          className="bg-white rounded-3xl border border-blue-100 p-5 flex gap-4 shadow-sm"
        >
          <div className="text-2xl w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-blue-500 bg-blue-50 rounded-full px-2 py-1">
                STEP {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-black text-dct-dark">{title}</h3>
            </div>
            <p className="mt-2 text-sm text-dct-gray leading-6">{text}</p>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-black text-dct-primary"
              >
                Open CATIA setup folder ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatiaBasicsPanel() {
  const [courses, setCourses] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [activeCourseId, setActiveCourseId] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [preReqRes, enrollRes] = await Promise.all([
        prerequisiteApi.list(),
        batchApi.enrolled(),
      ]);
      const data = preReqRes.data || [];
      setCourses(data);
      setEnrollment((enrollRes.data || [])[0] || null);
      const catia =
        data.find((c) => c.slug === "catia-tool-for-beginners") || data[0];

      setActiveCourseId((currentCourseId) => {
        const courseStillExists = data.some(
          (course) => course.id === currentCourseId,
        );

        return courseStillExists
          ? currentCourseId
          : catia?.id || data[0]?.id || "";
      });

      setActiveLessonId((currentLessonId) => {
        const lessonStillExists = data.some((course) =>
          course.lessons?.some((lesson) => lesson.id === currentLessonId),
        );

        return lessonStillExists
          ? currentLessonId
          : catia?.lessons?.[0]?.id || "";
      });
    } catch (e) {
      setErr(e.message || "Failed to load prerequisite videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const catia =
    courses.find((course) => course.slug === "catia-tool-for-beginners") ||
    courses[0];

  const optional = courses.filter(
    (course) => course.slug !== "catia-tool-for-beginners",
  );

  const activeCourse =
    courses.find((course) => course.id === activeCourseId) ||
    catia ||
    courses[0];

  const lessons = activeCourse?.lessons || [];

  const active =
    lessons.find((lesson) => lesson.id === activeLessonId) ||
    lessons.find((lesson) => lesson.is_unlocked) ||
    lessons[0];

  const openCourse = (course) => {
    if (!course) return;

    const catiaCompleted =
      Number(catia?.completed_lessons || 0) >=
        Number(catia?.total_lessons || 0) &&
      Number(catia?.total_lessons || 0) > 0;

    const isCatia = course.id === catia?.id;

    if (!isCatia && !catiaCompleted) {
      alert("Complete all CATIA Basic videos before starting this course.");
      return;
    }

    const firstAvailableLesson =
      course.lessons?.find(
        (lesson) => lesson.is_unlocked && !lesson.completed,
      ) ||
      course.lessons?.find((lesson) => lesson.is_unlocked) ||
      course.lessons?.[0];

    setActiveCourseId(course.id);
    setActiveLessonId(firstAvailableLesson?.id || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const complete = async () => {
    if (!active?.id) return;
    try {
      await prerequisiteApi.saveProgress(active.id, {
        completed: true,
        watched_seconds: active.duration_seconds || 1800,
        last_position: active.duration_seconds || 1800,
      });
      const currentCourseId = activeCourse?.id;
      const currentLessonId = active.id;
      const currentCourseIndex = courses.findIndex(
        (course) => course.id === currentCourseId,
      );

      await load();

      const currentLessonIndex = lessons.findIndex(
        (lesson) => lesson.id === currentLessonId,
      );

      const nextLesson = lessons[currentLessonIndex + 1];

      if (nextLesson) {
        setActiveLessonId(nextLesson.id);
        return;
      }

      const isLastLesson = currentLessonIndex === lessons.length - 1;

      if (isLastLesson && currentCourseId === catia?.id) {
        const nextCourse = courses[currentCourseIndex + 1];

        if (nextCourse) {
          const nextCourseLesson =
            nextCourse.lessons?.find((lesson) => lesson.is_unlocked) ||
            nextCourse.lessons?.[0];

          setActiveCourseId(nextCourse.id);
          setActiveLessonId(nextCourseLesson?.id || "");
        }
      }
    } catch (e) {
      alert(e.message || "Failed to save progress.");
    }
  };

  return (
    <div className="space-y-5">
      <div
        className="rounded-[28px] p-6 sm:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
      >
        <p className="text-xs font-black tracking-[0.25em] uppercase opacity-90">
          Second Step
        </p>
        <h1 className="text-2xl sm:text-4xl font-black mt-2 leading-tight">
          {activeCourse?.title || "Prerequisite video plan"}
        </h1>
        <p className="mt-3 max-w-3xl text-white/85 text-sm sm:text-base leading-7">
          Complete videos in order. Each completion is saved and visible to
          admin.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/12 p-4">
            <strong className="text-2xl">
              {activeCourse?.completed_lessons || 0}/
              {activeCourse?.total_lessons || 0}
            </strong>
            <p className="text-xs opacity-80">Videos completed</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4">
            <strong className="text-2xl">
              {fmtDate(enrollment?.batch?.start_date)}
            </strong>
            <p className="text-xs opacity-80">Batch starts</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4">
            <strong className="text-2xl">90%</strong>
            <p className="text-xs opacity-80">Watch target</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
        <h3 className="font-black text-dct-dark">Your recommended plan</h3>
        <p className="text-sm text-dct-gray mt-1 leading-6">
          {getPlanMessage(enrollment)}
        </p>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 font-semibold text-sm">
          {err}
        </div>
      )}
      {loading && (
        <div className="bg-white rounded-3xl p-10 text-center">
          Loading videos...
        </div>
      )}

      {!loading && !err && active && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="bg-white rounded-3xl border border-blue-100 overflow-hidden shadow-sm">
            <div className="aspect-video bg-slate-950">
              <iframe
                key={active.id}
                src={active.vimeo_url}
                title={active.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {activeCourse?.title || "Prerequisite Course"}
                </span>
                <span className="text-xs font-black text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  Target:{" "}
                  {fmtDate(
                    targetDateFor((active.order_number || 1) - 1, enrollment),
                  )}
                </span>
              </div>
              <h2 className="text-xl font-black text-dct-dark">
                {active.title}
              </h2>
              <p className="text-sm text-dct-gray mt-2">{active.description}</p>
              <button
                onClick={complete}
                className="mt-4 inline-flex items-center gap-2 bg-dct-primary hover:bg-dct-blue text-white font-black px-5 py-3 rounded-2xl"
              >
                ✅ Mark Complete
              </button>
            </div>
          </section>

          <aside className="bg-white rounded-3xl border border-blue-100 p-3 shadow-sm h-fit">
            <div className="px-2 py-3">
              <h3 className="font-black text-dct-dark">Video order</h3>
              <p className="text-xs text-dct-gray mt-1">
                Next video unlocks after previous completion.
              </p>
            </div>
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {lessons.map((video, index) => {
                const activeRow = video.id === active.id;
                return (
                  <button
                    key={video.id}
                    disabled={!video.is_unlocked}
                    onClick={() =>
                      video.is_unlocked && setActiveLessonId(video.id)
                    }
                    className={`w-full text-left rounded-2xl border p-3 transition ${activeRow ? "border-dct-primary bg-blue-50" : "border-gray-100 bg-white hover:bg-slate-50"} ${!video.is_unlocked ? "opacity-55 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${video.completed ? "bg-green-100 text-green-700" : video.is_unlocked ? "bg-blue-100 text-dct-primary" : "bg-gray-100 text-gray-400"}`}
                      >
                        {video.completed
                          ? "✅"
                          : video.is_unlocked
                            ? "▶"
                            : "🔒"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-dct-dark leading-5">
                          {String(video.order_number || index + 1).padStart(
                            2,
                            "0",
                          )}
                          . {video.title}
                        </p>
                        <p className="text-xs text-dct-gray mt-1">
                          Target: {fmtDate(targetDateFor(index, enrollment))} •{" "}
                          {video.progress_percent || 0}%
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {optional.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-dct-dark">
            Optional after CATIA basics
          </h2>

          {optional.map((course) => {
            const catiaCompleted =
              Number(catia?.completed_lessons || 0) >=
                Number(catia?.total_lessons || 0) &&
              Number(catia?.total_lessons || 0) > 0;

            const isCurrent = course.id === activeCourse?.id;

            return (
              <button
                key={course.id}
                type="button"
                disabled={!catiaCompleted}
                onClick={() => openCourse(course)}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  isCurrent
                    ? "border-dct-primary bg-blue-50"
                    : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                } ${
                  !catiaCompleted
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{course.icon}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-black text-dct-dark">
                        {course.title}
                      </h3>

                      {!catiaCompleted ? (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black text-gray-500">
                          🔒 COMPLETE CATIA FIRST
                        </span>
                      ) : course.completed_lessons === course.total_lessons ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black text-green-700">
                          ✅ COMPLETED
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-dct-primary">
                          ▶ START COURSE
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-dct-gray">
                      {course.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <p className="text-xs font-bold text-dct-primary">
                        {course.completed_lessons}/{course.total_lessons}{" "}
                        completed
                      </p>

                      {catiaCompleted && (
                        <span className="text-xs font-black text-dct-primary">
                          {isCurrent ? "Currently open" : "Click to open →"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PrerequisitesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const current =
    location.pathname === "/student/prerequisites" ||
    location.pathname.includes("catia-basics")
      ? "catia"
      : "install";
  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-dct-dark">
            Pre-Requisites
          </h1>
          <p className="text-sm text-dct-gray mt-1">
            First install CATIA, then complete CATIA basics before or along with
            your early live sessions.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-blue-100 p-2 mb-5 grid grid-cols-2 gap-2 shadow-sm">
          <button
            onClick={() => navigate("/student/prerequisites/tool-installation")}
            className={`rounded-2xl px-4 py-4 font-black text-sm flex items-center justify-center gap-2 ${current === "install" ? "bg-dct-primary text-white" : "bg-white text-dct-primary"}`}
          >
            🔧 Tool Installation
          </button>
          <button
            onClick={() => navigate("/student/prerequisites/catia-basics")}
            className={`rounded-2xl px-4 py-4 font-black text-sm flex items-center justify-center gap-2 ${current === "catia" ? "bg-dct-primary text-white" : "bg-white text-dct-primary"}`}
          >
            📘 CATIA Basic Videos
          </button>
        </div>

        {current === "install" ? <InstallationPanel /> : <CatiaBasicsPanel />}
      </PageWrapper>
    </AppShell>
  );
}
