// Vercel serverless function for signup email verification
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

// Function to create transporter
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
    
    // Test the transporter
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email transporter verified successfully');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Generate 6-digit code
const generateVerificationCode = () => {
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
      ssl: process.env.MYSQL_SSL === 'true' ? {} : false
    });
    
    // Create signup_verification_codes table if it doesn't exist
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

// Check if email already exists in users table
const checkEmailExists = async (email) => {
  const db = await getDbConnection();
  if (!db) {
    return null; // Can't check if DB not available
  }

  try {
    const [users] = await db.execute(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );
    await db.end();
    return users.length > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error.message);
    await db.end();
    return null; // Return null on error (don't reveal if email exists)
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
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid email address is required' 
      });
    }

    const emailLower = email.toLowerCase();

    // Check if email already exists in the system
    const emailExists = await checkEmailExists(emailLower);
    if (emailExists === true) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists. Please sign in instead.' 
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiration

    // Store code in database
    const db = await getDbConnection();
    if (db) {
      try {
        // Delete any existing codes for this email
        await db.execute('DELETE FROM signup_verification_codes WHERE email = ?', [emailLower]);
        
        // Insert new code
        await db.execute(
          'INSERT INTO signup_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
          [emailLower, code, expiresAt]
        );
        await db.end();
      } catch (dbError) {
        console.error('Database error storing verification code:', dbError);
        await db.end();
        // Continue to try sending email even if DB fails
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
      from: `"THE GLITCH" <${process.env.EMAIL_USER.trim()}>`,
      to: emailLower,
      subject: 'THE GLITCH - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a1a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; font-size: 32px; margin: 0;">THE GLITCH</h1>
          </div>
          <div style="background-color: #1a0f2e; padding: 30px; border-radius: 10px; border: 1px solid #8B5CF6;">
            <h2 style="color: #8B5CF6; margin-top: 0;">Email Verification Required</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for signing up for THE GLITCH! To complete your registration and verify your email address, please use the following verification code:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #251a3a; padding: 20px 40px; border-radius: 8px; border: 2px solid #8B5CF6;">
                <span style="font-size: 36px; font-weight: bold; color: #8B5CF6; letter-spacing: 5px;">${code}</span>
              </div>
            </div>
            <p style="font-size: 14px; color: #cccccc; margin-top: 30px;">
              This code will expire in 10 minutes. If you didn't request this verification code, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #cccccc; margin-top: 20px;">
              Welcome to THE GLITCH - where wealth meets opportunity! 💰🚀
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Signup verification code sent to ${emailLower}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent successfully' 
    });
  } catch (error) {
    console.error('Error sending signup verification email:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification email. Please try again later.' 
    });
  }
};

