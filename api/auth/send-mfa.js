const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

// Function to create email transporter
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing EMAIL_USER or EMAIL_PASS environment variables');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim()
      }
    });
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Generate 6-digit MFA code
const generateMFACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    
    // Create mfa_codes table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mfa_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_email (email),
        INDEX idx_expires (expires_at)
      )
    `);
    
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
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID or email is required' 
      });
    }

    const emailLower = (email || '').toLowerCase();

    // Generate MFA code
    const code = generateMFACode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiration

    // Store code in database
    const db = await getDbConnection();
    if (db) {
      try {
        // Delete any existing codes for this user
        if (userId) {
          await db.execute('DELETE FROM mfa_codes WHERE user_id = ?', [userId]);
        } else if (emailLower) {
          await db.execute('DELETE FROM mfa_codes WHERE email = ?', [emailLower]);
        }
        
        // Insert new code
        await db.execute(
          'INSERT INTO mfa_codes (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)',
          [userId || null, emailLower, code, expiresAt]
        );
        await db.end();
      } catch (dbError) {
        console.error('Database error storing MFA code:', dbError);
        await db.end();
      }
    }

    // Send email
    const transporter = createEmailTransporter();
    if (!transporter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email service is not configured. Please contact support.' 
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: 'THE GLITCH - MFA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">THE GLITCH - MFA Verification</h2>
          <p>Your MFA verification code is:</p>
          <div style="background: #1a0f2e; color: #8B5CF6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`MFA code sent to ${emailLower}`);

    return res.status(200).json({ 
      success: true, 
      message: req.body.resend ? 'MFA code resent successfully' : 'MFA code sent successfully' 
    });
  } catch (error) {
    console.error('Error sending MFA code:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send MFA code. Please try again later.' 
    });
  }
};

