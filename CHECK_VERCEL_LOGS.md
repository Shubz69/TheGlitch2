# 🔍 Check Vercel Function Logs to Debug

## The Error Persists
Even though environment variables are set, the function still says "Email service is not configured."

## ✅ Debug Steps:

### Step 1: Check Vercel Function Logs
1. Go to **Vercel Dashboard** → Your Project
2. Click **"Deployments"** tab
3. Click on the **LATEST deployment** (the one that should have the env vars)
4. Click **"Functions"** tab (near the top)
5. Find **`api/auth/forgot-password`** in the list
6. Click on it
7. Click **"Logs"** tab
8. **Try password reset again** (enter email and click send)
9. **Look for logs** that say:
   ```
   Email config check: { hasEmailUser: ..., hasEmailPass: ..., ... }
   ```

### Step 2: What to Look For

**If logs show:**
- `hasEmailUser: false` or `hasEmailPass: false` → Variables aren't being read
- `hasEmailUser: true` and `hasEmailPass: true` → Variables ARE set, but transporter creation failed

### Step 3: Verify Variable Values

1. Go to **Settings** → **Environment Variables**
2. Click on **`EMAIL_USER`** (eye icon or edit)
3. Verify the value is correct (your Gmail address)
4. Click on **`EMAIL_PASS`**
5. Verify:
   - It's exactly 16 characters
   - **NO SPACES** in the password
   - It's the actual Gmail App Password (not your regular Gmail password)

### Step 4: Common Issues

**Issue 1: Spaces in EMAIL_PASS**
- Gmail App Password looks like: `mmxr ojyg tglv mrtn`
- Must be entered as: `mmxrojytglvmrtn` (no spaces)

**Issue 2: Wrong Environment**
- Variables must have **ALL environments checked**:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

**Issue 3: Not Redeployed**
- Must redeploy after setting/changing variables
- Go to Deployments → Latest → "..." → Redeploy

### Step 5: Force New Deployment

If logs show variables aren't being read:

1. Make a small code change (or just push a commit)
2. This will trigger a new deployment
3. The new deployment will pick up the environment variables

**OR**

1. Go to Deployments
2. Click "..." on latest
3. Click "Redeploy"
4. Make sure it says "Production" environment

## 🎯 Next Steps:

1. **Check the logs** (most important!)
2. **Share what the logs show** - especially the "Email config check" line
3. If variables show as `false`, we know they're not being read
4. If variables show as `true`, the issue is with transporter creation

**Please check the Vercel function logs and share what you see!**

