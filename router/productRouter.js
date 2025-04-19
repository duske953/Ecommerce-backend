const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const authController = require('../controller/authController');
const product = require('../model/productModel');
const Limiter = require('../utils/rateLimit');

router.use(Limiter(5 * 60 * 1000, 400));
router.route('/fetchOnSaleProducts').get(productController.fetchOnSaleProducts);
router.route('/fetchProducts').get(productController.fetchProducts);
router.route('/fetchProduct/:asin/').get(productController.fetchProduct);
router.route('/search').get(productController.searchProduct);
router
  .route('/getProductsFromCategory')
  .get(productController.getProductsFromCategory);

//protected
router.use(authController.protected);
router.use(Limiter(5 * 60 * 1000, 150));
router
  .route('/addProductToCart')
  .post(authController.isActive, productController.addProductToCart);
router
  .route('/deleteProductFromCart')
  .post(authController.isActive, productController.deleteProductFromCart);
router.route('/getProductsFromCart').get(productController.getProductsFromCart);

module.exports = router;
