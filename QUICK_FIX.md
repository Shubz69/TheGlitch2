# QUICK FIX - Password Reset Now Working

## The Problem
The Java Spring Boot backend at `theglitch.world` doesn't have password reset endpoints, causing 405 errors.

## The Solution
I've created a Node.js microservice (`server.js`) with all password reset endpoints. You need to deploy it.

## ⚡ FASTEST FIX (5 minutes)

### If you have SSH access to your server:

1. **SSH into your server**
2. **Navigate to your project directory**
3. **Install dependencies:**
   ```bash
   npm install bcrypt better-sqlite3 express cors nodemailer
   ```
4. **Set environment variables:**
   ```bash
   export EMAIL_USER=your-email@gmail.com
   export EMAIL_PASS=your-gmail-app-password
   ```
5. **Start server.js:**
   ```bash
   nohup node server.js > server.log 2>&1 &
   ```
6. **Update nginx to route password reset to Node.js:**
   
   Edit your nginx config (usually `/etc/nginx/sites-available/theglitch.world`):
   
   ```nginx
   # Add this BEFORE your existing /api location block
   location ~ ^/api/auth/(forgot-password|verify-reset-code|reset-password)$ {
       proxy_pass http://localhost:8080;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
7. **Reload nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

**Done!** Password reset should now work.

## 🐳 Docker Fix

If using Docker:

```bash
docker-compose up -d --build nodejs-service
docker-compose restart frontend
```

## ✅ Verification

Test it:
```bash
curl -X POST https://www.theglitch.world/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

You should get `{"success":true}` instead of `405`.

## 📧 Email Setup (Gmail)

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Create App Password
4. Use that password as `EMAIL_PASS`

## What's Already Done ✅

- ✅ Frontend calls correct endpoints
- ✅ server.js has all 3 endpoints implemented
- ✅ Database integration ready
- ✅ Email sending configured
- ✅ Password hashing with bcrypt
- ✅ Error handling

**Just needs to be deployed and running!**

