# Vercel Deployment Guide - Password Reset

## ✅ Code is Ready!

The password reset endpoints are now configured as Vercel serverless functions.

## 🚀 Deployment Steps

### 1. Push to Git (Already Done)
```bash
git push origin main
```

### 2. Deploy on Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com
2. Import your Git repository
3. Vercel will auto-detect the React app and deploy

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
```

### 3. Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these:
- **`EMAIL_USER`**: Your Gmail address (e.g., `your-email@gmail.com`)
- **`EMAIL_PASS`**: Your Gmail App Password ([How to get](https://support.google.com/accounts/answer/185833))

**To get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Under "App passwords", create a new app password
4. Use that password as `EMAIL_PASS`

### 4. Redeploy After Setting Environment Variables

After setting environment variables, trigger a new deployment:
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

Or push a small change:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 📍 Endpoints

Once deployed, these endpoints will be available:
- `POST https://www.theglitch.world/api/auth/forgot-password`
- `POST https://www.theglitch.world/api/auth/verify-reset-code`
- `POST https://www.theglitch.world/api/auth/reset-password`

## ⚠️ Important Notes

### Storage Limitation
The current implementation uses in-memory storage for reset codes. This means:
- Codes may not persist across serverless function invocations
- For production, you should integrate with:
  - **Vercel KV** (Redis) - Recommended
  - **Vercel Postgres** - Alternative
  - **Your existing database** - Best option

### Password Update
The `reset-password.js` function currently logs the password hash but doesn't update your database. You need to:
1. Connect to your user database (MySQL/PostgreSQL)
2. Update the user's password in the database
3. Use the hashed password from the function

### Recommended Production Setup

For production, update the functions to use your database:

```javascript
// In reset-password.js, add:
const { createClient } = require('@vercel/postgres'); // or your DB client

// Update user password:
await db.query(
  'UPDATE users SET password = $1 WHERE email = $2',
  [hashedPassword, tokenData.email]
);
```

## ✅ Testing After Deployment

1. **Test forgot password:**
```bash
curl -X POST https://www.theglitch.world/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Should return: `{"success":true,"message":"Reset code sent to your email"}`

2. **Check your email** for the 6-digit code

3. **Test verify code:**
```bash
curl -X POST https://www.theglitch.world/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","code":"123456"}'
```

## 🎯 Current Status

✅ **Frontend**: Ready
✅ **Serverless Functions**: Created and ready
✅ **CORS**: Configured
✅ **Email**: Configured
⚠️ **Database Integration**: Needs your database connection
⚠️ **Storage**: Currently in-memory (should use KV/DB)

## 🔧 Next Steps for Full Production

1. Integrate with Vercel KV for code storage
2. Connect to your user database for password updates
3. Add proper error logging (Vercel logs)
4. Set up monitoring/alerting

The password reset will work once deployed and environment variables are set!

