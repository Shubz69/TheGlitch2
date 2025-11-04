const mysql = require('mysql2/promise');
// Note: Using simple base64 token encoding instead of jwt library for Vercel compatibility

// Get MySQL connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return null;
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
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
    const { userId, code, email } = req.body;

    if (!code || (!userId && !email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code and user ID or email are required' 
      });
    }

    const emailLower = email ? email.toLowerCase() : null;

    // Retrieve code from database
    const db = await getDbConnection();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.' 
      });
    }

    try {
      let query, params;
      if (userId) {
        query = 'SELECT * FROM mfa_codes WHERE user_id = ? AND code = ? ORDER BY created_at DESC LIMIT 1';
        params = [userId, code];
      } else {
        query = 'SELECT * FROM mfa_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1';
        params = [emailLower, code];
      }

      const [rows] = await db.execute(query, params);

      if (!rows || rows.length === 0) {
        await db.end();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid MFA code' 
        });
      }

      const mfaRecord = rows[0];

      // Check if code has expired
      if (Date.now() > mfaRecord.expires_at) {
        await db.execute('DELETE FROM mfa_codes WHERE id = ?', [mfaRecord.id]);
        await db.end();
        return res.status(400).json({ 
          success: false, 
          message: 'MFA code has expired. Please request a new one.' 
        });
      }

      // Code is valid - get user info
      let userInfo;
      if (userId) {
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (userRows && userRows.length > 0) {
          userInfo = userRows[0];
        }
      } else if (emailLower) {
        const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [emailLower]);
        if (userRows && userRows.length > 0) {
          userInfo = userRows[0];
        }
      }

      // Delete used code
      await db.execute('DELETE FROM mfa_codes WHERE id = ?', [mfaRecord.id]);
      await db.end();

      if (!userInfo) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Generate JWT token (simple version - in production use proper JWT library)
      const token = Buffer.from(JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        username: userInfo.username,
        role: userInfo.role || 'USER',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      })).toString('base64');

      return res.status(200).json({
        success: true,
        verified: true,
        token: token,
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.avatar || '/avatars/avatar_ai.png',
        role: userInfo.role || 'USER',
        mfaVerified: true
      });
    } catch (dbError) {
      console.error('Database error verifying MFA code:', dbError);
      await db.end();
      return res.status(500).json({ 
        success: false, 
        message: 'Database error. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify MFA code. Please try again later.' 
    });
  }
};

