const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const shortid = require("shortid");
const { requireSignin, adminMiddleware } = require("../common-middleware");
const {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  postUploadBlogImages,
} = require("../controller/blog");
const customStorage = require("../common-middleware/customStorage");

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

const router = Router();

router.post(
  "/blog",
  requireSignin,
  adminMiddleware,
  upload.single("coverImg"),
  createBlog
);
router.patch("/blog/:id", requireSignin, adminMiddleware, updateBlog);
router.delete("/blog/:id", requireSignin, adminMiddleware, deleteBlog);
router.get("/blog/all", getAllBlogs);
router.get("/blog/:id", getBlogById);
router.post(
  "/blog/uploadImg",
  requireSignin,
  adminMiddleware,
  upload.single("file"),
  postUploadBlogImages
);

module.exports = router;
