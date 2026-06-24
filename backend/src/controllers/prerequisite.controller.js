const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

const DEMO_VIMEO = "https://player.vimeo.com/video/900601730";

const DEFAULT_COURSES = [
  {
    slug: "catia-tool-for-beginners",
    title: "CATIA Tool for Beginners",
    subtitle: "Required before live Plastic / BIW sessions",
    description:
      "Complete CATIA basics before live training starts or during the first non-live days.",
    icon: "⚙",
    order_index: 1,
    lessons: [
      [
        1,
        "Sketcher Session 01",
        "CATIA sketcher introduction and basic sketch workflow.",
        "https://player.vimeo.com/video/900601730",
      ],
      [
        2,
        "Sketcher Session 02",
        "Profile creation, constraints and clean sketching practice.",
        "https://player.vimeo.com/video/900603176",
      ],
      [
        3,
        "Sketcher Session 03",
        "Advanced profile creation and sketch correction practice.",
        "https://player.vimeo.com/video/900609026",
      ],
      [
        4,
        "Sketcher Session 04",
        "Sketcher tools, trim, mirror, offset and reference use.",
        "https://player.vimeo.com/video/900610082",
      ],
      [
        5,
        "Sketcher Session 05",
        "Sketcher practice and common mistakes correction.",
        "https://player.vimeo.com/video/900611137",
      ],
      [
        6,
        "Part Design Session 01",
        "Part Design interface, pad, pocket and basic solid workflow.",
        "https://player.vimeo.com/video/900612354",
      ],
      [
        7,
        "Part Design Session 02",
        "Fillet, chamfer, hole, shell and feature order thinking.",
        "https://player.vimeo.com/video/900613490",
      ],
      [
        8,
        "Part Design Session 03",
        "Reference elements, planes, axis and design intent.",
        "https://player.vimeo.com/video/900614440",
      ],
      [
        9,
        "Part Design Session 04",
        "Practice model creation and tree structure discipline.",
        "https://player.vimeo.com/video/900615262",
      ],
      [
        10,
        "Part Design Session 05",
        "Final basic practice before live domain sessions.",
        "https://player.vimeo.com/video/900616202",
      ],
    ],
  },
  {
    slug: "ug-nx-tool-for-beginners",
    title: "UG NX Tool for Beginners",
    subtitle: "Optional after CATIA basics",
    description:
      "NX awareness course for students who want extra CAD confidence.",
    icon: "🔧",
    order_index: 2,
    lessons: [
      [
        1,
        "NX Sketchers Introduction",
        "its not required now, after 3 months you can learn",
        "https://player.vimeo.com/video/997012965",
      ],
      [
        2,
        "NX Part-Design",
        "its not required now, after 3 months you can learn",
        "https://player.vimeo.com/video/997173059",
      ],
      [
        3,
        "NX Assembly Workbench",
        "its not required now, after 3 months you can learn",
        "https://player.vimeo.com/video/707301515",
      ],
      [
        4,
        "Synchronous Modeling Basics",
        "Understand direct edit workflow used in industry corrections.",
      ],
      [
        5,
        "NX Assembly & Drafting Basics",
        "Assembly positioning and drawing basics for mechanical parts.",
      ],
    ],
  },
  {
    slug: "gdt-fundamentals",
    title: "GD&T Fundamentals",
    subtitle: "Optional for interview and drawing confidence",
    description: "Drawing, tolerance and manufacturing communication basics.",
    icon: "📐",
    order_index: 3,
    lessons: [
      [
        1,
        "Drawing Reading Basics",
        "Understand basic views, dimensions, notes and title block.",
      ],
      [
        2,
        "Datum Concept",
        "Understand datum feature, datum reference and locating intent.",
      ],
      [
        3,
        "Form Controls",
        "Flatness, straightness, circularity and cylindricity overview.",
      ],
      [
        4,
        "Orientation & Location Controls",
        "Parallelism, perpendicularity, position and profile basics.",
      ],
      [
        5,
        "Practical GD&T Review",
        "How designers use GD&T in automotive product design discussions.",
      ],
    ],
  },
];

