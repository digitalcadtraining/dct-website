const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/prerequisite.controller");

router.get(
  "/access",
  authenticate,
  authorize("STUDENT"),
  controller.getStudentPortalAccess,
);

router.get(
  "/admin/catalog",
  authenticate,
  authorize("ADMIN"),
  controller.getAdminPrerequisiteCatalog,
);

router.get(
  "/admin/batches/:batchId/access",
  authenticate,
  authorize("ADMIN"),
  controller.getAdminBatchAccess,
);

router.patch(
  "/admin/batches/:batchId/access",
  authenticate,
  authorize("ADMIN"),
  controller.updateAdminBatchAccess,
);

router.get(
  "/",
  authenticate,
  authorize("STUDENT"),
  controller.listPrerequisitesForStudent,
);

router.post(
  "/lessons/:lessonId/progress",
  authenticate,
  authorize("STUDENT"),
  controller.updateLessonProgress,
);

router.get(
  "/admin/progress",
  authenticate,
  authorize("ADMIN"),
  controller.getAdminPrerequisiteProgress,
);

module.exports = router;
