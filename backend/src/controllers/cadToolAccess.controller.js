const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

const ACCESS_MARKER = "CAD_TOOL_ACCESS";

const CAD_TOOL_COURSES = {
  "catia-basic": {
    key: "catia-v5",
    label: "CATIA V5",
  },
  "nx-basic": {
    key: "ug-nx",
    label: "UG NX",
  },
  "solidworks-basic": {
    key: "solidworks",
    label: "SolidWorks",
  },
};

const CAD_COURSE_SLUGS = Object.keys(CAD_TOOL_COURSES);

function courseMeta(courseSlug) {
  return (
    CAD_TOOL_COURSES[String(courseSlug || "").toLowerCase()] || {
      key: "other",
      label: "Other CAD Software",
    }
  );
}

async function getStudent(studentId) {
  return prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
}

async function getCadAccess(req, res, next) {
  try {
    const student = await getStudent(req.params.studentId);

    if (!student) {
      return error(res, 404, "Student not found.");
    }

    const [batches, enrollments] = await Promise.all([
      prisma.batch.findMany({
        where: {
          course: {
            slug: {
              in: CAD_COURSE_SLUGS,
            },
          },
          status: {
            in: ["UPCOMING", "ACTIVE"],
          },
        },
        orderBy: [{ start_date: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          start_date: true,
          end_date: true,
          status: true,
          course: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      prisma.enrollment.findMany({
        where: {
          student_id: student.id,
          batch: {
            course: {
              slug: {
                in: CAD_COURSE_SLUGS,
              },
            },
          },
        },
        select: {
          id: true,
          batch_id: true,
          enrolled_price: true,
          discount_code: true,
          payment_status: true,
        },
      }),
    ]);

    const enrollmentByBatch = new Map(
      enrollments.map((item) => [item.batch_id, item]),
    );

    const items = batches.map((batch) => {
      const enrollment = enrollmentByBatch.get(batch.id);
      const meta = courseMeta(batch.course?.slug);

      const isAdminAccess =
        String(enrollment?.discount_code || "").toUpperCase() === ACCESS_MARKER;

      return {
        ...batch,
        tool_key: meta.key,
        tool_label: meta.label,
        selected: Boolean(enrollment),
        locked: Boolean(enrollment && !isAdminAccess),
        access_type: enrollment
          ? isAdminAccess
            ? "ADMIN_ACCESS"
            : "PAID_OR_EXISTING"
          : "NONE",
      };
    });

    return success(res, 200, "CAD software access fetched.", {
      student,
      batches: items,
    });
  } catch (err) {
    next(err);
  }
}

async function updateCadAccess(req, res, next) {
  try {
    const selectedBatchIds = Array.isArray(req.body.batch_ids)
      ? [...new Set(req.body.batch_ids.map(String).filter(Boolean))]
      : [];

    const student = await getStudent(req.params.studentId);

    if (!student) {
      return error(res, 404, "Student not found.");
    }

    const validBatches = await prisma.batch.findMany({
      where: {
        course: {
          slug: {
            in: CAD_COURSE_SLUGS,
          },
        },
        status: {
          in: ["UPCOMING", "ACTIVE"],
        },
      },
      select: {
        id: true,
        name: true,
        max_students: true,
        course: {
          select: {
            slug: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    const validBatchMap = new Map(
      validBatches.map((batch) => [batch.id, batch]),
    );

    const invalidIds = selectedBatchIds.filter(
      (batchId) => !validBatchMap.has(batchId),
    );

    if (invalidIds.length > 0) {
      return error(
        res,
        400,
        "One or more selected CAD software batches are invalid.",
      );
    }

    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        student_id: student.id,
        batch: {
          course: {
            slug: {
              in: CAD_COURSE_SLUGS,
            },
          },
        },
      },
      select: {
        id: true,
        batch_id: true,
        discount_code: true,
      },
    });

    const existingByBatch = new Map(
      existingEnrollments.map((item) => [item.batch_id, item]),
    );

    const removableAccess = existingEnrollments.filter(
      (item) =>
        String(item.discount_code || "").toUpperCase() === ACCESS_MARKER &&
        !selectedBatchIds.includes(item.batch_id),
    );

    for (const batchId of selectedBatchIds) {
      const batch = validBatchMap.get(batchId);
      const existing = existingByBatch.get(batchId);

      if (!existing && batch._count.enrollments >= batch.max_students) {
        return error(
          res,
          409,
          `${batch.name} is full. Choose another batch or increase its capacity.`,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      if (removableAccess.length > 0) {
        await tx.enrollment.deleteMany({
          where: {
            id: {
              in: removableAccess.map((item) => item.id),
            },
          },
        });
      }

      for (const batchId of selectedBatchIds) {
        if (existingByBatch.has(batchId)) {
          continue;
        }

        await tx.enrollment.create({
          data: {
            student_id: student.id,
            batch_id: batchId,
            payment_status: "PAID",
            payment_ref: "ADMIN_CAD_ACCESS",
            enrolled_price: 0,
            original_price: 0,
            discount_code: ACCESS_MARKER,
            progress: 0,
          },
        });
      }
    });

    return success(
      res,
      200,
      "CAD software access updated successfully.",
      {
        student_id: student.id,
        selected_batch_ids: selectedBatchIds,
      },
    );
  } catch (err) {
    if (err.code === "P2002") {
      return error(res, 409, "This software access already exists.");
    }

    next(err);
  }
}

module.exports = {
  getCadAccess,
  updateCadAccess,
};
