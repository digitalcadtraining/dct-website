const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const {
  streamPdf,
  streamPng,
  streamPreviewPng,
} = require("../services/certificate.service");

const UNLOCK_PROGRESS = 70;

function slotMinutes(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (
    minutes > 59 ||
    (period && (hours < 1 || hours > 12)) ||
    (!period && hours > 23)
  ) {
    return null;
  }

  if (period) {
    hours = (hours % 12) + (period === "PM" ? 12 : 0);
  }

  return hours * 60 + minutes;
}

function batchSessionDuration(batch, session) {
  const slots = batch.time_slots;
  const slot = Array.isArray(slots) ? slots[0] : slots;

  const [start, end] = String(slot || "")
    .split(/[–—-]/)
    .map(slotMinutes);

  if (start != null && end != null) {
    const minutes = (end - start + 1440) % 1440;

    if (minutes > 0) return minutes;
  }

  return Math.max(1, Number(session.duration_minutes) || 60);
}

function getBatchProgress(enrollment, now = Date.now()) {
  const batch = enrollment.batch || {};

  const sessions = (batch.scheduled_sessions || []).filter(
    (session) => session.status !== "CANCELLED",
  );

  if (!sessions.length) return 0;

  const completed = sessions.filter((session) => {
    if (session.status === "COMPLETED") return true;

    if (!session.scheduled_at) return false;

    const start = new Date(session.scheduled_at).getTime();

    return (
      Number.isFinite(start) &&
      start + batchSessionDuration(batch, session) * 60000 <= now
    );
  }).length;

  return Math.floor((completed * 100) / sessions.length);
}

const COURSE_CODES = {
  "plastic-product-design": {
    code: "PPD",
    name: "Automotive Plastic Product Design",
  },
  "biw-product-design": {
    code: "BIW",
    name: "BIW Product Design",
  },
  "catia-basic": {
    code: "CATIA",
    name: "CATIA V5 Basic Software Training",
  },
  "nx-basic": {
    code: "NX",
    name: "UG NX Basic Software Training",
  },
  "solidworks-basic": {
    code: "SW",
    name: "SolidWorks Basic Software Training",
  },
};

function courseIdentity(course) {
  const slug = String(course?.slug || "").toLowerCase();
  const configured = COURSE_CODES[slug];

  if (configured) return configured;

  const fallbackCode = String(course?.short_name || course?.name || "COURSE")
    .replace(/[^A-Za-z0-9]+/g, "")
    .slice(0, 8)
    .toUpperCase();

  return {
    code: fallbackCode || "COURSE",
    name: String(course?.name || "Course"),
  };
}

function cleanBatchName(value) {
  return String(value || "DCT Training Batch")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b/gi, "")
    .replace(/\s*[-–—]\s*(?=$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toCertificateView(enrollment) {
  const identity = courseIdentity(enrollment.batch?.course);
  const certificate = enrollment.certificate;
  const progress = getBatchProgress(enrollment);

  const isIssued =
    Boolean(certificate?.is_active) && progress >= UNLOCK_PROGRESS;

  return {
    id: isIssued ? certificate.id : null,
    enrollment_id: enrollment.id,
    certificate_number: isIssued ? certificate.certificate_number : null,
    student_name: enrollment.student.name,
    course_name: isIssued ? certificate.course_name : identity.name,
    batch_name: isIssued
      ? certificate.batch_name
      : cleanBatchName(enrollment.batch.name),
    batch_start_date: isIssued
      ? certificate.batch_start_date
      : enrollment.batch.start_date,
    batch_end_date: isIssued
      ? certificate.batch_end_date
      : enrollment.batch.end_date,
    issued_at: isIssued ? certificate.issued_at : null,
    is_issued: isIssued,
    progress,
    unlock_progress: UNLOCK_PROGRESS,
    can_download: isIssued,
  };
}

const enrollmentInclude = {
  student: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  batch: {
    include: {
      course: true,
      scheduled_sessions: {
        select: {
          status: true,
          scheduled_at: true,
          duration_minutes: true,
        },
      },
    },
  },
  certificate: true,
};

async function findEnrollment(enrollmentId) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: enrollmentInclude,
  });
}

