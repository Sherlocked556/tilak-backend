const Cart = require("../models/cart");

// function runUpdate(condition, updateData) {
//   return new Promise((resolve, reject) => {
//     //you update code here

//     Cart.findOneAndUpdate(condition, updateData, { upsert: true })
//       .then((result) => resolve())
//       .catch((err) => reject(err));
//   });
// }

exports.addItemToCart = async (req, res) => {
  let cartItem = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      for (let i = 0; i < cart.cartItems.length; i++) {
        const item = cart.cartItems[i];

        console.log(item.product, cartItem.product);
        if (item.product == cartItem.product) {
          item.quantity += cartItem.quantity;
          cartItem.quantity = 0;
        }
      }

      if (cartItem.quantity > 0) {
        cart.cartItems.push({
          product: cartItem.product,
          quantity: cartItem.quantity,
        });
      }

      const updatedCart = await cart
        .save()
        .then((t) =>
          t
            .populate("cartItems.product", "_id name price productPictures")
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
          },
        ],
      })
        .save()
        .then((t) =>
          t
            .populate("cartItems.product", "_id name price productPictures")
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

// exports.addItemToCart = (req, res) => {
//   Cart.findOne({ user: req.user._id }).exec((error, cart) => {
//     if (error) return res.status(400).json({ error });
//     if (cart) {
//       //if cart already exists then update cart by quantity
//       let promiseArray = [];

//       req.body.cartItems.forEach((cartItem) => {
//         const product = cartItem.product;
//         const item = cart.cartItems.find((c) => c.product == product);
//         let condition, update;
//         if (item) {
//           condition = { user: req.user._id, "cartItems.product": product };
//           update = {
//             $set: {
//               "cartItems.$": cartItem,
//             },
//           };
//         } else {
//           condition = { user: req.user._id };
//           update = {
//             $push: {
//               cartItems: cartItem,
//             },
//           };
//         }
//         promiseArray.push(runUpdate(condition, update));

//       });
//       Promise.all(promiseArray)
//         .then((response) => res.status(201).json({ response }))
//         .catch((error) => res.status(400).json({ error }));
//     } else {
//       //if cart not exist then create a new cart
//       const cart = new Cart({
//         user: req.user._id,
//         cartItems: req.body.cartItems,
//       });
//       cart.save((error, cart) => {
//         if (error) return res.status(400).json({ error });
//         if (cart) {
//           return res.status(201).json({ cart });
//         }
//       });
//     }
//   });
// };

exports.getCartItems = async (req, res) => {
  try {
    if (!req.cookies["refresh-token"]) {
      throw new Error("Invalid Request");
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product",
      "_id name price productPictures"
    );

    res.json(cart);
  } catch (error) {
    res.status(400).json({
      success: false,
      error,
    });
  }
};

// new update remove cart items
exports.removeCartItems = (req, res) => {
  const { productId } = req.body;
  if (productId) {
    Cart.update(
      { user: req.user._id },
      {
        $pull: {
          cartItems: {
            product: productId,
          },
        },
      }
    ).exec((error, result) => {
      if (error) return res.status(400).json({ error });
      if (result) {
        res.status(202).json({ result });
      }
    });
  }
};
