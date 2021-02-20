const { requireSignin, userMiddleware } = require("../common-middleware");
const {
  addOrder,
  getOrders,
  getOrder,
  createOrder,
  addOrderRazorpay,
  createOrderRazorpay,
  createOrderPaypal,
  addOrderPaypal,
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

module.exports = router;
