const router = require("express").Router();
const { submitApplication, getApplicationStatus } = require("../controllers/tutor.controller");

router.post("/",       submitApplication);     // Public (with phone_token)
router.get("/status",  getApplicationStatus);  // Public - check status by phone

module.exports = router;
