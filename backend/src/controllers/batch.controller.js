const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");

function parseSlotStart(slot) {
  if (!slot) return null;
  const first = String(slot).split(/[–-]/)[0]?.trim();
  const m = first.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h, min };
}

function getIndiaDateString(dateValue) {
  if (!dateValue) return null;

  // If frontend gives YYYY-MM-DD, preserve it exactly.
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function withSlotTime(dateValue, slot) {
  if (!dateValue) return null;

  const base = getIndiaDateString(dateValue);

  if (!base) return null;

  const slotStart = parseSlotStart(slot);

  const h = slotStart?.h ?? 0;
  const min = slotStart?.min ?? 0;

  const finalDate = new Date(
    `${base}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+05:30`,
  );

  return Number.isNaN(finalDate.getTime()) ? null : finalDate;
}

function decorateStudentInstallments(installments = []) {
  const now = new Date();

  return installments.map((item) => {
    let displayStatus = "PENDING";

    if (item.status === "PAID" || item.paid_at) {
      displayStatus = "PAID";
    } else if (
      item.due_date &&
      new Date(item.due_date).getTime() < now.getTime()
    ) {
      displayStatus = "DUE";
    }

    return {
      ...item,
      display_status: displayStatus,
    };
  });
}

function generateSessionDates(startDate, totalSessions, altDays, sundayOff) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  let count = 0;
  while (count < totalSessions) {
    const day = current.getDay();
    if (sundayOff && day === 0) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    dates.push(new Date(current));
    count++;
    current.setDate(current.getDate() + (altDays ? 2 : 1));
  }
  return dates;
}

function generateBatchName(courseName, startDate) {
  const dateString = getIndiaDateString(startDate);

  if (!dateString) {
    return courseName || "Batch";
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateString}T12:00:00+05:30`));

  return `${courseName} - ${day} ${monthName} ${String(year).slice(2)}`;
}

function projectMeta(project) {
  const h = project?.highlights;
  if (h && typeof h === "object" && !Array.isArray(h)) return h;
  if (Array.isArray(h)) {
    const isRecorded = h.includes("RECORDED_DATA");
    return {
      is_recorded: isRecorded,
      delivery_mode: isRecorded ? "RECORDED" : "LIVE",
      unlock_rule: isRecorded ? "FIRST_LIVE_PROJECT_START" : null,
      sessions: [],
    };
  }
  return {
    is_recorded: false,
    delivery_mode: "LIVE",
    unlock_rule: null,
    sessions: [],
  };
}
function isRecordedProject(project) {
  const meta = projectMeta(project);
  return Boolean(meta.is_recorded || meta.delivery_mode === "RECORDED");
}
function projectToStudent(project) {
  const meta = projectMeta(project);
  return {
    id: project.id,
    name: project.name,
    is_recorded: isRecordedProject(project),
    delivery_mode: isRecordedProject(project) ? "RECORDED" : "LIVE",
    unlock_rule:
      meta.unlock_rule ||
      (isRecordedProject(project) ? "FIRST_LIVE_PROJECT_START" : null),
  };
}
function liveProjectSessions(project) {
  const meta = projectMeta(project);
  if (isRecordedProject(project)) return [];
  return Array.isArray(meta.sessions)
    ? meta.sessions.filter((s) => s?.name)
    : [];
}
function buildLiveSessionItems(syllabusSessions = [], syllabusProjects = []) {
  const general = syllabusSessions.map((s) => ({
    name: s.name,
    type: s.type || "BOTH",
  }));
  const projectItems = [];
  for (const project of syllabusProjects) {
    liveProjectSessions(project).forEach((s) =>
      projectItems.push({
        name: `Project: ${project.name} - ${s.name}`,
        type: "CAD",
      }),
    );
  }
  return [...general, ...projectItems].map((item, idx) => ({
    ...item,
    session_number: idx + 1,
  }));
}
async function getTutorCourseProjectMap(pairs) {
  const uniquePairs = [];
  const seen = new Set();
  for (const pair of pairs) {
    if (!pair?.tutor_id || !pair?.course_id) continue;
    const key = `${pair.tutor_id}:${pair.course_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniquePairs.push(pair);
  }
  if (!uniquePairs.length) return new Map();
  const applications = await prisma.tutorApplication.findMany({
    where: {
      status: "APPROVED",
      OR: uniquePairs.map((p) => ({
        user_id: p.tutor_id,
        course_id: p.course_id,
      })),
    },
    include: { syllabus_projects: true },
  });
  const map = new Map();
  for (const app of applications) {
    const key = `${app.user_id}:${app.course_id}`;
    const recorded = (app.syllabus_projects || [])
      .filter(isRecordedProject)
      .map(projectToStudent);
    map.set(key, recorded);
  }
  return map;
}
function safeSessionStatus(value) {
  const allowed = new Set(["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"]);
  return allowed.has(String(value || "").toUpperCase())
    ? String(value).toUpperCase()
    : "UPCOMING";
}
function safeSessionType(value) {
  const allowed = new Set(["THEORY", "CAD", "BOTH"]);
  return allowed.has(String(value || "").toUpperCase())
    ? String(value).toUpperCase()
    : "BOTH";
}
function safeBatchStatus(value, current = "UPCOMING") {
  const allowed = new Set([
    "PENDING_APPROVAL",
    "UPCOMING",
    "ACTIVE",
    "COMPLETED",
  ]);
  return allowed.has(String(value || "").toUpperCase())
    ? String(value).toUpperCase()
    : current;
}

