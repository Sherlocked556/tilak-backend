const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
require("dotenv").config();

const generateAccessJwtToken = (_id, email, fullName, role) => {
  return jwt.sign(
    { _id, email, fullName, role },
    process.env.JWT_ACCESS_TOKEN,
    {
      expiresIn: 60 * 10 * 10,
    }
  );
};

const generateRefreshJwtToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.JWT_REFRESH_TOKEN, {
    expiresIn: "7d",
  });
};

exports.signup = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const { firstName, lastName, email, password } = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      firstName,
      lastName,
      email,
      hash_password,
      username: shortid.generate(),
    });

    _user.save((error, user) => {
      if (error) {
        return res.status(400).json({
          msg: "Something went wrong",
        });
      }

      if (user) {
        return res.status(201).json({
          success: true,
          msg: "User Registered",
        });
      }
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });
    console.log(user);

    if (user) {
      const isPassword = await user.authenticate(req.body.password);
      if (isPassword) {
        const accessToken = generateAccessJwtToken(
          user._id,
          user.email,
          user.fullName,
          user.role
        );

        const refreshToken = generateRefreshJwtToken(user._id, user.role);

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;

        user
          .save()
          .then(({ _id, firstName, lastName, email, fullName, role }) => {
            //TODO add secure and domain
            res.cookie("refresh-token", refreshToken, {
              domain: ".tilakshringar.com",
              maxAge: 7 * 24 * 60 * 60 * 1000,
              httpOnly: true,
              secure: true,
              sameSite: "None",
            });

            return res.status(200).json({
              accessToken,
              user: { _id, firstName, lastName, email, fullName, role },
            });
          })
          .catch((err) => {
            return res.status(400).json({
              msg: "Cannot save tokens",
              err,
            });
          });
      }
      // else if (user.role === "admin") {
      //   res.status(400).json({
      //     msg: "Try Admin Login",
      //   });
      // }
      else {
        console.log("at 100");
        return res.status(400).json({
          msg: "Something went wrong",
        });
      }
    } else {
      console.log("at 106");
      return res.status(400).json({ msg: "Something went wrong" });
    }
  });
};

exports.signout = (req, res) => {
  const userId = req.body._id;

  User.findById(userId)
    .then((user) => {
      user.accessToken = "";
      user.refreshToken = "";

      user
        .save()
        .then((savedUsed) => {
          res.clearCookie("refresh-token", {
            domain: ".tilakshringar.com",
            maxAge: 1,
            secure: true,
            sameSite: "None",
            httpOnly: true,
          });

          res.status(200).json({
            msg: "Signed Out Successfulyy...!",
          });
        })
        .catch((err) => {
          return res.status(400).json({
            msg: "Cannot save tokens",
            err,
          });
        });
    })
    .catch((err) => {
      return res.status(400).json({
        msg: "Cannot Logout",
        err,
      });
    });
};

exports.refreshAccessToken = async (req, res) => {
  let { accessToken } = req.body;
  let refreshToken = req.cookies["refresh-token"];

  try {
    if (!refreshToken) {
      throw new Error("Invalid Request");
    }

    const { _id } = jwt.decode(accessToken);

    const user = await User.findById(_id);

    if (user.refreshToken !== refreshToken) {
      throw new Error("Invalid Request");
    }

    accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      process.env.JWT_ACCESS_TOKEN,
      {
        expiresIn: 60 * 10 * 10,
      }
    );

    user.accessToken = accessToken;

    const savedUser = await user.save();

    return res.status(200).json({
      accessToken: savedUser.accessToken,
    });
  } catch (error) {
    return res.status(400).json({
      msg: "Bad Request",
      error,
    });
  }
};
