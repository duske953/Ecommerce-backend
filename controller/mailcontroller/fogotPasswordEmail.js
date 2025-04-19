const catchAsync = require('../../utils/catchAsync');
const users = require('../../model/userModel');
const sendEmail = require('../../utils/sendEmail');
const DOMAIN =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
exports.sendForgotPasswordEmail = catchAsync(async (req, res, next) => {
  const now = new Date();
  const user = await users.findOne({ Email: req.user.Email });
  await sendEmail(
    user.Email,
    `Reset your password`,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
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
    .button {
      display: inline-block;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 20px;
      margin: 20px 0;
      border-radius: 4px;
      font-weight: bold;
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
          <h1 style="margin: 0; font-size: 24px;">Reset Your Password</h1>
        </td>
      </tr>
      <tr>
        <td class="inner">
          <p>Hello <strong>${user.Name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>

          <p style="text-align: center;">
            <a href="${DOMAIN}/reset-password/?token=${req.token}" class="button">Reset Password</a>
          </p>

          <p>If you didn’t request this, you can ignore this message. This link will expire in 1 hour.</p>

          <p>If the button doesn’t work, copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">
          <a href="${DOMAIN}/reset-password/?token=${req.token}">
          ${DOMAIN}/reset-password/?token=${req.token}</a></p>

          <p>Thanks,<br>The Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; {{YEAR}} Your Store Name. All rights reserved.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
  );
  res.status(200).json({
    message: 'An email containing how to reset your password was just sent',
  });
});
