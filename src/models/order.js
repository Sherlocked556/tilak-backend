const mongoose = require("mongoose");
// A
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAddress.address",
      required: true,
    },
    billingAddress: {
      name: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 50,
      },
      mobileNumber: {
        type: String,
        required: true,
        trim: true,
      },
      pinCode: {
        type: String,
        required: true,
        trim: true,
      },
      locality: {
        type: String,
        required: true,
        trim: true,
        min: 10,
        max: 100,
      },
      address: {
        type: String,
        required: true,
        trim: true,
        min: 10,
        max: 100,
      },
      cityDistrictTown: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        required: true,
      },
      landmark: {
        type: String,
        min: 10,
        max: 100,
      },
      alternatePhone: {
        type: String,
      },
      addressType: {
        type: String,
        required: true,
        enum: ["home", "work"],
        required: true,
      },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentData: {
      paymentProvider: {
        enum: ["razorpay", "paypal"],
        type: String,
      },
      orderId: {
        type: String,
      },
      paymentId: {
        type: String,
      },
      currency: {
        type: String,
      },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        payablePrice: {
          type: Number,
          required: true,
        },
        purchasedQty: {
          type: Number,
          required: true,
        },
        purchasedSize: {
          sizeUnit: { type: String },
          sizeValue: { type: Number },
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refund"],
      required: true,
    },
    paymentType: {
      type: String,
    },
    orderStatus: [
      {
        type: {
          type: String,
          enum: ["ordered", "packed", "shipped", "delivered"],
          default: "ordered",
        },
        date: {
          type: Date,
          default: Date.now(),
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    resellerCode: {
      type: String,
    },
  },
  { timestamps: true }
);

orderSchema.methods.getAddress = function (cb) {
  console.log("in methods");

  mongoose
    .model("UserAddress")
    .findOne({ user: this.user }, function (err, userAddress) {
      if (err) {
        return cb(err, "No User Addresses Found.");
      }

      let billingAddress = userAddress.address.find(
        (item) => item._id == this.addressId
      );

      if (!billingAddress) {
        return cb(err, "No Matching Address Found.");
      }

      this.billingAddress = billingAddress;
    });
};

module.exports = mongoose.model("Order", orderSchema);