function toVimeoEmbed(url) {
  const raw = String(url || "").trim();
  if (!raw || raw.includes("PASTE_VIDEO_ID")) return DEMO_VIMEO;
  if (raw.includes("player.vimeo.com/video/")) return raw;
  const privateMatch = raw.match(
    /vimeo\.com\/(?:manage\/videos\/)?(\d+)\/([a-zA-Z0-9]+)/i,
  );
  if (privateMatch)
    return `https://player.vimeo.com/video/${privateMatch[1]}?h=${privateMatch[2]}`;
  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return raw;
}

async function ensureDefaultPrerequisites() {
  for (const item of DEFAULT_COURSES) {
    const course = await prisma.prerequisiteCourse.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        icon: item.icon,
        order_index: item.order_index,
        is_active: true,
      },
      create: {
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        icon: item.icon,
        order_index: item.order_index,
        is_active: true,
      },
    });

    for (const lesson of item.lessons) {
      const [order_number, title, description, vimeo_url] = lesson;
      await prisma.prerequisiteLesson.upsert({
        where: {
          course_id_order_number: { course_id: course.id, order_number },
        },
        update: {
          title,
          description,
          vimeo_url: toVimeoEmbed(vimeo_url || DEMO_VIMEO),
          duration_seconds: 1800,
          completion_percent: 90,
          is_active: true,
        },
        create: {
          course_id: course.id,
          order_number,
          title,
          description,
          vimeo_url: toVimeoEmbed(vimeo_url || DEMO_VIMEO),
          duration_seconds: 1800,
          completion_percent: 90,
          is_active: true,
        },
      });
    }
  }
}

function isComplete(progress, lesson) {
  if (progress?.completed_at) return true;
  const required = Math.ceil(
    (Number(lesson.duration_seconds || 0) *
      Number(lesson.completion_percent || 90)) /
      100,
  );
  return Number(progress?.watched_seconds || 0) >= required && required > 0;
}

function buildCoursePayload(course, progressesByLessonId) {
  let previousCompleted = true;
  const lessons = course.lessons.map((lesson) => {
    const progress = progressesByLessonId.get(lesson.id) || null;
    const completed = isComplete(progress, lesson);
    const unlocked = previousCompleted;
    const pct = lesson.duration_seconds
      ? Math.min(
          100,
          Math.round(
            (Number(progress?.watched_seconds || 0) /
              Number(lesson.duration_seconds)) *
              100,
          ),
        )
      : 0;

    const payload = {
      id: lesson.id,
      order_number: lesson.order_number,
      title: lesson.title,
      description: lesson.description,
      vimeo_url: toVimeoEmbed(lesson.vimeo_url),
      duration_seconds: lesson.duration_seconds,
      completion_percent: lesson.completion_percent,
      watched_seconds: Number(progress?.watched_seconds || 0),
      last_position: Number(progress?.last_position || 0),
      progress_percent: completed ? 100 : pct,
      completed,
      completed_at: progress?.completed_at || null,
      is_unlocked: unlocked,
    };

    previousCompleted = completed;
    return payload;
  });

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalLessons = lessons.length;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    icon: course.icon,
    order_index: course.order_index,
    total_lessons: totalLessons,
    completed_lessons: completedCount,
    progress_percent: totalLessons
      ? Math.round((completedCount / totalLessons) * 100)
      : 0,
    lessons,
  };
}

const listPrerequisitesForStudent = async (req, res, next) => {
  try {
    await ensureDefaultPrerequisites();

    const [courses, progresses] = await Promise.all([
      prisma.prerequisiteCourse.findMany({
        where: { is_active: true },
        orderBy: [{ order_index: "asc" }, { created_at: "asc" }],
        include: {
          lessons: {
            where: { is_active: true },
            orderBy: { order_number: "asc" },
          },
        },
      }),
      prisma.prerequisiteProgress.findMany({
        where: { student_id: req.user.id },
      }),
    ]);

    const progressesByLessonId = new Map(
      progresses.map((p) => [p.lesson_id, p]),
    );
    const data = courses.map((course) =>
      buildCoursePayload(course, progressesByLessonId),
    );
    return success(res, 200, "Prerequisite courses fetched.", data);
  } catch (err) {
    next(err);
  }
};

const updateLessonProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const completedFromClient = Boolean(req.body?.completed);
    const watched = Math.max(
      0,
      Math.floor(Number(req.body?.watched_seconds || 0)),
    );
    const position = Math.max(
      0,
      Math.floor(Number(req.body?.last_position || watched || 0)),
    );

    const lesson = await prisma.prerequisiteLesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson || !lesson.is_active || !lesson.course?.is_active) {
      return error(res, 404, "Lesson not found.");
    }

    if (lesson.order_number > 1) {
      const previous = await prisma.prerequisiteLesson.findUnique({
        where: {
          course_id_order_number: {
            course_id: lesson.course_id,
            order_number: lesson.order_number - 1,
          },
        },
        include: { progress: { where: { student_id: req.user.id } } },
      });
      if (previous && !isComplete(previous.progress?.[0], previous)) {
        return error(res, 403, "Complete previous lesson first.");
      }
    }

    const requiredSeconds = Math.ceil(
      (lesson.duration_seconds * lesson.completion_percent) / 100,
    );
    const cappedWatched = completedFromClient
      ? lesson.duration_seconds
      : Math.min(Math.max(watched, position), lesson.duration_seconds);
    const isNowComplete =
      cappedWatched >= requiredSeconds || completedFromClient;

    const existing = await prisma.prerequisiteProgress.findUnique({
      where: {
        student_id_lesson_id: { student_id: req.user.id, lesson_id: lesson.id },
      },
    });

    const progress = await prisma.prerequisiteProgress.upsert({
      where: {
        student_id_lesson_id: { student_id: req.user.id, lesson_id: lesson.id },
      },
      update: {
        watched_seconds: Math.max(
          Number(existing?.watched_seconds || 0),
          cappedWatched,
        ),
        last_position: Math.min(
          position || cappedWatched,
          lesson.duration_seconds,
        ),
        ...(isNowComplete && !existing?.completed_at
          ? { completed_at: new Date() }
          : {}),
      },
      create: {
        student_id: req.user.id,
        lesson_id: lesson.id,
        watched_seconds: cappedWatched,
        last_position: Math.min(
          position || cappedWatched,
          lesson.duration_seconds,
        ),
        ...(isNowComplete ? { completed_at: new Date() } : {}),
      },
    });

    return success(
      res,
      200,
      isNowComplete ? "Lesson completed." : "Progress saved.",
      {
        lesson_id: lesson.id,
        watched_seconds: progress.watched_seconds,
        last_position: progress.last_position,
        completed: Boolean(progress.completed_at),
        completed_at: progress.completed_at,
      },
    );
  } catch (err) {
    next(err);
  }
};

const getAdminPrerequisiteProgress = async (req, res, next) => {
  try {
    await ensureDefaultPrerequisites();

    const [courses, students] = await Promise.all([
      prisma.prerequisiteCourse.findMany({
        where: { is_active: true },
        orderBy: { order_index: "asc" },
        include: {
          lessons: {
            where: { is_active: true },
            orderBy: { order_number: "asc" },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          is_active: true,
          prerequisite_progress: true,
          enrollments: {
            include: {
              batch: { include: { course: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    const rows = students.map((student) => {
      const progressByLessonId = new Map(
        student.prerequisite_progress.map((p) => [p.lesson_id, p]),
      );
      const courseRows = courses.map((course) => {
        const total = course.lessons.length;
        const completed = course.lessons.filter((lesson) =>
          isComplete(progressByLessonId.get(lesson.id), lesson),
        ).length;
        return {
          course_id: course.id,
          slug: course.slug,
          title: course.title,
          total_lessons: total,
          completed_lessons: completed,
          progress_percent: total ? Math.round((completed / total) * 100) : 0,
        };
      });

      const catia =
        courseRows.find((c) => c.slug === "catia-tool-for-beginners") ||
        courseRows[0];
      const allTotal = courseRows.reduce((n, c) => n + c.total_lessons, 0);
      const allDone = courseRows.reduce((n, c) => n + c.completed_lessons, 0);

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        is_active: student.is_active,
        enrolled_courses: student.enrollments
          .map((e) => e.batch?.course?.name)
          .filter(Boolean),
        catia_completed_lessons: catia?.completed_lessons || 0,
        catia_total_lessons: catia?.total_lessons || 10,
        catia_progress_percent: catia?.progress_percent || 0,
        total_lessons: allTotal,
        completed_lessons: allDone,
        progress_percent: allTotal ? Math.round((allDone / allTotal) * 100) : 0,
        courses: courseRows,
      };
    });

    return success(res, 200, "Prerequisite progress fetched.", rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPrerequisitesForStudent,
  updateLessonProgress,
  getAdminPrerequisiteProgress,
};
