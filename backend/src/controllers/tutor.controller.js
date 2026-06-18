/**
 * Tutor Application Controller
 */
const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizePhone } = require("../utils/helpers");
const jwt = require("jsonwebtoken");

function projectMeta(project = {}) {
  const isRecorded = Boolean(project.is_recorded || project.delivery_mode === "RECORDED");
  return {
    is_recorded: isRecorded,
    delivery_mode: isRecorded ? "RECORDED" : "LIVE",
    unlock_rule: isRecorded ? "FIRST_LIVE_PROJECT_START" : null,
    sessions: isRecorded ? [] : (project.sessions || []),
  };
}

const submitApplication = async (req, res, next) => {
  try {
    const {
      name, email, phone, phone_token,
      occupation, years_exp, companies, work_experience,
      course_id, time_slots,
      hide_identity, location, languages,
      syllabus_sessions, syllabus_projects,
    } = req.body;

    const required = { name, email, phone, occupation, years_exp, companies, work_experience, course_id, location };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) return error(res, 400, `Missing required fields: ${missing.join(", ")}`);

    let decoded;
    try { decoded = jwt.verify(phone_token, process.env.JWT_ACCESS_SECRET); }
    catch { return error(res, 400, "Phone verification expired. Please verify OTP again."); }

    const normalizedPhone = normalizePhone(phone);
    if (decoded.phone !== normalizedPhone || decoded.purpose !== "TUTOR_REGISTER") {
      return error(res, 400, "Invalid phone verification token.");
    }

    const existing = await prisma.tutorApplication.findFirst({ where: { phone: normalizedPhone, status: { not: "REJECTED" } } });
    if (existing) return error(res, 409, "An application with this phone number already exists.");

    const course = await prisma.course.findUnique({ where: { id: course_id } });
    if (!course) return error(res, 404, "Selected course not found.");

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.tutorApplication.create({
        data: {
          name,
          email,
          phone: normalizedPhone,
          occupation,
          years_exp: parseInt(years_exp),
          companies,
          work_experience,
          course_id,
          time_slots: time_slots || [],
          hide_identity: hide_identity || false,
          location,
          languages: languages || [],
        },
      });

      if (syllabus_sessions?.length) {
        await tx.syllabusTemplate.createMany({
          data: syllabus_sessions.map((s, idx) => ({
            application_id: app.id,
            session_number: s.session_number || idx + 1,
            name: s.name,
            type: s.type || "BOTH",
          })),
        });
      }

      if (syllabus_projects?.length) {
        await tx.syllabusProject.createMany({
          data: syllabus_projects
            .filter((p) => p?.name)
            .map((p) => ({
              application_id: app.id,
              name: p.name,
              highlights: projectMeta(p),
            })),
        });
      }

      return app;
    });

    return success(res, 201, "Application submitted successfully! We will review and contact you within 3-5 business days.", {
      application_id: application.id,
      status: application.status,
    });
  } catch (err) { next(err); }
};

const getApplicationStatus = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) return error(res, 400, "Phone number required.");

    const application = await prisma.tutorApplication.findFirst({
      where: { phone: normalizePhone(phone) },
      orderBy: { applied_on: "desc" },
      select: { id: true, status: true, applied_on: true, reviewed_on: true, rejection_note: true, course: { select: { name: true } } },
    });

    if (!application) return error(res, 404, "No application found for this phone number.");
    return success(res, 200, "Application status.", application);
  } catch (err) { next(err); }
};

const getApprovedCourses = async (req, res, next) => {
  try {
    const applications = await prisma.tutorApplication.findMany({
      where: { user_id: req.user.id, status: "APPROVED" },
      orderBy: { reviewed_on: "desc" },
      include: { course: { select: { id: true, name: true, slug: true, short_name: true } } },
    });

    const unique = new Map();
    applications.forEach((app) => {
      if (app.course?.id) unique.set(app.course.id, app.course);
    });

    return success(res, 200, "Approved tutor courses.", Array.from(unique.values()));
  } catch (err) { next(err); }
};

module.exports = { submitApplication, getApplicationStatus, getApprovedCourses };
