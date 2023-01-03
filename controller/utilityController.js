const catchAsync = require("../utils/catchAsync");
const products = require("../model/productModel");
const sendMail = require("../utils/sendEmail");
exports.sendEMail = catchAsync(async (req, res, next) => {
  const product = await products.findById(req.body.id);
  console.log(product);
  await sendMail(
    req.user.Email,
    `Order for ${product.title}`,
    ` <head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap" rel="stylesheet">
  <body style = "color:#333; font-size:20px; font-family:'Rubik',sans-serif; line-height:1.4; font-weight:500">
  <p>Thank you for placing an order on OEK. <br>  We're glad to inform you that we've received your order <br> <br> and we will process it very soon. <br> Thank you again for choosing OEK for your purschase. <br> <br> Best regards, <br> <br> OEK</p>
  </body>
  </head>`
  );

  res.status(200).json({
    msg: "Email sent successfully",
  });
});
