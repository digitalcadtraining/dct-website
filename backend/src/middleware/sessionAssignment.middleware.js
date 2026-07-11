const { prisma } = require("../config/db");

/**
 * For a completed session, reuse its existing internal assignment record
 * or create one automatically. The student never sees this internal step.
 *
 * The next controller receives req.params.id as an assignment ID, so the
 * existing Google Drive, 48-hour replacement, feedback, grading and progress
 * logic remains unchanged.
 */
async function resolveCompletedSessionAssignment(req, res, next) {
  try {
    const sessionId = req.params.sessionId;

    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        batch_id: true,
        session_number: true,
        name: true,
        status: true,
        scheduled_at: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    const now = new Date();

    const sessionDate = session.scheduled_at
      ? new Date(session.scheduled_at)
      : null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const isCompleted =
      session.status === "COMPLETED" ||
      Boolean(
        sessionDate &&
        !Number.isNaN(sessionDate.getTime()) &&
        sessionDate < todayStart,
      );

    if (!isCompleted) {
      return res.status(403).json({
        success: false,
        message:
          "Assignment submission opens only after the live session is completed.",
      });
    }

    const enrolled = await prisma.enrollment.findFirst({
      where: {
        student_id: req.user.id,
        batch_id: session.batch_id,
      },
      select: { id: true },
    });

    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this batch.",
      });
    }

    let assignment = await prisma.assignment.findFirst({
      where: {
        batch_id: session.batch_id,
        session_id: session.id,
      },
      orderBy: { created_at: "asc" },
      select: { id: true },
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          batch_id: session.batch_id,
          session_id: session.id,
          title: `Session ${session.session_number} Assignment`,
          description:
            `Submit the practical work completed for ${session.name}. ` +
            "Reference files and instructions are shared in the official WhatsApp group.",
          file_url: null,
          storage_provider: "LOCAL",
          drive_file_id: null,
          original_filename: null,
          file_mime_type: null,
          file_size: null,
          due_date: null,
        },
        select: { id: true },
      });
    }

    // Reuse the existing assignment submission controller without duplicating
    // Google Drive or 48-hour locking logic.
    req.params.id = assignment.id;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  resolveCompletedSessionAssignment,
};
