const catchAsync = require("./catchAsync");
const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
  try {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      connectionTimeout: +process.env.TIMED_OUT,
      socketTimeout: +process.env.TIMED_OUT,
      service: process.env.EMAIL_SERVICE,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    throw err;
  }
}

module.exports = sendEmail;
