const express = require("express");
const {
  adminMiddleware,
  requireSignin,
  resellerMiddleware,
} = require("../common-middleware");
const {
  createReseller,
  fetchReseller,
  fetchAllReseller,
  createRequest,
  updateRequest,
  fetchRequests,
  fetchResellerRequests,
  fetchAllRequests,
  deleteReseller,
  updateReseller,
} = require("../controller/reseller");

const router = express.Router();

router.post("/reseller", requireSignin, adminMiddleware, createReseller);
router.patch("/reseller", requireSignin, adminMiddleware, updateReseller);
router.get("/reseller", requireSignin, adminMiddleware, fetchAllReseller);
router.delete(
  "/reseller/:resellerId",
  requireSignin,
  adminMiddleware,
  deleteReseller
);
router.post(
  "/reseller/request",
  requireSignin,
  resellerMiddleware,
  createRequest
);
router.patch(
  "/reseller/request",
  requireSignin,
  resellerMiddleware,
  updateRequest
);
router.get(
  "/reseller/request",
  requireSignin,
  resellerMiddleware,
  fetchAllRequests
);
router.get(
  "/reseller/:resellerId",
  requireSignin,
  resellerMiddleware,
  fetchReseller
);
router.get(
  "/reseller/request/:requestId",
  requireSignin,
  resellerMiddleware,
  fetchRequests
);
router.get(
  "/reseller/:resellerId/request",
  requireSignin,
  resellerMiddleware,
  fetchResellerRequests
);

module.exports = router;
