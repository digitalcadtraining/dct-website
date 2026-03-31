const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { queryController: c } = require("../controllers/session.controller");

router.post("/",                authenticate, authorize("STUDENT"), c.createQuery);
router.get("/mine",             authenticate, authorize("STUDENT"), c.getMyQueries);
router.get("/batch/:batchId",   authenticate, authorize("TUTOR", "ADMIN"), c.getBatchQueries);
router.patch("/:id/answer",     authenticate, authorize("TUTOR", "ADMIN"), c.answerQuery);

module.exports = router;
