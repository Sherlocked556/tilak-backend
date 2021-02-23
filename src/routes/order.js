const {
  requireSignin,
  userMiddleware,
  adminMiddleware,
} = require("../common-middleware");
const {
  addOrder,
  getOrders,
  getOrder,
  createOrder,
  addOrderRazorpay,
  createOrderRazorpay,
  createOrderPaypal,
  addOrderPaypal,
  getAllOrder,
} = require("../controller/order");
const router = require("express").Router();

router.post(
  "/createOrder/razorpay",
  requireSignin,
  userMiddleware,
  createOrderRazorpay
);
router.post(
  "/createOrder/paypal",
  requireSignin,
  userMiddleware,
  createOrderPaypal
);

router.get("/addOrder", addOrder);
router.get("/addOrder/razorpay", addOrderRazorpay);
router.get("/addOrder/paypal", addOrderPaypal);

router.get("/getOrders", requireSignin, userMiddleware, getOrders);
router.post("/getOrder", requireSignin, userMiddleware, getOrder);
router.get("/getAllOrders", requireSignin, adminMiddleware, getAllOrder);

module.exports = router;
