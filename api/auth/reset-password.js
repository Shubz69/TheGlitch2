// Vercel serverless function for reset password
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

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
    const { token, newPassword } = req.body;

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

    // Decode token
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Check if token expired
    if (Date.now() > tokenData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Token has expired'
      });
    }

    // Hash the new password
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process password reset'
      });
    }

    // Update password in the database
    // Try MySQL connection first (for Java backend database)
    let passwordUpdated = false;

    // Try MySQL database connection
    if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE) {
      try {
        const connection = await mysql.createConnection({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          ssl: process.env.MYSQL_SSL === 'true' ? {} : false
        });

        // Update password in users table
        const [result] = await connection.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, tokenData.email.toLowerCase()]
        );

        await connection.end();

        if (result.affectedRows > 0) {
          console.log(`Password reset for ${tokenData.email} - updated in MySQL database`);
          passwordUpdated = true;
        } else {
          console.warn(`Password reset for ${tokenData.email} - user not found in database`);
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
      } catch (dbError) {
        console.error('MySQL update error:', dbError.message);
        // Continue to try backend API as fallback
      }
    }

    // Fallback: Try backend API endpoint
    if (!passwordUpdated) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'https://theglitch.world';
        const fetch = require('node-fetch');
        
        const updateResponse = await fetch(`${backendUrl}/api/auth/update-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: tokenData.email,
            password: hashedPassword
          })
        });

        if (updateResponse.ok) {
          console.log(`Password reset for ${tokenData.email} - updated via backend API`);
          passwordUpdated = true;
        }
      } catch (backendError) {
        console.error('Backend API update error:', backendError.message);
      }
    }

    // If still not updated, return error
    if (!passwordUpdated) {
      console.error(`CRITICAL: Password reset for ${tokenData.email} - password hashed but NOT saved to database`);
      return res.status(500).json({
        success: false,
        message: 'Password reset failed. Database connection unavailable. Please contact support.'
      });
    }

    // Success - password updated in database
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

