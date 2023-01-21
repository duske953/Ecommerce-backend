const catchAsync = require("./catchAsync");
const createError = require("http-errors");
const products = require("../model/productModel");
const users = require("../model/userModel");
const express = require("express");
module.exports = catchAsync(async (req, res, next) => {
  if (!req.body.id)
    return next(createError(404, "The page your'e looking for does not exist"));
  const foundProduct = await users
    .findOne(
      { products: { $elemMatch: { _id: req.body.id } }, _id: req.user._id },
      { "products.$": 1 }
    )
    .populate("products.products");

  if (!foundProduct)
    return next(createError(404, "We could not find product you requested"));
  const product = foundProduct.products[0].products;
  const stripe = require("stripe")(process.env.STRIPE_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.floor(1000) * 100,
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
