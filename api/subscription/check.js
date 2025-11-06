const mysql = require('mysql2/promise');

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
      connectTimeout: 5000
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
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get user ID from query params or body
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
          // Column doesn't exist, add it
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

      // Get user subscription status from database
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
      
      // Admins always have access
      if (isAdmin) {
        return res.status(200).json({
          success: true,
          hasActiveSubscription: true,
          isAdmin: true,
          paymentFailed: false,
          expiry: null
        });
      }

      // Check if payment failed
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

      // Check subscription status
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
          // Subscription expired
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

      // No active subscription
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
};

