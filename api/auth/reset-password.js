// Vercel serverless function for reset password
const bcrypt = require('bcrypt');

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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // In production, update password in your database here
    // For now, we'll just return success
    // TODO: Connect to your database and update the user's password
    console.log(`Password reset for ${tokenData.email} - password hashed: ${hashedPassword.substring(0, 20)}...`);

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

