const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const crypto = require("crypto");
const fx = require("money");
require("dotenv").config();

const Order = require("../models/order");
const Cart = require("../models/cart");
const Address = require("../models/address");
const Product = require("../models/product");
const { Reseller } = require("../models/reseller");

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

// fx.settings = { from: "INR" };

exports.createOrderRazorpay = async (req, res) => {
  try {
    let totalAmount = 0;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product",
      "name basePrice description areSizes sizes"
    );

    totalAmount = cart.totalAmount + 50;

    // console.log(parseInt(totalAmount), req.body.currency);

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: parseInt(totalAmount) * 100,
      currency: req.body.currency,
    };

    const cartItems = cart.cartItems.map((item) => {
      return {
        productId: item.product._id,
        payablePrice: item.price,
        purchasedQty: item.quantity,
        purchasedSize: {
          sizeUnit: item.size.sizeUnit,
          sizeValue: item.size.sizeValue,
        },
      };
    });

    instance.orders.create(options, async (err, order) => {
      try {
        if (!err) {
          const userAddress = await Address.findOne({ user: req.user._id });

          const address = userAddress.address.find(
            (item) => item._id.toString() == req.body.addressId.toString()
          );

          console.log(address);

          const newOrder = await new Order({
            user: req.user._id,
            totalAmount,
            paymentData: {
              paymentProvider: "razorpay",
              orderId: order.id,
              currency: order.currency,
            },
            items: cartItems,
            paymentStatus: "pending",
            addressId: req.body.addressId,
            billingAddress: address,
            resellerCode: req.body.resellerCode || "",
          }).save();

          return res.json({ order: newOrder });
        } else {
          throw err;
        }
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, msg: "Bad Request", error });
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Bad Request", error });
  }
};

exports.createOrderPaypal = async (req, res) => {
  try {
    let totalAmount = 0;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product",
      "name basePrice description areSizes sizes"
    );

    totalAmount = cart.totalAmount + 50;

    let item_list = cart.cartItems.map((item) => {
      return {
        name: item.product.name,
        price: parseFloat(item.price).toFixed(2),
        quantity: item.quantity,
        currency: "INR",
      };
    });

    const cartItems = cart.cartItems.map((item) => {
      return {
        productId: item.product._id,
        payablePrice: item.price,
        purchasedQty: item.quantity,
        purchasedSize: {
          sizeUnit: item.size.sizeUnit,
          sizeValue: item.size.sizeValue,
        },
      };
    });

    // if (req.body.currency != "INR") {
    //   totalAmount = await fx.convert(parseInt(totalAmount), {
    //     from: "INR",
    //     to: req.body.currency,
    //   });
    // }

    const create_payment_json = {
      intent: "SALE",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:2000/api/addOrder/paypal",
        cancel_url: "http://localhost:2000/api/addOrder/cancel?method=paypal",
      },
      transactions: [
        {
          item_list: {
            items: item_list,
          },
          amount: {
            currency: "INR",
            total: parseFloat(totalAmount).toFixed(2),
          },
        },
      ],
    };

    console.log(item_list);

    paypal.payment.create(create_payment_json, async (error, payment) => {
      try {
        if (error) {
          throw error;
        } else {
          console.log(payment);
          let redirect_uri = "";
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              redirect_uri = payment.links[i].href;
            }
          }
          const userAddress = await Address.findOne({ user: req.user._id });

          const address = userAddress.address.find(
            (item) => item._id.toString() == req.body.addressId.toString()
          );

          const newOrder = await new Order({
            user: req.user._id,
            totalAmount,
            paymentData: {
              paymentProvider: "paypal",
              paymentId: payment.id,
              currency: req.body.currency,
            },
            items: cartItems,
            paymentStatus: "pending",
            addressId: req.body.addressId,
            billingAddress: address,
            resellerCode: req.body.resellerCode || "",
          }).save();

          return res.json({ order: newOrder, redirect_uri });
        }
      } catch (error) {
        if (error.response) {
          console.log(error.response.details);
        } else {
          console.log(error);
        }
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Bad Request", error });
  }
};

