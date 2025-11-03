# ⚠️ URGENT: Set Email Environment Variables in Vercel

## The Error You're Seeing

The console shows:
```
Error data: {success: false, message: 'Email service is not configured. Please contact support.'}
```

This means **the Vercel function is working**, but it needs environment variables to send emails.

## ✅ Fix This Now (5 minutes)

### Step 1: Go to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your project (the-glitch or theglitch.world)

### Step 2: Add Environment Variables
1. Click **Settings** tab (left sidebar)
2. Click **Environment Variables** (in the menu)
3. Click **Add New** button

**Add Variable 1:**
- **Key:** `EMAIL_USER`
- **Value:** Your Gmail address (e.g., `your-email@gmail.com`)
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all)
- Click **Save**

**Add Variable 2:**
- **Key:** `EMAIL_PASS`
- **Value:** Your Gmail App Password (16 characters)
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all)
- Click **Save**

### Step 3: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is enabled (if not, enable it first)
3. Scroll down to **App passwords** (or search for it)
4. Click **Select app** → Choose **Mail**
5. Click **Select device** → Choose **Other** → Type "Vercel"
6. Click **Generate**
7. Copy the **16-character password** (it will look like: `abcd efgh ijkl mnop`)
8. Paste it as `EMAIL_PASS` in Vercel (remove spaces, it should be one string)

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to finish (~2 minutes)

### Step 5: Test

After redeployment:
1. Go to https://www.theglitch.world/forgot-password
2. Enter your email
3. Click "Send Reset Email"
4. ✅ Should work now!

## 🔍 Verify Variables Are Set

To confirm variables are set:
1. In Vercel Dashboard → Settings → Environment Variables
2. You should see both `EMAIL_USER` and `EMAIL_PASS` listed
3. They should have checkmarks for Production, Preview, and Development

## ⚠️ Important Notes

- **Environment variables are case-sensitive:** `EMAIL_USER` not `email_user`
- **You MUST redeploy after adding variables** - they don't apply to existing deployments
- **Gmail App Password is required** - regular password won't work
- **The password should be 16 characters** without spaces

## ✅ Once Done

The error message will change from:
- ❌ "Email service is not configured. Please contact support."
- ✅ "Reset code sent to your email"

You'll receive an email with a 6-digit code to reset your password!

