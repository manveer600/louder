# Email Configuration Guide

## Overview

The application sends confirmation emails to users when they register their email for an event. This guide explains how to configure email sending.

## Email Service Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Step Verification** on your Google account
   - Go to: https://myaccount.google.com/security

2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Louder" as the name
   - Copy the generated 16-character password

3. **Configure in `.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM=noreply@louder.com
   EMAIL_FROM_NAME=Louder
   ```

### Option 2: Other SMTP Services

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@louder.com
EMAIL_FROM_NAME=Louder
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Louder
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Louder
```

## Testing Email Configuration

### Method 1: Test via API

```bash
# Trigger an email by registering for an event via the frontend
# Or use the API directly:
curl -X POST http://localhost:5000/api/v1/users/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "eventId": "YOUR_EVENT_ID",
    "consentGiven": true
  }'
```

### Method 2: Check Logs

After submitting an email, check your backend logs:

**Success:**
```
Email saved for event: ...
Confirmation email sent to: ...
```

**Failure:**
```
Failed to send confirmation email: ...
```

## Development Mode

If SMTP credentials are not configured, the application will:
- ✅ Still save emails to the database
- ✅ Still redirect users to event pages
- ⚠️ Log a warning that emails are disabled
- ❌ Not send confirmation emails

This allows you to develop without email configuration, but emails won't be sent.

## Production Considerations

1. **Use a professional email service** (SendGrid, Mailgun, AWS SES)
2. **Set up SPF/DKIM** records for your domain
3. **Monitor email delivery rates**
4. **Set up bounce handling**
5. **Comply with email regulations** (CAN-SPAM, GDPR)

## Email Template

The confirmation email includes:
- Event name
- Event date and time
- Venue information
- Direct link to purchase tickets
- Professional branding

The template is in: `backend/services/emailSender.service.js`

## Troubleshooting

### "Email service not configured" warning
**Solution**: Add SMTP credentials to `backend/.env`

### "Authentication failed" error
**Solution**: 
- Check SMTP_USER and SMTP_PASS are correct
- For Gmail, use App Password (not regular password)
- Verify 2-Step Verification is enabled

### Emails not received
**Solution**:
- Check spam folder
- Verify email address is correct
- Check SMTP service status
- Review backend logs for errors

### Emails sent but not delivered
**Solution**:
- Verify SPF/DKIM records
- Check sender reputation
- Review email service dashboard for bounces
