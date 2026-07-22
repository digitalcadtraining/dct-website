const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const {
  ensureCompletedSessionAssignments,
} = require("../services/automaticAssignment.service");

const OVERDUE_AFTER_HOURS = Math.max(
  1,
  Number(process.env.ASSIGNMENT_OVERDUE_AFTER_HOURS || 48),
);

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function toTimestamp(value) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getSubmissionMap(submissions = []) {
  const map = new Map();

  submissions.forEach((submission) => {
    const key = `${submission.student_id}:${submission.assignment_id}`;
    const existing = map.get(key);

    if (
      !existing ||
      toTimestamp(submission.submitted_at) >
        toTimestamp(existing.submitted_at)
    ) {
      map.set(key, submission);
    }
  });

  return map;
}

function getLastSubmission(submissions = []) {
  return submissions.reduce((latest, submission) => {
    if (!latest) return submission.submitted_at;

    return toTimestamp(submission.submitted_at) > toTimestamp(latest)
      ? submission.submitted_at
      : latest;
  }, null);
}

async function verifyTutorBatch(batchId, tutorId) {
  return prisma.batch.findFirst({
    where: {
      id: batchId,
      tutor_id: tutorId,
    },
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      status: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

const getTutorStudentProgress = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await verifyTutorBatch(batchId, req.user.id);

    if (!batch) {
      return error(res, 403, "You do not own this batch.");
    }

    /*
     * Keeps the existing automatic-assignment workflow unchanged.
     * It only ensures that completed sessions have assignment records.
     */
    await ensureCompletedSessionAssignments(batchId);

    const now = new Date();

    const [assignments, enrollments, submissions] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          batch_id: batchId,
          session: {
            status: "COMPLETED",
          },
        },
        orderBy: [
          {
            session: {
              session_number: "asc",
            },
          },
          {
            created_at: "asc",
          },
        ],
        select: {
          id: true,
          title: true,
          created_at: true,
          due_date: true,
          session: {
            select: {
              id: true,
              session_number: true,
              name: true,
              status: true,
              scheduled_at: true,
            },
          },
        },
      }),

      prisma.enrollment.findMany({
        where: {
          batch_id: batchId,
        },
        orderBy: {
          enrolled_at: "asc",
        },
        select: {
          id: true,
          student_id: true,
          enrolled_at: true,
          payment_status: true,
          assignment_rating: true,
          assignment_feedback: true,
          assignment_feedback_updated_at: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              is_active: true,
            },
          },
        },
      }),

      prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            batch_id: batchId,
          },
        },
        select: {
          id: true,
          student_id: true,
          assignment_id: true,
          status: true,
          submitted_at: true,
          first_submitted_at: true,
          reviewed_at: true,
          replacement_count: true,
        },
      }),
    ]);

    const submissionMap = getSubmissionMap(submissions);
    const totalAssignments = assignments.length;

    const students = enrollments.map((enrollment) => {
      const studentSubmissions = submissions.filter(
        (submission) => submission.student_id === enrollment.student_id,
      );

      let submitted = 0;
      let overdue = 0;

      const assignmentProgress = assignments.map((assignment) => {
        const submission = submissionMap.get(
          `${enrollment.student_id}:${assignment.id}`,
        );

        if (submission) {
          submitted += 1;

          return {
            assignment_id: assignment.id,
            title: assignment.title,
            session_id: assignment.session?.id || null,
            session_number: assignment.session?.session_number || null,
            session_name: assignment.session?.name || "Session Assignment",
            status: "SUBMITTED",
            submitted_at: submission.submitted_at,
            submission_status: submission.status,
          };
        }

        const overdueAt = assignment.due_date
          ? new Date(assignment.due_date)
          : addHours(new Date(assignment.created_at), OVERDUE_AFTER_HOURS);

        const isOverdue = overdueAt.getTime() < now.getTime();

        if (isOverdue) {
          overdue += 1;
        }

        return {
          assignment_id: assignment.id,
          title: assignment.title,
          session_id: assignment.session?.id || null,
          session_number: assignment.session?.session_number || null,
          session_name: assignment.session?.name || "Session Assignment",
          status: isOverdue ? "OVERDUE" : "PENDING",
          submitted_at: null,
          submission_status: null,
        };
      });

      const pending = Math.max(0, totalAssignments - submitted);

      const completionPercent =
        totalAssignments > 0
          ? Math.round((submitted / totalAssignments) * 100)
          : 0;

      return {
        enrollment_id: enrollment.id,
        student: enrollment.student,
        total_assignments: totalAssignments,
        submitted,
        pending,
        overdue,
        completion_percent: completionPercent,
        last_submission_at: getLastSubmission(studentSubmissions),
        rating: enrollment.assignment_rating,
        feedback: enrollment.assignment_feedback,
        feedback_updated_at: enrollment.assignment_feedback_updated_at,
        assignments: assignmentProgress,
      };
    });

    /*
     * Priority order:
     * 1. Students with zero submissions
     * 2. Students with overdue assignments
     * 3. Lowest submission percentage
     * 4. Student name
     */
    students.sort((a, b) => {
      const aZero = a.submitted === 0 ? 0 : 1;
      const bZero = b.submitted === 0 ? 0 : 1;

      if (aZero !== bZero) {
        return aZero - bZero;
      }

      const aOverdue = a.overdue > 0 ? 0 : 1;
      const bOverdue = b.overdue > 0 ? 0 : 1;

      if (aOverdue !== bOverdue) {
        return aOverdue - bOverdue;
      }

      if (a.completion_percent !== b.completion_percent) {
        return a.completion_percent - b.completion_percent;
      }

      return String(a.student?.name || "").localeCompare(
        String(b.student?.name || ""),
      );
    });

    const completedStudents = students.filter(
      (student) =>
        totalAssignments > 0 && student.submitted === totalAssignments,
    ).length;

    const neverSubmitted = students.filter(
      (student) => student.submitted === 0,
    ).length;

    const needAttention = students.filter(
      (student) => student.overdue > 0 || student.submitted === 0,
    ).length;

    const averageSubmission =
      students.length > 0
        ? Math.round(
            students.reduce(
              (sum, student) => sum + student.completion_percent,
              0,
            ) / students.length,
          )
        : 0;

    return success(res, 200, "Student assignment progress fetched.", {
      batch,
      summary: {
        students: students.length,
        total_assignments: totalAssignments,
        average_submission: averageSubmission,
        completed_students: completedStudents,
        need_attention: needAttention,
        never_submitted: neverSubmitted,
      },
      students,
    });
  } catch (err) {
    next(err);
  }
};

