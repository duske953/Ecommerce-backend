const catchAsync = require('./catchAsync');
const createError = require('http-errors');
const users = require('../model/userModel');
const stripe = require('stripe')(process.env.STRIPE_KEY);
module.exports = catchAsync(async (req, res, next) => {
  const userProducts = await users
    .findOne({
      _id: req.user._id,
    })
    .populate('productsInCart.product');
  if (!userProducts)
    return next(createError(404, 'We could not find product you requested'));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'usd',
    payment_method_types: ['card'],
  });
  res.status(200).json({ paymentIntent, userProducts });
});
