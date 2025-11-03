#!/bin/bash

# Password Reset Server Startup Script
# Run this on your production server to start the password reset service

echo "Starting Password Reset Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install bcrypt better-sqlite3 express cors nodemailer

# Check environment variables
if [ -z "$EMAIL_USER" ]; then
    echo "WARNING: EMAIL_USER environment variable not set."
    echo "Set it with: export EMAIL_USER=your-email@gmail.com"
fi

if [ -z "$EMAIL_PASS" ]; then
    echo "WARNING: EMAIL_PASS environment variable not set."
    echo "Set it with: export EMAIL_PASS=your-app-password"
fi

# Start the server
echo "Starting server on port 8080..."
echo "Server will run in the background. Logs: server.log"
nohup node server.js > server.log 2>&1 &

echo "✅ Password reset server started!"
echo "PID: $!"
echo "Check logs with: tail -f server.log"

