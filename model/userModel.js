const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Cryptr = require('cryptr');
const createError = require('http-errors');
const date = require('date-and-time');
const sendEmail = require('../utils/sendEmail');
const randomToken = require('rand-token');
const { v4: uuidv4 } = require('uuid');
const cryptr = new Cryptr(process.env.CRYPT_SECRET);
const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: [true, 'Your name is required'],
    trim: true,
  },
  Email: {
    type: String,
    required: [true, 'Your email address is required'],
    unique: [true, 'A user with this email already exists'],
    trim: true,
    lowercase: true,
    validate: {
      validator(v) {
        return validator.isEmail(v);
      },
      message: (props) =>
        `The email given,${props.value} is not a valid email address`,
    },
  },

  Password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'your password must be at lease 8 characters long'],
    trim: true,
    select: false,
  },

  PasswordConfirm: {
    type: String,
    required: [true, 'plese confirm your password'],
    trim: true,
    validate: {
      validator(v) {
        return v === this.Password;
      },
      message: (props) => 'The passwords given do not match',
    },
  },
  createdAt: {
    type: Date,
    select: false,
    default: new Date(),
  },

  active: {
    type: Boolean,
    default: false,
    select: false,
  },

  EmailConfirmToken: {
    type: String,
    select: false,
  },

  userPaid: {
    type: Boolean,
    default: false,
    select: false,
  },

  productsInCart: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
      },
      productPaid: {
        type: Boolean,
      },
      quantity: {
        type: Number,
      },
      productDiscount: {
        type: Number,
      },
    },
  ],

  EmailTokenExpiresDate: {
    type: Date,
    select: false,
    default: new Date(),
  },

  isReusedPassword: {
    type: Boolean,
    default: false,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordResetExpiresDate: {
    type: Date,
    select: false,
    default: new Date(),
  },
});

function returnHtml(msg) {
  const htmlBody = `<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap" rel="stylesheet">
  <body style = "color:#333; font-size:20px; font-family:'Rubik',sans-serif; line-height:1.4; font-weight:500">
  <p>${msg}</p>
  </body>
  </head>`;

  return htmlBody;
}

userSchema.pre('save', async function (next) {
  if (!this.isDirectModified('Password')) return next();
  console.log(this.isReusedPassword);
  if (this.isReusedPassword) {
    console.log('ken');
    this.Password = undefined;
    return next();
  }
  this.Password = await bcrypt.hash(this.Password, 12);
  this.PasswordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.$isNew && this.isDirectModified('Email')) {
    this.active = false;
  }
  next();
});

userSchema.method('verifyPassword', async function (password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
});

const user = new mongoose.model('user', userSchema);

module.exports = user;
