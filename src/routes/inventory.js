const express = require("express");
const multer = require("multer");
const router = express.Router();
const shortid = require("shortid");
const path = require("path");
const customStorage = require("../common-middleware/customStorage");
const {
  createInventory,
  editInventory,
  getInventory,
  getOneInventory,
  deleteInventory,
} = require("../controller/inventory");
const { requireSignin, adminMiddleware } = require("../common-middleware");

const storage = new customStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      path.join(
        path.dirname(__dirname),
        "uploads",
        shortid.generate() + "-" + file.originalname
      )
    );
  },
});

const upload = multer({
  storage,
});

router.post(
  "/inventory",
  requireSignin,
  adminMiddleware,
  upload.single("thumbnail"),
  createInventory
);
router.patch(
  "/inventory/:id",
  requireSignin,
  adminMiddleware,
  upload.single("thumbnail"),
  editInventory
);
router.get("/inventory", getInventory);
router.get("/inventory/:id", getOneInventory);
router.delete(
  "/inventory/:id",
  requireSignin,
  adminMiddleware,
  deleteInventory
);

module.exports = router;
