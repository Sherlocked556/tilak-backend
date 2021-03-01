const address = require("../models/address");
const UserAddress = require("../models/address");

exports.addAddress = (req, res) => {
  //return res.status(200).json({body: req.body})
  const { payload } = req.body;
  if (payload.address) {
    if (payload.address._id) {
      UserAddress.findOneAndUpdate(
        { user: req.user._id, "address._id": payload.address._id },
        {
          $set: {
            "address.$": payload.address,
          },
        },
        { new: true}
      ).exec((error, address) => {
        if (error) return res.status(400).json({ error });
        if (address) {
          res.status(201).json({ address });
        }
      });
    } else {
      UserAddress.findOneAndUpdate(
        { user: req.user._id },
        {
          $push: {
            address: payload.address,
          },
        },
        { new: true, upsert: true }
      ).exec((error, address) => {
        if (error) return res.status(400).json({ error });
        if (address) {
          res.status(201).json({ address });
        }
      });
    }
  } else {
    res.status(400).json({ error: "Params address required" });
  }
};

exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;

  try {
    const userAddress = await UserAddress.findOne({ user: req.user._id });

    userAddress.address = userAddress.address.filter(
      (address) => address._id != addressId
    );

    console.log(userAddress.address);

    const savedAddress = await userAddress.save();

    res.json({ address: savedAddress });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
      error,
    });
  }
};

exports.getAddress = (req, res) => {
  UserAddress.find({ user: req.user._id }).exec((error, userAddress) => {
    if (error) return res.status(400).json({ error });
    if (userAddress) {
      res.status(200).json({ userAddress });
    }
  });
};
