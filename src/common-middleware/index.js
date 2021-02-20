const jwt = require("jsonwebtoken");
const multer = require("multer");
const shortid = require("shortid");
const path = require("path");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const User = require("../models/user");

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
  try {
    if (req.cookies["refresh-token"] && req.headers.authorization) {
      // console.log(req.cookies["refresh-token"], "refresh-token");
      // console.log(req.headers.authorization, "access-token");

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
      return res.status(403).json({ message: "Token expired" });
    }

    return res.status(400).json({ message: "Authorization required", error });
  }
};

exports.userMiddleware = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(400).json({ message: "User access denied" });
  }
  next();
};

exports.adminMiddleware = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "super-admin") {
    return next();
  }
  return res.status(400).json({ message: "Admin access denied" });
};

exports.superAdminMiddleware = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "super-admin") {
    return next();
  }
  return res.status(400).json({ message: "Admin access denied" });
};