async function generateCertificateNumber(tx, courseCode, year) {
  const latest = await tx.courseCertificate.findFirst({
    where: {
      course_code: courseCode,
      issue_year: year,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  const sequence = Number(latest?.sequence || 0) + 1;

  return {
    sequence,
    certificateNumber: `DCT/${courseCode}/${year}/${String(sequence).padStart(
      4,
      "0",
    )}`,
  };
}

async function ensureCertificate(
  enrollment,
  { issuedById = null, allowReissue = false } = {},
) {
  if (
    !enrollment ||
    getBatchProgress(enrollment) < UNLOCK_PROGRESS ||
    !enrollment.batch?.end_date
  ) {
    return enrollment;
  }

  // Keep existing certificates and respect revoked certificates.
  if (
    enrollment.certificate &&
    (!allowReissue || enrollment.certificate.is_active)
  ) {
    return enrollment;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const current = await tx.enrollment.findUnique({
            where: { id: enrollment.id },
            include: enrollmentInclude,
          });

          if (
            !current ||
            getBatchProgress(current) < UNLOCK_PROGRESS ||
            !current.batch?.end_date
          ) {
            return current;
          }

          if (
            current.certificate &&
            (!allowReissue || current.certificate.is_active)
          ) {
            return current;
          }

          const identity = courseIdentity(current.batch.course);
          const issuedAt = new Date();
          const issueYear = issuedAt.getFullYear();

          const certificateDetails = {
            student_name: current.student.name,
            course_name: identity.name,
            batch_name: cleanBatchName(current.batch.name),
            batch_start_date: current.batch.start_date,
            batch_end_date: current.batch.end_date,
            issued_at: issuedAt,
            issued_by_id: issuedById,
            is_active: true,
          };

          let certificate;

          if (current.certificate) {
            // Only explicit admin reissue can reactivate a certificate.
            certificate = await tx.courseCertificate.update({
              where: {
                enrollment_id: current.id,
              },
              data: certificateDetails,
            });
          } else {
            const number = await generateCertificateNumber(
              tx,
              identity.code,
              issueYear,
            );

            certificate = await tx.courseCertificate.create({
              data: {
                enrollment_id: current.id,
                certificate_number: number.certificateNumber,
                course_code: identity.code,
                issue_year: issueYear,
                sequence: number.sequence,
                ...certificateDetails,
              },
            });
          }

          return {
            ...current,
            certificate,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (err) {
      if ((err.code === "P2002" || err.code === "P2034") && attempt < 4) {
        continue;
      }

      throw err;
    }
  }

  return enrollment;
}

async function issueCertificate(req, res, next) {
  try {
    const enrollment = await findEnrollment(req.params.enrollmentId);

    if (!enrollment) {
      return error(res, 404, "Enrollment not found.");
    }

    const progress = getBatchProgress(enrollment);

    if (progress < UNLOCK_PROGRESS) {
      return error(
        res,
        400,
        `Certificate unlocks after ${UNLOCK_PROGRESS}% batch live-session completion. Current batch progress is ${progress}%.`,
      );
    }

    if (enrollment.certificate?.is_active) {
      return success(
        res,
        200,
        "Certificate is already issued.",
        toCertificateView(enrollment),
      );
    }

    if (!enrollment.batch?.end_date) {
      return error(res, 400, "Batch completion date is required.");
    }

    const updatedEnrollment = await ensureCertificate(enrollment, {
      issuedById: req.user.id,
      allowReissue: true,
    });

    if (
      !updatedEnrollment ||
      !toCertificateView(updatedEnrollment).can_download
    ) {
      return error(res, 400, "Certificate eligibility has changed.");
    }

    return success(
      res,
      201,
      "Course completion certificate issued.",
      toCertificateView(updatedEnrollment),
    );
  } catch (err) {
    next(err);
  }
}

async function revokeCertificate(req, res, next) {
  try {
    const certificate = await prisma.courseCertificate.findUnique({
      where: { enrollment_id: req.params.enrollmentId },
    });

    if (!certificate) {
      return error(res, 404, "Certificate not found.");
    }

    await prisma.courseCertificate.update({
      where: { enrollment_id: req.params.enrollmentId },
      data: { is_active: false },
    });

    return success(res, 200, "Certificate revoked.");
  } catch (err) {
    next(err);
  }
}

async function myCertificates(req, res, next) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        student_id: req.user.id,
      },
      orderBy: {
        enrolled_at: "desc",
      },
      include: enrollmentInclude,
    });

    const certificates = [];

    for (const enrollment of enrollments) {
      let updatedEnrollment = enrollment;

      try {
        updatedEnrollment = (await ensureCertificate(enrollment)) || enrollment;
      } catch (err) {
        // A certificate issue must not prevent My Courses from loading.
        console.error(
          "Automatic certificate issuance failed:",
          enrollment.id,
          err.message,
        );
      }

      certificates.push(toCertificateView(updatedEnrollment));
    }

    return success(res, 200, "Certificates fetched.", certificates);
  } catch (err) {
    next(err);
  }
}

async function getStudentEnrollment(req, enrollmentId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      student_id: req.user.id,
    },
    include: enrollmentInclude,
  });

  if (!enrollment) {
    const err = new Error("Enrollment not found.");
    err.statusCode = 404;
    throw err;
  }

  return enrollment;
}

async function previewCertificatePng(req, res, next) {
  try {
    const enrollment = await getStudentEnrollment(req, req.params.enrollmentId);

    await streamPreviewPng(toCertificateView(enrollment), res);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.statusCode, err.message);
    }
    next(err);
  }
}

async function getIssuedEnrollment(req, certificateId) {
  const certificate = await prisma.courseCertificate.findFirst({
    where: {
      id: certificateId,
      is_active: true,
      enrollment: {
        student_id: req.user.id,
      },
    },
    select: {
      enrollment_id: true,
    },
  });

  if (!certificate) {
    const err = new Error("Issued certificate not found.");
    err.statusCode = 404;
    throw err;
  }

  const enrollment = await findEnrollment(certificate.enrollment_id);
  const view = toCertificateView(enrollment);

  if (!view.can_download) {
    const err = new Error(
      `Certificate download unlocks after ${UNLOCK_PROGRESS}% batch live-session completion.`,
    );
    err.statusCode = 403;
    throw err;
  }

  return view;
}

async function downloadCertificatePdf(req, res, next) {
  try {
    await streamPdf(
      await getIssuedEnrollment(req, req.params.certificateId),
      res,
    );
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.statusCode, err.message);
    }
    next(err);
  }
}

async function downloadCertificatePng(req, res, next) {
  try {
    await streamPng(
      await getIssuedEnrollment(req, req.params.certificateId),
      res,
    );
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.statusCode, err.message);
    }
    next(err);
  }
}

module.exports = {
  issueCertificate,
  revokeCertificate,
  myCertificates,
  downloadCertificatePdf,
  downloadCertificatePng,
  previewCertificatePng,
};
