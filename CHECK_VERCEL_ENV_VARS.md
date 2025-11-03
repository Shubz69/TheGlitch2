# 🔍 How to Verify Environment Variables Are Set in Vercel

## The Error Shows:
**"Email service is not configured. Please contact support."**

This means Vercel can't see `EMAIL_USER` or `EMAIL_PASS`.

## ✅ Check These Steps:

### 1. Verify Variables Are Actually Set
1. Go to https://vercel.com/dashboard
2. Click your project **"the-glitch"**
3. Click **Settings** → **Environment Variables**
4. **DO YOU SEE:**
   - `EMAIL_USER` listed? ✅ or ❌
   - `EMAIL_PASS` listed? ✅ or ❌

### 2. Check Environment Scope
For EACH variable (`EMAIL_USER` and `EMAIL_PASS`):
- Make sure ALL THREE are checked:
  - ✅ Production
  - ✅ Preview  
  - ✅ Development

**If even ONE is unchecked, it won't work!**

### 3. Check Variable Values
Click on each variable to edit:
- `EMAIL_USER`: Should be your Gmail (e.g., `Shubzfx@gmail.com`)
- `EMAIL_PASS`: Should be 16 characters, **NO SPACES**

### 4. Check Deployment Status
1. Go to **Deployments** tab
2. Look at the **latest deployment**
3. Check the **"..."** menu → **"View Build Logs"**
4. Look for any errors about environment variables

### 5. VERIFY REDEPLOYMENT
**This is the #1 issue!**

Environment variables **ONLY work after redeploy**:
1. Go to **Deployments**
2. Click **"..."** on the **latest deployment** (the one AFTER you added env vars)
3. Click **"Redeploy"**
4. Wait for it to finish (green checkmark)

**If you set variables but didn't redeploy, they won't work!**

### 6. Check Function Logs
After redeploy, try password reset again, then:
1. Go to **Deployments** → Latest deployment
2. Click **"Functions"** tab
3. Click **`api/auth/forgot-password`**
4. Check **"Logs"** tab
5. Look for: `Email config check: { hasEmailUser: true/false, hasEmailPass: true/false }`

## 🚨 Common Issues:

### Issue 1: Variables Not Redeployed
**Fix:** Redeploy after adding variables

### Issue 2: Wrong Environment Selected
**Fix:** Make sure Production, Preview, AND Development are all checked

### Issue 3: Spaces in EMAIL_PASS
**Fix:** Remove all spaces from Gmail App Password (16 chars, no spaces)

### Issue 4: Wrong Variable Names
**Fix:** Must be EXACTLY:
- `EMAIL_USER` (not `email_user` or `EMAIL_USERNAME`)
- `EMAIL_PASS` (not `email_pass` or `EMAIL_PASSWORD`)

## ✅ Quick Test After Setup:

1. Set both variables ✅
2. Check all environments ✅
3. Redeploy ✅
4. Wait for deployment to finish ✅
5. Try password reset ✅

**If it still doesn't work after this, check the Vercel function logs!**

