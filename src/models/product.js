const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    availability: {
      type: Boolean,
      required: true,
    },
    offer: { type: Number },
    productPictures: [{ img: { type: String } }],
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        review: String,
      },
    ],
    category: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedAt: Date,
    areSizes: {
      type: Boolean,
      required: true,
    },
    sizes: {
      sizeUnit: { type: String, enum: ["inch", "feet"] },
      sizeVariants: [
        {
          quantity: {
            type: Number,
          },
          addOnPrice: {
            type: Number,
          },
          sizeValue: {
            type: String,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
