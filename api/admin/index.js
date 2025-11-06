const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for admin');
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
    console.error('Database connection error in admin:', error.message);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS - allow both www and non-www origins
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle HEAD requests
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  // Extract the path to determine which endpoint to handle
  // Vercel passes the path in req.url or we can construct it
  let pathname = '';
  try {
    if (req.url) {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      pathname = url.pathname;
    } else if (req.path) {
      pathname = req.path;
    }
  } catch (e) {
    // Fallback: check if this is a contact request based on query or body
    pathname = req.url || '';
  }

  // Handle /api/subscription/check
  if ((pathname.includes('/subscription/check') || pathname.endsWith('/subscription/check')) && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const userId = req.method === 'GET' ? req.query.userId : req.body.userId;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      const db = await getDbConnection();
      if (!db) {
        return res.status(500).json({ success: false, message: 'Database connection error' });
      }

      try {
        // Check if subscription columns exist, add if not
        try {
          await db.execute('SELECT subscription_status FROM users LIMIT 1');
        } catch (e) {
          await db.execute('ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT NULL');
        }
        
        try {
          await db.execute('SELECT subscription_expiry FROM users LIMIT 1');
        } catch (e) {
          await db.execute('ALTER TABLE users ADD COLUMN subscription_expiry DATETIME DEFAULT NULL');
        }
        
        try {
          await db.execute('SELECT payment_failed FROM users LIMIT 1');
        } catch (e) {
          await db.execute('ALTER TABLE users ADD COLUMN payment_failed BOOLEAN DEFAULT FALSE');
        }

        const [rows] = await db.execute(
          'SELECT subscription_status, subscription_expiry, payment_failed, role FROM users WHERE id = ?',
          [userId]
        );
        await db.end();

        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = rows[0];
        const isAdmin = user.role === 'ADMIN' || user.role === 'admin';
        
        if (isAdmin) {
          return res.status(200).json({
            success: true,
            hasActiveSubscription: true,
            isAdmin: true,
            paymentFailed: false,
            expiry: null
          });
        }

        if (user.payment_failed === 1 || user.payment_failed === true) {
          return res.status(200).json({
            success: true,
            hasActiveSubscription: false,
            isAdmin: false,
            paymentFailed: true,
            expiry: user.subscription_expiry,
            message: 'Your payment has failed. Please update your payment method to continue using the community.'
          });
        }

        if (user.subscription_status === 'active' && user.subscription_expiry) {
          const expiryDate = new Date(user.subscription_expiry);
          const now = new Date();
          
          if (expiryDate > now) {
            return res.status(200).json({
              success: true,
              hasActiveSubscription: true,
              isAdmin: false,
              paymentFailed: false,
              expiry: user.subscription_expiry
            });
          } else {
            return res.status(200).json({
              success: true,
              hasActiveSubscription: false,
              isAdmin: false,
              paymentFailed: false,
              expiry: user.subscription_expiry,
              message: 'Your subscription has expired. Please renew to continue using the community.'
            });
          }
        }

        return res.status(200).json({
          success: true,
          hasActiveSubscription: false,
          isAdmin: false,
          paymentFailed: false,
          expiry: null,
          message: 'You need an active subscription to access the community.'
        });
      } catch (dbError) {
        console.error('Database error checking subscription:', dbError);
        if (db && !db.ended) await db.end();
        return res.status(500).json({ success: false, message: 'Failed to check subscription status' });
      }
    } catch (error) {
      console.error('Error in subscription check:', error);
      return res.status(500).json({ success: false, message: 'An error occurred' });
    }
  }

  // Handle /api/admin/user-status
  if ((pathname.includes('/user-status') || pathname.endsWith('/admin/user-status')) && req.method === 'GET') {
    try {
      const db = await getDbConnection();
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection error'
        });
      }

      try {
        // Check if last_seen column exists
        try {
          await db.execute('SELECT last_seen FROM users LIMIT 1');
        } catch (e) {
          // Column doesn't exist, add it
          await db.execute('ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT NULL');
        }

        // Consider users online if they were active in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const [rows] = await db.execute(
          `SELECT id, username, email, name, avatar, role, last_seen, created_at
           FROM users 
           WHERE last_seen >= ? OR (last_seen IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE))
           ORDER BY last_seen DESC`,
          [fiveMinutesAgo]
        );
        
        // Get total users count (including deleted/banned status)
        const [allUsers] = await db.execute('SELECT COUNT(*) as total FROM users');
        await db.end();

        const onlineUsers = rows.map(row => ({
          id: row.id,
          username: row.username,
          email: row.email,
          name: row.name,
          avatar: row.avatar || '/avatars/avatar_ai.png',
          role: row.role,
          lastSeen: row.last_seen
        }));

        return res.status(200).json({
          onlineUsers: onlineUsers,
          totalUsers: allUsers[0]?.total || 0
        });
      } catch (dbError) {
        console.error('Database error fetching user status:', dbError.message);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user status'
        });
      }
    } catch (error) {
      console.error('Error in admin/user-status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user status'
      });
    }
  }

  // Handle /api/contact (GET, POST, DELETE) - consolidated into admin endpoint
  // Check if this is a contact endpoint request
  const isContactRequest = pathname.includes('/contact') || pathname.endsWith('/contact') || 
                          (req.url && req.url.includes('/contact')) ||
                          (!pathname.includes('/user-status') && (req.method === 'GET' || req.method === 'POST' || req.method === 'DELETE') && req.query && Object.keys(req.query).length === 0);

  if (isContactRequest || (!pathname.includes('/user-status') && req.method !== 'OPTIONS')) {
    // GET - Fetch all contact messages (admin only)
    if (req.method === 'GET') {
      try {
        const db = await getDbConnection();
        if (!db) {
          return res.status(500).json({
            success: false,
            message: 'Database connection error'
          });
        }

        try {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS contact_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              subject VARCHAR(255),
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              read BOOLEAN DEFAULT FALSE,
              INDEX idx_email (email),
              INDEX idx_created (created_at)
            )
          `);

          const [rows] = await db.execute(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
          );
          await db.end();

          const messages = rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            subject: row.subject,
            message: row.message,
            createdAt: row.created_at,
            read: row.read === 1 || row.read === true
          }));

          return res.status(200).json(messages);
        } catch (dbError) {
          console.error('Database error fetching contact messages:', dbError.message);
          if (db && !db.ended) await db.end();
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages'
          });
        }
      } catch (error) {
        console.error('Error in contact GET:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch contact messages'
        });
      }
    }

    // POST - Submit new contact message
    if (req.method === 'POST') {
      try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
          return res.status(400).json({
            success: false,
            message: 'Name, email, and message are required'
          });
        }

        const db = await getDbConnection();
        if (!db) {
          return res.status(500).json({
            success: false,
            message: 'Database connection error'
          });
        }

        try {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS contact_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              subject VARCHAR(255),
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              read BOOLEAN DEFAULT FALSE
            )
          `);

          await db.execute(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject || '', message]
          );
          await db.end();

          return res.status(200).json({
            success: true,
            message: 'Contact message submitted successfully'
          });
        } catch (dbError) {
          console.error('Database error submitting contact message:', dbError.message);
          if (db && !db.ended) await db.end();
          return res.status(500).json({
            success: false,
            message: 'Failed to submit contact message'
          });
        }
      } catch (error) {
        console.error('Error in contact POST:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to submit contact message'
        });
      }
    }

    // DELETE - Delete contact message (admin only)
    if (req.method === 'DELETE') {
      try {
        const { id } = req.query || {};

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Message ID is required'
          });
        }

        const db = await getDbConnection();
        if (!db) {
          return res.status(500).json({
            success: false,
            message: 'Database connection error'
          });
        }

        try {
          const [result] = await db.execute(
            'DELETE FROM contact_messages WHERE id = ?',
            [id]
          );
          await db.end();

          if (result.affectedRows > 0) {
            return res.status(200).json({
              success: true,
              message: 'Contact message deleted successfully'
            });
          } else {
            return res.status(404).json({
              success: false,
              message: 'Message not found'
            });
          }
        } catch (dbError) {
          console.error('Database error deleting contact message:', dbError.message);
          if (db && !db.ended) await db.end();
          return res.status(500).json({
            success: false,
            message: 'Failed to delete contact message'
          });
        }
      } catch (error) {
        console.error('Error in contact DELETE:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete contact message'
        });
      }
    }
  }

  return res.status(404).json({ success: false, message: 'Endpoint not found' });
};