const createBatch = async (req, res, next) => {
  try {
    const {
      course_id,
      start_date,
      max_students,
      description,
      zoom_link,
      time_slots,
      alt_days = false,
      sunday_off = true,
    } = req.body;
    const tutorId = req.user.id;
    if (!course_id) return error(res, 400, "course_id is required.");
    if (!start_date) return error(res, 400, "start_date is required.");
    const normalizedSlots = Array.isArray(time_slots)
      ? time_slots.filter(Boolean)
      : typeof time_slots === "string" && time_slots.trim()
        ? [time_slots.trim()]
        : [];
    if (normalizedSlots.length === 0)
      return error(res, 400, "At least one class time slot is required.");
    const application = await prisma.tutorApplication.findFirst({
      where: { user_id: tutorId, course_id, status: "APPROVED" },
      include: {
        syllabus_sessions: { orderBy: { session_number: "asc" } },
        syllabus_projects: true,
        course: { select: { name: true, short_name: true } },
      },
    });
    if (!application)
      return error(res, 403, "You are not approved to teach this course.");
    const batchName = generateBatchName(application.course.name, start_date);
    const duplicate = await prisma.batch.findFirst({
      where: { tutor_id: tutorId, course_id, name: batchName },
    });
    if (duplicate)
      return error(res, 409, `Batch "${batchName}" already exists.`);
    const liveItems = buildLiveSessionItems(
      application.syllabus_sessions || [],
      application.syllabus_projects || [],
    );
    const totalSessions = liveItems.length;
    if (totalSessions === 0)
      return error(
        res,
        400,
        "No approved live sessions found for this course. Please contact admin.",
      );
    const sessionDates = generateSessionDates(
      start_date,
      totalSessions,
      Boolean(alt_days),
      Boolean(sunday_off),
    );

    const parsedStartDate = new Date(start_date);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return error(res, 400, "Please select valid batch start date.");
    }

    const endDate =
      sessionDates.length > 0
        ? sessionDates[sessionDates.length - 1]
        : new Date(parsedStartDate.setMonth(parsedStartDate.getMonth() + 4));

    if (!endDate || Number.isNaN(new Date(endDate).getTime())) {
      return error(
        res,
        400,
        "Could not calculate valid batch end date. Please check course sessions.",
      );
    }

    const mainSlot = normalizedSlots[0];
    const recordedProjects = (application.syllabus_projects || [])
      .filter(isRecordedProject)
      .map(projectToStudent);
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: {
          course_id,
          tutor_id: tutorId,
          name: batchName,
          start_date:
            withSlotTime(start_date, mainSlot) || new Date(start_date),
          end_date: withSlotTime(endDate, mainSlot) || endDate,
          max_students: parseInt(max_students) || 50,
          description: description || null,
          zoom_link: zoom_link || null,
          time_slots: normalizedSlots,
          status: "PENDING_APPROVAL",
        },
      });
      await tx.scheduledSession.createMany({
        data: liveItems.map((s, idx) => ({
          batch_id: newBatch.id,
          session_number: s.session_number,
          name: s.name,
          type: s.type || "CAD",
          scheduled_at: withSlotTime(sessionDates[idx], mainSlot),
          status: "UPCOMING",
        })),
      });
      return newBatch;
    });
    const fullBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: { select: { name: true } },
        scheduled_sessions: { orderBy: { session_number: "asc" } },
        _count: { select: { scheduled_sessions: true, enrollments: true } },
      },
    });
    return success(
      res,
      201,
      `Batch "${batchName}" created with ${totalSessions} live sessions scheduled. ${recordedProjects.length} recorded project(s) will unlock with the first live project. Awaiting admin approval.`,
      { ...fullBatch, recorded_projects: recordedProjects },
    );
  } catch (err) {
    next(err);
  }
};

const getMyBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const batches = await prisma.batch.findMany({
      where: { tutor_id: req.user.id, ...(status && { status }) },
      orderBy: { start_date: "desc" },
      include: {
        course: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, scheduled_sessions: true } },
      },
    });
    return success(res, 200, "Your batches.", batches);
  } catch (err) {
    next(err);
  }
};

const updateBatch = async (req, res, next) => {
  try {
    const batch = await prisma.batch.findFirst({
      where: { id: req.params.id, tutor_id: req.user.id },
    });
    if (!batch) return error(res, 404, "Batch not found.");
    const { zoom_link, description, max_students, status, time_slots } =
      req.body;
    const updateData = {};
    if (zoom_link !== undefined) updateData.zoom_link = zoom_link || null;
    if (description !== undefined) updateData.description = description || null;
    if (max_students !== undefined)
      updateData.max_students = parseInt(max_students);
    if (status !== undefined)
      updateData.status = safeBatchStatus(status, batch.status);
    if (time_slots !== undefined)
      updateData.time_slots = Array.isArray(time_slots) ? time_slots : [];
    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: updateData,
    });
    return success(res, 200, "Batch updated.", updated);
  } catch (err) {
    next(err);
  }
};

const updateFullBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id;
    const tutorId = req.user.id;

    const existingBatch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        tutor_id: tutorId,
      },
      include: {
        course: {
          select: {
            name: true,
          },
        },
        scheduled_sessions: {
          orderBy: {
            session_number: "asc",
          },
          include: {
            _count: {
              select: {
                assignments: true,
                queries: true,
              },
            },
          },
        },
      },
    });

    if (!existingBatch) {
      return error(res, 404, "Batch not found.");
    }

    const {
      name,
      start_date,
      end_date,
      max_students,
      description,
      status,
      time_slots,
      sessions,
    } = req.body;

    const currentSessions = existingBatch.scheduled_sessions || [];

    const currentById = new Map(
      currentSessions.map((session) => [session.id, session]),
    );

    /*
     * --------------------------------------------------
     * NORMALIZE TIME SLOTS
     * --------------------------------------------------
     */

    let normalizedSlots = Array.isArray(existingBatch.time_slots)
      ? existingBatch.time_slots
      : [];

    if (time_slots !== undefined) {
      normalizedSlots = Array.isArray(time_slots)
        ? time_slots.map((slot) => String(slot || "").trim()).filter(Boolean)
        : typeof time_slots === "string" && time_slots.trim()
          ? [time_slots.trim()]
          : normalizedSlots;
    }

    const mainSlot = normalizedSlots[0] || null;

    /*
     * --------------------------------------------------
     * START DATE
     * --------------------------------------------------
     */

    let newStartDate = null;

    if (start_date !== undefined && start_date) {
      const parsed = new Date(start_date);

      if (Number.isNaN(parsed.getTime())) {
        return error(res, 400, "Please select valid batch start date.");
      }

      newStartDate = withSlotTime(parsed, mainSlot) || parsed;
    }

    /*
     * --------------------------------------------------
     * SESSION SHIFT
     *
     * Important:
     * We calculate shift from SESSION 1 instead of only
     * old batch.start_date.
     *
     * This also repairs existing batches where the
     * batch date was already changed but sessions were
     * still showing the old date.
     * --------------------------------------------------
     */

    let sessionShiftMs = 0;
    let shouldShiftSessions = false;

    if (newStartDate) {
      const firstScheduledSession = currentSessions.find(
        (session) => session.status !== "CANCELLED" && session.scheduled_at,
      );

      if (firstScheduledSession?.scheduled_at) {
        const oldFirstSessionDate = new Date(
          firstScheduledSession.scheduled_at,
        );

        sessionShiftMs = newStartDate.getTime() - oldFirstSessionDate.getTime();

        shouldShiftSessions = sessionShiftMs !== 0;
      } else {
        const oldBatchStart = new Date(existingBatch.start_date);

        sessionShiftMs = newStartDate.getTime() - oldBatchStart.getTime();

        shouldShiftSessions = sessionShiftMs !== 0;
      }
    }

    /*
     * --------------------------------------------------
     * BATCH UPDATE DATA
     * --------------------------------------------------
     */

    const updateData = {};

    if (newStartDate) {
      updateData.start_date = newStartDate;

      // Automatically rename batch from new date.
      updateData.name = generateBatchName(
        existingBatch.course?.name || existingBatch.name,
        newStartDate,
      );
    } else if (name !== undefined) {
      updateData.name = String(name || "").trim() || existingBatch.name;
    }

    /*
     * End date:
     * - if tutor explicitly changes it → use new value
     * - otherwise shift existing end date together with
     *   the batch/session date change
     */

    if (end_date !== undefined && end_date) {
      const parsedEnd = new Date(end_date);

      if (Number.isNaN(parsedEnd.getTime())) {
        return error(res, 400, "Please select valid batch end date.");
      }

      updateData.end_date = withSlotTime(parsedEnd, mainSlot) || parsedEnd;
    } else if (shouldShiftSessions && existingBatch.end_date) {
      updateData.end_date = new Date(
        new Date(existingBatch.end_date).getTime() + sessionShiftMs,
      );
    }

    if (
      updateData.end_date &&
      updateData.start_date &&
      updateData.end_date <= updateData.start_date
    ) {
      return error(res, 400, "Batch end date must be after start date.");
    }

    if (max_students !== undefined) {
      updateData.max_students = Math.max(
        1,
        parseInt(max_students) || existingBatch.max_students,
      );
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (status !== undefined) {
      updateData.status = safeBatchStatus(status, existingBatch.status);
    }

    if (time_slots !== undefined) {
      if (normalizedSlots.length > 0) {
        updateData.time_slots = normalizedSlots;
      }
    }

    const incomingSessions = Array.isArray(sessions) ? sessions : null;

    /*
     * --------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------
     */

    const updatedBatch = await prisma.$transaction(async (tx) => {
      await tx.batch.update({
        where: {
          id: batchId,
        },
        data: updateData,
      });

      /*
       * CASE 1:
       * Tutor editor supplied session data.
       */

      if (incomingSessions) {
        const incomingIds = new Set(
          incomingSessions
            .filter((session) => session.id)
            .map((session) => session.id),
        );

        /*
         * Keep existing safety:
         * don't delete sessions containing
         * assignments or queries.
         */

        for (const oldSession of currentSessions) {
          if (!incomingIds.has(oldSession.id)) {
            if (
              (oldSession._count?.assignments || 0) > 0 ||
              (oldSession._count?.queries || 0) > 0
            ) {
              await tx.scheduledSession.update({
                where: {
                  id: oldSession.id,
                },
                data: {
                  status: "CANCELLED",
                },
              });
            } else {
              await tx.scheduledSession.delete({
                where: {
                  id: oldSession.id,
                },
              });
            }
          }
        }

        for (let index = 0; index < incomingSessions.length; index += 1) {
          const item = incomingSessions[index] || {};

          const sessionNumber = index + 1;

          const currentSession = item.id ? currentById.get(item.id) : null;

          let scheduledAt = null;

          /*
           * Existing session:
           * automatically shift old date when
           * batch start changed.
           */

          if (shouldShiftSessions && currentSession?.scheduled_at) {
            scheduledAt = new Date(
              new Date(currentSession.scheduled_at).getTime() + sessionShiftMs,
            );
          }

          /*
           * If no automatic shift is required,
           * use tutor supplied session date.
           */

          if (!shouldShiftSessions && item.scheduled_at) {
            const suppliedDate = new Date(item.scheduled_at);

            if (!Number.isNaN(suppliedDate.getTime())) {
              scheduledAt = suppliedDate;
            }
          }

          /*
           * New session.
           */

          if (!currentSession && item.scheduled_at) {
            const suppliedDate = new Date(item.scheduled_at);

            if (!Number.isNaN(suppliedDate.getTime())) {
              scheduledAt = suppliedDate;
            }
          }

          const sessionData = {
            session_number: sessionNumber,

            name: String(item.name || "").trim() || `Session ${sessionNumber}`,

            type: safeSessionType(item.type),

            scheduled_at: scheduledAt,

            status: safeSessionStatus(item.status),
          };

          if (item.id && currentById.has(item.id)) {
            await tx.scheduledSession.update({
              where: {
                id: item.id,
              },
              data: sessionData,
            });
          } else {
            await tx.scheduledSession.create({
              data: {
                batch_id: batchId,
                ...sessionData,
              },
            });
          }
        }
      } else if (shouldShiftSessions) {
        /*
         * CASE 2:
         * No sessions sent by frontend, but batch
         * start date changed.
         *
         * Shift every existing session automatically.
         */
        for (const session of currentSessions) {
          if (!session.scheduled_at) {
            continue;
          }

          const shiftedDate = new Date(
            new Date(session.scheduled_at).getTime() + sessionShiftMs,
          );

          await tx.scheduledSession.update({
            where: {
              id: session.id,
            },
            data: {
              scheduled_at: shiftedDate,
            },
          });
        }
      }

      return tx.batch.findUnique({
        where: {
          id: batchId,
        },
        include: {
          course: {
            select: {
              name: true,
              slug: true,
            },
          },

          tutor: {
            select: {
              name: true,
            },
          },

          scheduled_sessions: {
            orderBy: {
              session_number: "asc",
            },
            include: {
              assignments: {
                select: {
                  id: true,
                  title: true,
                  due_date: true,
                },
              },
            },
          },

          assignments: {
            orderBy: {
              created_at: "asc",
            },
          },

          _count: {
            select: {
              enrollments: true,
              scheduled_sessions: true,
            },
          },
        },
      });
    });

    return success(
      res,
      200,
      shouldShiftSessions
        ? `Batch updated. All sessions shifted to the new batch schedule and batch renamed to "${updatedBatch.name}".`
        : "Full batch updated. Student dashboard will show latest data.",
      updatedBatch,
    );
  } catch (err) {
    next(err);
  }
};

