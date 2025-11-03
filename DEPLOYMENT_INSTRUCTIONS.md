# Password Reset Deployment Instructions

## Quick Fix for Production

The password reset endpoints are now implemented in `server.js`. To make them work on `theglitch.world`, you have **two options**:

### Option 1: Add Node.js Service (Recommended for Docker)

If you're using Docker/Docker Compose:

1. **Build and deploy the new service:**
   ```bash
   docker-compose up -d --build nodejs-service
   ```

2. **Restart nginx:**
   ```bash
   docker-compose restart frontend
   ```

3. **Verify it's running:**
   ```bash
   docker ps | grep nodejs
   ```

4. **Set environment variables:**
   ```bash
   export EMAIL_USER=your-email@gmail.com
   export EMAIL_PASS=your-app-password
   ```

The nginx config will automatically route `/api/auth/forgot-password` requests to the Node.js service.

### Option 2: Standalone Node.js Server (If not using Docker)

If your production server doesn't use Docker:

1. **Install dependencies:**
   ```bash
   npm install bcrypt better-sqlite3 express cors nodemailer stripe
   ```

2. **Set environment variables:**
   ```bash
   export EMAIL_USER=your-email@gmail.com
   export EMAIL_PASS=your-app-password
   export PORT=8081
   ```

3. **Run server.js:**
   ```bash
   node server.js
   ```

4. **Configure your reverse proxy (nginx/apache) to route:**
   - `POST /api/auth/forgot-password` → `http://localhost:8081/api/auth/forgot-password`
   - `POST /api/auth/verify-reset-code` → `http://localhost:8081/api/auth/verify-reset-code`
   - `POST /api/auth/reset-password` → `http://localhost:8081/api/auth/reset-password`

### Option 3: Add to Java Backend (Long-term Solution)

If you want to keep everything in Java Spring Boot:

1. Add these endpoints to your `AuthController.java`:
   ```java
   @PostMapping("/api/auth/forgot-password")
   @PostMapping("/api/auth/verify-reset-code")
   @PostMapping("/api/auth/reset-password")
   ```

2. Implement the logic using your existing email service and database.

## Testing

After deployment, test with:

```bash
curl -X POST https://www.theglitch.world/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

You should get a `200 OK` response instead of `405 Method Not Allowed`.

## Current Status

✅ **Frontend**: Ready and calling correct endpoints
✅ **server.js**: Has all 3 password reset endpoints implemented
✅ **Database**: SQLite integration ready
✅ **Email**: Configured with nodemailer

⚠️ **Backend**: Needs to be deployed/running

## Troubleshooting

**If still getting 405:**
1. Check if Node.js service is running: `docker ps` or `ps aux | grep node`
2. Check nginx logs: `docker logs frontend` or `/var/log/nginx/error.log`
3. Verify route is correct in nginx config
4. Test Node.js service directly: `curl http://localhost:8081/api/auth/forgot-password -X POST -d '{"email":"test"}'`

**If getting connection errors:**
- Verify Node.js service is accessible on port 8081 (or configured port)
- Check firewall rules
- Verify docker network connectivity

