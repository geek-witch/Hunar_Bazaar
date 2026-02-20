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
    console.error('✗ Email service configuration error:', error);
    console.error('Please check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
  } else {
    console.log(`Email configured: ${process.env.EMAIL_USER || 'EMAIL_USER not set'}`);
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

const sendContactEmail = async (contactData) => {
  const { name, email, phone, subject, message } = contactData;
  const recipientEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Hunar Bazaar Contact Form" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong style="color: #14b8a6;">Name:</strong> ${name}</p>
          <p style="margin: 8px 0;"><strong style="color: #14b8a6;">Email:</strong> <a href="mailto:${email}" style="color: #14b8a6;">${email}</a></p>
          ${phone ? `<p style="margin: 8px 0;"><strong style="color: #14b8a6;">Phone:</strong> ${phone}</p>` : ''}
          <p style="margin: 8px 0;"><strong style="color: #14b8a6;">Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #14b8a6; margin-top: 0;">Message:</h3>
          <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from the Hunar Bazaar contact form.<br>
            You can reply directly to this email to respond to ${name}.
          </p>
        </div>
      </div>
    `,
    text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}

Message:
${message}

---
This email was sent from the Hunar Bazaar contact form.
You can reply directly to this email to respond to ${name}.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
};

const sendSupportReplyEmail = async (userEmail, userName, issueCategory, issueDescription, adminReply) => {
  const mailOptions = {
    from: `"Hunar Bazaar Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Re: Your Support Request - ${issueCategory}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px;">
          Response to Your Support Request
        </h2>
        
        <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong style="color: #14b8a6;">Category:</strong> ${issueCategory}</p>
          <p style="margin: 8px 0;"><strong style="color: #14b8a6;">Your Original Message:</strong></p>
          <p style="margin: 8px 0; color: #374151; background-color: #ffffff; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${issueDescription}</p>
        </div>
        
        <div style="background-color: #ffffff; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #14b8a6; margin-top: 0;">Our Response:</h3>
          <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${adminReply}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px;">
            If you have any further questions, please reply to this email or submit a new support request.<br>
            © 2025 Hunar Bazaar. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
Response to Your Support Request

Category: ${issueCategory}

Your Original Message:
${issueDescription}

Our Response:
${adminReply}

---
If you have any further questions, please reply to this email or submit a new support request.
© 2025 Hunar Bazaar. All rights reserved.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending support reply email:', error);
    if (error.response) {
      console.error('Email service response:', error.response);
    }
    if (error.code) {
      console.error('Email error code:', error.code);
    }
    throw error;
  }
};

const sendWarningEmail = async (email, userName, warningMessage) => {
  const mailOptions = {
    from: `"Hunar Bazaar Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Account Warning - Hunar Bazaar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Warning</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been flagged for violating our community guidelines. We take the safety and respect of our community seriously.</p>
        
        <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Warning Details:</h3>
          <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${warningMessage}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Next Steps:</strong><br>
          Please review your activities and ensure you are following our community guidelines going forward. Repeated violations may result in account suspension or deletion.
        </p>
        
        <p style="color: #6b7280;">
          If you believe this warning was issued in error, please contact our support team.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px;">
            © 2025 Hunar Bazaar. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
Account Warning

Hello ${userName},

Your account has been flagged for violating our community guidelines.

Warning Details:
${warningMessage}

Next Steps:
Please review your activities and ensure you are following our community guidelines going forward. Repeated violations may result in account suspension or deletion.

If you believe this warning was issued in error, please contact our support team.

© 2025 Hunar Bazaar. All rights reserved.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending warning email:', error);
    throw error;
  }
};

const sendSessionNotification = async (email, studentName, teacherName, skill, date, time, action) => {
  const actionText = action === 'scheduled' ? 'scheduled' : 'cancelled';
  const subject = `Session ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} - Hunar Bazaar`;
  
  const mailOptions = {
    from: `"Hunar Bazaar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #14b8a6;">Session ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h2>
        <p>Hi ${studentName},</p>
        <p>Your learning session has been ${actionText}:</p>
        <div style="background-color: #f0fdfa; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #14b8a6; margin-top: 0;">Session Details</h3>
          <p><strong>Teacher:</strong> ${teacherName}</p>
          <p><strong>Skill:</strong> ${skill}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        ${action === 'scheduled' ? 
          '<p>Please be ready 5 minutes before the session starts. You will receive the meeting link closer to the session time.</p>' :
          '<p>If you have any questions, please contact your teacher or our support team.</p>'
        }
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">© 2025 Hunar Bazaar. All rights reserved.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending session ${action} email:`, error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendContactEmail,
  sendSupportReplyEmail,
  sendWarningEmail,
  sendSessionNotification
};