exports.addOrderRazorpay = async (req, res) => {
  const order = req.query;

  const orderId = order.orderCreationId;
  const checkoutOrderId = order.razorpayOrderId;
  const paymentId = order.razorpayPaymentId;
  const signature = order.razorpaySignature;

  const genSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(checkoutOrderId + "|" + paymentId)
    .digest("hex");

  try {
    if (signature !== genSign) {
      throw new Error("Signature mismatch");
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const order = await Order.findOne({ "paymentData.orderId": orderId });
    console.log(order);

    instance.payments.fetch(paymentId, async (error, payment) => {
      order.paymentData.paymentId = payment.id;
      order.paymentStatus = "completed";
      order.paymentType = payment.method;
      order.orderStatus.push({ type: "ordered", isCompleted: true });

      const deletedCart = await Cart.deleteOne({ user: order.user });

      for (let i = 0; i < order.items.length; i++) {
        let product = await Product.findById(order.items[i].productId);

        console.log("product", product.sizes);

        if (product.areSizes) {
          console.log("areSizes true");

          if (
            product.sizes.sizeUnit === order.items[i].purchasedSize.sizeUnit
          ) {
            console.log("unit match", order.items);

            for (let j = 0; j < product.sizes.sizeVariants.length; j++) {
              if (
                parseInt(product.sizes.sizeVariants[j].sizeValue) ===
                order.items[i].purchasedSize.sizeValue
              ) {
                console.log("sizeValue match", product);
                // console.log(
                //   "prod",
                //   product.sizes.sizeVariants[j],
                //   order,
                //   order.items[i].purchasedSize
                // );

                product.sizes.sizeVariants[j].quantity -=
                  order.items[i].purchasedQty;
              }
            }
          }
        } else {
          console.log("areSizes false");

          product.quantity -= order.items[i].purchasedQty;
          product.sizes = [];
        }

        const savedProdut = await product.save();
        console.log(savedProdut);
      }

      if (order.resellerCode !== "") {
        const reseller = await Reseller.findOneAndUpdate(
          {
            resellerCode: order.resellerCode,
          },
          {
            $push: {
              orders: {
                orderId: order._id,
              },
            },
            $inc: {
              requestablePoints: 1,
            },
          }
        );
      }

      const savedOrder = await order.save();

      return res.json({ savedOrder });
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.addOrderPaypal = async (req, res) => {
  try {
    const { paymentId, token, PayerID: payerId } = req.query;

    paypal.payment.execute(
      paymentId,
      { payer_id: payerId },
      async (error, payment) => {
        if (error) {
          throw new Error(error);
        } else {
          if (
            payment.state === "approved" &&
            payment.transactions &&
            payment.transactions[0].related_resources &&
            payment.transactions[0].related_resources[0].sale
          ) {
            console.log("order authorization completed successfully");

            // Capture order id
            let orderId = payment.transactions[0].related_resources[0].sale.id;

            const order = await Order.findOne({
              "paymentData.paymentId": paymentId,
            });

            order.paymentData.orderId = orderId;
            order.paymentStatus = "completed";
            order.paymentType = payment.payer.payment_method;
            order.orderStatus.push({ type: "ordered", isCompleted: true });

            const deletedCart = await Cart.deleteOne({ user: order.user });

            for (let i = 0; i < order.items.length; i++) {
              let product = await Product.findById(order.items[i].productId);

              if (
                product.sizes.sizeUnit === order.items[i].purchasedSize.sizeUnit
              ) {
                for (let j = 0; j < product.sizes.sizeVariants.length; j++) {
                  if (
                    product.sizes.sizeVariants[j].sizeValue ===
                    order.items[i].purchasedSize.sizeValue
                  ) {
                    product.sizes.sizeVariants[j].quantity -=
                      order.items[i].purchasedQty;
                  }
                }
              }

              await product.save();
            }

            if (order.resellerCode !== "") {
              const reseller = await Reseller.findOneAndUpdate(
                {
                  resellerCode: order.resellerCode,
                },
                {
                  $push: {
                    orders: {
                      orderId: order._id,
                    },
                  },
                  $inc: {
                    requestablePoints: 1,
                  },
                }
              );
            }

            const savedOrder = await order.save();

            return res.redirect("http://localhost:3000/profile");
          } else {
            res.send("payment not successful");
          }
        }
      }
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message || "Bad Request",
      error,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  const { method } = req.query;

  res.json({ query: req.query });
};

exports.addOrder = (req, res) => {
  console.log("body", req.body);
  console.log("query", req.query);

  if (req.query.cancel === "true") {
    return res.json({ success: false });
  }

  return res.json({ success: true });
};

exports.getOrders = (req, res) => {
  Order.find({ user: req.user._id })
    .select(
      "_id paymentStatus paymentType orderStatus items paymentData totalAmount"
    )
    .populate("items.productId", "_id name productPictures")
    .exec((error, orders) => {
      if (error) return res.status(400).json({ error });
      if (orders) {
        res.status(200).json({ orders });
      }
    });
};

exports.getOrder = (req, res) => {
  Order.findOne({ _id: req.body.orderId })
    .populate("items.productId", "_id name productPictures")
    .populate("user", "_id firstName lastName role")
    .lean()
    .exec((error, order) => {
      if (error) return res.status(400).json({ error });
      if (order) {
        Address.findOne({
          user: order.user._id,
        }).exec((error, address) => {
          if (error) return res.status(400).json({ error });
          order.address = address.address.find(
            (adr) => adr._id.toString() == order.addressId.toString()
          );
          res.status(200).json({
            order,
          });
        });
      }
    });
};

exports.getAllOrder = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("items.productId", "_id name productPictures")
      .populate("user", "_id firstName lastName role")
      .exec();

    return res.json(orders);
  } catch (error) {
    console.log(error);

    return res.status(400).json({ success: false, msg: "Bad Request", error });
  }
};
