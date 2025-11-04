const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return null;
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Default channels (fallback)
      const defaultChannels = [
        { id: 'welcome', name: 'welcome', category: 'announcements', description: 'Welcome to THE GLITCH community!' },
        { id: 'announcements', name: 'announcements', category: 'announcements', description: 'Important announcements' },
        { id: 'general', name: 'general', category: 'general', description: 'General discussion' }
      ];

      const db = await getDbConnection();
      if (db) {
        try {
          // Create channels table if it doesn't exist
          await db.execute(`
            CREATE TABLE IF NOT EXISTS channels (
              id VARCHAR(255) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              category VARCHAR(100),
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          const [rows] = await db.execute('SELECT * FROM channels ORDER BY category, name');
          await db.end();

          if (rows && rows.length > 0) {
            const channels = rows.map(row => ({
              id: row.id,
              name: row.name,
              category: row.category,
              description: row.description
            }));
            return res.status(200).json(channels);
          }
        } catch (dbError) {
          console.error('Database error fetching channels:', dbError);
          await db.end();
        }
      }

      return res.status(200).json(defaultChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch channels.' 
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};

