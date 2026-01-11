# Quick Email Setup Guide

## Problem: Not Receiving Emails

If you're not receiving confirmation emails, it's because SMTP credentials are not configured.

## ✅ Quick Setup (Gmail - 5 minutes)

### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: Louder
3. Click "Generate"
4. **Copy the 16-character password** (you'll need this!)

### Step 3: Update backend/.env

Open `backend/.env` and add these lines:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password-here
EMAIL_FROM=noreply@louder.com
EMAIL_FROM_NAME=Louder
```

**Replace:**
- `your-email@gmail.com` → Your Gmail address
- `your-16-char-app-password-here` → The 16-character password from Step 2

### Step 4: Restart Backend

Stop the backend (Ctrl+C) and restart:
```powershell
cd backend
npm run dev
```

### Step 5: Test

1. Submit an email on any event
2. Check your email inbox
3. Check backend logs for "Email sent successfully"

## ⚠️ Important Notes

- **Don't use your regular Gmail password** - Use the App Password from Step 2
- **The App Password looks like**: `abcd efgh ijkl mnop` (with spaces) or `abcdefghijklmnop` (without spaces)
- **Copy it exactly** - You can only see it once

## 🔍 Verify It's Working

Check backend terminal logs after submitting email:

**✅ Success:**
```
Email sent successfully to user@example.com: <message-id>
Confirmation email sent to user@example.com for event: ...
```

**❌ Failure:**
```
Failed to send confirmation email to user@example.com: ...
⚠️ No SMTP credentials found. Email sending is disabled.
```

## 🚫 If You Don't Want to Configure Email

That's fine! The app will still work:
- ✅ Email is saved to database
- ✅ User is redirected to event page
- ✅ Success modal shows
- ❌ No confirmation email sent (but that's okay for development)

You can configure email later for production.
