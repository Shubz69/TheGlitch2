// Vercel serverless function for verify reset code
// Note: This uses in-memory storage. For production, use Vercel KV or database.

// Shared reset codes storage (in production, use Vercel KV)
// This is a workaround - codes won't persist across serverless invocations
// For production, integrate with Vercel KV or your database
const resetCodes = require('./reset-codes-store');

export default async function handler(req, res) {
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
    
    // Retrieve code from storage
    const stored = resetCodes.get(emailLower);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(emailLower);
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

    // Generate reset token
    const resetToken = Buffer.from(JSON.stringify({
      email: email,
      code: code,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    })).toString('base64');

    // Remove used code
    resetCodes.delete(emailLower);

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
}

