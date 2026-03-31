/**
 * Tutor Application Controller
 * Handles the 5-step tutor registration form
 * OTP verification required before submitting
 */

const { prisma }         = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizePhone } = require("../utils/helpers");
const { verifyOtp }      = require("../services/otp.service");
const jwt                = require("jsonwebtoken");

// ── SUBMIT TUTOR APPLICATION ──────────────────────────────
// POST /tutor-applications
// All 5 steps data in one payload + phone_token (from OTP verify)
const submitApplication = async (req, res, next) => {
  try {
    const {
      // Step 1 – Personal
      name, email, phone, phone_token,
      // Step 2 – Professional
      occupation, years_exp, companies, work_experience,
      // Step 3 – Course
      course_id,
      // Step 4 – Availability
      time_slots,
      // Step 5 – Preferences
      hide_identity, location, languages,
      // Syllabus
      syllabus_sessions, syllabus_projects,
    } = req.body;

    // Validate required fields
    const required = { name, email, phone, occupation, years_exp, companies, work_experience, course_id, location };
    const missing  = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) return error(res, 400, `Missing required fields: ${missing.join(", ")}`);

    // Verify phone_token
    let decoded;
    try {
      decoded = jwt.verify(phone_token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return error(res, 400, "Phone verification expired. Please verify OTP again.");
    }

    const normalizedPhone = normalizePhone(phone);
    if (decoded.phone !== normalizedPhone || decoded.purpose !== "TUTOR_REGISTER") {
      return error(res, 400, "Invalid phone verification token.");
    }

    // Check no existing application for same phone
    const existing = await prisma.tutorApplication.findFirst({
      where: { phone: normalizedPhone, status: { not: "REJECTED" } },
    });
    if (existing) {
      return error(res, 409, "An application with this phone number already exists.");
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: course_id } });
    if (!course) return error(res, 404, "Selected course not found.");

    // Create application with syllabus in a transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.tutorApplication.create({
        data: {
          name, email,
          phone:          normalizedPhone,
          occupation,
          years_exp:      parseInt(years_exp),
          companies,
          work_experience,
          course_id,
          time_slots:     time_slots     || [],
          hide_identity:  hide_identity  || false,
          location,
          languages:      languages      || [],
        },
      });

      // Create syllabus sessions
      if (syllabus_sessions?.length) {
        await tx.syllabusTemplate.createMany({
          data: syllabus_sessions.map((s, idx) => ({
            application_id: app.id,
            session_number: s.session_number || idx + 1,
            name:           s.name,
            type:           s.type || "BOTH",
          })),
        });
      }

      // Create syllabus projects (optional)
      if (syllabus_projects?.length) {
        await tx.syllabusProject.createMany({
          data: syllabus_projects.map(p => ({
            application_id: app.id,
            name:           p.name,
            highlights:     p.highlights || [],
          })),
        });
      }

      return app;
    });

    return success(res, 201, "Application submitted successfully! We will review and contact you within 3-5 business days.", {
      application_id: application.id,
      status:         application.status,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET APPLICATION STATUS ────────────────────────────────
// GET /tutor-applications/status?phone=xxx
const getApplicationStatus = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) return error(res, 400, "Phone number required.");

    const application = await prisma.tutorApplication.findFirst({
      where:   { phone: normalizePhone(phone) },
      orderBy: { applied_on: "desc" },
      select: {
        id: true, status: true, applied_on: true, reviewed_on: true,
        rejection_note: true,
        course: { select: { name: true } },
      },
    });

    if (!application) return error(res, 404, "No application found for this phone number.");
    return success(res, 200, "Application status.", application);
  } catch (err) {
    next(err);
  }
};

module.exports = { submitApplication, getApplicationStatus };
