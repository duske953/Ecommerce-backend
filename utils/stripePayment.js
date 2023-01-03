const catchAsync = require("./catchAsync");
const createError = require("http-errors");
const products = require("../model/productModel");
const users = require("../model/userModel");
const express = require("express");
module.exports = catchAsync(async (req, res, next) => {
  if (!req.body.id)
    return next(createError(404, "The page your'e looking for does not exist"));
  const product = await products.findById(req.body.id);
  const foundProduct = await users.findOne({
    products: product._id,
    _id: req.user._id,
  });
  if (!foundProduct)
    return next(createError(404, "We could not find product you requested"));
  const stripe = require("stripe")(process.env.STRIPE_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount:
      Math.floor(product.price.value || product.price.name.slice(1)) * 100,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      productTitle: product.title,
      productPrice: product.price.value || product.price.name.slice(1),
      productImg: product.image,
      productId: req.body.id,
    },
  });
  res.status(200).json({ paymentIntent });
});