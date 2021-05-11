const express = require("express");
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

router.post("/reseller", createReseller);
router.patch("/reseller", updateReseller);
router.get("/reseller", fetchAllReseller);
router.delete("/reseller/:resellerId", deleteReseller);
router.post("/reseller/request", createRequest);
router.patch("/reseller/request", updateRequest);
router.get("/reseller/request", fetchAllRequests);
router.get("/reseller/:resellerId", fetchReseller);
router.get("/reseller/request/:requestId", fetchRequests);
router.get("/reseller/:resellerId/request", fetchResellerRequests);

module.exports = router;
