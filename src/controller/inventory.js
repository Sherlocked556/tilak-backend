const { default: slugify } = require("slugify");
const Inventory = require("../models/inventory");

exports.createInventory = async (req, res) => {
  /**
   * {
   *  name,
   *  thumbnail: img,
   *  styles: [
   *    styleName: "Colour",
   *    products: [array of productIds]
   * ]
   * }
   *
   */

  let { name, styles } = req.body;
  const thumbnail = req.file.path.split("\\").pop().split("/").pop();

  try {
    if (styles) {
      styles = JSON.parse(styles);
    }

    const newInventory = await new Inventory({
      name,
      slug: slugify(name),
      thumbnail,
      styles: styles,
    }).save();

    return res.json({
      success: true,
      inventory: newInventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
      error,
    });
  }
};

exports.editInventory = async (req, res) => {
  let { inventory } = req.body;

  const thumbnail = req.file.path.split("\\").pop().split("/").pop();

  try {
    

  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
      error,
    });
  }
};

exports.getInventory = async (req, res) => {};

exports.deleteInventory = async (req, res) => {};