const saveStudentFeedback = async (req, res, next) => {
  try {
    const { batchId, studentId } = req.params;
    const { rating, feedback } = req.body;

    const batch = await verifyTutorBatch(batchId, req.user.id);

    if (!batch) {
      return error(res, 403, "You do not own this batch.");
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_batch_id: {
          student_id: studentId,
          batch_id: batchId,
        },
      },
      select: {
        id: true,
        student_id: true,
        batch_id: true,
      },
    });

    if (!enrollment) {
      return error(res, 404, "Student is not enrolled in this batch.");
    }

    let safeRating = null;

    if (rating !== undefined && rating !== null && rating !== "") {
      safeRating = Number(rating);

      if (
        !Number.isInteger(safeRating) ||
        safeRating < 1 ||
        safeRating > 5
      ) {
        return error(res, 400, "Rating must be between 1 and 5.");
      }
    }

    const safeFeedback =
      typeof feedback === "string" && feedback.trim()
        ? feedback.trim()
        : null;

    if (safeFeedback && safeFeedback.length > 3000) {
      return error(
        res,
        400,
        "Feedback cannot be longer than 3000 characters.",
      );
    }

    const updated = await prisma.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        assignment_rating: safeRating,
        assignment_feedback: safeFeedback,
        assignment_feedback_updated_at: new Date(),
      },
      select: {
        id: true,
        student_id: true,
        batch_id: true,
        assignment_rating: true,
        assignment_feedback: true,
        assignment_feedback_updated_at: true,
      },
    });

    return success(res, 200, "Student assignment feedback saved.", {
      enrollment_id: updated.id,
      student_id: updated.student_id,
      batch_id: updated.batch_id,
      rating: updated.assignment_rating,
      feedback: updated.assignment_feedback,
      feedback_updated_at: updated.assignment_feedback_updated_at,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTutorStudentProgress,
  saveStudentFeedback,
};