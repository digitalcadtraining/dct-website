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
        in: [...CAD_COURSE_SLUGS, "cad-software-tools"],
      },
    },
  },
},
      include: {
        installments: {
          orderBy: {
            installment_no: "asc",
          },
        },
        batch: {
          select: {
            id: true,
            course: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    const existingByBatch = new Map(
      existingEnrollments.map((item) => [item.batch_id, item]),
    );

    /*
     * The original purchased CAD enrollment is the enrollment that was not
     * created through the admin CAD access facility.
     */
const mainEnrollment = existingEnrollments.find(
  (item) =>
    item.batch?.course?.slug === "cad-software-tools" &&
    String(item.discount_code || "").toUpperCase() !== ACCESS_MARKER,
);

    if (!mainEnrollment) {
      return error(
        res,
        400,
        "Original paid CAD enrollment could not be found for this student.",
      );
    }

    /*
     * Protect the originally purchased course.
     * It must remain selected.
     */


    /*
     * Count unique CAD software, not merely the number of batches.
     */
    const selectedToolKeys = new Set(
      selectedBatchIds.map((batchId) => {
        const batch = validBatchMap.get(batchId);
        return courseMeta(batch?.course?.slug).key;
      }),
    );

    const selectedToolCount = selectedToolKeys.size;

    if (selectedToolCount < 1) {
      return error(res, 400, "Select at least one CAD software course.");
    }

    /*
     * Package pricing:
     * 1 software = ₹10,000
     * 2 or 3 software = ₹15,000
     */
    const packagePrice = selectedToolCount === 1 ? 10000 : 15000;

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

    const result = await prisma.$transaction(async (tx) => {
      /*
       * Remove only access enrollments created by this admin facility.
       * The student's original purchased enrollment is never removed.
       */
      if (removableAccess.length > 0) {
        await tx.enrollment.deleteMany({
          where: {
            id: {
              in: removableAccess.map((item) => item.id),
            },
          },
        });
      }

      /*
       * Create ₹0 enrollments for additional software.
       * Financial value remains attached to the original enrollment.
       */
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

      /*
       * Update the total package price on the original paid enrollment.
       */
      await tx.enrollment.update({
        where: {
          id: mainEnrollment.id,
        },
        data: {
          enrolled_price: packagePrice,
          original_price: packagePrice,
        },
      });

      /*
       * Registration payment is treated as ₹999 when the original
       * enrollment payment_status is PAID.
       */
      const registrationPaid =
        mainEnrollment.payment_status === "PAID" ? 999 : 0;

      const paidInstallments = mainEnrollment.installments.filter(
        (item) =>
          String(item.status || "").toUpperCase() === "PAID" ||
          Boolean(item.paid_at),
      );

      const paidEmiTotal = paidInstallments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      const totalPaid = registrationPaid + paidEmiTotal;

      const remainingAmount = Math.max(0, packagePrice - totalPaid);

      const unpaidInstallments = mainEnrollment.installments.filter(
        (item) =>
          String(item.status || "").toUpperCase() !== "PAID" &&
          !item.paid_at,
      );

      /*
       * Replace only unpaid EMI records.
       * Paid installments and their receipts remain untouched.
       */
      if (unpaidInstallments.length > 0) {
        await tx.enrollmentInstallment.deleteMany({
          where: {
            id: {
              in: unpaidInstallments.map((item) => item.id),
            },
          },
        });
      }

      if (remainingAmount > 0) {
        const highestPaidInstallmentNumber = paidInstallments.reduce(
          (highest, item) =>
            Math.max(highest, Number(item.installment_no || 0)),
          0,
        );

        await tx.enrollmentInstallment.create({
          data: {
            enrollment_id: mainEnrollment.id,
            installment_no: highestPaidInstallmentNumber + 1,
            label:
              selectedToolCount > 1
                ? "CAD Combo Upgrade Balance"
                : "CAD Course Balance",
            amount: remainingAmount,
            due_date: null,
            status: "PENDING",
            notes: `CAD package updated to ${selectedToolCount} software course(s).`,
          },
        });
      }

      return {
        packagePrice,
        selectedToolCount,
        totalPaid,
        remainingAmount,
      };
    });

    return success(
      res,
      200,
      "CAD software access and package fee updated successfully.",
      {
        student_id: student.id,
        selected_batch_ids: selectedBatchIds,
        selected_tool_count: result.selectedToolCount,
        package_price: result.packagePrice,
        already_paid: result.totalPaid,
        remaining_payable: result.remainingAmount,
      },
    );
  } catch (err) {
    if (err.code === "P2002") {
      return error(
        res,
        409,
        "This software access or EMI installment already exists.",
      );
    }

    next(err);
  }
}

module.exports = {
  getCadAccess,
  updateCadAccess,
};
