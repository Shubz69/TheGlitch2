const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for update-presence');
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
      acquireTimeout: 10000
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
    console.error('Database connection error in update-presence:', error.message);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

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
      // Update user's last_seen timestamp
      await db.execute(
        'UPDATE users SET last_seen = NOW() WHERE id = ?',
        [userId]
      );
      await db.end();

      return res.status(200).json({
        success: true,
        message: 'Presence updated'
      });
    } catch (dbError) {
      console.error('Database error updating presence:', dbError.message);
      if (db && !db.ended) await db.end();
      return res.status(500).json({
        success: false,
        message: 'Failed to update presence'
      });
    }
  } catch (error) {
    console.error('Error in update-presence:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

