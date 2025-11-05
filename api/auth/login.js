const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return null;
  }

  try {
    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      connectTimeout: 10000
    };

    if (process.env.MYSQL_SSL === 'true') {
      connectionConfig.ssl = { rejectUnauthorized: false };
    } else {
      connectionConfig.ssl = false;
    }

    const connection = await mysql.createConnection(connectionConfig);
    await connection.ping();
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const emailLower = email.toLowerCase();

    // Connect to database
    const db = await getDbConnection();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    try {
      // Find user by email
      const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [emailLower]
      );

      if (!users || users.length === 0) {
        await db.end();
        return res.status(401).json({
          success: false,
          message: 'The account connected to this email is not in use'
        });
      }

      const user = users[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        await db.end();
        return res.status(401).json({
          success: false,
          message: 'Incorrect password for this account'
        });
      }

      // Update last_seen
      await db.execute(
        'UPDATE users SET last_seen = NOW() WHERE id = ?',
        [user.id]
      );

      // Generate JWT token (3-part format: header.payload.signature)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        role: user.role || 'USER',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      })).toString('base64url');
      const signature = Buffer.from('signature').toString('base64url');
      const token = `${header}.${payload}.${signature}`;

      await db.end();

      return res.status(200).json({
        success: true,
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        name: user.name || user.username,
        avatar: user.avatar || '/avatars/avatar_ai.png',
        role: user.role || 'USER',
        token: token,
        status: 'SUCCESS'
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      await db.end();
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
};

