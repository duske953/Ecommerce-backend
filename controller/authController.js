const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');
const { promisify } = require('util');
const cryptr = new Cryptr(process.env.CRYPT_SECRET);
const Cookies = require('cookies');
const users = require('../model/userModel');
const createError = require('http-errors');
const user = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const keys = [process.env.JWT_SECRET];

async function signJwt(id) {
  const token = await jwt.sign({ data: id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return token;
}
//SENDING COOKIES
function sendCookie(req, res, token) {
  const cookies = new Cookies(req, res, {
    keys,
  });
  return cookies.set('jwt', token, {
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
    secure: process.env.NODE_ENV === 'development' ? false : true,
    path: '/',
    httpOnly: true,
  });
}
//SENDING RESPONSES
function sendResponse(...params) {
  const [res, code, user, token, msg] = params;
  return res.status(code).json({
    message: msg,
    data: {
      user,
      token,
    },
  });
}
//SIGNING UP USERS
exports.signup = catchAsync(async (req, res, next) => {
  const userDetails = {
    Email: req.body.Email,
    Name: req.body.Name,
    Password: req.body.Password,
    PasswordConfirm: req.body.PasswordConfirm,
  };
  const user = await users.create(userDetails);
  const token = await signJwt(user._id);
  sendCookie(req, res, token);
  await user.save({ validateBeforeSave: false });
  sendResponse(res, 201, user, token, 'Account created.');
});

//CHECKING IS USER'S ACCOUNT IS ACTIVE
exports.isActive = catchAsync(async (req, res, next) => {
  const user = await users.findById(req.user.id).select('+active');
  if (user.active === true) return next();
  return next(
    createError(400, 'Your account must be active to perform this action')
  );
});

// ACTIVATING USER'S ACCOUNT
exports.activateAccount = catchAsync(async (req, res, next) => {
  if (!req.params.confirmToken)
    return next(
      createError(404, "The page you're looking for does not exists")
    );
  const user = await users.findOne({
    EmailConfirmToken: cryptr.decrypt(req.params.confirmToken),
    EmailTokenExpires: { $gte: new Date() },
  });
  if (!user)
    return next(
      createError(404, "The page your're looking for no longer existes")
    );
  const token = await signJwt(user._id);
  user.active = true;
  user.EmailConfirmToken = undefined;
  user.EmailTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  sendCookie(req, res, token);
  sendResponse(res, 200, user, token, 'Your account is now active.');
});

//SENDING CONFIRMATION EMAIL TO USER TO CONFIRM EMAIL ADDRESS
exports.sendConfimationEmail = catchAsync(async (req, res, next) => {
  const user = await users.findById(req.user.id).select('+active');
  if (user.active === true)
    return res.status(200).json({ message: 'Your account is already active' });
  await user.confirmAccount();
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    message: `We just sent a confirmation email to ${req.user.Email} Please check your email.`,
  });
});

exports.checkUserCredentials = catchAsync(async (req, res, next) => {
  const { Email, Password } = req.body;
  if (!Email || !Password)
    return next(
      createError(400, 'Please enter your email or password to proceed')
    );

  const user = await users.findOne({ Email }).select('+Password');
  if (!user || !(await user.verifyPassword(Password, user.Password)))
    return next(createError(401, 'Invalid credentials please try again'));
  req.validUser = user;
  next();
});

//LOGGING IN USERS
exports.login = catchAsync(async (req, res, next) => {
  const token = await signJwt(req.validUser._id);
  sendCookie(req, res, token);
  sendResponse(res, 200, req.validUser, token, 'Logged in');
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  const user = await users.findById(req.user.id).select('+active');
  sendResponse(res, 200, user, null, 'User is logged in');
});

//CHECKING IF USER IS AUTHENTICATED IE LOGGED IN
exports.protected = catchAsync(async (req, res, next) => {
  if (!req.cookies.jwt)
    return next(createError(401, 'You are not allowed to perform this action'));
  const decoded = await promisify(jwt.verify)(
    req.cookies.jwt,
    process.env.JWT_SECRET
  );
  const user = await users.findById(decoded.data);
  if (!user)
    return next(createError(401, 'You are not allowed to perform this action'));
  req.user = user;
  next();
});

//LOGGING USERS OUT
exports.logout = catchAsync(async (req, res, next) => {
  if (req.user) {
    res.clearCookie('jwt', { sameSite: 'none', secure: true, path: '/' });
    sendResponse(res, 200, null, null, 'Logged out');
  }
});

//UPDATING PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, passwordConfirm } = req.body;
  if (!oldPassword || !newPassword || !passwordConfirm)
    return next(createError(400, 'Please fill all fields to proceed'));
  const user = await users.findById(req.user.id).select('+Password');
  if (!(await user.verifyPassword(oldPassword, user.Password)))
    return next(createError(400, 'Old password is incorrect'));

  if (await user.verifyPassword(newPassword, user.Password))
    return next(
      createError(400, "Old password can't be the same as the new password")
    );
  user.Password = newPassword;
  user.PasswordConfirm = passwordConfirm;
  res.clearCookie('jwt');
  const token = await signJwt(user._id);
  sendCookie(req, res, token);
  await user.save();
  sendResponse(res, 200, user, token, 'Your password has been updated');
});

exports.deleteAccount = catchAsync(async (req, res, next) => {
  if (!req.validUser._id.equals(req.user._id))
    return next(createError(400, 'Invalid credentials please try again'));
  if (req.body.status === 'pendingDelete')
    return res.status(200).json({
      msg: 'ok',
    });
  await users.findByIdAndDelete(req.user._id);
  res.clearCookie('jwt');
  sendResponse(res, 200, null, null, 'Logged out');
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { Email } = req.body;
  if (!Email)
    return next(createError(400, 'Please fill in your email address'));

  const foundUser = await users.findOne({ Email });

  if (!foundUser)
    return next(
      createError(
        400,
        'We could not find a user with the assosciated email address'
      )
    );
  await foundUser.forgotPassword();
  await foundUser.save({ validateBeforeSave: false });
  res.status(200).json({
    message:
      'An email containing details on how to reset your password was just sent',
  });
});

exports.checkValidPasswordResetToken = catchAsync(async (req, res, next) => {
  const { Token, id } = req.body;

  if (!Token || !id)
    return next(createError(404, "The page you're looking for does not exist"));
  const user = await users
    .findOne({
      Email: cryptr.decrypt(id),
      passwordResetToken: cryptr.decrypt(Token),
      passwordExpiresDate: { $gte: new Date() },
    })
    .select('passwordResetToken passwordExpiresDate');

  if (!user)
    return next(createError(404, "The page you're looking for does not exist"));

  await user.save({ validateBeforeSave: false });
  return res.status(200).json({ message: 'Token confirmed' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword, id } = req.body;

  if (!password || !confirmPassword)
    return next(createError(400, 'Please fill in all fields'));

  const user = await users.findOne({
    Email: cryptr.decrypt(id),
  });

  user.Password = password;
  user.PasswordConfirm = confirmPassword;
  user.passwordExpiresDate = undefined;
  user.passwordResetToken = undefined;
  const token = await signJwt(user._id);
  sendCookie(req, res, token);
  await user.save();
  return res.status(200).json({ message: 'Your password has been reset' });
});
