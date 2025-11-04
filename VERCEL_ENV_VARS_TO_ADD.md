# Exact Environment Variables to Add in Vercel

Based on your codebase analysis, here's exactly what you need:

## ✅ ALREADY SET (You have these):
- `EMAIL_USER` - Already configured ✅
- `EMAIL_PASS` - Already configured ✅

---

## 🔴 REQUIRED - Add These MySQL Variables:

You need to add these 5 MySQL database variables. **You'll need to get the actual values from your MySQL database provider.**

### 1. `MYSQL_HOST`
**Key:** `MYSQL_HOST`  
**Value:** Your MySQL server hostname or IP address  
**Example:** `your-database.mysql.database.azure.com` or `db.yourdomain.com`  
**Where to find:** Check your database provider's dashboard (Azure, AWS RDS, PlanetScale, etc.)

### 2. `MYSQL_USER`
**Key:** `MYSQL_USER`  
**Value:** Your MySQL username  
**Example:** `admin` or `theglitch_user`  
**Where to find:** Your database provider's dashboard or connection string

### 3. `MYSQL_PASSWORD`
**Key:** `MYSQL_PASSWORD`  
**Value:** Your MySQL password  
**Example:** `YourSecurePassword123!`  
**Where to find:** Your database provider's dashboard or connection string

### 4. `MYSQL_DATABASE`
**Key:** `MYSQL_DATABASE`  
**Value:** Your database name  
**Example:** Based on your codebase, it's likely `trading_platform` (from docker-compose.yml)  
**Where to find:** Your database provider's dashboard or connection string

### 5. `MYSQL_SSL`
**Key:** `MYSQL_SSL`  
**Value:** `true` (most cloud databases require this)  
**Example:** `true`  
**Note:** Set to `true` for cloud databases, `false` only for local development

---

## ⚠️ OPTIONAL - Add These for Full Functionality:

### 6. `STRIPE_SECRET_KEY` (Optional - for payment processing)
**Key:** `STRIPE_SECRET_KEY`  
**Value:** Your Stripe secret key  
**Example:** `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`  
**Note:** I found this in your backend config files, but you should verify it's still valid

### 7. `FRONTEND_URL` (Optional - for Stripe redirects)
**Key:** `FRONTEND_URL`  
**Value:** `https://www.theglitch.world`  
**Example:** `https://www.theglitch.world`  
**Note:** This is used for Stripe checkout redirect URLs

---

## 📋 Summary - What to Add in Vercel:

### Minimum Required (for registration/database to work):
1. ✅ `EMAIL_USER` - Already set
2. ✅ `EMAIL_PASS` - Already set
3. 🔴 `MYSQL_HOST` - **ADD THIS** (get from your database provider)
4. 🔴 `MYSQL_USER` - **ADD THIS** (get from your database provider)
5. 🔴 `MYSQL_PASSWORD` - **ADD THIS** (get from your database provider)
6. 🔴 `MYSQL_DATABASE` - **ADD THIS** (likely `trading_platform` based on your code)
7. 🔴 `MYSQL_SSL` - **ADD THIS** (set to `true`)

### Optional (for payment features):
8. ⚠️ `STRIPE_SECRET_KEY` - Add if you want Stripe payments
9. ⚠️ `FRONTEND_URL` - Add if you want Stripe redirects (set to `https://www.theglitch.world`)

---

## 🔍 How to Find Your MySQL Credentials:

### If you have a MySQL database already:
1. **Azure Database for MySQL:**
   - Go to Azure Portal → Your Database → Connection strings
   - Look for values like: `Server=xxx.mysql.database.azure.com;Database=xxx;Uid=xxx;Pwd=xxx`

2. **AWS RDS:**
   - Go to AWS Console → RDS → Databases → Your Database
   - Check "Endpoint" for host
   - Check "Configuration" for database name

3. **PlanetScale:**
   - Go to PlanetScale Dashboard → Your Database → Connect
   - Copy the connection string values

4. **Other providers:**
   - Check your provider's dashboard for connection details

### If you DON'T have a MySQL database yet:
You need to create one. Options:
- **Azure Database for MySQL** (recommended)
- **AWS RDS MySQL**
- **PlanetScale** (MySQL-compatible, easy setup)
- **DigitalOcean Managed Databases**
- **Any other MySQL hosting service**

Once you create the database, you'll get the connection details (host, username, password, database name).

---

## 🎯 Quick Action Items:

1. **Get MySQL credentials** from your database provider (or create a new database)
2. **Add these 5 variables** in Vercel:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `MYSQL_SSL` (set to `true`)
3. **Redeploy** your Vercel project
4. **Test registration** - it should work now!

---

## 📝 Notes:

- The database name `trading_platform` comes from your `docker-compose.yml` file, but you should verify what your actual production database name is
- All MySQL variables are **required** for registration, login, password reset, MFA, and community features to work
- The `MYSQL_SSL` should be `true` for any cloud database provider
- Make sure your MySQL database allows connections from Vercel's IP addresses (most cloud providers handle this automatically)

