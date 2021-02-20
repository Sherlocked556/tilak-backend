const express = require("express");
const {
  signup,
  signin,
  signout,
  refreshAccessToken,
} = require("../controller/auth");
const {
  validateSignupRequest,
  isRequestValidated,
  validateSigninRequest,
} = require("../validators/auth");

const router = express.Router();

router.post("/user/signin", validateSigninRequest, isRequestValidated, signin);
router.post("/user/signup", validateSignupRequest, isRequestValidated, signup);
router.post("/user/signout", signout);
router.patch("/refresh", refreshAccessToken);

//router.post('/profile',requireSignin,(req,res) =>{
//    res.status(200).json({user:'profile'})
//});

module.exports = router;
