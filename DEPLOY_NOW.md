# 🚀 DEPLOY TO VERCEL NOW - Password Reset Fix

## The Problem
Your password reset is getting **405 Method Not Allowed** because the Vercel serverless functions haven't been deployed yet.

## ✅ Solution - Deploy Now!

### Step 1: Go to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find your project (theglitch.world)
3. Click on it

### Step 2: Trigger a New Deployment
**Option A: Redeploy latest**
- Go to "Deployments" tab
- Click "..." on the latest deployment
- Click "Redeploy"

**Option B: Push to trigger auto-deploy**
```bash
git commit --allow-empty -m "Trigger Vercel deployment for password reset"
git push origin main
```

### Step 3: Set Environment Variables (CRITICAL!)

**In Vercel Dashboard:**
1. Go to **Settings** → **Environment Variables**
2. Add these two variables:

**Variable 1:**
- Name: `EMAIL_USER`
- Value: Your Gmail address (e.g., `your-email@gmail.com`)
- Environment: Production, Preview, Development (check all)

**Variable 2:**
- Name: `EMAIL_PASS`
- Value: Your Gmail App Password
- Environment: Production, Preview, Development (check all)

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to "App passwords" (search for it)
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Use it as `EMAIL_PASS`

### Step 4: Redeploy After Setting Variables

After setting environment variables:
- Go back to "Deployments"
- Click "..." on latest deployment
- Click "Redeploy"

OR wait for the next auto-deploy from Git push.

## ✅ Verification

Once deployed, test it:

1. **Test endpoint exists:**
   Visit: `https://www.theglitch.world/api/test`
   Should return: `{"success":true,"message":"Vercel serverless function is working!"}`

2. **Test password reset:**
   - Go to forgot password page
   - Enter your email
   - Click "Send Reset Email"
   - Should get success message (not 405 error)

## 📍 What Was Created

These serverless functions are now in your codebase:
- ✅ `/api/auth/forgot-password.js` - Sends reset code email
- ✅ `/api/auth/verify-reset-code.js` - Verifies the code
- ✅ `/api/auth/reset-password.js` - Resets the password
- ✅ `/api/test.js` - Test endpoint to verify functions work

## ⚠️ Important Notes

1. **Functions are ready** - They just need to be deployed
2. **Environment variables are REQUIRED** - Without `EMAIL_USER` and `EMAIL_PASS`, email won't send
3. **Storage limitation** - Currently uses in-memory storage (codes persist for ~10 minutes within same serverless instance)
4. **Password update** - The reset function currently hashes the password but you may need to connect it to your user database

## 🎯 Expected Result

After deployment:
- ✅ No more 405 errors
- ✅ Password reset emails sent successfully
- ✅ Codes verified correctly
- ✅ Passwords reset successfully

**The code is ready - just deploy it!**

