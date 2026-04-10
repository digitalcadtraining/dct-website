/**
 * Course Controller
 * Public: list courses, get course details, get batches for a course
 * Admin only: create, update, delete courses
 */

const { prisma }         = require("../config/db");
const { success, error } = require("../utils/response");
const { slugify }        = require("../utils/helpers");

// ── PUBLIC: List all active courses ──────────────────────
// GET /courses
const listCourses = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where:   { is_active: true },
      orderBy: { created_at: "asc" },
      select: {
        id: true, name: true, slug: true, short_name: true,
        description: true, duration_months: true, price: true,
        overview_points: true, tools_covered: true, thumbnail_url: true,
        _count: { select: { batches: true } },
      },
    });
    return success(res, 200, "Courses fetched.", courses);
  } catch (err) {
    next(err);
  }
};

// ── PUBLIC: Get single course + upcoming batches ──────────
// GET /courses/:slug
const getCourse = async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        batches: {
          where:   { status: { in: ["UPCOMING", "ACTIVE"] } },
          orderBy: { start_date: "asc" },
          select: {
            id: true, name: true, start_date: true, end_date: true,
            status: true, max_students: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!course || !course.is_active) {
      return error(res, 404, "Course not found.");
    }

    // Add available_seats to each batch
    const batchesWithSeats = course.batches.map(b => ({
      ...b,
      enrolled:        b._count.enrollments,
      available_seats: b.max_students - b._count.enrollments,
    }));

    return success(res, 200, "Course details.", { ...course, batches: batchesWithSeats });
  } catch (err) {
    next(err);
  }
};

// ── PUBLIC: Get batches for a course (for registration dropdown) ──
// GET /courses/:courseId/batches
const getCourseBatches = async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        course_id: req.params.courseId,
        status:    { in: ["UPCOMING", "ACTIVE"] },
      },
      orderBy: { start_date: "asc" },
      select: {
        id: true, name: true, start_date: true, end_date: true,
        status: true, max_students: true,
        tutor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });

    const result = batches.map(b => ({
      id:              b.id,
      name:            b.name,
      start_date:      b.start_date,
      end_date:        b.end_date,
      status:          b.status,
      tutor_name:      b.tutor.name,
      enrolled:        b._count.enrollments,
      available_seats: b.max_students - b._count.enrollments,
      is_full:         b._count.enrollments >= b.max_students,
    }));

    return success(res, 200, "Batches fetched.", result);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: Create course ──────────────────────────────────
// POST /courses
const createCourse = async (req, res, next) => {
  try {
    const { name, short_name, description, duration_months, price, overview_points, tools_covered } = req.body;

    if (!name || !short_name || !description || !duration_months || !price) {
      return error(res, 400, "name, short_name, description, duration_months, price are required.");
    }

    const slug   = slugify(name);
    const exists = await prisma.course.findUnique({ where: { slug } });
    if (exists) return error(res, 409, "A course with this name already exists.");

    const course = await prisma.course.create({
      data: {
        name, slug, short_name, description,
        duration_months: parseInt(duration_months),
        price,
        overview_points: overview_points || [],
        tools_covered:   tools_covered   || [],
      },
    });

    return success(res, 201, "Course created.", course);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: Update course ──────────────────────────────────
// PATCH /courses/:id
const updateCourse = async (req, res, next) => {
  try {
    const { name, short_name, description, duration_months, price, overview_points, tools_covered, is_active } = req.body;

    const updateData = {};
    if (name !== undefined)             updateData.name             = name;
    if (short_name !== undefined)       updateData.short_name       = short_name;
    if (description !== undefined)      updateData.description      = description;
    if (duration_months !== undefined)  updateData.duration_months  = parseInt(duration_months);
    if (price !== undefined)            updateData.price            = price;
    if (overview_points !== undefined)  updateData.overview_points  = overview_points;
    if (tools_covered !== undefined)    updateData.tools_covered    = tools_covered;
    if (is_active !== undefined)        updateData.is_active        = is_active;

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data:  updateData,
    });

    return success(res, 200, "Course updated.", course);
  } catch (err) {
    next(err);
  }
};

module.exports = { listCourses, getCourse, getCourseBatches, createCourse, updateCourse };
