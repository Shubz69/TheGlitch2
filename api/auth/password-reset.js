// Combined password reset endpoint - handles both verify code and reset password
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// Get MySQL connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for password-reset');
    return null;
  }

  try {
    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      connectTimeout: 10000,
      acquireTimeout: 10000
    };

    if (process.env.MYSQL_SSL === 'true') {
      connectionConfig.ssl = { rejectUnauthorized: false };
    } else {
      connectionConfig.ssl = false;
    }

    const connection = await mysql.createConnection(connectionConfig);
    
    // Test the connection
    await connection.ping();
    
    console.log('Database connection successful for password-reset');
    return connection;
  } catch (error) {
    console.error('Database connection error in password-reset:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
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
    const { action, email, code, token, newPassword } = req.body;

    // Handle verify code action
    if (action === 'verify' || (code && !token)) {
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email and code are required'
        });
      }

      const emailLower = email.toLowerCase();
      const db = await getDbConnection();
      
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured. Please contact support.'
        });
      }

      try {
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

        if (Date.now() > stored.expires_at) {
          await db.execute('DELETE FROM reset_codes WHERE email = ?', [emailLower]);
          await db.end();
          return res.status(400).json({
            success: false,
            message: 'Code has expired'
          });
        }

        await db.execute('DELETE FROM reset_codes WHERE email = ?', [emailLower]);
        await db.end();

        const resetToken = Buffer.from(JSON.stringify({
          email: email,
          code: code,
          expiresAt: Date.now() + (15 * 60 * 1000)
        })).toString('base64');

        return res.status(200).json({
          success: true,
          token: resetToken,
          message: 'Code verified successfully'
        });
      } catch (dbError) {
        console.error('Database error verifying code:', dbError.message);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          errno: dbError.errno
        });
        if (db && !db.ended) {
          await db.end();
        }
        return res.status(500).json({
          success: false,
          message: `Failed to verify code: ${dbError.message || 'Database error'}`
        });
      }
    }

    // Handle reset password action
    if (action === 'reset' || (token && newPassword)) {
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      let tokenData;
      try {
        tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (Date.now() > tokenData.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Token has expired'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const db = await getDbConnection();
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured. Please contact support.'
        });
      }

      try {
        const [result] = await db.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, tokenData.email.toLowerCase()]
        );

        await db.end();

        if (result.affectedRows > 0) {
          console.log(`Password reset for ${tokenData.email} - updated in MySQL database`);
          return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
      } catch (dbError) {
        console.error('MySQL update error:', dbError.message);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          errno: dbError.errno
        });
        if (db && !db.ended) {
          await db.end();
        }
        return res.status(500).json({
          success: false,
          message: `Failed to reset password: ${dbError.message || 'Database error'}`
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use action="verify" or action="reset"'
    });
  } catch (error) {
    console.error('Error in password-reset endpoint:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error message
    let errorMessage = 'Failed to process request';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

