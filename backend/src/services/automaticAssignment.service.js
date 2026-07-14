const { prisma } = require("../config/db");

function normalizeSlots(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {}

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseClock(value) {
  const match = String(value || "").match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
  );

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function slotEndClock(slot) {
  const parts = String(slot || "")
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parseClock(parts[1] || "") || null;
}

function slotStartClock(slot) {
  const parts = String(slot || "")
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parseClock(parts[0] || "") || null;
}

function getSessionEnd(session, slots) {
  if (!session?.scheduled_at) return null;

  const scheduled = new Date(session.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) return null;

  const slot =
    session.time_slot ||
    session.slot ||
    slots?.[0] ||
    "";

  const start = slotStartClock(slot);
  const end = slotEndClock(slot);

  const startAt = new Date(scheduled);
  if (start) {
    startAt.setHours(start.hours, start.minutes, 0, 0);
  }

  const endAt = new Date(scheduled);

  if (end) {
    endAt.setHours(end.hours, end.minutes, 0, 0);

    // Handles an overnight slot such as 11:30 PM - 12:30 AM.
    if (endAt <= startAt) {
      endAt.setDate(endAt.getDate() + 1);
    }
  } else {
    // Safe fallback: assume one hour when no end time is stored.
    endAt.setTime(startAt.getTime() + 60 * 60 * 1000);
  }

  return endAt;
}

async function syncCompletedSessionStatuses(batchId) {
  if (!batchId) return;

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      time_slots: true,
    },
  });

  if (!batch) return;

  const slots = normalizeSlots(batch.time_slots);
  const now = new Date();

  const sessions = await prisma.scheduledSession.findMany({
    where: {
      batch_id: batchId,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
    select: {
      id: true,
      scheduled_at: true,
      status: true,
    },
  });

  const completedIds = sessions
    .filter((session) => {
      const endAt = getSessionEnd(session, slots);
      return endAt && endAt.getTime() <= now.getTime();
    })
    .map((session) => session.id);

  if (completedIds.length > 0) {
    await prisma.scheduledSession.updateMany({
      where: {
        id: { in: completedIds },
      },
      data: {
        status: "COMPLETED",
      },
    });
  }
}

async function ensureCompletedSessionAssignments(batchId) {
  if (!batchId) return;

  await syncCompletedSessionStatuses(batchId);

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
          in: completedSessions.map((session) => session.id),
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
    if (existingSessionIds.has(session.id)) continue;

    // A second check prevents duplicate records if two requests arrive together.
    const existing = await prisma.assignment.findFirst({
      where: {
        batch_id: batchId,
        session_id: session.id,
      },
      select: {
        id: true,
      },
    });

    if (existing) continue;

    await prisma.assignment.create({
      data: {
        batch_id: batchId,
        session_id: session.id,
        title: `Session ${session.session_number} Assignment`,
        description: null,
        due_date: null,
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
  syncCompletedSessionStatuses,
};
