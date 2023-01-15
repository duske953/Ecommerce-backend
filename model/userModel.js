const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const Cryptr = require("cryptr");
const createError = require("http-errors");
const date = require("date-and-time");
const sendEmail = require("../utils/sendEmail");
const randomToken = require("rand-token");
const { v4: uuidv4 } = require("uuid");
const cryptr = new Cryptr(process.env.CRYPT_SECRET);
const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: [true, "Your name is required"],
    trim: true,
  },
  Email: {
    type: String,
    required: [true, "Your email address is required"],
    unique: [true, "A user with your email already exists"],
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

  Img: {
    type: String,
    default: `${process.env.RELATIVE_URL_BACKEND}/uploads/${uuidv4()}/user.png`,
  },

  Password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [8, "your password must be at lease 8 characters long"],
    trim: true,
    select: false,
  },

  PasswordConfirm: {
    type: String,
    required: [true, "plese confirm your password"],
    trim: true,
    validate: {
      validator(v) {
        return v === this.Password;
      },
      message: (props) => "The passwords given do not match",
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

  products: [
    {
      products: {
        type: mongoose.Schema.ObjectId,
        ref: "product",
      },
      productPaid: {
        type: Boolean,
      },
    },
  ],

  EmailTokenExpires: {
    type: Date,
    select: false,
    default: new Date(),
  },

  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordExpiresDate: {
    type: Date,
    select: false,
    default: new Date(),
  },

  //   products: [
  //     {
  //       type: mongoose.Schema.ObjectId,
  //       ref: "product",
  //     },
  //   ],
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

userSchema.pre("save", async function (next) {
  if (!this.isDirectModified("Password")) return next();
  this.Password = await bcrypt.hash(this.Password, 12);
  this.PasswordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.$isNew && this.isDirectModified("Email")) {
    this.active = false;
  }
  next();
});

userSchema.method("verifyPassword", async function (password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
});

userSchema.method("confirmAccount", async function () {
  try {
    this.EmailConfirmToken = randomToken.generate(100);
    const token = cryptr.encrypt(this.EmailConfirmToken);
    this.EmailTokenExpires = date.addMinutes(new Date(), 10);
    await sendEmail(
      this.Email,
      "OEK needs you to verify your email address",
      returnHtml(
        `Dear ${this.Name}, <br> <br>  Thank you for signing up for our ecommerce website! We are excited to have you as a new member. <br> <br> To complete your registration, please confirm your email address by clicking on the link below: <br> <br>
        <a style ="color:#333; text-decoration:none;font-size:18px; display:inline-block; border-radius:9px; color:#fff; padding:0.9rem 1.4rem; background-color:#1c7ed6" href="https://tech-freak.vercel.app/users/activate/${token}">Confirm Account</a> 
        <br> <br>  Note that this link is valid for only 10minutes. <br> <br>Once you have confirmed your email, you will be able to access all of the features of our website and start shopping! <br> <br>  If you didn't initiate this request, <br> kindly disregard this email. <br> <br> Regards, <br> <br> OEK`
      )
    );
  } catch (err) {
    if (err.errno === -3008)
      throw createError(400, "Something went wrong with this request");
    throw err;
  }
});

userSchema.method("forgotPassword", async function () {
  const now = new Date();
  this.passwordResetToken = randomToken.generate(100);
  const token = cryptr.encrypt(this.passwordResetToken);
  this.passwordExpiresDate = date.addMinutes(now, 10);
  await sendEmail(
    this.Email,
    "Reset your password",
    returnHtml(
      `Dear ${
        this.Name
      }, <br> <br>  We have received a request to reset your password for your account. If you did not request a password reset, please ignore this email. <br> <br> To reset your password, please click on the link below: <br> <br> <a style ="color:#333; text-decoration:none;font-size:18px; display:inline-block; border-radius:9px; color:#fff; padding:0.9rem 1.4rem; background-color:#1c7ed6" 
      href="https://tech-freak.vercel.app/users/reset-password/${token}?id=${cryptr.encrypt(
        this.Email
      )}">Reset Password</a> <br><br> If the link above does not work, you can also copy and paste the URL into your browser. <br> <br> Note that this link is valid for 10minutes. <br> <br> After the time limit has expired, you will have to resubmit the request for a password reset <br><br> Regards, <br> <br> OEK.`
    )
  );
});

const user = new mongoose.model("user", userSchema);

module.exports = user;
