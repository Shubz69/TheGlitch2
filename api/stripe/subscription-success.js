const mysql = require('mysql2/promise');

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get user ID from query params or body
    const userId = req.query.userId || req.body?.userId;
    const sessionId = req.query.session_id || req.body?.session_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
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
      // Check if subscription_status column exists, if not add it
      try {
        await db.execute('SELECT subscription_status FROM users LIMIT 1');
      } catch (err) {
        // Column doesn't exist, add it
        console.log('Adding subscription_status column to users table');
        await db.execute(`
          ALTER TABLE users 
          ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive',
          ADD COLUMN subscription_expiry DATETIME NULL,
          ADD COLUMN subscription_started DATETIME NULL,
          ADD COLUMN stripe_session_id VARCHAR(255) NULL
        `);
      }

      // Calculate subscription expiry (90 days from now for free trial, then monthly)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90); // 3 months free trial

      // Update user subscription status in database
      await db.execute(
        `UPDATE users 
         SET subscription_status = 'active',
             subscription_expiry = ?,
             subscription_started = NOW(),
             stripe_session_id = ?
         WHERE id = ?`,
        [expiryDate, sessionId || null, userId]
      );

      // Verify the update
      const [updatedUser] = await db.execute(
        'SELECT id, subscription_status, subscription_expiry FROM users WHERE id = ?',
        [userId]
      );

      await db.end();

      if (updatedUser && updatedUser.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Subscription activated successfully',
          subscription: {
            status: updatedUser[0].subscription_status,
            expiry: updatedUser[0].subscription_expiry
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (dbError) {
      console.error('Database error updating subscription:', dbError);
      if (db && !db.ended) await db.end();
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription status'
      });
    }
  } catch (error) {
    console.error('Error in subscription success handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};




