// Simple Express server with Stripe integration
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'your_stripe_key_here');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 8080;

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Mock course data
const courses = [
  { id: 1, title: "Intro to Trading", description: "Learn the basics of trading.", price: 0.3 },
  { id: 2, title: "Technical Analysis", description: "Master chart patterns and indicators.", price: 0.3 },
  { id: 3, title: "Fundamental Analysis", description: "Analyze financial statements.", price: 0.3 },
  { id: 4, title: "Crypto Trading", description: "Trade crypto assets effectively.", price: 0.3 },
  { id: 5, title: "Day Trading", description: "Master intraday trading strategies.", price: 0.3 },
  { id: 6, title: "Swing Trading", description: "Profit from market swings.", price: 0.3 }
];

// Direct checkout endpoint - no authentication required
app.get('/api/payments/checkout-direct', async (req, res) => {
  try {
    // Get course ID from query parameters
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Find course by ID
    const course = courses.find(c => c.id.toString() === courseId.toString());
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/payment-success?courseId=${courseId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/courses`,
    });
    
    // Redirect to Stripe checkout
    return res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Payment success webhook
app.post('/api/payments/complete', (req, res) => {
  // In a real application, you would verify the payment with Stripe
  // and update your database accordingly
  
  return res.json({ 
    success: true, 
    message: 'Payment completed successfully' 
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'platform@theglitch.online',
      subject: `Contact Form Message from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from The Glitch website contact form</em></p>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message' 
    });
  }
});

// Password Reset Endpoints
// Store reset codes in memory (in production, use Redis or database)
const resetCodes = new Map(); // email -> { code, expiresAt }

// Generate 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot password - send reset code
app.post('/api/auth/forgot-password', async (req, res) => {
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
    
    // Store code
    resetCodes.set(email.toLowerCase(), {
      code: resetCode,
      expiresAt: expiresAt
    });
    
    // Send email with reset code
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
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
    
    await transporter.sendMail(mailOptions);
    
    console.log(`Password reset code sent to ${email}: ${resetCode}`);
    
    res.json({ 
      success: true, 
      message: 'Reset code sent to your email' 
    });
  } catch (error) {
    console.error('Error sending reset email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reset email' 
    });
  }
});

// Verify reset code
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and code are required' 
      });
    }
    
    const stored = resetCodes.get(email.toLowerCase());
    
    if (!stored) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired code' 
      });
    }
    
    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email.toLowerCase());
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
    
    // Generate reset token (JWT-like token for password reset)
    const resetToken = Buffer.from(JSON.stringify({
      email: email,
      code: code,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    })).toString('base64');
    
    // Remove used code
    resetCodes.delete(email.toLowerCase());
    
    res.json({ 
      success: true, 
      token: resetToken,
      message: 'Code verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify code' 
    });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
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
    
    // In a real app, update password in database here
    // For now, just return success
    console.log(`Password reset for ${tokenData.email} - password updated`);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    });
  }
});

// Serve the React app - catch-all route using regex for compatibility
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// To use this server:
// 1. Install required packages: npm install express cors stripe
// 2. Save this file as server.js in your project root
// 3. Replace 'your_stripe_secret_key' with your actual Stripe secret key
// 4. Run with: node server.js 