function progressFromAssignments(batch, storedProgress = 0) {
  const assignments = Array.isArray(batch.assignments) ? batch.assignments : [];
  const total = assignments.length;
  if (total === 0)
    return Math.max(0, Math.min(100, Math.round(Number(storedProgress || 0))));
  const submitted = assignments.filter(
    (a) => Array.isArray(a.submissions) && a.submissions.length > 0,
  ).length;
  return Math.round((submitted / total) * 100);
}

const getEnrolledBatches = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      orderBy: { enrolled_at: "desc" },
      include: {
        installments: {
          orderBy: { installment_no: "asc" },
        },
        batch: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail_url: true,
              },
            },
            tutor: {
              select: {
                name: true,
              },
            },
            assignments: {
              select: {
                id: true,
                submissions: {
                  where: { student_id: studentId },
                  select: {
                    id: true,
                    status: true,
                    submitted_at: true,
                  },
                },
              },
            },
            _count: {
              select: {
                scheduled_sessions: true,
                assignments: true,
              },
            },
          },
        },
      },
    });

    const projectMap = await getTutorCourseProjectMap(
      enrollments.map((enrollment) => ({
        tutor_id: enrollment.batch?.tutor_id,
        course_id: enrollment.batch?.course_id,
      })),
    );

    const result = enrollments.map((enrollment) => {
      const batch = enrollment.batch || {};
      const progress = progressFromAssignments(batch, enrollment.progress);

      const { assignments, ...cleanBatch } = batch;
      const projectKey = `${batch.tutor_id}:${batch.course_id}`;

      const installments = decorateStudentInstallments(
        enrollment.installments || [],
      );

      const installmentReceived = installments
        .filter((item) => item.display_status === "PAID")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const overdue = installments
        .filter((item) => item.display_status === "DUE")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const pending = installments
        .filter((item) => item.display_status !== "PAID")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        id: enrollment.id,
        enrollment_id: enrollment.id,
        enrolled_at: enrollment.enrolled_at,
        payment_status: enrollment.payment_status,
        progress,
        enrolled_price: enrollment.enrolled_price,
        original_price: enrollment.original_price,
        discount_code: enrollment.discount_code,
        emi_first_due: enrollment.emi_first_due,
        emi_second_due: enrollment.emi_second_due,

        installments,

        payment_summary: {
          registration_received: enrollment.payment_status === "PAID" ? 999 : 0,
          installment_received: installmentReceived,
          pending,
          overdue,
          balance: pending,
        },

        batch: {
          ...cleanBatch,
          recorded_projects: projectMap.get(projectKey) || [],
        },
      };
    });

    return success(res, 200, "Your enrolled courses.", result);
  } catch (err) {
    next(err);
  }
};

const getBatchDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { name: true, slug: true, tools_covered: true } },
        tutor: { select: { name: true } },
        scheduled_sessions: {
          orderBy: { session_number: "asc" },
          include: {
            assignments: { select: { id: true, title: true, due_date: true } },
          },
        },
        assignments: { orderBy: { created_at: "asc" } },
      },
    });
    if (!batch) return error(res, 404, "Batch not found.");
    if (role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { student_id: userId, batch_id: req.params.id },
      });
      if (!enrollment)
        return error(res, 403, "You are not enrolled in this batch.");
    } else if (role === "TUTOR" && batch.tutor_id !== userId)
      return error(res, 403, "You do not own this batch.");
    const projectMap = await getTutorCourseProjectMap([
      { tutor_id: batch.tutor_id, course_id: batch.course_id },
    ]);
    return success(res, 200, "Batch details.", {
      ...batch,
      recorded_projects:
        projectMap.get(`${batch.tutor_id}:${batch.course_id}`) || [],
    });
  } catch (err) {
    next(err);
  }
};

const getCourseBatchesForRegistration = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 10);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 12);
    maxDate.setHours(23, 59, 59, 999);
    const batches = await prisma.batch.findMany({
      where: {
        course_id: req.params.courseId,
        status: { in: ["APPROVED", "UPCOMING", "ACTIVE"] },
        start_date: { gte: minDate, lte: maxDate },
      },
      orderBy: { start_date: "asc" },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        created_at: true,
        status: true,
        max_students: true,
        time_slots: true,
        tutor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });
    const batchIds = batches.map((b) => b.id);
    let offerMap = new Map();
    if (batchIds.length > 0) {
      try {
        const offerRows =
          await prisma.$queryRaw`SELECT id, offer_name, original_price, offer_price, offer_start_at, offer_end_at FROM batches WHERE id = ANY(${batchIds})`;
        offerMap = new Map(offerRows.map((row) => [row.id, row]));
      } catch {
        offerMap = new Map();
      }
    }
    const result = batches
      .map((b) => {
        const enrolled = b._count?.enrollments || 0;
        const availableSeats = Math.max(
          0,
          Number(b.max_students || 0) - enrolled,
        );
        const offer = offerMap.get(b.id) || {};
        return {
          id: b.id,
          name: b.name,
          start_date: b.start_date,
          end_date: b.end_date,
          created_at: b.created_at,
          status: b.status,
          tutor_name: b.tutor?.name || "DCT Tutor",
          time_slots: b.time_slots || [],
          enrolled,
          available_seats: availableSeats,
          is_full: availableSeats <= 0,
          offer_name: offer.offer_name || null,
          original_price: offer.original_price || null,
          offer_price: offer.offer_price || null,
          offer_start_at: offer.offer_start_at || null,
          offer_end_at: offer.offer_end_at || null,
        };
      })
      .filter((b) => !b.is_full);
    return success(res, 200, "Available batches.", result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBatch,
  getMyBatches,
  updateBatch,
  updateFullBatch,
  getEnrolledBatches,
  getBatchDetails,
  getCourseBatchesForRegistration,
};
