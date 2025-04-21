const catchAsync = require('../../utils/catchAsync');
const products = require('../../model/productModel');
const date = require('date-and-time');
const users = require('../../model/userModel');
const { v4: uuidv4 } = require('uuid');
const sendMail = require('../../utils/sendEmail');

exports.sendSuccessCheckoutEmail = catchAsync(async (req, res, next) => {
  const now = new Date();
  const user = await users
    .findById(req.user.id)
    .populate('productsInCart.product');

  const totalPrice = user.productsInCart?.reduce((acc, product) => {
    let price = 0;
    if (product.quantity >= 5) {
      price += acc + product.productDiscount;
    }
    if (product.quantity < 5) {
      price += acc + +product.product.price;
    }
    return price;
  }, 0);

  await sendMail(
    req.user.Email,
    `Order for ${user.Name}`,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    table {
      border-spacing: 0;
      width: 100%;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f4;
      padding: 20px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 6px;
      overflow: hidden;
    }
    .inner {
      padding: 20px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      color: #333333;
      line-height: 1.5;
    }
    .footer {
      font-size: 12px;
      color: #777777;
      text-align: center;
      padding: 20px;
    }
    @media screen and (max-width: 600px) {
      .inner {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #222; color: #ffffff; text-align: center; padding: 20px;">
          <h1 style="margin: 0; font-size: 24px;">Your Order is Confirmed</h1>
        </td>
      </tr>
      <tr>
        <td class="inner">
          <p>Hello <strong>${user.Name}</strong>,</p>
          <p>Thank you for shopping with us. Your order has been successfully placed.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td style="text-align: right;">$${totalPrice}</td>
            </tr>
            <tr>
              <td><strong>Expected Delivery:</strong></td>
              <td style="text-align: right;">${date.format(
                date.addDays(now, 14),
                'ddd, MMM DD YYYY'
              )}</td>
            </tr>
          </table>

          <p style="margin-top: 20px;">
            We'll send you another email when your order is on its way. You can always check your order status in your account.
          </p>

          <p>Thanks again,<br>The Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; ${new Date().getFullYear()} ByteCart. All rights reserved.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`
  );
  return next();
});
