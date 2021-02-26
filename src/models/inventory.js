const { Schema, model } = require("mongoose");

const inventorySchema = Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    styles: [
      {
        styleName: { type: String, required: true },
        products: [
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("Inventory", inventorySchema);
