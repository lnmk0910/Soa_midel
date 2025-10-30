const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"iBanking" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#b30000;">iBanking OTP</h2>
        <p>Hello,</p>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:5px; color:#b30000;">${otp}</h1>
        <p>This otp will be expired in  <b>5 minutes</b>.</p>
        <p>Please do not share this otp to anyone</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${to}`);
  } catch (err) {
    console.error('Error sending OTP :', err);
    throw err;
  }
}


async function sendInvoiceEmail(to, payment, tuition, customer) {
  const mailOptions = {
    from: `"iBanking" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Payment Receipt - ${payment._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px; background-color:#f9f9f9; border-radius:8px;">
        <h2 style="color:#007b00;">✅ Payment Successful</h2>
        <p>Dear <b>${customer.full_name}</b>,</p>
        <p>Thank you for your payment. Here is your receipt:</p>

        <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
          <tr>
            <td style="padding:8px; border:1px solid #ccc;">Student Name</td>
            <td style="padding:8px; border:1px solid #ccc;">${tuition.student_name}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ccc;">Student ID</td>
            <td style="padding:8px; border:1px solid #ccc;">${tuition.student_id}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ccc;">Amount</td>
            <td style="padding:8px; border:1px solid #ccc; color:#007b00;">${payment.amount.toLocaleString()} VND</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ccc;">Payment Date</td>
            <td style="padding:8px; border:1px solid #ccc;">${new Date(payment.payment_date).toLocaleString()}</td>
          </tr>
        </table>

        <p style="color: gray; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice sent to ${to}`);
  } catch (err) {
    console.error('Error sending invoice email:', err);
  }
}

module.exports = { sendOtpEmail, sendInvoiceEmail };
