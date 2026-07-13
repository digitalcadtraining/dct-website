const { prisma } = require("../config/db");

async function ensureCompletedSessionAssignments(
  batchId,
) {
  if (!batchId) return;

  const completedSessions =
    await prisma.scheduledSession.findMany({
      where: {
        batch_id: batchId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        session_number: true,
        name: true,
      },
      orderBy: {
        session_number: "asc",
      },
    });

  if (completedSessions.length === 0) return;

  const existingAssignments =
    await prisma.assignment.findMany({
      where: {
        batch_id: batchId,
        session_id: {
          in: completedSessions.map(
            (session) => session.id,
          ),
        },
      },
      select: {
        session_id: true,
      },
    });

  const existingSessionIds = new Set(
    existingAssignments
      .map((assignment) => assignment.session_id)
      .filter(Boolean),
  );

  for (const session of completedSessions) {
    if (existingSessionIds.has(session.id)) {
      continue;
    }

    const duplicateCheck =
      await prisma.assignment.findFirst({
        where: {
          batch_id: batchId,
          session_id: session.id,
        },
        select: {
          id: true,
        },
      });

    if (duplicateCheck) continue;

    await prisma.assignment.create({
      data: {
        batch_id: batchId,
        session_id: session.id,
        title: `Session ${session.session_number} Assignment`,
        description: null,
        due_date: null,

        // No tutor assignment attachment
        file_url: null,
        storage_provider: "LOCAL",
        drive_file_id: null,
        original_filename: null,
        file_mime_type: null,
        file_size: null,
      },
    });
  }
}

module.exports = {
  ensureCompletedSessionAssignments,
};