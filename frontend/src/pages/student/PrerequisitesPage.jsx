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

const BUNNY_LIBRARY_ID = "818190";

const GDT_BUNNY_LIBRARY_ID = "822002";

const GDT_BUNNY_VIDEOS = [
  // Session 01
  "789a7ead-4b58-4719-95cd-10b45e913fc0",

  // Session 02
  "dc7e56d2-4eba-41ef-9988-e381a0c7bd7f",

  // Session 03
  "f066f283-081e-44d2-b3b3-488b04a8e1f3",

  // Session 04
  "858caa85-c5a4-45d8-8d31-6a2d9d190de3",

  // Session 05
  "f598ed2d-433c-488c-a61f-602174593146",

  // Session 06
  "27be4f68-35d3-433a-ad74-7847b635cc30",

  // Session 07
  "31a9d9be-0cd5-488a-847e-1f84700139fc",

  // Session 08
  "3d7ba800-8e11-4e56-8643-01e78c6877ec",

  // Session 09
  "c94953e5-2970-48ba-a5d6-c50ee2fe557e",

  // Session 10
  "b9a4e338-1a6f-4c6c-86e1-abd164a9e126",

  // Session 11
  "a9870b0c-0da9-43e4-94b8-bf88896a81ce",

  // Session 12
  "c2a6f0ec-835b-4e3f-b87c-ab440ddf5af4",

  // Session 13
  "51f3984d-43b6-4138-b96f-dfe71b5b41d9",

  // Session 14
  "0a550a68-3edc-41b6-9622-0eeff6677455",

  // Session 15
  "c9d09912-cdf9-41a7-857e-ce1b7f709d4a",

  // Session 16
  "9d50d091-3984-4a68-80aa-7d7f2469e717",

  // Session 17
  "328d35b7-d61b-4c96-8f77-f63ae441e76b",

  // Session 18
  "31aa9233-1cf1-44db-83dd-38ad6cd55346",

  // Session 19
  "340f75d8-94fb-4c8a-be87-8e92e5fa73dc",

  // Session 20
  "ec502fdc-6362-46ad-80cf-1ebed97d93bf",

  // Session 21
  "9a435f5b-1d4a-491d-ad76-99faf7703d86",

  // Session 22
  "84781281-3542-4a18-89c1-ee9e51d005cb",

  // Session 23
  "7948b35c-dd96-43c3-a596-a4aba518e66d",

  // Session 24
  "6236ff39-06c8-44b5-8132-a2e84e2471ee",

  // Session 25
  "a119edb2-c4a0-4cda-a046-4a8d24eee016",

  // Session 26
  "2b9c337c-b884-4a40-bda5-4921b12a3448",

  // Session 27
  "f3178141-7870-4f6b-a89d-b99cd52767bf",

  // Session 28
  "305ad8da-26ba-46f2-a3fe-0b303b7be0d5",

  // Session 29
  "433231a8-6ebf-4c26-b46c-1b2b69d185b8",

  // Session 30
  "9fcacff8-ed7a-4b2f-8e58-d5da58fc7063",
];

const CATIA_BUNNY_VIDEOS = {
  // Sketcher Sessions 01–05
  900601730: "dafba3fa-43dd-4a6a-bb85-a19c684285b9",
  900603176: "79f39dcf-bfa4-4dda-aea8-3d630fa3803c",
  900609026: "c77c4a39-bbc9-4988-ab87-b4619fe04dcd",
  900610082: "585db7da-5d23-4d96-9f5b-99f709f56e56",
  900611137: "d283cabb-3674-49dd-b193-87865f31c1bb",

  // Part Design Sessions 01–05
  900612354: "6f682f6a-dacc-47b5-b43b-5f9474ca59aa",
  900613490: "fc53a9e9-4e19-41d7-8c34-baea90050af6",
  900614440: "4df3f00d-859f-437e-b453-34e0d748645c",
  900615262: "757a57e2-3df1-4e5f-9956-6ad95e0082e3",
  900616202: "b3bc5fa3-a05e-4434-9a16-f67a37645ca4",
};

