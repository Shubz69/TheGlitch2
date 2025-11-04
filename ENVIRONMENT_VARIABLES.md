# Environment Variables Required for Vercel Deployment

This document lists all environment variables that need to be set in your Vercel project settings.

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable below with its corresponding value
4. Make sure to add them for **Production**, **Preview**, and **Development** environments (or just Production if you want)

---

## Required Environment Variables

### 1. MySQL Database Connection (REQUIRED)

These are needed for all database operations (registration, login, password reset, MFA, community, courses).

```
MYSQL_HOST
```
**Example:** `your-database-host.mysql.database.azure.com` or `db.yourdomain.com` or `123.45.67.89`
- Your MySQL server hostname or IP address
- If using a cloud provider (Azure, AWS RDS, etc.), use the connection string hostname

```
MYSQL_USER
```
**Example:** `theglitch_user` or `admin` or `root`
- Your MySQL database username

```
MYSQL_PASSWORD
```
**Example:** `YourSecurePassword123!`
- Your MySQL database password
- Make sure it's a strong password and never commit it to Git

```
MYSQL_DATABASE
```
**Example:** `theglitch_db` or `theglitch_production`
- The name of your MySQL database

```
MYSQL_SSL
```
**Example:** `true` or `false`
- Set to `true` if your MySQL server requires SSL/TLS connections (most cloud providers do)
- Set to `false` if you're using a local database without SSL
- **Most production databases require `true`**

---

### 2. Email Service (REQUIRED for password reset, MFA, signup verification)

These are needed for sending verification emails, password reset codes, and MFA codes.

```
EMAIL_USER
```
**Example:** `noreply@theglitch.world` or `your-email@gmail.com`
- The email address used to send emails
- If using Gmail, use your full Gmail address
- **Note:** For Gmail, you'll need an "App Password" (see below)

```
EMAIL_PASS
```
**Example:** `your-app-password-here` (for Gmail) or `your-smtp-password`
- For Gmail: Use an "App Password" (not your regular Gmail password)
  - Go to Google Account → Security → 2-Step Verification → App Passwords
  - Generate a new app password for "Mail"
  - Use that 16-character password here
- For other email providers: Use your SMTP password

---

### 3. Stripe Payment Integration (OPTIONAL - for subscriptions)

These are only needed if you want to enable Stripe payment processing.

```
STRIPE_SECRET_KEY
```
**Example:** `sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890` or `sk_test_...`
- Your Stripe secret key from your Stripe dashboard
- Use test key (`sk_test_...`) for development
- Use live key (`sk_live_...`) for production

```
FRONTEND_URL
```
**Example:** `https://www.theglitch.world`
- Your website's frontend URL
- Used for redirect URLs after Stripe checkout

---

### 4. Backend URL (OPTIONAL - for fallback)

```
BACKEND_URL
```
**Example:** `https://www.theglitch.world`
- Your main backend API URL (if you have a separate backend)
- Currently used as a fallback in some endpoints

---

## Example Values for Different Providers

### MySQL Database Examples

**Azure Database for MySQL:**
```
MYSQL_HOST=theglitch.mysql.database.azure.com
MYSQL_USER=theglitch_admin@theglitch
MYSQL_PASSWORD=YourSecurePassword123!
MYSQL_DATABASE=theglitch_db
MYSQL_SSL=true
```

**AWS RDS:**
```
MYSQL_HOST=theglitch-db.123456789.us-east-1.rds.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD=YourSecurePassword123!
MYSQL_DATABASE=theglitch_db
MYSQL_SSL=true
```

**PlanetScale (MySQL-compatible):**
```
MYSQL_HOST=xxx.psdb.cloud
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=theglitch_db
MYSQL_SSL=true
```

**Local Development (if testing locally):**
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-local-password
MYSQL_DATABASE=theglitch_db
MYSQL_SSL=false
```

### Email Examples

**Gmail:**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```
(Note: Gmail app passwords have spaces, but you can remove them - they still work)

**Custom SMTP:**
```
EMAIL_USER=noreply@theglitch.world
EMAIL_PASS=your-smtp-password
```

---

## Minimum Required Variables

**For basic functionality (registration, login, database):**
- ✅ `MYSQL_HOST`
- ✅ `MYSQL_USER`
- ✅ `MYSQL_PASSWORD`
- ✅ `MYSQL_DATABASE`
- ✅ `MYSQL_SSL`

**For email features (password reset, MFA, signup verification):**
- ✅ `EMAIL_USER`
- ✅ `EMAIL_PASS`

**For payment processing (optional):**
- ⚠️ `STRIPE_SECRET_KEY`
- ⚠️ `FRONTEND_URL`

---

## Security Notes

1. **Never commit these values to Git** - They should only exist in Vercel's environment variables
2. **Use different values for Production vs Preview/Development** if possible
3. **Rotate passwords regularly** especially if you suspect a breach
4. **Use App Passwords for Gmail** instead of your main password
5. **Keep Stripe keys secure** - Never expose them in frontend code

---

## Testing Your Environment Variables

After setting these variables in Vercel:

1. **Redeploy your application** (Vercel will automatically redeploy when you add new environment variables, or you can trigger a redeploy manually)
2. **Check Vercel Function Logs** to see if there are any connection errors
3. **Test registration** - Try creating a new account
4. **Test password reset** - Try the forgot password flow
5. **Check logs** for any missing variable errors

---

## Troubleshooting

**If you see "Database connection error":**
- Verify all MySQL variables are set correctly
- Check that `MYSQL_SSL` is set to `true` if your database requires SSL
- Verify the host, username, password, and database name are correct
- Check that your MySQL server allows connections from Vercel's IP addresses

**If emails aren't sending:**
- Verify `EMAIL_USER` and `EMAIL_PASS` are set
- For Gmail, make sure you're using an App Password, not your regular password
- Check Vercel logs for email-specific errors

**If you see "Missing environment variables" in logs:**
- Go to Vercel Settings → Environment Variables
- Make sure the variable names match exactly (case-sensitive)
- Make sure they're added to the correct environment (Production/Preview/Development)

