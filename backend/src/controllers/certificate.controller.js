const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const {
  streamPdf,
  streamPng,
  streamPreviewPng,
} = require("../services/certificate.service");

const UNLOCK_PROGRESS = 80;

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
  const progress = Number(enrollment.progress || 0);

  /*
   * A certificate record may already exist because of earlier testing.
   * It must remain visually pending until the student's course progress
   * reaches the official 80% completion threshold.
   */
  const isIssued =
    Boolean(certificate?.is_active) &&
    progress >= UNLOCK_PROGRESS;

  return {
    id: isIssued ? certificate.id : null,
    enrollment_id: enrollment.id,
    certificate_number: isIssued
      ? certificate.certificate_number
      : null,
    student_name: enrollment.student.name,
    course_name: isIssued
      ? certificate.course_name
      : identity.name,
    batch_name: isIssued
      ? certificate.batch_name
      : cleanBatchName(enrollment.batch.name),
    batch_start_date: isIssued
      ? certificate.batch_start_date
      : enrollment.batch.start_date,
    batch_end_date: isIssued
      ? certificate.batch_end_date
      : enrollment.batch.end_date,
    issued_at: isIssued
      ? certificate.issued_at
      : null,
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

async function issueCertificate(req, res, next) {
  try {
    const enrollment = await findEnrollment(req.params.enrollmentId);

    if (!enrollment) {
      return error(res, 404, "Enrollment not found.");
    }

    const progress = Number(enrollment.progress || 0);

    if (progress < UNLOCK_PROGRESS) {
      return error(
        res,
        400,
        `Certificate can be issued only after ${UNLOCK_PROGRESS}% course completion. Current progress is ${progress}%.`,
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
      return error(
        res,
        400,
        "Batch completion date is required before issuing the certificate.",
      );
    }

    const identity = courseIdentity(enrollment.batch.course);
    const issuedAt = new Date();
    const issueYear = issuedAt.getFullYear();
    let certificate;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        certificate = await prisma.$transaction(
          async (tx) => {
            const number = await generateCertificateNumber(
              tx,
              identity.code,
              issueYear,
            );

            return tx.courseCertificate.upsert({
              where: { enrollment_id: enrollment.id },
              update: {
                is_active: true,
                issued_at: issuedAt,
                issued_by_id: req.user.id,
                student_name: enrollment.student.name,
                course_name: identity.name,
                batch_name: cleanBatchName(enrollment.batch.name),
                batch_start_date: enrollment.batch.start_date,
                batch_end_date: enrollment.batch.end_date,
              },
              create: {
                enrollment_id: enrollment.id,
                certificate_number: number.certificateNumber,
                course_code: identity.code,
                issue_year: issueYear,
                sequence: number.sequence,
                student_name: enrollment.student.name,
                course_name: identity.name,
                batch_name: cleanBatchName(enrollment.batch.name),
                batch_start_date: enrollment.batch.start_date,
                batch_end_date: enrollment.batch.end_date,
                issued_at: issuedAt,
                issued_by_id: req.user.id,
                is_active: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
        break;
      } catch (err) {
        if (
          (err.code === "P2002" || err.code === "P2034") &&
          attempt < 4
        ) {
          continue;
        }
        throw err;
      }
    }

    const updatedEnrollment = await findEnrollment(enrollment.id);

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

    return success(
      res,
      200,
      "Certificate previews fetched.",
      enrollments.map(toCertificateView),
    );
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
    const enrollment = await getStudentEnrollment(
      req,
      req.params.enrollmentId,
    );

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
      `Certificate download unlocks after ${UNLOCK_PROGRESS}% course completion.`,
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
