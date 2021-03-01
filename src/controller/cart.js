const Cart = require("../models/cart");

exports.addItemToCart = async (req, res) => {
  let cartItem = req.body;

  /**
   * {
   *  "product": "6034c1e6d14c6d67462c9164",
      "quantity": 3
      "size": {
        sizeUnit: inch,
        sizeValue: 12,
        price: 123
      }
      amount: 123
   * }
   */

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      for (let i = 0; i < cart.cartItems.length; i++) {
        const item = cart.cartItems[i];

        console.log(item.product, cartItem.product);
        if (
          item.product == cartItem.product &&
          JSON.stringify(item.size) == JSON.stringify(cartItem.size)
        ) {
          item.quantity += cartItem.quantity;
          cartItem.quantity = 0;
        }
      }
      cart.totalAmount += cartItem.amount;

      if (cartItem.quantity > 0) {
        cart.cartItems.push({
          product: cartItem.product,
          quantity: cartItem.quantity,
          size: cartItem.size,
          price: cartItem.amount,
        });
      }

      const updatedCart = await cart
        .save()
        .then((t) =>
          t
            .populate("cartItems.product", "_id name basePrice productPictures")
            .execPopulate()
        );

      return res.json(updatedCart);
    } else {
      const newCart = await new Cart({
        user: req.user._id,
        cartItems: [
          {
            product: cartItem.product,
            quantity: cartItem.quantity,
            size: cartItem.size,
            price: cartItem.amount,
          },
        ],
        totalAmount: cartItem.amount,
      })
        .save()
        .then((t) =>
          t
            .populate("cartItems.product", "_id name basePrice productPictures")
            .execPopulate()
        );

      return res.json(newCart);
    }
  } catch (error) {
    return res
      .status(400)
      .json({ error, message: "Error in adding item to cart." });
  }
};

exports.getCartItems = async (req, res) => {
  try {
    if (!req.cookies["refresh-token"]) {
      throw new Error("Invalid Request");
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product",
      "_id name basePrice productPictures availability sizes areSizes"
    );

    cart.cartItems.forEach((item, index) => {
      if (!item.product.availability) {
        cart.cartItems.splice(index, 1);

        cart.totalAmount -= item.price;
      }
    });

    const updatedCart = await cart
      .save()
      .then((t) =>
        t
          .populate(
            "cartItems.product",
            "_id name basePrice productPictures areSizes sizes"
          )
          .execPopulate()
      );

    res.json(updatedCart);
  } catch (error) {
    res.status(400).json({
      success: false,
      error,
    });
  }
};

// new update remove cart items
exports.removeCartItems = (req, res) => {
  const { productId, price } = req.body;
  if (productId) {
    console.log(productId);

    Cart.updateOne(
      { user: req.user._id },
      {
        $pull: {
          cartItems: {
            _id: productId,
          },
        },
        $inc: { totalAmount: -price },
      }
    ).exec((error, result) => {
      if (error) return res.status(400).json({ error });
      if (result) {
        res.status(202).json({ result });
      }
    });
  }
};
