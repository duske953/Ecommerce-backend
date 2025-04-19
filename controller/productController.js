const catchAsync = require('../utils/catchAsync');
const products = require('../model/productModel');
const utilityController = require('./mailcontroller/checkOutSuccessEmail');
const cheerio = require('cheerio');
const axios = require('axios');
const Cookies = require('cookies');
const createError = require('http-errors');
const product = require('../model/productModel');
const user = require('../model/userModel');
const ITEMS_PER_PAGE = 12;
function sendResponse(res, code, message, data) {
  return res.status(code).json({
    message,
    data: {
      ...data,
    },
  });
}

exports.fetchOnSaleProducts = catchAsync(async (req, res, next) => {
  const monitor = await products
    .find({ categories: { $elemMatch: { id: '1292115011' } } })
    .limit(1);
  const camera = await products
    .find({ categories: { $elemMatch: { id: 'photo' } } })
    .limit(1);
  const phone = await products
    .find({ categories: { $elemMatch: { id: '2811119011' } } })
    .limit(1);
  const accessories = await products
    .find({ categories: { $elemMatch: { id: '3011391011' } } })
    .limit(1);
  sendResponse(res, 200, 'products loaded', {
    monitor,
    camera,
    phone,
    accessories,
  });
});

exports.fetchProducts = catchAsync(async (req, res, next) => {
  const headphones = await products.aggregate([
    {
      $match: { 'categories.id': 16225007015 },
    },
    {
      $sample: { size: 8 },
    },
  ]);

  const laptops = await products.aggregate([
    {
      $match: { 'categories.id': 16225007012 },
    },
    {
      $sample: { size: 8 },
    },
  ]);
  sendResponse(res, 200, 'products loaded', { headphones, laptops });
});

async function extractImgThumbnail(link) {
  const html = await axios.get(link);
  const $ = cheerio.load(html.data);
  const imgThumbnail = $('.item .a-declarative img')
    .map((i, el) => {
      const src = $(el).attr('src');
      return src;
    })
    .get();
  return imgThumbnail;
}

async function extractProductMetadata(link) {
  const html = await axios.get(link);
  const $ = cheerio.load(html.data);
  const productSpecs = $('.a-normal.a-spacing-micro .a-spacing-small')
    .map((i, el) => {
      const name = $(el).find('.a-span3 .a-size-base').text();
      const value = $(el).find('.a-span9 .a-size-base').text();
      return { name, value };
    })
    .get();

  const aboutProduct = $(
    '.a-unordered-list.a-vertical.a-spacing-mini .a-spacing-mini'
  )
    .map((e, el) => {
      const aboutProduct = $(el).find('.a-list-item').text();
      return aboutProduct;
    })
    .get();

  return { productSpecs, aboutProduct };
}

exports.fetchProduct = catchAsync(async (req, res, next) => {
  if (!req.params.asin)
    return next(createError(400, 'Please include id property'));

  const product = await products.findOne({
    asin: req.params.asin,
  });
  if (!product)
    return next(createError(404, 'We could not find the requested product'));
  const id = product.categories.id;

  if (product.images.length === 0) {
    const imgThumbnail = await extractImgThumbnail(product.link);
    product.images = imgThumbnail;
    await product.save({ validateBeforeSave: false });
  }

  if (
    product.details.aboutProduct.length === 0 ||
    !product.details.productSpecs.length === 0
  ) {
    const { productSpecs, aboutProduct } = await extractProductMetadata(
      product.link
    );
    const productMetaData = {
      productSpecs,
      aboutProduct,
    };

    product.details = productMetaData;
    await product.save({ validateBeforeSave: false });
  }

  const similarProduct = await products.aggregate([
    {
      $match: { 'categories.id': +id },
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
  if (req.user.productsInCart.length >= 5)
    return next(
      createError(
        400,
        'You can only have 5 products per cart. Please process your order'
      )
    );

  const foundProduct = await user.findOne({
    productsInCart: { $elemMatch: { product: req.body.id } },
  });
  if (foundProduct) return next(createError(400, 'Product already in cart...'));

  await user.findOneAndUpdate(
    { _id: req.user.id },
    {
      $push: {
        productsInCart: {
          $each: [
            {
              product: req.body.id,
              productPaid: false,
              quantity: req.body.quantity,
              productDiscount: req.body.productDiscount,
            },
          ],
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

exports.deleteProductsFromCart = catchAsync(async (req, res, next) => {
  const foundUser = await user.findById(req.user.id);
  if (foundUser.productsInCart.length <= 0)
    return next(createError(400, 'You have no item(s) in your cart'));
  await user.findById(req.user.id).findOneAndUpdate(
    { _id: req.user.id },
    {
      $set: {
        productsInCart: [],
      },
    }
  );
  sendResponse(res, 201, 'Product added to cart');
});

exports.deleteProductFromCart = catchAsync(async (req, res, next) => {
  if (!req.body.id) return next(createError(400, 'Please provide product id'));
  await user.findById(req.user.id).findOneAndUpdate(
    { _id: req.user.id },
    {
      $pull: {
        productsInCart: {
          product: req.body.id,
        },
      },
    }
  );
  sendResponse(res, 200, `Product has been deleted`);
});

exports.searchProduct = catchAsync(async (req, res, next) => {
  const query = req.query.q;
  if (!req.query.q || !req.query.page)
    return next(createError(404, "The page your'e looking for does not exist"));
  if (+req.query.page <= 0 || !Number.isFinite(+req.query.page))
    return next(createError(404, "The page your'e looking for does not exist"));

  const numOfProducts = await product
    .find({
      $text: { $search: `"\"${query}\"" -2022`, $diacriticSensitive: true },
    })
    .count();
  const totalPages = Math.ceil(numOfProducts / ITEMS_PER_PAGE);
  const searchedProduct = await product
    .find({
      $text: { $search: `"\"${query}\"" -2022`, $diacriticSensitive: true },
    })
    .limit(ITEMS_PER_PAGE)
    .skip(+(req.query.page - 1) * ITEMS_PER_PAGE);

  if (searchedProduct.length <= 0)
    return next(
      createError(404, 'We could not find the requested product(s) ')
    );

  sendResponse(res, 200, 'success', { searchedProduct, totalPages });
});

exports.getProductsFromCart = catchAsync(async (req, res, next) => {
  const product = await user
    .findById(req.user.id)
    .populate('products.products')
    .select('products');
  sendResponse(res, 200, 'products from cart loaded', { product });
});

exports.getProductsFromCategory = catchAsync(async (req, res, next) => {
  console.log(req.query.id);
  if (!req.query.id || !req.query.page)
    return next(createError(400, 'something went wrong with the request'));
  if (req.query.page <= 0 || !Number.isFinite(+req.query.page))
    return next(createError(400, 'something went wrong with the request'));
  const numOfProducts = await products
    .find({
      'categories.id': +req.query.id,
    })
    .countDocuments();
  const totalPages = Math.ceil(numOfProducts / ITEMS_PER_PAGE);
  const foundProducts = await products
    .find({
      'categories.id': +req.query.id,
    })
    .limit(12)
    .skip(+(req.query.page - 1) * ITEMS_PER_PAGE);

  if (foundProducts.length === 0)
    return next(createError(404, "The page you're looking for does not exist"));
  sendResponse(res, 200, 'products fetched', { foundProducts, totalPages });
});
