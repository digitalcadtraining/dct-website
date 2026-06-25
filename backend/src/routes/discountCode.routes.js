const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/discountCode.controller");

router.post("/validate", ctrl.validateDiscountCode);

router.use(authenticate, authorize("ADMIN"));
router.get("/", ctrl.listDiscountCodes);
router.post("/", ctrl.createDiscountCode);
router.patch("/:id", ctrl.updateDiscountCode);

module.exports = router;
