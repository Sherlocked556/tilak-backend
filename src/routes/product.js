const express = require("express");
//const {  } = require('../controller/category');
const {
  requireSignin,
  adminMiddleware,
  compressMultipleImages,
  // uploadS3,
} = require("../common-middleware");
const {
  createProduct,
  getProductsBySlug,
  getProductDetailsById,
  deleteProductById,
  getProducts,
  patchProduct,
  patchProductById,
} = require("../controller/product");
const multer = require("multer");
const router = express.Router();
const shortid = require("shortid");
const path = require("path");
const customStorage = require("../common-middleware/customStorage");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(path.dirname(__dirname), "uploads"));
//   },
// filename: function (req, file, cb) {
//   cb(null, shortid.generate() + "-" + file.originalname);
// },
// });

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
  "/product/create",
  requireSignin,
  adminMiddleware,
  upload.array("productPicture"),
  // uploadS3.array("productPicture"),
  createProduct
);
router.get("/products/:slug", getProductsBySlug);
//router.get('/category/getcategory', getCategories);
router.get("/product/:productId", getProductDetailsById);
router.delete(
  "/product/deleteProductById/:productId",
  requireSignin,
  adminMiddleware,
  deleteProductById
);
router.patch(
  "/product/updateProducts",
  requireSignin,
  adminMiddleware,
  patchProduct
);
router.patch(
  "/product/updateById",
  requireSignin,
  adminMiddleware,
  upload.array("productPicture"),
  // uploadS3.array("productPicture"),
  patchProductById
);
router.post(
  "/product/getProducts",
  requireSignin,
  // adminMiddleware,
  getProducts
);

module.exports = router;
