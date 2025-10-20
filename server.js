// Simple Express server with Stripe integration + Realtime messaging and persistence
const express = require('express');
const http = require('http');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key-here');
const path = require('path');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});
const port = process.env.PORT || 8080;

// Feature flag
const enableAdminDMs = process.env.ENABLE_ADMIN_DMS !== 'false';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email sending function
async function sendEmail(to, subject, text, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      text: text,
      html: html
    };
    
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] Sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Simple in-memory rate-limit map per user for message sends (basic abuse protection)
const rateWindowMs = 10_000; // 10s window
const maxMessagesPerWindow = 20;
const sendBuckets = new Map(); // key: userId, value: { windowStart, count }

function canSend(userId) {
  const now = nowMs();
  const bucket = sendBuckets.get(userId) || { windowStart: now, count: 0 };
  if (now - bucket.windowStart > rateWindowMs) {
    bucket.windowStart = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  sendBuckets.set(userId, bucket);
  return bucket.count <= maxMessagesPerWindow;
}

// --- Simple mock auth middleware (JWT-less) based on localStorage flow ---
// Expect Authorization: Bearer <base64jwt> where payload contains { sub, role }
function parseMockJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (_) {
    return null;
  }
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = parseMockJwt(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = { id: String(payload.sub), role: payload.role || 'USER', email: payload.email || '' };
  next();
}

// --- Database setup (SQLite via better-sqlite3) ---
const db = new Database(path.join(__dirname, 'data.sqlite3'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  passwordHash TEXT
);

CREATE TABLE IF NOT EXISTS admin_user_threads (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  lastMessageAt INTEGER,
  unreadCountForAdmin INTEGER DEFAULT 0,
  unreadCountForUser INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  recipientId TEXT NOT NULL,
  body TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  editedAt INTEGER,
  status TEXT DEFAULT 'sent'
);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(threadId, createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_status ON messages(recipientId, status);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS channel_messages (
  id TEXT PRIMARY KEY,
  channelId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  body TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  editedAt INTEGER,
  status TEXT DEFAULT 'sent'
);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created ON channel_messages(channelId, createdAt);

CREATE TABLE IF NOT EXISTS mfa_codes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  codeHash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mfa_codes_user_purpose ON mfa_codes(userId, purpose);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(userId);
`);

function nowMs() { return Date.now(); }
function newId() { return 'id_' + Math.random().toString(36).slice(2) + nowMs().toString(36); }
function isAdmin(user) { return user && user.role === 'ADMIN'; }
function sanitizeBody(text) {
  const max = 5000;
  const trimmed = String(text || '').slice(0, max);
  return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
}
function sha256Hex(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

// --- Simple metrics ---
const metrics = {
  messagesCreated: 0,
  channelMessagesCreated: 0,
  activeConnections: 0,
  errors: 0
};

// Mock course data
const courses = [
  { id: 1, title: "Intro to Trading", description: "Learn the basics of trading.", price: 0.3 },
  { id: 2, title: "Technical Analysis", description: "Master chart patterns and indicators.", price: 0.3 },
  { id: 3, title: "Fundamental Analysis", description: "Analyze financial statements.", price: 0.3 },
  { id: 4, title: "Crypto Trading", description: "Trade crypto assets effectively.", price: 0.3 },
  { id: 5, title: "Day Trading", description: "Master intraday trading strategies.", price: 0.3 },
  { id: 6, title: "Swing Trading", description: "Profit from market swings.", price: 0.3 }
];

// Direct checkout endpoint - no authentication required
app.get('/api/payments/checkout-direct', async (req, res) => {
  try {
    // Get course ID from query parameters
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Find course by ID
    const course = courses.find(c => c.id.toString() === courseId.toString());
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/payment-success?courseId=${courseId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/courses`,
    });
    
    // Redirect to Stripe checkout
    return res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Payment success webhook
app.post('/api/payments/complete', (req, res) => {
  // In a real application, you would verify the payment with Stripe
  // and update your database accordingly
  
  return res.json({ 
    success: true, 
    message: 'Payment completed successfully' 
  });
});

// --- Auth: Forgot Password + MFA + Reset ---
const resetRate = new Map(); // key: email, value: { windowStart, count }
const resetWindowMs = 10 * 60 * 1000; // 10 minutes
const maxResetRequests = 5;

function canRequestReset(email) {
  const now = nowMs();
  const bucket = resetRate.get(email) || { windowStart: now, count: 0 };
  if (now - bucket.windowStart > resetWindowMs) { bucket.windowStart = now; bucket.count = 0; }
  bucket.count += 1; resetRate.set(email, bucket); return bucket.count <= maxResetRequests;
}

// Step 1: Request reset (sends MFA code and/or prepares token)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = (req.body && req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!canRequestReset(email)) return res.status(429).json({ error: 'Too many requests' });

    // Find or create user by email for demo purposes
    let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user) {
      user = { id: newId(), email, name: email.split('@')[0], role: 'USER', passwordHash: sha256Hex('password') };
      db.prepare(`INSERT INTO users (id, email, name, role, passwordHash) VALUES (@id, @email, @name, @role, @passwordHash)`).run(user);
    }

    const code = generateNumericCode(6);
    const codeHash = sha256Hex(code);
    const expiresAt = nowMs() + 15 * 60 * 1000; // 15 minutes
    const codeRow = { id: newId(), userId: user.id, codeHash, purpose: 'password_reset', expiresAt, createdAt: nowMs() };
    db.prepare(`INSERT INTO mfa_codes (id, userId, codeHash, purpose, expiresAt, createdAt) VALUES (@id, @userId, @codeHash, @purpose, @expiresAt, @createdAt)`).run(codeRow);

    console.log('[AUTH] Password reset code for', email, 'is', code);
    
    // Send email with reset code
    const emailSubject = 'THE GLITCH - Password Reset Code';
    const emailText = `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">THE GLITCH - Password Reset</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #6366f1; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">© 2023 THE GLITCH. All rights reserved.</p>
      </div>
    `;
    
    const emailResult = await sendEmail(email, emailSubject, emailText, emailHtml);
    
    if (emailResult.success) {
      return res.json({ success: true, message: 'Password reset code sent to your email' });
    } else {
      console.error('[AUTH] Email sending failed:', emailResult.error);
      return res.json({ success: true, message: 'Password reset code generated (email sending failed)' });
    }
  } catch (e) {
    console.error('POST /api/auth/forgot-password error', e);
    return res.status(500).json({ error: 'Failed to initiate reset' });
  }
});

