# How to Migrate Your Local MySQL Database to Cloud for Vercel

## ⚠️ Important: Vercel Can't Connect to Local Databases

Vercel serverless functions **cannot** connect to databases running on `localhost` or your laptop. You need to migrate your MySQL database to a cloud provider.

---

## 🎯 Step-by-Step Migration Guide

### **Option 1: Quick Setup (Recommended - Start Fresh)**

If you don't have critical data to preserve, you can let the code create the tables automatically:

1. **Create a cloud MySQL database** (see providers below)
2. **Add the connection variables to Vercel**
3. **Deploy** - The code will automatically create tables on first use

The API endpoints already have code to create tables if they don't exist:
- `users` table (created in `api/auth/register.js`)
- `courses` table (created in `api/courses.js`)
- `channels` table (created in `api/community/channels.js`)
- `messages` table (created in `api/community/channels/messages.js`)

---

### **Option 2: Migrate Existing Data**

If you have existing users/data in your local MySQL that you want to keep:

#### **Step 1: Export Your Local Database**

Open PowerShell or Command Prompt and run:

```bash
# Navigate to MySQL bin directory (adjust path if needed)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Export entire database (replace with your actual values)
mysqldump -u root -p trading_platform > C:\Users\1230s\Desktop\trading_platform_backup.sql

# When prompted, enter your MySQL password
```

**Or if MySQL is in your PATH:**
```bash
mysqldump -u root -p trading_platform > trading_platform_backup.sql
```

**Alternative - Export from MySQL Workbench:**
1. Open MySQL Workbench
2. Connect to your local database
3. Go to **Server** → **Data Export**
4. Select `trading_platform` database
5. Choose export location
6. Click **Start Export**

#### **Step 2: Create Cloud MySQL Database**

Choose one of these providers (I recommend **PlanetScale** for easiest setup):

##### **A. PlanetScale (Easiest - Free Tier Available)**

1. Go to https://planetscale.com
2. Sign up for free account
3. Create a new database
4. Name it: `trading_platform` (or any name you prefer)
5. Choose region closest to you
6. Once created, go to **Settings** → **Connect**
7. Copy the connection details:
   - **Host**: `xxx.psdb.cloud`
   - **Username**: (shown in connect screen)
   - **Password**: (click "Generate new password")
   - **Database**: `trading_platform`

##### **B. Azure Database for MySQL (Free Tier Available)**

1. Go to https://portal.azure.com
2. Create **Azure Database for MySQL** resource
3. Choose **Flexible Server** (cheaper option)
4. Set:
   - Server name: `theglitch-mysql`
   - Database name: `trading_platform`
   - Username: `admin` (or your choice)
   - Password: (set a strong password)
5. After creation, go to **Connection security**
6. Enable **Allow access to Azure services**
7. Add your IP address (for now, to import data)
8. Get connection details from **Overview** → **Connection strings**

##### **C. AWS RDS MySQL**

1. Go to https://aws.amazon.com/rds/
2. Create **RDS MySQL** instance
3. Choose **Free tier** if eligible
4. Set database name: `trading_platform`
5. Set master username and password
6. Configure security group to allow connections
7. Get endpoint from RDS dashboard

##### **D. DigitalOcean Managed Database**

1. Go to https://www.digitalocean.com
2. Create **Managed Database** → **MySQL**
3. Choose plan (starting at $15/month)
4. Set database name: `trading_platform`
5. Get connection details from dashboard

#### **Step 3: Import Your Data to Cloud Database**

**Method 1: Using MySQL Command Line**

```bash
# Connect to your cloud database (replace with your actual values)
mysql -h your-cloud-host.mysql.database.azure.com -u your-username -p trading_platform < trading_platform_backup.sql

# Or for PlanetScale
mysql -h xxx.psdb.cloud -u your-username -p trading_platform < trading_platform_backup.sql
```

**Method 2: Using MySQL Workbench**

1. Open MySQL Workbench
2. Create new connection to your cloud database:
   - **Hostname**: Your cloud database host
   - **Port**: 3306
   - **Username**: Your cloud database username
   - **Password**: Your cloud database password
3. Test connection
4. Go to **Server** → **Data Import**
5. Select **Import from Self-Contained File**
6. Choose your `trading_platform_backup.sql` file
7. Select default target schema: `trading_platform`
8. Click **Start Import**

**Method 3: Using phpMyAdmin (if available)**

1. Upload your `.sql` file
2. Select database
3. Click **Import**
4. Choose your file and import

#### **Step 4: Add Connection Variables to Vercel**

Once your cloud database is set up, add these to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

| Key | Value (Example) |
|-----|----------------|
| `MYSQL_HOST` | `xxx.mysql.database.azure.com` or `xxx.psdb.cloud` |
| `MYSQL_USER` | `admin` or username from cloud provider |
| `MYSQL_PASSWORD` | Your cloud database password |
| `MYSQL_DATABASE` | `trading_platform` |
| `MYSQL_SSL` | `true` |

#### **Step 5: Redeploy**

After adding variables:
1. Go to Vercel Dashboard → Deployments
2. Click **...** → **Redeploy** (or push a new commit)
3. Wait for deployment to complete
4. Test registration/login

---

## 📋 Quick Reference: Database Schema

Based on your codebase, these tables are created automatically:

### `users` table:
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `courses` table:
```sql
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `channels` table:
```sql
CREATE TABLE IF NOT EXISTS channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  course_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `messages` table:
```sql
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel_id INT NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Recommended: Start Fresh (Easiest)

If you don't have critical existing data:

1. **Create PlanetScale account** (free tier: https://planetscale.com)
2. **Create database** named `trading_platform`
3. **Get connection details** from PlanetScale dashboard
4. **Add to Vercel** as environment variables
5. **Redeploy** - tables will auto-create on first API call

That's it! No import needed.

---

## 🔒 Security Notes

- **Never commit** `.sql` backup files with passwords to Git
- **Use strong passwords** for cloud databases
- **Enable SSL** (`MYSQL_SSL=true`) for all cloud databases
- **Restrict IP access** if possible (though Vercel IPs change)
- **Use environment variables** - never hardcode credentials

---

## ❓ Troubleshooting

**"Can't connect to database"**
- Check that `MYSQL_SSL=true` if your cloud provider requires SSL
- Verify host, username, password are correct
- Check firewall rules allow connections

**"Table doesn't exist"**
- Tables are auto-created on first API call
- Try registering a user or accessing courses page

**"Access denied"**
- Verify username and password are correct
- Check database name matches exactly
- Ensure user has proper permissions

---

## 📞 Need Help?

If you get stuck:
1. Check Vercel logs: Dashboard → Your Project → Logs
2. Check database provider's connection logs
3. Test connection locally using MySQL Workbench first

