# Railway WebSocket Server Setup Guide

## Problem
The Railway `glitch-realtime` service is hardcoded to port 8080 and not handling WebSocket upgrades correctly.

## Solution
Replace the Railway service code with the provided WebSocket server.

## Files Created
1. `railway-websocket-server.js` - Complete WebSocket server
2. `railway-websocket-package.json` - Dependencies file

## How to Deploy to Railway

### Option 1: Update Existing Service (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to your `glitch-realtime` service
   - Go to **Settings** → **Source**

2. **Update the Service Code**
   - If connected to GitHub: Update the repository with the new files
   - If deployed directly: Use Railway's file editor or CLI

3. **Replace the Server File**
   - Replace your current server file with `railway-websocket-server.js`
   - Update `package.json` with dependencies from `railway-websocket-package.json`

4. **Redeploy**
   - Railway will automatically detect changes and redeploy
   - Check logs to see: `Realtime server listening on [PORT]` (should show Railway's PORT, not 8080)

### Option 2: Create New Service

1. **Create New Railway Service**
   - In Railway dashboard, create a new service
   - Name it `glitch-realtime` (or keep existing name)

2. **Deploy the Code**
   - Connect to GitHub repository with the new files
   - Or use Railway CLI to deploy

3. **Set Environment Variables** (if needed)
   - Railway automatically sets `PORT` - don't override it
   - Add any other environment variables your service needs

## Key Changes Made

### ✅ Fixed Port Configuration
```javascript
// OLD (Wrong):
const server = app.listen(8080, () => {
  console.log('Realtime server listening on 8080');
});

// NEW (Correct):
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Realtime server listening on ${PORT}`);
});
```

### ✅ Proper WebSocket Server Setup
- WebSocket server attached to HTTP server (required for Railway)
- Handles `/ws` endpoint correctly
- Returns `101 Switching Protocols` for WebSocket upgrades

### ✅ STOMP Protocol Support
- Compatible with frontend STOMP client
- Handles subscriptions and message broadcasting

## Testing After Deployment

1. **Check Railway Logs**
   - Should see: `Realtime server listening on [PORT]` (not 8080)
   - Should see: `WebSocket connection established` when clients connect

2. **Test WebSocket Connection**
   - Open browser console on your app
   - Run: `new WebSocket('wss://glitch-realtime-production.up.railway.app/ws')`
   - Should connect successfully (no error 1006)

3. **Check HTTP Logs**
   - Should see `GET /ws` returning `101 Switching Protocols` (not 200)

## Troubleshooting

### Still seeing port 8080 in logs?
- Check that you replaced the server file
- Verify `process.env.PORT` is being used
- Restart the Railway service

### Still getting HTTP 200?
- Ensure WebSocket server is attached to HTTP server
- Check that `/ws` path is configured correctly
- Verify Railway service is using the new code

### Connection still failing?
- Check Railway service logs for errors
- Verify all dependencies are installed (`npm install`)
- Ensure service is "Active" in Railway dashboard

## Dependencies

The server requires:
- `express` - HTTP server
- `ws` - WebSocket library
- `stompjs` - STOMP protocol support

All listed in `railway-websocket-package.json`.

