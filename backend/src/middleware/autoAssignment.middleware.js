const { prisma } = require("../config/db");

/**
 * Creates one empty assignment task for every completed session
 * that does not already have an assignment.
 *
 * This middleware does not upload files and does not change any
 * existing assignment, submission, grading, feedback or progress logic.
 */
async function ensureCompletedSessionAssignments(req, _res, next) {
  try {
    const batchId = req.params.batchId;

    if (!batchId) return next();

    const completedSessions = await prisma.scheduledSession.findMany({
      where: {
        batch_id: batchId,
        status: "COMPLETED",
      },
      orderBy: {
        session_number: "asc",
      },
      select: {
        id: true,
        session_number: true,
        name: true,
      },
    });

    if (completedSessions.length === 0) return next();

    const sessionIds = completedSessions.map((session) => session.id);

    const existingAssignments = await prisma.assignment.findMany({
      where: {
        batch_id: batchId,
        session_id: {
          in: sessionIds,
        },
      },
      select: {
        session_id: true,
      },
    });

    const sessionsWithAssignment = new Set(
      existingAssignments
        .map((assignment) => assignment.session_id)
        .filter(Boolean),
    );

    for (const session of completedSessions) {
      if (sessionsWithAssignment.has(session.id)) continue;

      // Recheck immediately before create to reduce duplicate risk
      // when Sessions and Assignments APIs load at the same time.
      const alreadyExists = await prisma.assignment.findFirst({
        where: {
          batch_id: batchId,
          session_id: session.id,
        },
        select: {
          id: true,
        },
      });

      if (alreadyExists) continue;

      await prisma.assignment.create({
        data: {
          batch_id: batchId,
          session_id: session.id,
          title: `Session ${session.session_number} Assignment`,
          description:
            `Submit the practical work completed for ${session.name}. ` +
            "Reference ZIP/files and detailed instructions are shared in the official WhatsApp group.",
          file_url: null,
          storage_provider: "LOCAL",
          drive_file_id: null,
          original_filename: null,
          file_mime_type: null,
          file_size: null,
          due_date: null,
        },
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  ensureCompletedSessionAssignments,
};
