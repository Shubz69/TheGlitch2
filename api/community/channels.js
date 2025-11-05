const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for channels');
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
    
    // Test the connection
    await connection.ping();
    
    console.log('Database connection successful for channels');
    return connection;
  } catch (error) {
    console.error('Database connection error in channels:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
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

          // Check if channels table has the category column, if not add it
          try {
            // MySQL doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
            const [columns] = await db.execute(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'channels' AND COLUMN_NAME = 'category'
            `, [process.env.MYSQL_DATABASE]);
            
            if (columns.length === 0) {
              await db.execute('ALTER TABLE channels ADD COLUMN category VARCHAR(100) DEFAULT NULL');
              console.log('Added category column to channels table');
            }
          } catch (alterError) {
            // Column might already exist or other error, log and continue
            console.log('Note: category column check:', alterError.message);
          }

          // Fetch channels from database, handle NULL categories safely
          let [rows] = [];
          try {
            [rows] = await db.execute('SELECT * FROM channels ORDER BY COALESCE(category, \'general\'), name');
          } catch (orderError) {
            // If ordering fails, try without category
            try {
              [rows] = await db.execute('SELECT * FROM channels ORDER BY name');
            } catch (fallbackError) {
              [rows] = await db.execute('SELECT * FROM channels');
            }
          }
          
          // If no channels in DB, create channels from courses
          if (rows.length === 0) {
            // Fetch courses to create channels
            try {
              const [courses] = await db.execute('SELECT * FROM courses');
              
              // Insert default channels
              const defaultChannels = [
                { id: 'welcome', name: 'welcome', category: 'announcements', description: 'Welcome to THE GLITCH community!' },
                { id: 'announcements', name: 'announcements', category: 'announcements', description: 'Important announcements' },
                { id: 'general', name: 'general', category: 'general', description: 'General discussion' }
              ];
              
              for (const channel of defaultChannels) {
                await db.execute(
                  'INSERT IGNORE INTO channels (id, name, category, description) VALUES (?, ?, ?, ?)',
                  [channel.id, channel.name, channel.category, channel.description]
                );
              }
              
              // Create channels from courses
              if (courses && courses.length > 0) {
                for (const course of courses) {
                  const courseId = course.id || course.name?.toLowerCase().replace(/\s+/g, '-') || `course-${course.id}`;
                  const courseName = course.name || course.title || 'Unnamed Course';
                  await db.execute(
                    'INSERT IGNORE INTO channels (id, name, category, description) VALUES (?, ?, ?, ?)',
                    [courseId, courseName, 'courses', course.description || `Discussion for ${courseName}`]
                  );
                }
              }
              
              // Also add trading channels
              const tradingChannels = [
                { id: 'forex', name: 'forex', category: 'trading', description: 'Forex trading discussions' },
                { id: 'crypto', name: 'crypto', category: 'trading', description: 'Cryptocurrency trading discussions' },
                { id: 'stocks', name: 'stocks', category: 'trading', description: 'Stock market discussions' },
                { id: 'indices', name: 'indices', category: 'trading', description: 'Indices trading discussions' }
              ];
              
              for (const channel of tradingChannels) {
                await db.execute(
                  'INSERT IGNORE INTO channels (id, name, category, description) VALUES (?, ?, ?, ?)',
                  [channel.id, channel.name, channel.category, channel.description]
                );
              }
              
              // Re-fetch channels after inserting
              [rows] = await db.execute('SELECT * FROM channels ORDER BY COALESCE(category, \'general\'), name');
            } catch (insertError) {
              console.error('Error creating channels from courses:', insertError.message);
            }
          }
          
          await db.end();

          if (rows && rows.length > 0) {
            const channels = rows.map(row => ({
              id: row.id,
              name: row.name,
              category: row.category || 'general',
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

