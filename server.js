const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log('db connection successfully');
});

app.use(express.json({ extended: false }));

const OrderSchema = mongoose.Schema({
  isPaid: Boolean,
  amount: Number,
  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String,
  },
});
const Order = mongoose.model('Order', OrderSchema);

app.get('/get-razorpay-key', (req, res) => {
  res.send({ key: process.env.RAZORPAY_KEY_ID });
});

app.post('/create-order', async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const options = {
      amount: req.body.amount,
      currency: 'INR',
    };
    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send('some error occured');
    res.send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/pay-order', async (req, res) => {
  try {
    const { amount, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;
    const newOrder = Order({
      isPaid: true,
      amount: amount,
      razorpay: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      },
    });
    await newOrder.save();
    res.send({ msg: 'Payment was successfull' });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.get('/list-orders', async (req, res) => {
  const orders = await Order.find();
  res.send(orders);
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log('server started on http://localhost:${port}');
});
