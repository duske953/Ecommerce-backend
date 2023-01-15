const catchAsync = require("../utils/catchAsync");
const products = require("../model/productModel");
const date = require("date-and-time");
const users = require("../model/userModel");
const { v4: uuidv4 } = require("uuid");
const sendMail = require("../utils/sendEmail");

const month = ["Jan", "Feb"];
exports.sendEMail = catchAsync(async (req, res, next) => {
  const foundProduct = await users
    .findOne(
      { products: { $elemMatch: { _id: req.body.id } }, _id: req.user._id },
      { "products.$": 1 }
    )
    .populate("products.products");
  const product = foundProduct.products[0].products;
  await sendMail(
    req.user.Email,
    `Order for ${product.title}`,
    ` <head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap" rel="stylesheet">
  <body style = "color:#333; font-size:20px; font-family:'Rubik',sans-serif; line-height:1.4; font-weight:500">
  <p> Dear ${
    req.user.Name
  }, <br> <br>Thank you for your purchase on our plaftform! We have received your order and it is now being processed.
 <br> <br> Order Details: <br> <br> Order Number: ${uuidv4()
   .toString()
   .replace("-", "")} <br> <br> Order Date: ${date.format(
      new Date(),
      "ddd, MMM DD YYYY"
    )} <br> <br> Order Total $${
      product.price.value || product.price.name.slice(1)
    } <br <br> <br> <br>  <img style = "height:150px; width:150px; object-fit:scale-down" src = ${
      product.image
    } alt=${
      product.title
    } /> <br> <br> <br>  You will receive an email from us once your package has been shipped <br> <br> Thank you again for choosing us for your purschase. <br> <br> Best regards, <br> <br> OEK</p>
  </body>
  </head>`
  );
  if (req.body.info && req.body.info === "payment-success") return next();
  res.status(200).json({
    msg: "Email sent successfully",
  });
});
