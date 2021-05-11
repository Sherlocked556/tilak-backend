const shortid = require("shortid");
const order = require("../models/order");
const { Reseller, ResellerRequests } = require("../models/reseller");
const User = require("../models/user");

exports.createReseller = async (req, res, next) => {
  let reqReseller = req.body.email;
  let reqPercent = req.body.percent;

  console.log(reqPercent);

  try {
    const user = await User.findOne({ email: reqReseller });

    const existingReseller = await Reseller.findOne({ userId: user._id });

    if (existingReseller) {
      throw new Error("Reseller already exists.");
    }

    user.role = "reseller";

    const reseller = new Reseller({
      userId: user._id,
      resellerCode: shortid.generate(),
      orders: [],
      percent: reqPercent,
    });

    const savedReseller = await reseller.save().then((t) =>
      t
        .populate([
          {
            path: "orders.orderId",
            select:
              "_id paymentData createdAt paymentStatus billingAddress totalAmount paymentType items orderStatus user",
            populate: [
              {
                path: "items.productId",
                select: "_id name productPictures",
              },
              {
                path: "user",
                select: "_id firstName lastName role email",
              },
            ],
          },
          {
            path: "userId",
            select: "_id firstName email role",
          },
        ])
        .execPopulate()
    );

    await user.save();

    return res.json({
      success: true,
      reseller: savedReseller,
      msg: "Reseller created Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.updateReseller = async (req, res, next) => {
  let { percent, resellerId } = req.body;

  try {
    const updatedReseller = await Reseller.findByIdAndUpdate(
      resellerId,
      {
        percent: percent,
      },
      { new: true }
    )
      .populate([
        {
          path: "orders.orderId",
          select:
            "_id paymentData createdAt paymentStatus billingAddress totalAmount paymentType items orderStatus user",
          populate: [
            {
              path: "items.productId",
              select: "_id name productPictures",
            },
            {
              path: "user",
              select: "_id firstName lastName role email",
            },
          ],
        },
        {
          path: "userId",
          select: "_id firstName email role",
        },
      ])
      .exec();

    res.json({
      success: true,
      reseller: updatedReseller,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.fetchReseller = async (req, res, next) => {
  let resellerId = req.params.resellerId;

  try {
    const reseller = await Reseller.findOne({ userId: resellerId }).populate({
      path: "orders.orderId",
      select:
        "_id paymentData createdAt paymentStatus billingAddress totalAmount paymentType items orderStatus user",
      populate: [
        {
          path: "items.productId",
          select: "_id name productPictures",
        },
        {
          path: "user",
          select: "_id firstName lastName role email",
        },
      ],
    });

    return res.json({
      success: true,
      reseller,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.fetchAllReseller = async (req, res, next) => {
  try {
    let resellers = await Reseller.find({}).populate([
      {
        path: "orders.orderId",
        select:
          "_id paymentData createdAt paymentStatus billingAddress totalAmount paymentType items orderStatus user",
        populate: [
          {
            path: "items.productId",
            select: "_id name productPictures",
          },
          {
            path: "user",
            select: "_id firstName lastName role email",
          },
        ],
      },
      {
        path: "userId",
        select: "_id firstName email role",
      },
    ]);

    for (let i = 0; i < resellers.length; i++) {
      let reseller = resellers[i];

      const requestDue = await ResellerRequests.aggregate([
        {
          $match: {
            resellerId: reseller._id,
          },
        },
        {
          $group: {
            _id: null,
            amount: {
              $sum: {
                $cond: [{ $eq: ["$status", "processing"] }, "$amount", 0],
              },
            },
          },
        },
      ]);

      resellers[i] = { ...reseller._doc, due: requestDue[0] };

      console.log(resellers[i]);
    }

    return res.json({
      success: true,
      resellers,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.createRequest = async (req, res, next) => {
  let { resellerId } = req.body;

  try {
    const reseller = await Reseller.findById(resellerId);

    if (!reseller) {
      throw new Error("Reseller not found.");
    }

    if (reseller.requestablePoints <= 0) {
      throw new Error("No points remaining to redeem.");
    }

    let points = 0;
    let amount = 0;

    for (let i = 0; i < reseller.orders.length; i++) {
      const order = reseller.orders[i];

      if (!order.claimed && !order.requested) {
        points++;
        amount += order.orderAmount;
        order.requested = true;
      }
    }

    reseller.requestableAmount = 0;
    reseller.requestablePoints = 0;

    const request = await new ResellerRequests({
      resellerId: reseller._id,
      date: new Date(),
      points,
      amount: Math.round(amount * reseller.percent),
    }).save();

    await reseller.save();

    return res.json({
      success: true,
      msg: "Request added successfully",
      request,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.updateRequest = async (req, res, next) => {
  let { status, requestId } = req.body;

  try {
    const request = await ResellerRequests.findById(requestId);
    const reseller = await Reseller.findById(request.resellerId);

    if (request.status == "processing") {
      if (status === "accepted") {
        request.status = status;

        for (let i = 0; i < reseller.orders.length; i++) {
          const order = reseller.orders[i];

          if (!order.claimed && order.requested) {
            order.claimed = true;
          }
        }

        reseller.totalPoints += request.amount;
      } else if (status === "declined") {
        request.status = status;

        for (let i = 0; i < reseller.orders.length; i++) {
          const order = reseller.orders[i];

          if (!order.claimed && order.requested) {
            order.requested = false;
          }
        }

        reseller.requestablePoints += request.points;
        reseller.requestableAmount += request.amount;
      }
    } else {
      throw new Error("Request has been accepted/declined.");
    }

    const updatedRequest = await request.save();
    await reseller.save();

    return res.json({
      success: true,
      msg: "Request Updated Successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.deleteReseller = async (req, res, next) => {
  let { resellerId } = req.params;

  try {
    const reseller = await Reseller.findByIdAndDelete(resellerId);
    const requests = await ResellerRequests.deleteMany({
      resellerId: resellerId,
    });

    const user = await User.findByIdAndUpdate(reseller.userId, {
      role: "user",
    });

    res.json({
      success: true,
      msg: "Reseller Successfully deleted.",
      reseller: resellerId,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.fetchRequests = async (req, res, next) => {
  let { requestId } = req.params;

  try {
    const request = await ResellerRequests.findById(requestId);

    return res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.fetchResellerRequests = async (req, res, next) => {
  let { resellerId } = req.params;

  // console.log("resellerId from fetchResellerRequests", resellerId);

  try {
    const reseller = await Reseller.findOne({ userId: resellerId });

    const request = await ResellerRequests.find({
      resellerId: reseller._id,
    });

    return res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.fetchAllRequests = async (req, res, next) => {
  try {
    const requests = await ResellerRequests.find({}).populate({
      path: "resellerId",
      select: "userId",
      populate: {
        path: "userId",
        select: "_id firstName lastName role email",
      },
    });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};
