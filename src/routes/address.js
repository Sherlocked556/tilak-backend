const express = require("express");
const { requireSignin, userMiddleware } = require("../common-middleware");
const {
  addAddress,
  getAddress,
  deleteAddress,
} = require("../controller/address");
const router = express.Router();

router.post("/user/address/create", requireSignin, userMiddleware, addAddress);
router.get("/user/getaddress", requireSignin, userMiddleware, getAddress);
router.delete(
  "/user/address/:addressId",
  requireSignin,
  userMiddleware,
  deleteAddress
);

module.exports = router;
