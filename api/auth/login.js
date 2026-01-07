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
    let db = null;
    try {
      db = await getDbConnection();
      if (!db) {
        console.error('Failed to establish database connection - missing environment variables or connection failed');
        return res.status(500).json({
          success: false,
          message: 'Database connection error. Please try again later.'
        });
      }
    } catch (connError) {
      console.error('Database connection error:', connError);
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
        if (db && !db.ended) {
          try {
            await db.end();
          } catch (e) {
            console.warn('Error closing DB connection:', e.message);
          }
        }
        return res.status(404).json({
          success: false,
          message: 'No account with this email exists. Please check your email or sign up for a new account.'
        });
      }

      const user = users[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        if (db && !db.ended) {
          try {
            await db.end();
          } catch (e) {
            console.warn('Error closing DB connection:', e.message);
          }
        }
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again or reset your password.'
        });
      }

      // Check if user has MFA enabled (check mfa_verified column or mfaEnabled)
      let mfaEnabled = false;
      try {
        // Check if mfa_verified column exists and if user has MFA enabled
        const [mfaCheck] = await db.execute(
          'SELECT mfa_verified, mfaEnabled FROM users WHERE id = ?',
          [user.id]
        );
        if (mfaCheck && mfaCheck.length > 0) {
          // MFA is enabled if mfa_verified is 1 or mfaEnabled is true
          mfaEnabled = mfaCheck[0].mfa_verified === 1 || mfaCheck[0].mfaEnabled === 1 || mfaCheck[0].mfaEnabled === true;
        }
      } catch (mfaError) {
        // Column might not exist, that's okay - MFA is optional
        console.log('MFA column check:', mfaError.message);
      }

      // If MFA is enabled, send MFA code and return MFA_REQUIRED status
      if (mfaEnabled) {
        // Import nodemailer for sending MFA code
        const nodemailer = require('nodemailer');
        
        // Create email transporter
        const createEmailTransporter = () => {
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return null;
          }
          try {
            return nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER.trim(),
                pass: process.env.EMAIL_PASS.trim()
              }
            });
          } catch (error) {
            console.error('Failed to create email transporter:', error);
            return null;
          }
        };

        // Generate 6-digit MFA code
        const generateMFACode = () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        };

        const mfaCode = generateMFACode();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        // Store MFA code in database (create table if needed)
        try {
          await db.execute(`
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
          
          // Delete any existing codes for this user
          await db.execute('DELETE FROM mfa_codes WHERE user_id = ?', [user.id]);
          
          // Insert new code
          await db.execute(
            'INSERT INTO mfa_codes (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)',
            [user.id, emailLower, mfaCode, expiresAt]
          );
        } catch (mfaDbError) {
          console.error('Error storing MFA code:', mfaDbError);
        }

        // Send MFA code via email
        const transporter = createEmailTransporter();
        if (transporter) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: emailLower,
              subject: 'THE GLITCH - MFA Verification Code',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a1a; color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6; font-size: 32px; margin: 0;">THE GLITCH</h1>
                  </div>
                  <div style="background-color: #1a0f2e; padding: 30px; border-radius: 10px; border: 1px solid #8B5CF6;">
                    <h2 style="color: #8B5CF6; margin-top: 0;">MFA Verification Required</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      Your login attempt requires MFA verification. Please use the following code to complete your login:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; background-color: #251a3a; padding: 20px 40px; border-radius: 8px; border: 2px solid #8B5CF6;">
                        <span style="font-size: 36px; font-weight: bold; color: #8B5CF6; letter-spacing: 5px;">${mfaCode}</span>
                      </div>
                    </div>
                    <p style="font-size: 14px; color: #cccccc; margin-top: 30px;">
                      This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
                    </p>
                  </div>
                </div>
              `
            });
            console.log(`MFA code sent to ${emailLower}`);
          } catch (emailError) {
            console.error('Error sending MFA email:', emailError);
          }
        }

        await db.end();

        return res.status(200).json({
          success: true,
          status: 'MFA_REQUIRED',
          id: user.id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          message: 'MFA verification required. Please check your email for the verification code.'
        });
      }

      // Update last_seen
      await db.execute(
        'UPDATE users SET last_seen = NOW() WHERE id = ?',
        [user.id]
      );

      // Check subscription status (add columns if they don't exist)
      let subscriptionStatus = 'inactive';
      let subscriptionExpiry = null;
      try {
        // Try to get subscription columns
        const [subscriptionData] = await db.execute(
          'SELECT subscription_status, subscription_expiry FROM users WHERE id = ?',
          [user.id]
        );
        if (subscriptionData && subscriptionData.length > 0) {
          subscriptionStatus = subscriptionData[0].subscription_status || 'inactive';
          subscriptionExpiry = subscriptionData[0].subscription_expiry;
          
          // Check if subscription is still valid
          if (subscriptionStatus === 'active' && subscriptionExpiry) {
            const expiryDate = new Date(subscriptionExpiry);
            if (expiryDate < new Date()) {
              // Subscription expired
              subscriptionStatus = 'expired';
              await db.execute(
                'UPDATE users SET subscription_status = ? WHERE id = ?',
                ['expired', user.id]
              );
            }
          }
        }
      } catch (err) {
        // Columns don't exist yet, they'll be created when subscription is activated
        console.log('Subscription columns not found, will be created on first subscription');
      }

      // Generate JWT token (3-part format: header.payload.signature)
      // Convert to base64url (replace + with -, / with _, remove = padding)
      const toBase64Url = (str) => {
        return Buffer.from(str).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };
      
      const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = toBase64Url(JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        role: user.role || 'USER',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }));
      const signature = toBase64Url('signature-' + Date.now());
      const token = `${header}.${payload}.${signature}`;
      
      console.log('Generated login token (length):', token.length, 'parts:', token.split('.').length);

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
        status: 'SUCCESS',
        subscription: {
          status: subscriptionStatus,
          expiry: subscriptionExpiry
        }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      if (db && !db.ended) {
        try {
          await db.end();
        } catch (e) {
          console.warn('Error closing DB connection after error:', e.message);
        }
      }
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
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

