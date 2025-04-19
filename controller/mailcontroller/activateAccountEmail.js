const catchAsync = require('../../utils/catchAsync');
const Cryptr = require('cryptr');
const date = require('date-and-time');
const randomToken = require('rand-token');
const users = require('../../model/userModel');
const sendMail = require('../../utils/sendEmail');
const DOMAIN =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
const cryptr = new Cryptr(process.env.CRYPT_SECRET);
exports.sendActivateAccountEmail = catchAsync(async (req, res, next) => {
  const user = await users.findById(req.user._id);
  const token = randomToken.generate(100);
  user.EmailConfirmToken = token;
  user.EmailTokenExpiresDate = date.addMinutes(new Date(), 10);
  const encryptedToken = cryptr.encrypt(token);
  await user.save({ validateBeforeSave: false });
  await sendMail(
    req.user.Email,
    'Activate your account',
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Activate Your Account</title>
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
      background-color: #28a745;
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
          <h1 style="margin: 0; font-size: 24px;">Activate Your Account</h1>
        </td>
      </tr>
      <tr>
        <td class="inner">
          <p>Hello <strong>${req.user.Name}</strong>,</p>
          <p>Thanks for signing up. Please activate your account by clicking the button below:</p>

          <p style="text-align: center;">
            <a href="${DOMAIN}/activate/?token=${encryptedToken}" class="button">Activate Account</a>
          </p>

          <p>If the button doesn’t work, copy and paste the link into your browser:</p>
          <p style="word-break: break-all;"><a href="${DOMAIN}/activate/?token=${encryptedToken}">${DOMAIN}/activate/?token=${token}</a></p>

          <p>If you didn’t create an account, you can safely ignore this email.</p>

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
</html>
`
  );
  res.status(200).json({
    msg: 'An email containing how to activate your account was just sent',
  });
});
