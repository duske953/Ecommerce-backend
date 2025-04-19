const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const userController = require('../controller/userController');
const productController = require('../controller/productController');
const processStripe = require('../utils/stripePayment');
const mailController = require('../controller/mailcontroller/checkOutSuccessEmail');
const Limiter = require('../utils/rateLimit');
const {
  sendForgotPasswordEmail,
} = require('../controller/mailcontroller/fogotPasswordEmail');
const {
  sendActivateAccountEmail,
} = require('../controller/mailcontroller/activateAccountEmail');

router.use(Limiter(5 * 60 * 1000, 300));
router.route('/signup').post(authController.signup);
router.route('/activate').get(authController.activateAccount);
router
  .route('/forgot-password')
  .post(authController.forgotPassword, sendForgotPasswordEmail);

router
  .route('/valid-reset-password-token')
  .get(authController.checkValidPasswordResetToken);
router.route('/reset-password').post(authController.resetPassword);
router
  .route('/login')
  .post(authController.checkUserCredentials, authController.login);

//protected routes
router.use(authController.protected);
router.route('/isLoggedIn').get(authController.isLoggedIn);
router.use(Limiter(5 * 60 * 1000, 100));
router.route('/send-activate-account-email').post(sendActivateAccountEmail);
router.route('/logout').post(authController.logout);
router.route('/update-password').post(authController.updatePassword);
router.route('/update-account-info').post(userController.updateMe);
router.route('/process-checkout').get(authController.isActive, processStripe);
router
  .route('/delete-account')
  .delete(authController.checkUserCredentials, authController.deleteAccount);
// router
//   .route('/sendMail')
//   .post(authController.isActive, utiltyController.sendEMail);

router
  .route('/productPaid')
  .post(authController.isActive, userController.userPaidForItem);
// router

router
  .route('/checkout-success')
  .post(
    authController.isActive,
    mailController.sendSuccessCheckoutEmail,
    productController.deleteProductsFromCart
  );

module.exports = router;
