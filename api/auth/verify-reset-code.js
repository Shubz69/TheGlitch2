// Vercel serverless function for verify reset code
const mysql = require('mysql2/promise');

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
      ssl: process.env.MYSQL_SSL === 'true' ? {} : false
    });
    
    return connection;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const emailLower = email.toLowerCase();
    
    // Retrieve code from MySQL database
    const db = await getDbConnection();
    
    if (!db) {
      // Fallback to in-memory storage if DB not configured
      if (typeof global !== 'undefined') {
        if (!global.resetCodesStore) {
          global.resetCodesStore = new Map();
        }
        const stored = global.resetCodesStore.get(emailLower);
        
        if (!stored) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired code'
          });
        }

        if (Date.now() > stored.expiresAt) {
          global.resetCodesStore.delete(emailLower);
          return res.status(400).json({
            success: false,
            message: 'Code has expired'
          });
        }

        if (stored.code !== code) {
          return res.status(400).json({
            success: false,
            message: 'Invalid code'
          });
        }

        global.resetCodesStore.delete(emailLower);
      } else {
        return res.status(500).json({
          success: false,
          message: 'Database not configured. Please contact support.'
        });
      }
    } else {
      try {
        // Get code from database
        const [rows] = await db.execute(
          'SELECT * FROM reset_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
          [emailLower, code]
        );

        if (rows.length === 0) {
          await db.end();
          return res.status(400).json({
            success: false,
            message: 'Invalid code'
          });
        }

        const stored = rows[0];

        // Check if expired
        if (Date.now() > stored.expires_at) {
          await db.execute('DELETE FROM reset_codes WHERE email = ?', [emailLower]);
          await db.end();
          return res.status(400).json({
            success: false,
            message: 'Code has expired'
          });
        }

        // Delete used code
        await db.execute('DELETE FROM reset_codes WHERE email = ?', [emailLower]);
        await db.end();
        console.log(`Reset code verified for ${emailLower}`);
      } catch (dbError) {
        console.error('Database error verifying code:', dbError.message);
        await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to verify code'
        });
      }
    }

    // Generate reset token
    const resetToken = Buffer.from(JSON.stringify({
      email: email,
      code: code,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    })).toString('base64');

    return res.status(200).json({
      success: true,
      token: resetToken,
      message: 'Code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
};

