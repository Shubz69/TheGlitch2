// Vercel serverless function for forgot password
const nodemailer = require('nodemailer');

// Function to create transporter (called inside handler to catch errors better)
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
    console.error('Error details:', error.message, error.stack);
    return null;
  }
};

// Generate 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store reset codes - shared module for serverless functions
// Note: This won't persist across different serverless instances
// For production, use Vercel KV, Vercel Postgres, or your database
let resetCodes = new Map();

// Export for use in other functions (serverless functions in same region may share this)
if (typeof global !== 'undefined') {
  if (!global.resetCodesStore) {
    global.resetCodesStore = new Map();
  }
  resetCodes = global.resetCodesStore;
}

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate 6-digit code
    const resetCode = generateResetCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    const emailLower = email.toLowerCase();

    // Store code (in production, use Vercel KV or database)
    resetCodes.set(emailLower, {
      code: resetCode,
      expiresAt: expiresAt
    });

    // Check if email is configured
    const hasEmailUser = !!process.env.EMAIL_USER;
    const hasEmailPass = !!process.env.EMAIL_PASS;
    
    console.log('Email config check:', {
      hasEmailUser,
      hasEmailPass,
      emailUserLength: process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0,
      emailPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
      emailUserValue: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'undefined'
    });
    
    if (!hasEmailUser || !hasEmailPass) {
      console.error('Email configuration missing:', {
        EMAIL_USER: hasEmailUser,
        EMAIL_PASS: hasEmailPass
      });
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact support.'
      });
    }

    // Create transporter inside handler to get better error reporting
    const transporter = createEmailTransporter();
    
    if (!transporter) {
      console.error('Failed to create email transporter even though env vars are set');
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please contact support.'
      });
    }

    // Send email with reset code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'THE GLITCH - Password Reset Code',
      html: `
        <h2>THE GLITCH - Password Reset</h2>
        <p>You requested to reset your password. Use the code below to verify:</p>
        <h3 style="font-size: 24px; color: #8B5CF6; letter-spacing: 5px;">${resetCode}</h3>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p><em>THE GLITCH Platform</em></p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please check email configuration.'
      });
    }

    console.log(`Password reset code sent to ${email}: ${resetCode}`);

    return res.status(200).json({
      success: true,
      message: 'Reset code sent to your email'
    });
  } catch (error) {
    console.error('Error sending reset email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reset email'
    });
  }
};

