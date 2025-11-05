const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for community/users');
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
    console.error('Database connection error in community/users:', error.message);
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
        const [rows] = await db.execute(
          'SELECT id, username, email, name, avatar, role, created_at, last_seen FROM users ORDER BY created_at DESC'
        );
        await db.end();

        const users = rows.map(row => ({
          id: row.id,
          username: row.username,
          email: row.email,
          name: row.name,
          avatar: row.avatar || '/avatars/avatar_ai.png',
          role: row.role,
          createdAt: row.created_at,
          lastSeen: row.last_seen
        }));

        return res.status(200).json(users);
      } catch (dbError) {
        console.error('Database error fetching users:', dbError.message);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch users'
        });
      }
    } catch (error) {
      console.error('Error in community/users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};

