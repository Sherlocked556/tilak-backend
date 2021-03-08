const { default: slugify } = require("slugify");
const Inventory = require("../models/inventory");

exports.createInventory = async (req, res) => {
  let { name, styles, category } = req.body;
  const thumbnail = req.file.path.split("\\").pop().split("/").pop();

  try {
    if (styles) {
      styles = JSON.parse(styles);
    }

    // console.log(JSON.parse(styles));

    const newInventory = await new Inventory({
      name,
      slug: slugify(name),
      thumbnail,
      category,
      styles: styles,
    })
      .save()
      .then((t) => t.populate("category", "_id name").execPopulate());

    return res.json({
      success: true,
      inventory: newInventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message || error.name,
      error,
    });
  }
};

exports.editInventory = async (req, res) => {
  let inventoryId = req.params.id;
  let inventory = req.body;

  let thumbnail = "";
  let styles = {};

  try {
    if (req.file) {
      thumbnail = req.file.path.split("\\").pop().split("/").pop();
    }

    if (thumbnail && thumbnail !== inventory.thumbnail) {
      inventory.thumbnail = thumbnail;
    }

    if (inventory.prevStyles) {
      inventory.styles = JSON.parse(inventory.prevStyles);

      delete inventory.prevStyles;
    }
    // console.log("ealhdsj");

    console.log(inventory.styles);

    inventory.slug = slugify(inventory.name);

    const updatedInventory = await Inventory.findByIdAndUpdate(
      inventoryId,
      inventory,
      { new: true }
    )
      .populate("category", "_id name")
      .exec();

    console.log(updatedInventory);

    return res.json({
      success: true,
      inventory: updatedInventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message || error.name,
      error,
    });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({})
      .populate("category", "_id name")
      .exec();

    res.json({ success: true, inventory });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message || error.name,
      error,
    });
  }
};

exports.getOneInventory = async (req, res) => {
  let inventoryId = req.params.id;

  try {
    const inventory = await Inventory.findById(inventoryId)
      .populate("category", "_id name")
      .exec();

    res.json({ success: true, inventory });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message || error.name,
      error,
    });
  }
};

exports.deleteInventory = async (req, res) => {
  let inventory = req.params.id;

  try {
    const deletedInventory = await Inventory.findByIdAndDelete(inventory);

    res.json({ success: true, inventory });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message || error.name,
      error,
    });
  }
};
