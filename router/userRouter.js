const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const userController = require('../controller/userController');
const productController = require('../controller/productController');
const processStripe = require('../utils/stripePayment');
const utiltyController = require('../controller/utilityController');
const Limiter = require('../utils/rateLimit');

router.use(Limiter(5 * 60 * 1000, 300));
router.route('/signup').post(authController.signup);
router.route('/activate/:confirmToken').patch(authController.activateAccount);
router.route('/forgotPassword').post(authController.forgotPassword);
router
  .route('/resetPassword')
  .post(authController.checkValidPasswordResetToken)
  .patch(authController.resetPassword);
router
  .route('/login')
  .post(authController.checkUserCredentials, authController.login);

//protected routes
router.use(authController.protected);
router.route('/isLoggedIn').get(authController.isLoggedIn);
router.use(Limiter(5 * 60 * 1000, 150));
router.route('/confirm').post(authController.sendConfimationEmail);
router.route('/logout').post(authController.logout);
router.route('/updatePassword').patch(authController.updatePassword);
router.route('/updateMe').patch(userController.updateMe);
router.route('/process-checkout').post(authController.isActive, processStripe);
router
  .route('/deleteAccount')
  .delete(authController.checkUserCredentials, authController.deleteAccount);
router
  .route('/sendMail')
  .post(authController.isActive, utiltyController.sendEMail);

router
  .route('/productPaid')
  .post(authController.isActive, userController.userPaidForItem);
// router

router
  .route('/checkIfUserPaidForItem')
  .patch(
    authController.isActive,
    userController.checkIfUserHasPaidForItem,
    utiltyController.sendEMail,
    productController.deleteProductFromCart
  );
//   .route("/uploadImg")
//   .post(userController.upload.single("profileImg"), userController.uploadImg);

module.exports = router;
