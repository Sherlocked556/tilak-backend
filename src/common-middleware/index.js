const jwt = require("jsonwebtoken");
const multer = require("multer");
const shortid = require("shortid");
const path = require("path");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const User = require("../models/user");
const sharp = require("sharp");
const { readFileSync, unlinkSync } = require("fs");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(path.dirname(__dirname), "uploads"));
//   },
//   filename: function (req, file, cb) {
//     cb(null, shortid.generate() + "-" + file.originalname);
//   },
// });

// const accessKeyId = process.env.accessKeyId;
// const secretAccessKey = process.env.secretAccessKey;

// const s3 = new aws.S3({
//   accessKeyId,
//   secretAccessKey,
// });

// exports.upload = multer({ storage });

// exports.uploadS3 = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: "flipkart-clone-app",
//     acl: "public-read",
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
//       cb(null, shortid.generate() + "-" + file.originalname);
//     },
//   }),
// });

exports.requireSignin = async (req, res, next) => {
  console.log("ahfjhakjkajhsdjkhajdhj");

  try {
    console.log(req.cookies["refresh-token"], "refresh-token");
    console.log(req.headers.authorization, "access-token");
    if (req.cookies["refresh-token"] && req.headers.authorization) {
      const refreshToken = jwt.verify(
        req.cookies["refresh-token"],
        process.env.JWT_REFRESH_TOKEN
      );

      const accessToken = jwt.verify(
        req.headers.authorization.split(" ")[1],
        process.env.JWT_ACCESS_TOKEN
      );

      const user = await User.findById(refreshToken._id);

      req.user = accessToken;

      if (
        user.refreshToken != req.cookies["refresh-token"] ||
        user.accessToken != req.headers.authorization.split(" ")[1]
      ) {
        throw new Error("Invalid Token, Login again");
      }
      return next();
    }
  } catch (error) {
    // console.log(error.name, "Error name");
    // console.log("Access Token", req.headers.authorization)

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ msg: "Token expired" });
    }

    return res.status(400).json({ msg: "Authorization required", error });
  }
};

exports.userMiddleware = (req, res, next) => {
  if (
    req.user.role === "admin" ||
    req.user.role === "user" ||
    req.user.role === "super-admin" ||
    req.user.role === "reseller"
  ) {
    return next();
  }
  return res.status(400).json({ msg: "User access denied" });
  next();
};

exports.resellerMiddleware = (req, res, next) => {
  if (
    req.user.role === "admin" ||
    req.user.role === "super-admin" ||
    req.user.role === "reseller"
  ) {
    return next();
  }
  return res.status(400).json({ msg: "User access denied" });
  next();
};

exports.adminMiddleware = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "super-admin") {
    return next();
  }
  return res.status(400).json({ msg: "Admin access denied" });
};

exports.superAdminMiddleware = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "super-admin") {
    return next();
  }
  return res.status(400).json({ msg: "Admin access denied" });
};

exports.compressMultipleImages = async (req, res, next) => {
  console.log(req.files);

  if (!req.files) {
    return next();
  }

  req.body.images = [];

  await Promise.all(
    req.files.map(async (file) => {
      // let buffer = readFileSync(file.path);

      await sharp(file.path)
        .resize(640, 420)
        .toFormat("jpeg")
        .jpeg({ quality: 95 })
        .toFile(path.join(path.dirname(__dirname), "uploads", file.filename));

      unlinkSync(file.path);
      req.body.images.push(file.filename);
    })
  );

  next();
};

exports.compressSingleImages = (req, res, next) => {};

exports.compressSingleImagesWithoutResize = (req, res, next) => {};