// Step 2: Verify MFA code and issue short-lived reset token
app.post('/api/auth/verify-reset', (req, res) => {
  try {
    const email = (req.body && req.body.email || '').toLowerCase().trim();
    const code = (req.body && req.body.code || '').trim();
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user) return res.status(400).json({ error: 'Invalid code' });
    const codeHash = sha256Hex(code);
    const row = db.prepare(`SELECT * FROM mfa_codes WHERE userId = ? AND purpose = 'password_reset' ORDER BY createdAt DESC`).get(user.id);
    if (!row || row.codeHash !== codeHash || row.expiresAt < nowMs()) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    // Issue token
    const token = newId();
    const tokenRow = { id: newId(), userId: user.id, tokenHash: sha256Hex(token), expiresAt: nowMs() + 15 * 60 * 1000, used: 0, createdAt: nowMs() };
    db.prepare(`INSERT INTO password_reset_tokens (id, userId, tokenHash, expiresAt, used, createdAt) VALUES (@id, @userId, @tokenHash, @expiresAt, @used, @createdAt)`).run(tokenRow);
    // In production: email link with /reset-password?token=token
    console.log('[AUTH] Reset link for', email, `is /reset-password?token=${token}`);
    return res.json({ success: true, token });
  } catch (e) {
    console.error('POST /api/auth/verify-reset error', e);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Step 3: Reset password using token or code
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const tokenOrCode = req.body && (req.body.token || req.body.code || req.body.resetCode || req.body.sessionToken || req.body.tokenOrCode);
    const newPassword = req.body && (req.body.password || req.body.newPassword);
    if (!tokenOrCode || !newPassword) return res.status(400).json({ error: 'Token/code and new password required' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password too short' });

    const now = nowMs();
    let userId = null;
    // Try token path
    const tokenHash = sha256Hex(tokenOrCode);
    const tokenRow = db.prepare(`SELECT * FROM password_reset_tokens WHERE tokenHash = ?`).get(tokenHash);
    if (tokenRow && !tokenRow.used && tokenRow.expiresAt > now) {
      userId = tokenRow.userId;
      db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE id = ?`).run(tokenRow.id);
    } else {
      // Try code path (latest code)
      const codeHash = sha256Hex(tokenOrCode);
      const candidate = db.prepare(`SELECT * FROM mfa_codes WHERE codeHash = ? AND purpose = 'password_reset' ORDER BY createdAt DESC`).get(codeHash);
      if (!candidate || candidate.expiresAt < now) return res.status(400).json({ error: 'Invalid or expired token' });
      userId = candidate.userId;
    }
    if (!userId) return res.status(400).json({ error: 'Invalid reset request' });

    const passwordHash = sha256Hex(newPassword);
    db.prepare(`UPDATE users SET passwordHash = ? WHERE id = ?`).run(passwordHash, userId);
    console.log('[AUTH] Password changed for user', userId, 'at', new Date().toISOString());
    // In production: send confirmation email
    return res.json({ success: true });
  } catch (e) {
    console.error('POST /api/auth/reset-password error', e);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// --- Admin <-> User Threads ---
if (enableAdminDMs) {
  // List threads
  app.get('/api/threads', authRequired, (req, res) => {
    try {
      if (isAdmin(req.user)) {
        const rows = db.prepare(`SELECT * FROM admin_user_threads ORDER BY lastMessageAt DESC NULLS LAST`).all();
        return res.json({ threads: rows });
      }
      const thread = db.prepare(`SELECT * FROM admin_user_threads WHERE userId = ?`).get(String(req.user.id));
      if (!thread) return res.json({ threads: [] });
      return res.json({ threads: [thread] });
    } catch (e) {
      console.error('GET /api/threads error', e);
      res.status(500).json({ error: 'Failed to list threads' });
    }
  });

  // Get messages (paginated by timestamp cursor)
  app.get('/api/threads/:threadId/messages', authRequired, (req, res) => {
    try {
      const { threadId } = req.params;
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
      const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : null;

      const thread = db.prepare(`SELECT * FROM admin_user_threads WHERE id = ?`).get(threadId);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (!isAdmin(req.user) && String(req.user.id) !== String(thread.userId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      let rows;
      if (cursor) {
        rows = db.prepare(`SELECT * FROM messages WHERE threadId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?`).all(threadId, cursor, limit);
      } else {
        rows = db.prepare(`SELECT * FROM messages WHERE threadId = ? ORDER BY createdAt DESC LIMIT ?`).all(threadId, limit);
      }
      const hasMore = rows.length === limit;
      return res.json({ messages: rows.reverse(), nextCursor: rows.length ? rows[0].createdAt : null, hasMore });
    } catch (e) {
      console.error('GET /api/threads/:threadId/messages error', e);
      res.status(500).json({ error: 'Failed to load messages' });
    }
  });

  // Send message
  app.post('/api/threads/:threadId/messages', authRequired, (req, res) => {
    try {
      if (!canSend(String(req.user.id))) return res.status(429).json({ error: 'Rate limit exceeded' });
      const { threadId } = req.params;
      const thread = db.prepare(`SELECT * FROM admin_user_threads WHERE id = ?`).get(threadId);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (!isAdmin(req.user) && String(req.user.id) !== String(thread.userId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const body = sanitizeBody(req.body && req.body.body);
      if (!body) return res.status(400).json({ error: 'Message body required' });

      // Determine recipient: if sender is admin, recipient is thread.userId; else recipient is 'ADMIN'
      const senderId = String(req.user.id);
      const recipientId = isAdmin(req.user) ? String(thread.userId) : 'ADMIN';

      const message = {
        id: newId(),
        threadId,
        senderId,
        recipientId,
        body,
        createdAt: nowMs(),
        editedAt: null,
        status: 'sent'
      };

      const insert = db.prepare(`INSERT INTO messages (id, threadId, senderId, recipientId, body, createdAt, editedAt, status) VALUES (@id, @threadId, @senderId, @recipientId, @body, @createdAt, @editedAt, @status)`);
      insert.run(message);
      metrics.messagesCreated++;

      // Update thread metadata and unread counters
      if (isAdmin(req.user)) {
        db.prepare(`UPDATE admin_user_threads SET lastMessageAt = ?, unreadCountForUser = unreadCountForUser + 1 WHERE id = ?`).run(message.createdAt, threadId);
      } else {
        db.prepare(`UPDATE admin_user_threads SET lastMessageAt = ?, unreadCountForAdmin = unreadCountForAdmin + 1 WHERE id = ?`).run(message.createdAt, threadId);
      }

      // Broadcast after persistence, include unread counters snapshot
      const updatedThread = db.prepare(`SELECT * FROM admin_user_threads WHERE id = ?`).get(threadId);
      io.to(`thread:${threadId}`).emit('thread:new_message', { threadId, message, thread: updatedThread });
      return res.status(201).json({ message });
    } catch (e) {
      console.error('POST /api/threads/:threadId/messages error', e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Mark read
  app.post('/api/threads/:threadId/read', authRequired, (req, res) => {
    try {
      const { threadId } = req.params;
      const thread = db.prepare(`SELECT * FROM admin_user_threads WHERE id = ?`).get(threadId);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (!isAdmin(req.user) && String(req.user.id) !== String(thread.userId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (isAdmin(req.user)) {
        db.prepare(`UPDATE admin_user_threads SET unreadCountForAdmin = 0 WHERE id = ?`).run(threadId);
        db.prepare(`UPDATE messages SET status = 'read' WHERE threadId = ? AND recipientId = 'ADMIN'`).run(threadId);
      } else {
        db.prepare(`UPDATE admin_user_threads SET unreadCountForUser = 0 WHERE id = ?`).run(threadId);
        db.prepare(`UPDATE messages SET status = 'read' WHERE threadId = ? AND recipientId = ?`).run(threadId, String(thread.userId));
      }

      const updated = db.prepare(`SELECT * FROM admin_user_threads WHERE id = ?`).get(threadId);
      io.to(`thread:${threadId}`).emit('thread:read', { threadId, thread: updated });
      return res.json({ success: true });
    } catch (e) {
      console.error('POST /api/threads/:threadId/read error', e);
      res.status(500).json({ error: 'Failed to mark read' });
    }
  });
}

// Ensure a thread exists for a user; expose a helper endpoint for user to get/create their thread
app.post('/api/threads/ensure', authRequired, (req, res) => {
  try {
    if (!enableAdminDMs) return res.status(404).json({ error: 'Feature disabled' });
    if (isAdmin(req.user)) return res.status(400).json({ error: 'Only users create their own thread' });
    const existing = db.prepare(`SELECT * FROM admin_user_threads WHERE userId = ?`).get(String(req.user.id));
    if (existing) return res.json({ thread: existing });
    const thread = { id: newId(), userId: String(req.user.id), lastMessageAt: null, unreadCountForAdmin: 0, unreadCountForUser: 0 };
    db.prepare(`INSERT INTO admin_user_threads (id, userId, lastMessageAt, unreadCountForAdmin, unreadCountForUser) VALUES (@id, @userId, @lastMessageAt, @unreadCountForAdmin, @unreadCountForUser)`).run(thread);
    return res.status(201).json({ thread });
  } catch (e) {
    console.error('POST /api/threads/ensure error', e);
    res.status(500).json({ error: 'Failed to ensure thread' });
  }
});

// --- Community Channels ---
app.get('/api/channels/:channelId/messages', authRequired, (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : null;
    let rows;
    if (cursor) {
      rows = db.prepare(`SELECT * FROM channel_messages WHERE channelId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?`).all(channelId, cursor, limit);
    } else {
      rows = db.prepare(`SELECT * FROM channel_messages WHERE channelId = ? ORDER BY createdAt DESC LIMIT ?`).all(channelId, limit);
    }
    const hasMore = rows.length === limit;
    return res.json({ messages: rows.reverse(), nextCursor: rows.length ? rows[0].createdAt : null, hasMore });
  } catch (e) {
    console.error('GET /api/channels/:channelId/messages error', e);
    res.status(500).json({ error: 'Failed to load channel messages' });
  }
});

app.post('/api/channels/:channelId/messages', authRequired, (req, res) => {
  try {
    const { channelId } = req.params;
    const body = sanitizeBody(req.body && req.body.body);
    if (!body) return res.status(400).json({ error: 'Message body required' });
    if (!canSend(String(req.user.id))) return res.status(429).json({ error: 'Rate limit exceeded' });
    const message = { id: newId(), channelId, senderId: String(req.user.id), body, createdAt: nowMs(), editedAt: null, status: 'sent' };
    db.prepare(`INSERT INTO channel_messages (id, channelId, senderId, body, createdAt, editedAt, status) VALUES (@id, @channelId, @senderId, @body, @createdAt, @editedAt, @status)`).run(message);
    metrics.channelMessagesCreated++;
    io.to(`channel:${channelId}`).emit('channel:new_message', { channelId, message });
    return res.status(201).json({ message });
  } catch (e) {
    console.error('POST /api/channels/:channelId/messages error', e);
    res.status(500).json({ error: 'Failed to send channel message' });
  }
});

// --- Socket.IO realtime ---
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  metrics.activeConnections++;
  // Simple auth via query for role/id (for demo); in production swap for proper auth
  const userId = socket.handshake.auth && socket.handshake.auth.userId ? String(socket.handshake.auth.userId) : null;
  const role = socket.handshake.auth && socket.handshake.auth.role ? socket.handshake.auth.role : 'USER';

  socket.on('thread:join', ({ threadId }) => {
    socket.join(`thread:${threadId}`);
  });

  socket.on('channel:join', ({ channelId }) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
  });
});

// Chatbot API endpoint
app.post('/api/chatbot', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context if available
    const user = req.user || null;
    const isLoggedIn = !!user;
    
    // Generate AI response based on message and user context
    const response = generateChatbotResponse(message, isLoggedIn, user);
    
    res.json({ 
      success: true,
      reply: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process message' 
    });
  }
});

// Chatbot response generation function
function generateChatbotResponse(message, isLoggedIn, user) {
  const msg = message.toLowerCase();
  
  // Greetings
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return isLoggedIn 
      ? `Hello ${user?.name || 'there'}! Welcome back to THE GLITCH. How can I assist you today?`
      : "Hello! Welcome to THE GLITCH. I'm here to help you learn about our trading platform. How can I assist you?";
  }
  
  // Course related queries
  if (msg.includes("course") || msg.includes("learn") || msg.includes("study")) {
    if (msg.includes("beginner") || msg.includes("start")) {
      return "Perfect! We offer several beginner-friendly courses. Start with our free 'Introduction to Trading' course. Visit the Courses page to explore all available options.";
    }
    if (msg.includes("price") || msg.includes("cost")) {
      return "We have courses ranging from free to $79.99. Our premium membership ($19.99/month) gives you access to all courses plus exclusive features.";
    }
    return "We offer comprehensive trading courses covering stocks, forex, crypto, and more. Each course includes video lessons, quizzes, and practical exercises.";
  }
  
  // Platform features
  if (msg.includes("feature") || msg.includes("tool") || msg.includes("what can")) {
    return "THE GLITCH offers: 📚 Educational courses, 💬 Community discussions, 📊 Trading insights, 🎯 Personalized learning paths, and 24/7 AI support. What interests you most?";
  }
  
  // Community related
  if (msg.includes("community") || msg.includes("chat") || msg.includes("discuss")) {
    return isLoggedIn 
      ? "Great! You can access our community through the Community tab. Connect with other traders, share strategies, and get help from experienced members."
      : "Our community is available after you sign up! It's a great place to connect with fellow traders and learn from their experiences.";
  }
  
  // Trading related
  if (msg.includes("trade") || msg.includes("trading") || msg.includes("market")) {
    return "THE GLITCH focuses on education and strategy development. We teach you how to analyze markets, manage risk, and develop profitable trading strategies. We don't provide direct trading - we teach you how to trade successfully!";
  }
  
  // Support
  if (msg.includes("help") || msg.includes("support") || msg.includes("problem")) {
    return "I'm here to help! For technical issues, contact our support team via the Contact page. For trading questions or platform guidance, feel free to ask me anything!";
  }
  
  // About the platform
  if (msg.includes("about") || msg.includes("what is") || msg.includes("platform")) {
    return "THE GLITCH is your comprehensive trading education platform. We help you build generational wealth through 8 powerful domains: Health & Fitness, E-Commerce, Forex, Crypto, Algorithmic FX, Intelligent Systems, Social Media, and Real Estate.";
  }
  
  // Pricing
  if (msg.includes("price") || msg.includes("cost") || msg.includes("subscription")) {
    return "We offer flexible pricing: Free courses available, Premium membership at $19.99/month, and individual courses from free to $79.99. Start with our free content and upgrade as you grow!";
  }
  
  // Default response
  return "That's an interesting question! I'm here to help you learn about THE GLITCH platform, our courses, and trading strategies. Could you be more specific about what you'd like to know?";
}

// Courses API endpoint
app.get('/api/courses', (req, res) => {
  try {
    res.json({ 
      success: true,
      data: courses 
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch courses' 
    });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// To use this server:
// 1. Install required packages: npm install express cors stripe
// 2. Save this file as server.js in your project root
// 3. Replace 'your_stripe_secret_key' with your actual Stripe secret key
// 4. Run with: node server.js 