const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

const sendOTPEmail = async (email, otpCode) => {
  const mailOptions = {
    from: `"Hunar Bazaar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Account - Hunar Bazaar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #14b8a6;">Welcome to Hunar Bazaar!</h2>
        <p>Thank you for signing up. Please verify your account using the OTP below:</p>
        <div style="background-color: #f0fdfa; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #14b8a6; font-size: 32px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">© 2025 Hunar Bazaar. All rights reserved.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/#/reset-password?token=${resetToken}`;

  const mailOptions = {
    to: email,
    subject: 'Reset Your Password - Hunar Bazaar',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetLink}" style="background-color: #124b55ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>Or copy this link: ${resetLink}</p>
      <p><strong>This link expires in 1 hour.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};

