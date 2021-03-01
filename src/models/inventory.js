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
        items: [
          {
            styleValue: { type: String },
            products: [
              {
                product: {
                  type: Schema.Types.ObjectId,
                  ref: "Product",
                },
              },
            ],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("Inventory", inventorySchema);
