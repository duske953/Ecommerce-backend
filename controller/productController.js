const catchAsync = require('../utils/catchAsync');
const products = require('../model/productModel');
const utilityController = require('./utilityController');
const axios = require('axios');
const createError = require('http-errors');
const product = require('../model/productModel');
const user = require('../model/userModel');

function sendResponse(res, code, message, data) {
  return res.status(code).json({
    message,
    data: {
      ...data,
    },
  });
}

exports.getProducts = catchAsync(async (req, res, next) => {
  const headphones = await products.aggregate([
    {
      $match: { categories: { $elemMatch: { id: '172541' } } },
    },
    {
      $sample: { size: 8 },
    },
  ]);

  const laptops = await products.aggregate([
    {
      $match: { categories: { $elemMatch: { id: '13896617011' } } },
    },
    {
      $sample: { size: 8 },
    },
  ]);
  sendResponse(res, 200, 'products loaded', { headphones, laptops });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await products.findOne({
    _id: req.params.id,
    asin: req.params.asin,
  });
  if (!product)
    return next(createError(404, 'We could not find the requested product'));
  const id = product.categories[0].id;

  const similarProduct = await products.aggregate([
    {
      $match: { categories: { $elemMatch: { id } } },
    },
    {
      $sample: { size: 8 },
    },
  ]);
  sendResponse(res, 200, 'Product fetched', { product, similarProduct });
});

exports.addProductToCart = catchAsync(async (req, res, next) => {
  if (!req.body.id)
    return next(createError(400, 'No product was found to add to cart'));
  if (req.user.products.length >= 5)
    return next(
      createError(
        400,
        'You can only have 5 products per cart. Please process your order'
      )
    );

  const foundProduct = await user.findOne({
    products: { $elemMatch: { products: req.body.id } },
  });

  if (foundProduct) return next(createError(400, 'Product already in cart...'));

  const addedProduct = await user.findOneAndUpdate(
    { _id: req.user.id },
    {
      $push: {
        products: {
          $each: [{ products: req.body.id, productPaid: false }],
          $position: 0,
        },
      },
    },
    { new: true }
  );
  await req.user.save({ validateBeforeSave: false });

  sendResponse(res, 201, 'Product added to cart', {
    user: req.user,
  });
});

exports.deleteProductFromCart = catchAsync(async (req, res, next) => {
  if (!req.body.id) return next(createError(400, 'No items found to delete'));
  const foundProduct = await user.findById(req.user.id).findOne({
    products: { $elemMatch: { _id: req.body.id } },
  });

  if (!foundProduct)
    return next(
      createError(400, 'We could not find that product in your cart')
    );
  await user.findById(req.user.id).findOneAndUpdate(
    { _id: req.user.id },
    {
      $pull: {
        products: {
          _id: req.body.id,
        },
      },
    }
  );
  sendResponse(res, 200, `product with ${req.body.id} has been deleted`);
});

exports.searchProduct = catchAsync(async (req, res, next) => {
  const query = req.query.q;
  if (!req.query.q || !req.query.page)
    return next(createError(404, "The page your'e looking for does not exist"));
  if (+req.query.page <= 0 || !Number.isFinite(+req.query.page))
    return next(createError(404, "The page your'e looking for does not exist"));
  const searchedProduct = await product
    .find({
      $text: { $search: `"\"${query}\"" -2022`, $diacriticSensitive: true },
    })
    .limit(8)
    .skip(+(req.query.page - 1) * 8);

  if (searchedProduct.length === 0)
    return next(createError(404, "The page you're looking for does not exist"));

  sendResponse(res, 200, 'success', { searchedProduct });
});

exports.getProductsFromCart = catchAsync(async (req, res, next) => {
  const product = await user
    .findById(req.user.id)
    .populate('products.products')
    .select('products');
  sendResponse(res, 200, 'products from cart loaded', { product });
});

exports.getProductsFromCategory = catchAsync(async (req, res, next) => {
  if (!req.query.id || !req.query.page)
    return next(createError(400, 'something went wrong with the request'));
  if (req.query.page <= 0 || !Number.isFinite(+req.query.page))
    return next(createError(400, 'something went wrong with the request'));

  const foundProducts = await products
    .find({
      categories: { $elemMatch: { id: req.query.id } },
    })
    .limit(8)
    .skip(+(req.query.page - 1) * 8);

  if (foundProducts.length === 0)
    return next(createError(404, "The page you're looking for does not exist"));
  sendResponse(res, 200, 'products fetched', { foundProducts });
});
