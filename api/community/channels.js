const mysql = require('mysql2/promise');

const slugify = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
};

const toDisplayName = (value) => {
  if (!value) return '';
  return value
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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

const ensureChannelsTable = async (db) => {
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
};

const PROTECTED_CHANNEL_IDS = new Set(['welcome', 'announcements', 'admin']);

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

  // Handle HEAD requests (for connection checks)
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Default channels (fallback)
      const defaultChannels = [
        { id: 'welcome', name: 'welcome', displayName: 'Welcome', category: 'announcements', description: 'Welcome to THE GLITCH community!' },
        { id: 'announcements', name: 'announcements', displayName: 'Announcements', category: 'announcements', description: 'Important announcements' },
        { id: 'general', name: 'general', displayName: 'General', category: 'general', description: 'General discussion' }
      ];

      const db = await getDbConnection();
      if (db) {
        try {
          // Create channels table if it doesn't exist
          await ensureChannelsTable(db);
          
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
            
            // Ensure all courses from defaultCourses are also in the database
            const defaultCourses = [
              { id: 1, title: "E-Commerce" },
              { id: 2, title: "Health & Fitness" },
              { id: 3, title: "Trading" },
              { id: 4, title: "Real Estate" },
              { id: 5, title: "Social Media" },
              { id: 6, title: "Psychology and Mindset" },
              { id: 7, title: "Algorithmic AI" },
              { id: 8, title: "Crypto" }
            ];
            
            for (const course of defaultCourses) {
              const courseId = `course-${course.id}`;
              const courseName = course.title.toLowerCase().replace(/\s+/g, '-');
              await db.execute(
                'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, category=?, description=?, access_level=?',
                [courseId, courseName, 'courses', `Discussion for ${course.title}`, 'open', courseName, 'courses', `Discussion for ${course.title}`, 'open']
              );
            }
            
            // Add trading channels (everyone can see and post)
            const tradingChannels = [
              { id: 'forex', name: 'forex', category: 'trading', description: 'Forex trading discussions' },
              { id: 'crypto', name: 'crypto', category: 'trading', description: 'Cryptocurrency trading discussions' },
              { id: 'stocks', name: 'stocks', category: 'trading', description: 'Stock market discussions' },
              { id: 'indices', name: 'indices', category: 'trading', description: 'Indices trading discussions' },
              { id: 'day-trading', name: 'day-trading', category: 'trading', description: 'Day trading strategies and discussions' },
              { id: 'swing-trading', name: 'swing-trading', category: 'trading', description: 'Swing trading discussions' },
              { id: 'commodities', name: 'commodities', category: 'trading', description: 'Commodities and metals trading insights' },
              { id: 'futures', name: 'futures', category: 'trading', description: 'Futures market strategies and setups' },
              { id: 'options', name: 'options', category: 'trading', description: 'Options trading strategies and education' },
              { id: 'prop-trading', name: 'prop-trading', category: 'trading', description: 'Prop firm challenges and funded account tips' },
              { id: 'market-analysis', name: 'market-analysis', category: 'trading', description: 'Daily market analysis and trade ideas' }
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
            const channels = rows.map(row => {
              // Create a proper displayName from the name
              const displayName = row.name
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              return {
                id: row.id,
                name: row.name,
                displayName: displayName,
                category: row.category || 'general',
                description: row.description,
                accessLevel: row.access_level || 'open',
                locked: row.access_level === 'admin-only'
              };
            });
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

  if (req.method === 'POST') {
    try {
      const { id, name, displayName, category, description, accessLevel } = req.body || {};
      const sourceName = displayName || name;

      if (!sourceName || !sourceName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Channel name is required'
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
        await ensureChannelsTable(db);

        const slugBase = slugify(name || sourceName) || `channel-${Date.now()}`;
        let channelId = id && id.trim() ? slugify(id) : slugBase;
        if (!channelId) {
          channelId = `channel-${Date.now()}`;
        }

        // Ensure uniqueness of ID
        let suffix = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const [existingRows] = await db.execute('SELECT id FROM channels WHERE id = ?', [channelId]);
          if (!existingRows || existingRows.length === 0) break;
          suffix += 1;
          channelId = `${slugBase}-${suffix}`;
        }

        const channelName = slugify(name || sourceName) || channelId;
        const channelCategory = (category || 'general').toLowerCase();
        const channelDescription = description || '';
        const channelAccess = (accessLevel || 'open').toLowerCase();
        const locked = channelAccess === 'admin-only';

        await db.execute(
          'INSERT INTO channels (id, name, category, description, access_level) VALUES (?, ?, ?, ?, ?)',
          [channelId, channelName, channelCategory, channelDescription, channelAccess]
        );

        await db.end();

        return res.status(201).json({
          success: true,
          channel: {
            id: channelId,
            name: channelName,
            displayName: displayName || toDisplayName(channelName),
            category: channelCategory,
            description: channelDescription,
            accessLevel: channelAccess,
            locked
          }
        });
      } catch (dbError) {
        console.error('Database error creating channel:', dbError);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to create channel'
        });
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const channelId =
        req.query.id ||
        req.query.channelId ||
        req.body?.id ||
        req.body?.channelId;

      if (!channelId) {
        return res.status(400).json({
          success: false,
          message: 'Channel ID is required'
        });
      }

      if (PROTECTED_CHANNEL_IDS.has(channelId)) {
        return res.status(403).json({
          success: false,
          message: 'This channel cannot be deleted'
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
        await ensureChannelsTable(db);

        await db.execute('DELETE FROM messages WHERE channel_id = ?', [channelId]);
        const [result] = await db.execute('DELETE FROM channels WHERE id = ?', [channelId]);
        await db.end();

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Channel not found'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Channel deleted successfully'
        });
      } catch (dbError) {
        console.error('Database error deleting channel:', dbError);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to delete channel'
        });
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};

