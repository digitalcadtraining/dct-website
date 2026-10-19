const router=require("express").Router();
const {authenticate,authorize}=require("../middleware/auth");
const controller=require("../controllers/englishConfidence.controller");
router.get("/",authenticate,authorize("STUDENT"),controller.getCourse);
router.put("/preference",authenticate,authorize("STUDENT"),controller.setPreference);
router.post("/days/:day/submit",authenticate,authorize("STUDENT"),controller.submitDay);
router.get("/admin/report",authenticate,authorize("ADMIN"),controller.adminReport);
module.exports=router;
