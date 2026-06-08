const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

const DEMO_VIMEO = "https://player.vimeo.com/video/76979871";

const DEFAULT_COURSES = [
  {
    slug: "catia-tool-for-beginners",
    title: "CATIA Tool for Beginners",
    subtitle: "Start here before live Plastic / BIW sessions",
    description: "Build the basic CATIA confidence required before the domain course begins.",
    icon: "⚙",
    lessons: [
      [1, "CATIA Interface & Workbench Overview", "Understand CATIA screen, workbenches, tree structure and navigation."],
      [2, "Sketcher Basics & Constraints", "Create clean sketches with dimensions and constraints."],
      [3, "Part Design Core Commands", "Pad, pocket, shaft, groove, fillet, chamfer and reference features."],
      [4, "Assembly Basics", "Product structure, components, constraints and simple assembly workflow."],
      [5, "Drafting & Drawing Basics", "Basic views, dimensions and manufacturing drawing awareness."],
    ],
  },
  {
    slug: "ug-nx-tool-for-beginners",
    title: "UG NX Tool for Beginners",
    subtitle: "Useful for NX based automotive projects",
    description: "Learn NX basics so you can understand project conversion and common industry workflows.",
    icon: "🔧",
    lessons: [
      [1, "NX Interface & File Workflow", "Open, save, navigate and understand the NX part environment."],
      [2, "NX Sketching Fundamentals", "Use sketch tools, constraints, dimensions and references."],
      [3, "NX 3D Modeling Commands", "Extrude, revolve, hole, shell, edge blend and design intent."],
      [4, "Synchronous Modeling Basics", "Understand direct edit workflow used in industry corrections."],
      [5, "NX Assembly & Drafting Basics", "Assembly positioning and drawing basics for mechanical parts."],
    ],
  },
  {
    slug: "mould-design-fundamentals",
    title: "Mould Design Fundamentals",
    subtitle: "Prerequisite for plastic product design thinking",
    description: "Understand basic mould terminology, tooling direction and manufacturing feasibility.",
    icon: "🏭",
    lessons: [
      [1, "Injection Moulding Process Overview", "Understand machine, mould, material, filling, cooling and ejection basics."],
      [2, "Tooling Direction & Draft", "Learn how tooling direction, draft and undercuts affect plastic part design."],
      [3, "Core, Cavity, Slider & Lifter", "Understand mould side decisions and side core actions."],
      [4, "Gate, Runner, Cooling & Ejection", "Basic mould systems every product designer should know."],
      [5, "Common Plastic Defects", "Sink mark, weld line, warpage, flash and basic prevention thinking."],
    ],
  },
];

function toVimeoEmbed(url) {
  const raw = String(url || "").trim();
  if (!raw) return DEMO_VIMEO;
  if (raw.includes("player.vimeo.com/video/")) return raw;
  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return raw;
}

async function ensureDefaultPrerequisites() {
  for (const [courseIndex, item] of DEFAULT_COURSES.entries()) {
    const course = await prisma.prerequisiteCourse.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        icon: item.icon,
        order_index: courseIndex + 1,
        is_active: true,
      },
      create: {
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        icon: item.icon,
        order_index: courseIndex + 1,
        is_active: true,
      },
    });

    for (const lesson of item.lessons) {
      const [order_number, title, description] = lesson;
      await prisma.prerequisiteLesson.upsert({
        where: { course_id_order_number: { course_id: course.id, order_number } },
        update: {
          title,
          description,
          vimeo_url: DEMO_VIMEO,
          duration_seconds: 600,
          completion_percent: 90,
          is_active: true,
        },
        create: {
          course_id: course.id,
          order_number,
          title,
          description,
          vimeo_url: DEMO_VIMEO,
          duration_seconds: 600,
          completion_percent: 90,
          is_active: true,
        },
      });
    }
  }
}

function isComplete(progress, lesson) {
  if (progress?.completed_at) return true;
  const required = Math.ceil((Number(lesson.duration_seconds || 0) * Number(lesson.completion_percent || 90)) / 100);
  return Number(progress?.watched_seconds || 0) >= required && required > 0;
}

