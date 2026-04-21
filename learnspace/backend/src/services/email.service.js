// ============================================================
// LearnSpace - Email Service (Nodemailer)
// ============================================================
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const emailTemplates = {
  welcome: (data) => ({
    subject: 'Welcome to LearnSpace!',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563eb;padding:30px;text-align:center;">
        <h1 style="color:white;margin:0;">LearnSpace</h1>
      </div>
      <div style="padding:30px;">
        <h2>Welcome, ${data.name}!</h2>
        <p>Your account has been created successfully.</p>
        <a href="${process.env.CLIENT_URL}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Start Learning</a>
      </div>
    </div>`
  }),
  'reset-password': (data) => ({
    subject: 'Reset Your LearnSpace Password',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>Password Reset Request</h2>
      <p>Hi ${data.name}, click below to reset your password. Expires in ${data.expiresIn}.</p>
      <a href="${data.resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p style="color:#999;margin-top:20px;font-size:12px;">If you didn't request this, ignore this email.</p>
    </div>`
  }),
  'enrollment-confirmation': (data) => ({
    subject: `Enrollment Confirmed: ${data.courseName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>You're enrolled!</h2>
      <p>Hi ${data.name}, you have successfully enrolled in <strong>${data.courseName}</strong>.</p>
      <p>Amount paid: <strong>৳${data.amount}</strong></p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Go to My Courses</a>
    </div>`
  }),
  'instructor-approved': (data) => ({
    subject: 'Your Instructor Application is Approved!',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>Congratulations, ${data.name}! 🎉</h2>
      <p>Your instructor application has been approved. You can now create and publish courses.</p>
      <a href="${process.env.CLIENT_URL}/instructor/dashboard" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Go to Dashboard</a>
    </div>`
  }),
  'instructor-rejected': (data) => ({
    subject: 'Instructor Application Update',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>Hi ${data.name},</h2>
      <p>Unfortunately your instructor application was not approved.</p>
      <p><strong>Reason:</strong> ${data.reason || 'Does not meet current requirements.'}</p>
    </div>`
  }),
  'course-approved': (data) => ({
    subject: `Course Published: ${data.courseName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>Your course is live now!</h2>
      <p>Hi ${data.name}, <strong>${data.courseName}</strong> has been approved and is now visible to students.</p>
    </div>`
  }),
  'course-rejected': (data) => ({
    subject: `Course Review Update: ${data.courseName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <h2>Hi ${data.name},</h2>
      <p>Your course <strong>${data.courseName}</strong> was not approved.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
    </div>`
  }),
  'password-changed': (data) => ({
    subject: 'Password Changed Successfully',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
      <p>Hi ${data.name}, your LearnSpace password has been changed successfully.</p>
      <p>If you didn't do this, contact support immediately.</p>
    </div>`
  })
};

const sendEmail = async ({ to, subject, template, html, data }) => {
  try {
    // In development, just log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log(`[Email skipped in dev] To: ${to} | Subject: ${subject || emailTemplates[template]?.(data)?.subject}`);
      return { messageId: 'dev-mode' };
    }

    let mailOptions = {
      from: `"LearnSpace" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: subject || emailTemplates[template]?.(data)?.subject
    };

    if (template && emailTemplates[template]) {
      mailOptions.html = emailTemplates[template](data).html;
    } else if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    // Don't crash the app if email fails
    console.error('Email send error:', error.message);
    return null;
  }
};

module.exports = { sendEmail };
