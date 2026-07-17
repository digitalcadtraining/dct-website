const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const certificate = require("../controllers/certificate.controller");

router.get(
  "/mine",
  authenticate,
  authorize("STUDENT"),
  certificate.myCertificates,
);

router.get(
  "/enrollments/:enrollmentId/preview.png",
  authenticate,
  authorize("STUDENT"),
  certificate.previewCertificatePng,
);

router.get(
  "/:certificateId/download.pdf",
  authenticate,
  authorize("STUDENT"),
  certificate.downloadCertificatePdf,
);

router.get(
  "/:certificateId/download.png",
  authenticate,
  authorize("STUDENT"),
  certificate.downloadCertificatePng,
);

module.exports = router;
