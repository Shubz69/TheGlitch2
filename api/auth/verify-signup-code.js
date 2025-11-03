// Vercel serverless function for verifying signup email code
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
    
    // Ensure signup_verification_codes table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS signup_verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_expires (expires_at)
      )
    `);
    
    return connection;
  } catch (error) {
    console.error('Database connection error:', error.message);
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
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    const emailLower = email.toLowerCase();

    // Retrieve code from database
    const db = await getDbConnection();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.' 
      });
    }

    try {
      const [rows] = await db.execute(
        'SELECT * FROM signup_verification_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
        [emailLower, code]
      );

      if (!rows || rows.length === 0) {
        await db.end();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid verification code' 
        });
      }

      const verificationRecord = rows[0];

      // Check if code has expired
      if (Date.now() > verificationRecord.expires_at) {
        // Delete expired code
        await db.execute('DELETE FROM signup_verification_codes WHERE email = ?', [emailLower]);
        await db.end();
        return res.status(400).json({ 
          success: false, 
          message: 'Verification code has expired. Please request a new one.' 
        });
      }

      // Code is valid - delete it so it can't be reused
      await db.execute('DELETE FROM signup_verification_codes WHERE email = ?', [emailLower]);
      await db.end();

      return res.status(200).json({ 
        success: true, 
        verified: true,
        message: 'Email verified successfully' 
      });
    } catch (dbError) {
      console.error('Database error verifying code:', dbError);
      await db.end();
      return res.status(500).json({ 
        success: false, 
        message: 'Database error. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Error verifying signup code:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify code. Please try again later.' 
    });
  }
};

