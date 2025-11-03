# 🚨 URGENT: Set Environment Variables in Vercel NOW

## The Error:
**"Email service is not configured. Please contact support."**

This means `EMAIL_USER` and `EMAIL_PASS` are **NOT SET** in Vercel.

## ✅ FIX IN 2 MINUTES:

### Step 1: Open Vercel Dashboard
Go to: https://vercel.com/dashboard

### Step 2: Select Your Project
Click on **"the-glitch"** or **"theglitch.world"**

### Step 3: Go to Settings → Environment Variables
1. Click **"Settings"** tab (left sidebar)
2. Click **"Environment Variables"** (in the menu)

### Step 4: Add EMAIL_USER
1. Click **"Add New"** button
2. **Key:** `EMAIL_USER`
3. **Value:** Your Gmail address (e.g., `Shubzfx@gmail.com`)
4. **Environments:** Check ALL ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

### Step 5: Add EMAIL_PASS
1. Click **"Add New"** button again
2. **Key:** `EMAIL_PASS`
3. **Value:** Your Gmail App Password (16 characters, NO SPACES)
   - If you don't have it: See "Get Gmail App Password" below
4. **Environments:** Check ALL ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

### Step 6: REDEPLOY (CRITICAL!)
**Environment variables DON'T work until you redeploy!**

1. Click **"Deployments"** tab
2. Find the latest deployment
3. Click **"..."** (three dots) on the right
4. Click **"Redeploy"**
5. Wait 2-3 minutes for deployment to finish

### Step 7: Test
After redeployment completes:
1. Go to https://www.theglitch.world/forgot-password
2. Enter your email
3. Click "Send Reset Email"
4. ✅ Should work now!

---

## 📧 Get Gmail App Password (If You Don't Have It)

1. Go to: https://myaccount.google.com/security
2. Make sure **"2-Step Verification"** is enabled
3. Scroll down to **"App passwords"**
4. Click **"Select app"** → Choose **"Mail"**
5. Click **"Select device"** → Choose **"Other"** → Type **"Vercel"**
6. Click **"Generate"**
7. Copy the **16-character password** (it looks like: `mmxr ojyg tglv mrtn`)
8. Remove ALL spaces when pasting into Vercel (should be: `mmxrojytglvmrtn`)

---

## ✅ Verification Checklist

After completing above:
- [ ] `EMAIL_USER` is set in Vercel
- [ ] `EMAIL_PASS` is set in Vercel (no spaces)
- [ ] Both variables have Production, Preview, Development checked
- [ ] Deployment has been redeployed after setting variables
- [ ] Deployment shows "Ready" status

**Once all checked, password reset will work!**

