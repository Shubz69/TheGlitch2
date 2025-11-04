const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // bcrypt is in package.json

// Get database connection
const getDbConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    
    // Create users table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar VARCHAR(255),
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    const { username, email, password, name, avatar } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    // Connect to database
    const db = await getDbConnection();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.' 
      });
    }

    try {
      // Check if email or username already exists
      const [emailCheck] = await db.execute('SELECT id FROM users WHERE email = ?', [emailLower]);
      if (emailCheck && emailCheck.length > 0) {
        await db.end();
        return res.status(409).json({ 
          success: false, 
          message: 'An account with this email already exists. Please sign in instead.' 
        });
      }

      const [usernameCheck] = await db.execute('SELECT id FROM users WHERE username = ?', [usernameLower]);
      if (usernameCheck && usernameCheck.length > 0) {
        await db.end();
        return res.status(409).json({ 
          success: false, 
          message: 'Username already taken. Please choose a different username.' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password, name, avatar, role) VALUES (?, ?, ?, ?, ?, ?)',
        [usernameLower, emailLower, hashedPassword, name || username, avatar || '/avatars/avatar_ai.png', 'USER']
      );

      const userId = result.insertId;

      // Generate JWT token (simple version - in production use proper JWT library)
      const token = Buffer.from(JSON.stringify({
        id: userId,
        email: emailLower,
        username: usernameLower,
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      })).toString('base64');

      await db.end();

      return res.status(200).json({
        success: true,
        id: userId,
        username: usernameLower,
        email: emailLower,
        name: name || username,
        avatar: avatar || '/avatars/avatar_ai.png',
        role: 'USER',
        token: token,
        status: 'SUCCESS'
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      await db.end();
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          success: false, 
          message: 'Email or username already exists. Please sign in instead.' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Database error. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again later.' 
    });
  }
};

