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
      [1, "Sketcher Session 01", "CATIA sketcher introduction and basic sketch workflow.", "https://player.vimeo.com/video/900601730"],
      [2, "Sketcher Session 02", "Profile creation, constraints and clean sketching practice.", "https://player.vimeo.com/video/900603176"],
      [3, "Sketcher Session 03", "Advanced profile creation and sketch correction practice.", "https://player.vimeo.com/video/900609026"],
      [4, "Sketcher Session 04", "Sketcher tools, trim, mirror, offset and reference use.", "https://player.vimeo.com/video/900610082"],
      [5, "Sketcher Session 05", "Sketcher practice and common mistakes correction.", "https://player.vimeo.com/video/900611137"],
      [6, "Part Design Session 01", "Part Design interface, pad, pocket and basic solid workflow.", "https://player.vimeo.com/video/900612354"],
      [7, "Part Design Session 02", "Fillet, chamfer, hole, shell and feature order thinking.", "https://player.vimeo.com/video/900613490"],
      [8, "Part Design Session 03", "Reference elements, planes, axis and design intent.", "https://player.vimeo.com/video/900614440"],
      [9, "Part Design Session 04", "Practice model creation and tree structure discipline.", "https://player.vimeo.com/video/900615262"],
      [10, "Part Design Session 05", "Final basic practice before live domain sessions.", "https://player.vimeo.com/video/900616202"],
    ],
  },
  {
    slug: "ug-nx-tool-for-beginners",
    title: "UG NX Tool for Beginners",
    subtitle: "Optional after CATIA basics",
    description: "NX awareness course for students who want extra CAD confidence.",
    icon: "🔧",
    order_index: 2,
    lessons: [
      [1, "NX Sketchers Introduction", "Learn NX sketcher basics.", "https://player.vimeo.com/video/997012965"],
      [2, "NX Part-Design", "Learn NX part design basics.", "https://player.vimeo.com/video/997173059"],
      [3, "NX Assembly Workbench", "Learn assembly basics.", "https://player.vimeo.com/video/707301515"],
      [4, "Synchronous Modeling Basics", "Understand direct edit workflow used in industry corrections."],
      [5, "NX Assembly & Drafting Basics", "Assembly positioning and drawing basics for mechanical parts."],
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
      [1, "Session 1 GD&T", "Introduction of the Course", "https://player.vimeo.com/video/723081241"],
      [2, "Session 2 GD&T", "Overview Of the Course", "https://player.vimeo.com/video/723090995"],
      [3, "Session 3 GD&T", "Test Your Current Skills", "https://player.vimeo.com/video/723082681"],
      [4, "Session 4 GD&T", "Need Of GD&T", "https://player.vimeo.com/video/723092850"],
      [5, "Session 5 GD&T", "Concept Of Tolerant Zone", "https://player.vimeo.com/video/723085556"],
      [6, "Session 6 GD&T", "Concept Of Datums", "https://player.vimeo.com/video/723087613"],
      [7, "Session 7 GD&T", "Concept Of MMC", "https://player.vimeo.com/video/723378996"],
      [8, "Session 8 GD&T", "Inspection of a simple drawing", "https://player.vimeo.com/video/723389836"],
      [9, "Session 9 GD&T", "Concept of polar coordinates_", "https://player.vimeo.com/video/723394823"],
      [10, "Session 10 GD&T", "Circular Profile", "https://player.vimeo.com/video/723399837"],
      [11, "Session 11 GD&T", "Virtual Size", "https://player.vimeo.com/video/723634058"],
      [12, "Session 12 GD&T", "Understanding datums in detail", "https://player.vimeo.com/video/723640796"],
      [13, "Session 13 GD&T", "Dimensioning a drawing", "https://player.vimeo.com/video/723643879"],
      [14, "Session 14 GD&T", "Inspection of a component", "https://player.vimeo.com/video/723646990"],
      [15, "Session 15 GD&T", "Inspection of a component 2", "https://player.vimeo.com/video/723650329"],
      [16, "Session 16 GD&T", "Holes as datums", "https://player.vimeo.com/video/723665418"],
      [17, "Session 17 GD&T", "Form controls", "https://player.vimeo.com/video/723660545"],
      [18, "Session 18 GD&T", "Paradox", "https://player.vimeo.com/video/723662005"],
      [19, "Session 19 GD&T", "Types of feature control frame", "https://player.vimeo.com/video/723675060"],
      [20, "Session 20 GD&T", "Types of feature control frame 2", "https://player.vimeo.com/video/723680147"],
      [21, "Session 21 GD&T", "Profile controls", "https://player.vimeo.com/video/723683604"],
      [22, "Session 22 GD&T", "Coaxial datums", "https://player.vimeo.com/video/723686448"],
      [23, "Session 23 GD&T", "Coaxial controls", "https://player.vimeo.com/video/723688113"],
      [24, "Session 24 GD&T", "Projected tol_", "https://player.vimeo.com/video/723690013"],
      [25, "Session 25 GD&T", "Concept of boundaries_", "https://player.vimeo.com/video/723692660"],
      [26, "Session 26 GD&T", "Individual Stackup", "https://player.vimeo.com/video/723694617"],
      [27, "Session 27 GD&T", "Set up for Assy Stackup", "https://player.vimeo.com/video/723695266"],
      [28, "Session 28 GD&T", "Stackup problem 1", "https://player.vimeo.com/video/723695948"],
      [29, "Session 29 GD&T", "Stackup problem 2", "https://player.vimeo.com/video/723696418"],
      [30, "Session 30 GD&T", "Stackup problem 3", "https://player.vimeo.com/video/723696757"],
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
  if (privateMatch) {
    return `https://player.vimeo.com/video/${privateMatch[1]}?h=${privateMatch[2]}`;
  }

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
          course_id_order_number: {
            course_id: course.id,
            order_number,
          },
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

  return (
    Number(progress?.watched_seconds || 0) >= required &&
    required > 0
  );
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

  const completedCount = lessons.filter((lesson) => lesson.completed).length;
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

function normalizeAccessRow(row) {
  return {
    show_prerequisites: row?.show_prerequisites !== false,
    show_sessions: row?.show_sessions !== false,
    show_assignments: row?.show_assignments !== false,
    show_progress: row?.show_progress !== false,
    visible_prerequisite_ids: Array.isArray(
      row?.visible_prerequisite_ids,
    )
      ? row.visible_prerequisite_ids
      : [],
  };
}

async function getBatchAccess(batchId) {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      show_prerequisites,
      show_sessions,
      show_assignments,
      show_progress,
      visible_prerequisite_ids
    FROM batches
    WHERE id = ${batchId}
    LIMIT 1
  `;

  return rows[0] ? normalizeAccessRow(rows[0]) : null;
}

async function getStudentAccess(studentId) {
  const rows = await prisma.$queryRaw`
    SELECT
      b.id,
      b.show_prerequisites,
      b.show_sessions,
      b.show_assignments,
      b.show_progress,
      b.visible_prerequisite_ids
    FROM enrollments e
    JOIN batches b ON b.id = e.batch_id
    WHERE e.student_id = ${studentId}
      AND b.status::text IN ('UPCOMING', 'ACTIVE', 'COMPLETED')
    ORDER BY e.enrolled_at DESC
  `;

  if (!rows.length) {
    return {
      show_prerequisites: true,
      show_sessions: true,
      show_assignments: true,
      show_progress: true,
      visible_prerequisite_ids: [],
      show_all_prerequisites: true,
    };
  }

  const normalized = rows.map(normalizeAccessRow);
  const prerequisiteBatches = normalized.filter(
    (item) => item.show_prerequisites,
  );

  const showAllPrerequisites = prerequisiteBatches.some(
    (item) => item.visible_prerequisite_ids.length === 0,
  );

  return {
    show_prerequisites: prerequisiteBatches.length > 0,
    show_sessions: normalized.some((item) => item.show_sessions),
    show_assignments: normalized.some((item) => item.show_assignments),
    show_progress: normalized.some((item) => item.show_progress),
    visible_prerequisite_ids: showAllPrerequisites
      ? []
      : [
          ...new Set(
            prerequisiteBatches.flatMap(
              (item) => item.visible_prerequisite_ids,
            ),
          ),
        ],
    show_all_prerequisites: showAllPrerequisites,
  };
}

const getStudentPortalAccess = async (req, res, next) => {
  try {
    const access = await getStudentAccess(req.user.id);
    return success(res, 200, "Student portal access fetched.", access);
  } catch (err) {
    next(err);
  }
};

const getAdminPrerequisiteCatalog = async (req, res, next) => {
  try {
    await ensureDefaultPrerequisites();

    const courses = await prisma.prerequisiteCourse.findMany({
      where: { is_active: true },
      orderBy: [{ order_index: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        icon: true,
        order_index: true,
        _count: {
          select: { lessons: true },
        },
      },
    });

    return success(res, 200, "Prerequisite catalog fetched.", courses);
  } catch (err) {
    next(err);
  }
};

const getAdminBatchAccess = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        max_students: true,
        time_slots: true,
      },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    const access = await getBatchAccess(batchId);

    return success(res, 200, "Batch access fetched.", {
      ...batch,
      ...access,
    });
  } catch (err) {
    next(err);
  }
};

const updateAdminBatchAccess = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) return error(res, 404, "Batch not found.");

    const startDate =
      req.body.start_date === undefined
        ? batch.start_date
        : new Date(req.body.start_date);

    const endDate =
      req.body.end_date === undefined
        ? batch.end_date
        : new Date(req.body.end_date);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return error(res, 400, "Valid batch start and end dates are required.");
    }

    if (endDate <= startDate) {
      return error(res, 400, "Batch end date must be after start date.");
    }

    const maxStudents =
      req.body.max_students === undefined
        ? batch.max_students
        : Number(req.body.max_students);

    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      return error(res, 400, "Maximum students must be at least 1.");
    }

    const timeSlots =
      req.body.time_slots === undefined
        ? batch.time_slots
        : Array.isArray(req.body.time_slots)
          ? req.body.time_slots
              .map((slot) => String(slot || "").trim())
              .filter(Boolean)
          : [];

    await prisma.batch.update({
      where: { id: batchId },
      data: {
        start_date: startDate,
        end_date: endDate,
        max_students: maxStudents,
        time_slots: timeSlots,
      },
    });

    const currentAccess =
      (await getBatchAccess(batchId)) || normalizeAccessRow(null);

    const showPrerequisites =
      req.body.show_prerequisites === undefined
        ? currentAccess.show_prerequisites
        : Boolean(req.body.show_prerequisites);

    const showSessions =
      req.body.show_sessions === undefined
        ? currentAccess.show_sessions
        : Boolean(req.body.show_sessions);

    const showAssignments =
      req.body.show_assignments === undefined
        ? currentAccess.show_assignments
        : Boolean(req.body.show_assignments);

    const showProgress =
      req.body.show_progress === undefined
        ? currentAccess.show_progress
        : Boolean(req.body.show_progress);

    const visibleIds =
      showPrerequisites &&
      Array.isArray(req.body.visible_prerequisite_ids)
        ? [
            ...new Set(
              req.body.visible_prerequisite_ids
                .map((value) => String(value || "").trim())
                .filter(Boolean),
            ),
          ]
        : showPrerequisites
          ? currentAccess.visible_prerequisite_ids
          : [];

    await prisma.$executeRaw`
      UPDATE batches
      SET
        show_prerequisites = ${showPrerequisites},
        show_sessions = ${showSessions},
        show_assignments = ${showAssignments},
        show_progress = ${showProgress},
        visible_prerequisite_ids = ${visibleIds}::text[],
        updated_at = NOW()
      WHERE id = ${batchId}
    `;

    const updatedBatch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        max_students: true,
        time_slots: true,
      },
    });

    const updatedAccess = await getBatchAccess(batchId);

    return success(
      res,
      200,
      "Batch dates and student access updated.",
      {
        ...updatedBatch,
        ...updatedAccess,
      },
    );
  } catch (err) {
    next(err);
  }
};

const listPrerequisitesForStudent = async (req, res, next) => {
  try {
    await ensureDefaultPrerequisites();

    const access = await getStudentAccess(req.user.id);

    if (!access.show_prerequisites) {
      return success(
        res,
        200,
        "Prerequisites are disabled for your batch.",
        [],
      );
    }

    const where = {
      is_active: true,
      ...(!access.show_all_prerequisites
        ? {
            id: {
              in: access.visible_prerequisite_ids,
            },
          }
        : {}),
    };

    const [courses, progresses] = await Promise.all([
      prisma.prerequisiteCourse.findMany({
        where,
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
      progresses.map((progress) => [progress.lesson_id, progress]),
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

    const access = await getStudentAccess(req.user.id);

    if (
      !access.show_prerequisites ||
      (!access.show_all_prerequisites &&
        !access.visible_prerequisite_ids.includes(lesson.course_id))
    ) {
      return error(
        res,
        403,
        "This prerequisite is not enabled for your batch.",
      );
    }

    if (lesson.order_number > 1) {
      const previous = await prisma.prerequisiteLesson.findUnique({
        where: {
          course_id_order_number: {
            course_id: lesson.course_id,
            order_number: lesson.order_number - 1,
          },
        },
        include: {
          progress: {
            where: { student_id: req.user.id },
          },
        },
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
      : Math.min(
          Math.max(watched, position),
          lesson.duration_seconds,
        );

    const isNowComplete =
      cappedWatched >= requiredSeconds || completedFromClient;

    const existing = await prisma.prerequisiteProgress.findUnique({
      where: {
        student_id_lesson_id: {
          student_id: req.user.id,
          lesson_id: lesson.id,
        },
      },
    });

    const progress = await prisma.prerequisiteProgress.upsert({
      where: {
        student_id_lesson_id: {
          student_id: req.user.id,
          lesson_id: lesson.id,
        },
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
        ...(isNowComplete
          ? { completed_at: new Date() }
          : {}),
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
              batch: {
                include: {
                  course: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const rows = students.map((student) => {
      const progressByLessonId = new Map(
        student.prerequisite_progress.map((progress) => [
          progress.lesson_id,
          progress,
        ]),
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
          progress_percent: total
            ? Math.round((completed / total) * 100)
            : 0,
        };
      });

      const catia =
        courseRows.find(
          (course) => course.slug === "catia-tool-for-beginners",
        ) || courseRows[0];

      const allTotal = courseRows.reduce(
        (total, course) => total + course.total_lessons,
        0,
      );

      const allDone = courseRows.reduce(
        (total, course) => total + course.completed_lessons,
        0,
      );

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        is_active: student.is_active,
        enrolled_courses: student.enrollments
          .map((enrollment) => enrollment.batch?.course?.name)
          .filter(Boolean),
        catia_completed_lessons: catia?.completed_lessons || 0,
        catia_total_lessons: catia?.total_lessons || 10,
        catia_progress_percent: catia?.progress_percent || 0,
        total_lessons: allTotal,
        completed_lessons: allDone,
        progress_percent: allTotal
          ? Math.round((allDone / allTotal) * 100)
          : 0,
        courses: courseRows,
      };
    });

    return success(
      res,
      200,
      "Prerequisite progress fetched.",
      rows,
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentPortalAccess,
  getAdminPrerequisiteCatalog,
  getAdminBatchAccess,
  updateAdminBatchAccess,
  listPrerequisitesForStudent,
  updateLessonProgress,
  getAdminPrerequisiteProgress,
};