function getPrerequisitePlayerUrl(lesson, course) {
  const originalUrl = String(lesson?.vimeo_url || "");

  // GD&T Fundamentals — Bunny Stream
  if (course?.slug === "gdt-fundamentals") {
    const sessionNumber = Number(lesson?.order_number);

    const bunnyId = GDT_BUNNY_VIDEOS[sessionNumber - 1];

    if (!bunnyId) {
      console.warn("No Bunny video mapped for GD&T session:", sessionNumber);
      return "";
    }

    return `https://iframe.mediadelivery.net/embed/${GDT_BUNNY_LIBRARY_ID}/${bunnyId}`;
  }

  // Other prerequisite courses remain unchanged.
  if (course?.slug !== "catia-tool-for-beginners") {
    return originalUrl;
  }

  // Match CATIA videos by their session number.
  const sessionNumber = Number(lesson?.order_number);

  const bunnyVideoIds = [
    "dafba3fa-43dd-4a6a-bb85-a19c684285b9",
    "79f39dcf-bfa4-4dda-aea8-3d630fa3803c",
    "c77c4a39-bbc9-4988-ab87-b4619fe04dcd",
    "585db7da-5d23-4d96-9f5b-99f709f56e56",
    "d283cabb-3674-49dd-b193-87865f31c1bb",
    "6f682f6a-dacc-47b5-b43b-5f9474ca59aa",
    "fc53a9e9-4e19-41d7-8c34-baea90050af6",
    "4df3f00d-859f-437e-b453-34e0d748645c",
    "757a57e2-3df1-4e5f-9956-6ad95e0082e3",
    "b3bc5fa3-a05e-4434-9a16-f67a37645ca4",
  ];

  const bunnyId = bunnyVideoIds[sessionNumber - 1];

  if (!bunnyId) {
    console.warn("No Bunny video mapped for CATIA session:", sessionNumber);
    return "";
  }

  return `https://iframe.mediadelivery.net/embed/818190/${bunnyId}`;
}

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
  const [completing, setCompleting] = useState(false);

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
    if (completing) return;
    setCompleting(true);
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
    } finally {
      setCompleting(false);
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
            <div className="bg-slate-950">
              <div className="relative w-full aspect-video overflow-hidden bg-black">
                <iframe
                  key={active.id}
                  src={getPrerequisitePlayerUrl(active, activeCourse)}
                  title={active.title}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-green-400 text-sm">●</span>
                  <span className="text-xs sm:text-sm font-semibold truncate">
                    {active.completed
                      ? "Lesson completed"
                      : "Learning in progress"}
                  </span>
                </div>

                <span className="text-xs text-slate-300">
                  Session {String(active.order_number || 1).padStart(2, "0")}
                  {" / "}
                  {lessons.length}
                </span>
              </div>
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

              <h2 className="text-xl font-black text-dct-dark">
                {active.title}
              </h2>

              <p className="text-sm text-dct-gray mt-2">{active.description}</p>

              <button
                type="button"
                onClick={complete}
                disabled={completing || active.completed || !active.is_unlocked}
                className={`mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition
    ${
      active.completed
        ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
        : "bg-dct-primary hover:bg-dct-blue text-white shadow-md hover:shadow-lg"
    }
    disabled:opacity-70`}
              >
                {completing
                  ? "Saving progress..."
                  : active.completed
                    ? "✓ Lesson Completed"
                    : "✓ Mark Complete & Continue"}
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
        <button
          onClick={() => navigate("/student/prerequisites/english-confidence")}
          className="mt-5 w-full rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 text-left shadow-sm transition hover:shadow-md"
        >
          <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
            Bonus · Optional · No prerequisites
          </span>
          <span className="mt-2 block text-xl font-black text-gray-900">
            ⭐ English Confidence Builder
          </span>
          <span className="mt-2 block text-sm text-gray-600">
            Basic grammar → workplace English → HR interview answers. 90 days,
            15 minutes daily, easy MCQs. Start anytime — CATIA completion is not
            required.
          </span>
          <span className="mt-3 block text-sm font-black text-blue-700">
            Start learning →
          </span>
        </button>
      </PageWrapper>
    </AppShell>
  );
}
