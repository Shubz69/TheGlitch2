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
              access_level VARCHAR(50) DEFAULT 'open',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Add access_level column if it doesn't exist
          try {
            await db.execute(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'channels' AND COLUMN_NAME = 'access_level'
            `, [process.env.MYSQL_DATABASE]).then(([columns]) => {
              if (columns.length === 0) {
                return db.execute('ALTER TABLE channels ADD COLUMN access_level VARCHAR(50) DEFAULT \'open\'');
              }
            });
          } catch (alterError) {
            // Column might already exist, ignore
            console.log('Note: access_level column check:', alterError.message);
          }

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
          
          // Always ensure required channels exist (create/update if needed)
          try {
            // Fetch courses to create channels
            const [courses] = await db.execute('SELECT * FROM courses');
            
            // Insert default channels (welcome and announcements - everyone can see, only admins post)
            const defaultChannels = [
              { id: 'welcome', name: 'welcome', category: 'announcements', description: 'Welcome to THE GLITCH community!', accessLevel: 'read-only' },
              { id: 'announcements', name: 'announcements', category: 'announcements', description: 'Important announcements', accessLevel: 'read-only' }
            ];
            
            for (const channel of defaultChannels) {
              await db.execute(
                'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, category=?, description=?, access_level=?',
                [channel.id, channel.name, channel.category, channel.description, channel.accessLevel, channel.name, channel.category, channel.description, channel.accessLevel]
              );
            }
            
            // Insert admin channel (only admins can see and post)
            await db.execute(
              'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, category=?, description=?, access_level=?',
              ['admin', 'admin', 'staff', 'Admin-only channel', 'admin-only', 'admin', 'staff', 'Admin-only channel', 'admin-only']
            );
            
            // Create channels from courses (everyone can see and post)
            if (courses && courses.length > 0) {
              for (const course of courses) {
                const courseId = `course-${course.id}`;
                const courseName = (course.title || course.name || 'Unnamed Course').toLowerCase().replace(/\s+/g, '-');
                const courseDisplayName = course.title || course.name || 'Unnamed Course';
                await db.execute(
                  'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, category=?, description=?, access_level=?',
                  [courseId, courseName, 'courses', `Discussion for ${courseDisplayName}`, 'open', courseName, 'courses', `Discussion for ${courseDisplayName}`, 'open']
                );
              }
            }
            
            // Add trading channels (everyone can see and post)
            const tradingChannels = [
              { id: 'forex', name: 'forex', category: 'trading', description: 'Forex trading discussions' },
              { id: 'crypto', name: 'crypto', category: 'trading', description: 'Cryptocurrency trading discussions' },
              { id: 'stocks', name: 'stocks', category: 'trading', description: 'Stock market discussions' },
              { id: 'indices', name: 'indices', category: 'trading', description: 'Indices trading discussions' },
              { id: 'day-trading', name: 'day-trading', category: 'trading', description: 'Day trading strategies and discussions' },
              { id: 'swing-trading', name: 'swing-trading', category: 'trading', description: 'Swing trading discussions' }
            ];
            
            for (const channel of tradingChannels) {
              await db.execute(
                'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, category=?, description=?, access_level=?',
                [channel.id, channel.name, channel.category, channel.description, 'open', channel.name, channel.category, channel.description, 'open']
              );
            }
            
            // Re-fetch channels after inserting/updating
            [rows] = await db.execute('SELECT * FROM channels ORDER BY COALESCE(category, \'general\'), name');
          } catch (insertError) {
            console.error('Error creating/updating channels:', insertError.message);
          }
          
          await db.end();

          if (rows && rows.length > 0) {
            const channels = rows.map(row => ({
              id: row.id,
              name: row.name,
              category: row.category || 'general',
              description: row.description,
              accessLevel: row.access_level || 'open',
              locked: row.access_level === 'admin-only'
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

