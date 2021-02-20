const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const crypto = require("crypto");
require("dotenv").config();

const Order = require("../models/order");
const Cart = require("../models/cart");
const Address = require("../models/address");

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

exports.createOrderRazorpay = async (req, res) => {
  try {
    let totalAmount = 0;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product",
      "name price quantity description"
    );

    cart.cartItems.forEach((prod) => {
      totalAmount += prod.product.price * prod.quantity;
    });

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
        payablePrice: item.product.price,
        purchasedQty: item.quantity,
      };
    });

    instance.orders.create(options, async (err, order) => {
      if (!err) {
        // TODO add addressId
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
        }).save();

        return res.json({ order: newOrder });
      } else {
        throw err;
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
      "name price quantity description"
    );

    cart.cartItems.forEach((prod) => {
      totalAmount += prod.product.price * prod.quantity;
    });

    let item_list = cart.cartItems.map((item) => {
      return {
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        currency: req.body.currency,
      };
    });

    const cartItems = cart.cartItems.map((item) => {
      return {
        productId: item.product._id,
        payablePrice: item.product.price,
        purchasedQty: item.quantity,
      };
    });

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
            currency: req.body.currency,
            total: parseFloat(totalAmount),
          },
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        return res.json(error);
      } else {
        console.log(payment);
        let redirect_uri = "";
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            redirect_uri = payment.links[i].href;
          }
        }

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
        }).save();

        return res.json({ order: newOrder, redirect_uri });
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

      const savedOrder = await order.save();

      return res.json({ savedOrder });
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
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

            const savedOrder = await order.save();

            return res.json({ savedOrder });
          } else {
            res.send("payment not successful");
          }
        }
      }
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
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
    .select("_id paymentStatus paymentType orderStatus items")
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
    .lean()
    .exec((error, order) => {
      if (error) return res.status(400).json({ error });
      if (order) {
        Address.findOne({
          user: req.user._id,
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
