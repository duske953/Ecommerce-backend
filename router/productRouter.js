const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const authController = require("../controller/authController");
const product = require("../model/productModel");
const Limiter = require("../utils/rateLimit");

router.use(Limiter(5 * 60 * 1000, 400));
router.route("/").get(productController.getProducts);
router.route("/:asin/:id").get(productController.getProduct);
router.route("/search").get(productController.searchProduct);
router
  .route("/getProductsFromCategory")
  .get(productController.getProductsFromCategory);

//protected
router.use(authController.protected);
router.use(Limiter(5 * 60 * 1000, 150));
router
  .route("/addToCart")
  .patch(authController.isActive, productController.addProductToCart);
router
  .route("/deleteProductFromCart")
  .patch(authController.isActive, productController.deleteProductFromCart);
router.route("/getProductsFromCart").get(productController.getProductsFromCart);

module.exports = router;
