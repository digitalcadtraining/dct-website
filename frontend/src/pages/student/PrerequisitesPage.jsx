import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { prerequisiteApi } from "../../services/api.js";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, PlayCircle, Clock3, BookOpen, RefreshCw } from "lucide-react";

const C = { dark: "#1F1A17", blue: "#024981", primary: "#007BBF", gray: "#6A6B6D", light: "#9ca3af" };

function formatTime(total = 0) {
  const sec = Math.max(0, Math.floor(total));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function loadVimeoSdk() {
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo.Player);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-vimeo-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Vimeo.Player));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.dataset.vimeoSdk = "true";
    script.onload = () => resolve(window.Vimeo.Player);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function VimeoLessonPlayer({ lesson, onProgressSaved, locked }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const lastSentRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [localWatched, setLocalWatched] = useState(lesson?.watched_seconds || 0);

  useEffect(() => {
    setReady(false);
    setLocalWatched(lesson?.watched_seconds || 0);
    lastSentRef.current = 0;

    if (!lesson?.id || locked) return undefined;

    let destroyed = false;
    let player;

    loadVimeoSdk()
      .then((Player) => {
        if (destroyed || !iframeRef.current) return;
        player = new Player(iframeRef.current);
        playerRef.current = player;

        player.ready().then(async () => {
          setReady(true);
          if (lesson.last_position > 0) {
            try { await player.setCurrentTime(Math.min(lesson.last_position, lesson.duration_seconds - 2)); } catch {}
          }
        });

        player.on("timeupdate", (data) => {
          const current = Math.floor(data.seconds || 0);
          const watched = Math.max(current, lesson.watched_seconds || 0);
          setLocalWatched(watched);

          if (current - lastSentRef.current >= 12) {
            lastSentRef.current = current;
            prerequisiteApi.saveProgress(lesson.id, { watched_seconds: watched, last_position: current })
              .then((res) => onProgressSaved?.(res.data))
              .catch(() => {});
          }
        });

        player.on("ended", () => {
          prerequisiteApi.saveProgress(lesson.id, { watched_seconds: lesson.duration_seconds, last_position: lesson.duration_seconds })
            .then((res) => onProgressSaved?.(res.data, true))
            .catch(() => {});
        });
      })
      .catch(() => setReady(true));

    return () => {
      destroyed = true;
      try { playerRef.current?.unload?.(); } catch {}
      playerRef.current = null;
    };
  }, [lesson?.id, locked]);

  if (!lesson) {
    return <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-dct-lightgray">Select a lesson to start.</div>;
  }

  if (locked) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center" style={{ boxShadow: "0 18px 48px rgba(2,73,129,.08)" }}>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Lock size={28} /></div>
        <h3 className="text-xl font-bold text-dct-dark">Lesson Locked</h3>
        <p className="mt-2 text-sm text-dct-lightgray">Complete the previous video first to unlock this session.</p>
      </div>
    );
  }

  const pct = lesson.duration_seconds ? Math.min(100, Math.round((localWatched / lesson.duration_seconds) * 100)) : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white" style={{ boxShadow: "0 18px 54px rgba(2,73,129,.10)" }}>
      <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe
          ref={iframeRef}
          src={`${lesson.vimeo_url}?title=0&byline=0&portrait=0&badge=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={lesson.title}
          className="absolute inset-0 h-full w-full border-0"
        />
        {!ready && <div className="absolute inset-0 grid place-items-center bg-black text-white text-sm">Loading video…</div>}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-dct-primary">Session {lesson.order_number}</p>
            <h2 className="mt-1 text-xl font-bold text-dct-dark">{lesson.title}</h2>
            {lesson.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-dct-gray">{lesson.description}</p>}
          </div>
          {lesson.completed ? <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">Completed</span> : <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-dct-primary">Watch {lesson.completion_percent}% to complete</span>}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-dct-gray"><span>{formatTime(localWatched)} watched</span><span>{pct}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#024981] to-[#007BBF] transition-all" style={{ width: `${lesson.completed ? 100 : pct}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

function LessonRow({ lesson, active, onClick }) {
  return (
    <button onClick={onClick} disabled={!lesson.is_unlocked} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-dct-primary bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"} ${!lesson.is_unlocked ? "opacity-60 cursor-not-allowed" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${lesson.completed ? "bg-green-100 text-green-700" : lesson.is_unlocked ? "bg-blue-100 text-dct-primary" : "bg-slate-100 text-slate-500"}`}>
          {lesson.completed ? <CheckCircle2 size={20} /> : lesson.is_unlocked ? <PlayCircle size={20} /> : <Lock size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-dct-primary">{String(lesson.order_number).padStart(2, "0")}</p>
          <h4 className="truncate text-sm font-bold text-dct-dark">{lesson.title}</h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-dct-lightgray"><Clock3 size={12} /> {formatTime(lesson.duration_seconds)}</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-dct-primary" style={{ width: `${lesson.progress_percent || 0}%` }} /></div>
    </button>
  );
}

export default function PrerequisitesPage() {
  const [courses, setCourses] = useState([]);
  const [courseIndex, setCourseIndex] = useState(0);
  const [lessonId, setLessonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    prerequisiteApi.list()
      .then((res) => {
        const items = res.data || [];
        setCourses(items);
        const firstCourse = items[courseIndex] || items[0];
        const firstOpen = firstCourse?.lessons?.find((l) => l.is_unlocked && !l.completed) || firstCourse?.lessons?.[0];
        setLessonId(firstOpen?.id || "");
      })
      .catch((e) => setError(e.message || "Failed to load prerequisite courses."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const selectedCourse = courses[courseIndex] || null;
  const selectedLesson = useMemo(() => selectedCourse?.lessons?.find((l) => l.id === lessonId) || selectedCourse?.lessons?.[0] || null, [selectedCourse, lessonId]);

  const refreshAfterProgress = (saved, force = false) => {
    if (saved?.completed || force) load();
    else {
      setCourses((prev) => prev.map((course) => ({
        ...course,
        lessons: course.lessons.map((lesson) => lesson.id === saved?.lesson_id ? { ...lesson, watched_seconds: saved.watched_seconds, last_position: saved.last_position, completed: saved.completed, progress_percent: saved.completed ? 100 : lesson.progress_percent } : lesson),
      })));
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#024981] to-[#007BBF] p-5 text-white sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Pre-Requisites</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Complete these before your live course starts</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">Watch in order. Every session is tracked by watch time, and the next lesson unlocks only after the previous one is completed.</p>
        </div>

        {loading && <div className="rounded-3xl bg-white p-10 text-center text-dct-lightgray">Loading prerequisite videos…</div>}
        {!loading && error && <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-600">{error}</p><button onClick={load} className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white"><RefreshCw size={14} className="inline mr-2" />Retry</button></div>}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {courses.map((course, idx) => (
                <button key={course.id} onClick={() => { setCourseIndex(idx); const next = course.lessons.find((l) => l.is_unlocked && !l.completed) || course.lessons[0]; setLessonId(next?.id || ""); }} className={`rounded-2xl border bg-white p-4 text-left transition ${idx === courseIndex ? "border-dct-primary shadow-lg" : "border-gray-100 hover:border-blue-200"}`}>
                  <div className="flex items-center gap-3"><span className="text-2xl">{course.icon}</span><div><h3 className="font-bold text-dct-dark">{course.title}</h3><p className="text-xs text-dct-lightgray">{course.completed_lessons}/{course.total_lessons} completed</p></div></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-dct-primary" style={{ width: `${course.progress_percent}%` }} /></div>
                </button>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
              <motion.div key={selectedLesson?.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <VimeoLessonPlayer lesson={selectedLesson} locked={!selectedLesson?.is_unlocked} onProgressSaved={refreshAfterProgress} />
              </motion.div>

              <aside className="rounded-3xl border border-gray-100 bg-white p-4" style={{ boxShadow: "0 14px 42px rgba(2,73,129,.08)" }}>
                <div className="mb-4 flex items-center justify-between gap-2"><div><h3 className="font-bold text-dct-dark">{selectedCourse?.title}</h3><p className="text-xs text-dct-lightgray">Sequential video sessions</p></div><BookOpen className="text-dct-primary" size={20} /></div>
                <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
                  {selectedCourse?.lessons?.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} active={lesson.id === selectedLesson?.id} onClick={() => lesson.is_unlocked && setLessonId(lesson.id)} />)}
                </div>
              </aside>
            </div>
          </>
        )}
      </PageWrapper>
    </AppShell>
  );
}