function buildCoursePayload(course, progressesByLessonId) {
  let previousCompleted = true;
  const lessons = course.lessons.map((lesson) => {
    const progress = progressesByLessonId.get(lesson.id) || null;
    const completed = isComplete(progress, lesson);
    const unlocked = previousCompleted;
    const pct = lesson.duration_seconds
      ? Math.min(100, Math.round((Number(progress?.watched_seconds || 0) / Number(lesson.duration_seconds)) * 100))
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
    progress_percent: totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0,
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
      prisma.prerequisiteProgress.findMany({ where: { student_id: req.user.id } }),
    ]);

    const progressesByLessonId = new Map(progresses.map((p) => [p.lesson_id, p]));
    const data = courses.map((course) => buildCoursePayload(course, progressesByLessonId));
    return success(res, 200, "Prerequisite courses fetched.", data);
  } catch (err) {
    next(err);
  }
};

const updateLessonProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const watched = Math.max(0, Math.floor(Number(req.body?.watched_seconds || 0)));
    const position = Math.max(0, Math.floor(Number(req.body?.last_position || watched || 0)));

    const lesson = await prisma.prerequisiteLesson.findUnique({
      where: { id: lessonId },
      include: {
        course: true,
      },
    });

    if (!lesson || !lesson.is_active || !lesson.course?.is_active) {
      return error(res, 404, "Lesson not found.");
    }

    if (lesson.order_number > 1) {
      const previous = await prisma.prerequisiteLesson.findUnique({
        where: { course_id_order_number: { course_id: lesson.course_id, order_number: lesson.order_number - 1 } },
        include: { progress: { where: { student_id: req.user.id } } },
      });
      if (previous && !isComplete(previous.progress?.[0], previous)) {
        return error(res, 403, "Complete previous lesson first.");
      }
    }

    const requiredSeconds = Math.ceil((lesson.duration_seconds * lesson.completion_percent) / 100);
    const cappedWatched = Math.min(Math.max(watched, position), lesson.duration_seconds);
    const isNowComplete = cappedWatched >= requiredSeconds;

    const progress = await prisma.prerequisiteProgress.upsert({
      where: { student_id_lesson_id: { student_id: req.user.id, lesson_id: lesson.id } },
      update: {
        watched_seconds: { increment: 0 },
        last_position: Math.min(position, lesson.duration_seconds),
      },
      create: {
        student_id: req.user.id,
        lesson_id: lesson.id,
        watched_seconds: 0,
        last_position: Math.min(position, lesson.duration_seconds),
      },
    });

    const nextWatched = Math.max(progress.watched_seconds, cappedWatched);
    const updated = await prisma.prerequisiteProgress.update({
      where: { id: progress.id },
      data: {
        watched_seconds: nextWatched,
        last_position: Math.min(position, lesson.duration_seconds),
        ...(isNowComplete && !progress.completed_at ? { completed_at: new Date() } : {}),
      },
    });

    return success(res, 200, isNowComplete ? "Lesson completed." : "Progress saved.", {
      lesson_id: lesson.id,
      watched_seconds: updated.watched_seconds,
      last_position: updated.last_position,
      completed: Boolean(updated.completed_at),
      completed_at: updated.completed_at,
    });
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
        include: { lessons: { where: { is_active: true }, orderBy: { order_number: "asc" } } },
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
            include: { batch: { include: { course: { select: { name: true } } } } },
          },
        },
      }),
    ]);

    const rows = students.map((student) => {
      const progressByLessonId = new Map(student.prerequisite_progress.map((p) => [p.lesson_id, p]));
      const courseRows = courses.map((course) => {
        const total = course.lessons.length;
        const completed = course.lessons.filter((lesson) => isComplete(progressByLessonId.get(lesson.id), lesson)).length;
        return {
          course_id: course.id,
          title: course.title,
          total_lessons: total,
          completed_lessons: completed,
          progress_percent: total ? Math.round((completed / total) * 100) : 0,
        };
      });

      const allTotal = courseRows.reduce((n, c) => n + c.total_lessons, 0);
      const allDone = courseRows.reduce((n, c) => n + c.completed_lessons, 0);

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        is_active: student.is_active,
        enrolled_courses: student.enrollments.map((e) => e.batch?.course?.name).filter(Boolean),
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
