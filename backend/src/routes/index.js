/**
 * Routes Index
 * Mounts all route modules under /api/v1
 */

const router = require("express").Router();

router.use("/auth",              require("./auth.routes"));
router.use("/courses",           require("./course.routes"));
router.use("/batches",           require("./batch.routes"));
router.use("/sessions",          require("./session.routes"));
router.use("/assignments",       require("./assignment.routes"));
router.use("/queries",           require("./query.routes"));
router.use("/tutor-applications",require("./tutor.routes"));
router.use("/admin",             require("./admin.routes"));

// API overview
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DigitalCAD Training API v1",
    endpoints: {
      auth:               "/api/v1/auth",
      courses:            "/api/v1/courses",
      batches:            "/api/v1/batches",
      sessions:           "/api/v1/sessions",
      assignments:        "/api/v1/assignments",
      queries:            "/api/v1/queries",
      tutorApplications:  "/api/v1/tutor-applications",
      admin:              "/api/v1/admin",
    },
  });
});

module.exports = router;
