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
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      connectTimeout: 5000, // 5 second timeout
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    await connection.ping(); // Test connection
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract channel ID from query or URL
  const channelId = req.query.channelId || req.query.id;

  if (!channelId) {
    return res.status(400).json({ success: false, message: 'Channel ID is required' });
  }

  try {
    const db = await getDbConnection();
    
    if (req.method === 'GET') {
      // Get messages for a channel
      if (!db) {
        return res.status(200).json([]); // Return empty array if DB unavailable
      }

      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            channel_id VARCHAR(255) NOT NULL,
            user_id INT,
            username VARCHAR(255),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_channel (channel_id),
            INDEX idx_created (created_at)
          )
        `);

        // Ensure created_at column exists (for existing tables)
        try {
          const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'created_at'
          `, [process.env.MYSQL_DATABASE]);
          
          if (columns.length === 0) {
            await db.execute('ALTER TABLE messages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Added created_at column to messages table');
          }
        } catch (alterError) {
          console.log('Note: created_at column check:', alterError.message);
        }

        // Try to fetch with created_at, fallback to id if column doesn't exist
        let [rows] = [];
        try {
          [rows] = await db.execute(
            'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC',
            [channelId]
          );
        } catch (orderError) {
          // If created_at doesn't exist, order by id instead
          if (orderError.code === 'ER_BAD_FIELD_ERROR' && orderError.message.includes('created_at')) {
            [rows] = await db.execute(
              'SELECT * FROM messages WHERE channel_id = ? ORDER BY id ASC',
              [channelId]
            );
          } else {
            throw orderError;
          }
        }
        await db.end();

        const messages = rows.map(row => ({
          id: row.id,
          channelId: row.channel_id,
          userId: row.user_id,
          username: row.username,
          content: row.content,
          createdAt: row.created_at,
          timestamp: row.created_at, // Add timestamp for frontend compatibility
          sender: {
            id: row.user_id,
            username: row.username,
            avatar: '/avatars/avatar_ai.png',
            role: 'USER'
          }
        }));

        return res.status(200).json(messages);
      } catch (dbError) {
        console.error('Database error fetching messages:', dbError);
        await db.end();
        return res.status(200).json([]);
      }
    }

    if (req.method === 'POST') {
      // Create a new message
      const { userId, username, content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: 'Database unavailable' });
      }

      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            channel_id VARCHAR(255) NOT NULL,
            user_id INT,
            username VARCHAR(255),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const [result] = await db.execute(
          'INSERT INTO messages (channel_id, user_id, username, content) VALUES (?, ?, ?, ?)',
          [channelId, userId || null, username || 'Anonymous', content.trim()]
        );

        const [newMessage] = await db.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
        await db.end();

        const message = {
          id: newMessage[0].id,
          channelId: newMessage[0].channel_id,
          userId: newMessage[0].user_id,
          username: newMessage[0].username,
          content: newMessage[0].content,
          createdAt: newMessage[0].created_at,
          timestamp: newMessage[0].created_at, // Add timestamp for frontend compatibility
          sender: {
            id: newMessage[0].user_id,
            username: newMessage[0].username,
            avatar: '/avatars/avatar_ai.png',
            role: 'USER'
          }
        };

        return res.status(201).json(message);
      } catch (dbError) {
        console.error('Database error creating message:', dbError);
        await db.end();
        return res.status(500).json({ success: false, message: 'Failed to create message' });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling messages:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred' 
    });
  }
};

