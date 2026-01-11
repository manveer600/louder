/**
 * Email Sender Service
 * Handles sending transactional emails using nodemailer
 */

const nodemailer = require('nodemailer');
const { NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME } = require('../config/env');
const logger = require('../utils/logger');

// Email configuration from environment variables
const emailConfig = {
  host: SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(SMTP_PORT) || 587,
  secure: SMTP_SECURE || false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER || '',
    pass: SMTP_PASS || ''
  },
  from: EMAIL_FROM || 'Louder <noreply@louder.com>',
  fromName: EMAIL_FROM_NAME || 'Louder'
};

// Create transporter
let transporter = null;

// Initialize email transporter
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if SMTP credentials are provided
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    if (NODE_ENV === 'development') {
      logger.warn('⚠️  No SMTP credentials found. Email sending is disabled.');
      logger.warn('📧 To enable email sending, add SMTP credentials to backend/.env');
      logger.warn('   See EMAIL_SETUP.md for instructions');
    }
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth.user ? {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass
      } : undefined
    });

    logger.info('Email transporter initialized');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
    return null;
  }
}

/**
 * Send email
 */
async function sendEmail({ to, subject, html, text }) {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    const errorMsg = 'Email service not configured. Add SMTP credentials to backend/.env (see EMAIL_SETUP.md)';
    logger.warn(`⚠️  ${errorMsg}`);
    logger.warn(`Would send to ${to}: ${subject}`);
    return { 
      success: false, 
      message: errorMsg,
      configured: false
    };
  }

  try {
    // Verify SMTP connection first
    await mailTransporter.verify();
    logger.info('SMTP connection verified');

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.auth.user}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    logger.info(`Sending email to ${to}...`);
    const info = await mailTransporter.sendMail(mailOptions);
    logger.info(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    logger.error(`Error details: ${error.message}`);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS in .env';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT';
    }
    
    return {
      success: false,
      error: errorMessage,
      code: error.code
    };
  }
}

/**
 * Send confirmation email for event interest
 */
async function sendConfirmationEmail(email, event) {
  const eventDate = new Date(event.date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `Thank you for your interest in ${event.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">LOUDER</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Live Events & Ticketing</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #0ea5e9; margin-top: 0;">Thank You for Registering!</h2>
        
        <p>Hi there,</p>
        
        <p>Thank you for registering your email with <strong>Louder</strong>. We're excited that you're interested in live events!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Event Details</h3>
          <p style="margin: 10px 0;"><strong>Event:</strong> ${event.title}</p>
          <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${eventDate}</p>
          <p style="margin: 10px 0;"><strong>Venue:</strong> ${event.venue || 'Sydney, Australia'}</p>
          ${event.category ? `<p style="margin: 10px 0;"><strong>Category:</strong> ${event.category}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${event.originalEventUrl}" 
             style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Get Your Tickets Now
          </a>
        </div>
        
        <p>You can click the button above to visit the event page and purchase your tickets directly.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
          We'll keep you updated with new events and recommendations based on your interests. 
          If you no longer wish to receive these emails, you can unsubscribe at any time.
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px; margin-bottom: 0;">
          This email was sent to ${email} because you showed interest in this event on Louder.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Louder. All rights reserved.</p>
        <p>Sydney, Australia</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Thank You for Registering!

Hi there,

Thank you for registering your email with Louder. We're excited that you're interested in live events!

Event Details:
- Event: ${event.title}
- Date & Time: ${eventDate}
- Venue: ${event.venue || 'Sydney, Australia'}
${event.category ? `- Category: ${event.category}` : ''}

Get Your Tickets: ${event.originalEventUrl}

We'll keep you updated with new events and recommendations based on your interests.

---
© ${new Date().getFullYear()} Louder. All rights reserved.
This email was sent to ${email}
  `;

  return await sendEmail({
    to: email,
    subject: subject,
    html: html,
    text: text
  });
}

module.exports = {
  sendEmail,
  sendConfirmationEmail,
  getTransporter
};
