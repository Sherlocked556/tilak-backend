const { Schema, model } = require("mongoose");

const requestSchema = Schema({
  resellerId: {
    type: Schema.Types.ObjectId,
    ref: "Reseller",
  },
  date: {
    type: String,
  },
  status: {
    type: String,
    enum: ["processing", "accepted", "declined"],
    default: "processing",
  },
  points: {
    type: Number,
  },
});

const resellerSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  resellerCode: {
    type: String,
    required: true,
    unique: true,
  },
  orders: [
    {
      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
      requested: {
        type: Boolean,
        default: false,
      },
      claimed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
  },
  requestablePoints: {
    type: Number,
    required: true,
    default: 0,
  },
});

exports.ResellerRequests = model("ResellerRequest", requestSchema);

exports.Reseller = model("Reseller", resellerSchema);
