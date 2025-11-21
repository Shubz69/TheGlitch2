// Railway WebSocket Server for glitch-realtime
// This server handles WebSocket connections with STOMP protocol
// Deploy this to Railway as the glitch-realtime service

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Server } = require('stompjs');

const app = express();
const PORT = process.env.PORT || 8080; // CRITICAL: Use Railway's PORT

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server
// This is crucial for Railway - the WebSocket server must be attached to the HTTP server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws' // Handle WebSocket connections at /ws
});

// STOMP server setup
const stompServer = new Server({
  server: wss,
  debug: (str) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('STOMP:', str);
    }
  }
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  // Handle STOMP protocol
  stompServer.handleProtocol(ws);
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Handle STOMP subscriptions
stompServer.on('subscribe', (frame) => {
  console.log('STOMP subscribe:', frame.destination);
});

stompServer.on('unsubscribe', (frame) => {
  console.log('STOMP unsubscribe:', frame.destination);
});

stompServer.on('send', (frame) => {
  console.log('STOMP send:', frame.destination);
  
  // Broadcast message to all subscribers of the destination
  const destination = frame.destination;
  const message = frame.body;
  
  // Find all clients subscribed to this destination and send the message
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.subscriptions) {
      if (client.subscriptions.has(destination)) {
        client.send(JSON.stringify({
          destination: destination,
          body: message
        }));
      }
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'glitch-realtime',
    port: PORT,
    websocket: 'active'
  });
});

// Start server - CRITICAL: Use process.env.PORT for Railway
server.listen(PORT, () => {
  console.log(`Realtime server listening on ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

