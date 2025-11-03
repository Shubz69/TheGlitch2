# Database Environment Variables for Password Reset

## ✅ Password Reset Now Saves to Database!

The password reset function now updates passwords directly in your MySQL database, so **all accounts will work**.

## 🔧 Required Environment Variables in Vercel

Add these to your Vercel project → Settings → Environment Variables:

### MySQL Database Connection:

1. **`MYSQL_HOST`**
   - Value: Your MySQL host (e.g., `your-mysql-host.com` or IP address)
   - If using a cloud database, check your provider for the connection string

2. **`MYSQL_USER`**
   - Value: MySQL username (e.g., `user` or `root`)

3. **`MYSQL_PASSWORD`**
   - Value: MySQL password

4. **`MYSQL_DATABASE`**
   - Value: Database name (e.g., `trading_platform`)

5. **`MYSQL_SSL`** (Optional)
   - Value: `true` or `false`
   - Set to `true` if your MySQL requires SSL connection

### Example:
```
MYSQL_HOST=your-mysql-server.com
MYSQL_USER=user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=trading_platform
MYSQL_SSL=true
```

## 📍 How to Find Your MySQL Credentials

### If using Docker/your own server:
- Check `docker-compose.yml` (lines 25-27, 59-63)
- Your MySQL is at `mysql:3306` internally
- Database: `trading_platform`
- User: `user`
- Password: `password` (or whatever you set)

### If using a cloud MySQL provider:
- **AWS RDS**: Check RDS dashboard → Endpoint
- **Google Cloud SQL**: Check Cloud SQL instances → Connection name
- **Azure Database**: Check Azure Portal → Connection strings
- **PlanetScale/other**: Check their dashboard for connection details

## 🔐 Security Note

**Important:** Your MySQL database needs to be **publicly accessible** from the internet for Vercel functions to connect. This means:

1. ✅ **Recommended**: Use a cloud MySQL provider (AWS RDS, Google Cloud SQL, PlanetScale)
2. ⚠️ **Alternative**: Whitelist Vercel's IP ranges in your MySQL firewall
3. ⚠️ **Less Secure**: Open MySQL port to all IPs (not recommended)

### Vercel IP Ranges:
You may need to whitelist Vercel's IP addresses. Check Vercel docs for current IP ranges, or use a service like:
- **PlanetScale** (serverless MySQL - works great with Vercel)
- **AWS RDS** (with security groups)
- **Google Cloud SQL** (with authorized networks)

## ✅ After Setting Variables

1. **Redeploy** your Vercel project
2. **Test password reset** - it should now save to database!
3. **Verify** - try logging in with the new password

## 🎯 What Happens Now

When a user resets their password:
1. ✅ Reset code email sent (using EMAIL_USER/EMAIL_PASS)
2. ✅ Code verified
3. ✅ **Password hashed and saved to MySQL database** ← NEW!
4. ✅ User can login with new password

**Works for ALL accounts!** 🎉

