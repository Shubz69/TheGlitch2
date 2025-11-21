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
        // Use existing table structure - don't try to create/modify
        // The actual table has: id, content, encrypted, timestamp, channel_id, sender_id
        
        // Try to fetch messages - use timestamp column (actual column name)
        // channel_id is bigint in actual table, but we receive it as string, so we need to handle both
        let [rows] = [];
        try {
          // Try with channel_id as string first (for string IDs like 'welcome')
          [rows] = await db.execute(
            'SELECT * FROM messages WHERE channel_id = ? ORDER BY timestamp ASC',
            [channelId]
          );
        } catch (queryError) {
          // If that fails, try converting channelId to number (for numeric IDs)
          const numericChannelId = parseInt(channelId);
          if (!isNaN(numericChannelId)) {
            [rows] = await db.execute(
              'SELECT * FROM messages WHERE channel_id = ? ORDER BY timestamp ASC',
              [numericChannelId]
            );
          } else {
            // If channelId is not numeric and query failed, try ordering by id
            try {
              [rows] = await db.execute(
                'SELECT * FROM messages WHERE channel_id = ? ORDER BY id ASC',
                [channelId]
              );
            } catch (fallbackError) {
              if (!isNaN(numericChannelId)) {
                [rows] = await db.execute(
                  'SELECT * FROM messages WHERE channel_id = ? ORDER BY id ASC',
                  [numericChannelId]
                );
              } else {
                throw queryError;
              }
            }
          }
        }
        await db.end();

        // Map to frontend format - handle actual column names
        const messages = rows.map(row => ({
          id: row.id,
          channelId: row.channel_id,
          userId: row.sender_id, // Actual column is sender_id, not user_id
          username: row.username || 'Anonymous', // username might not exist, use fallback
          content: row.content,
          createdAt: row.timestamp, // Actual column is timestamp, not created_at
          timestamp: row.timestamp,
          sender: {
            id: row.sender_id,
            username: row.username || 'Anonymous',
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
        // Use actual table structure: id, content, encrypted, timestamp, channel_id, sender_id
        // Handle channel_id as either string or number
        const channelIdValue = isNaN(parseInt(channelId)) ? channelId : parseInt(channelId);
        
        // Insert message - use actual column names
        // Note: username column doesn't exist, so we'll need to get it from users table or store it differently
        // For now, we'll insert without username and fetch it separately if needed
        const [result] = await db.execute(
          'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())',
          [channelIdValue, userId || null, content.trim()]
        );

        const [newMessage] = await db.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
        await db.end();

        // Map to frontend format
        const message = {
          id: newMessage[0].id,
          channelId: newMessage[0].channel_id,
          userId: newMessage[0].sender_id, // Actual column is sender_id
          username: username || 'Anonymous', // Use provided username since it's not in DB
          content: newMessage[0].content,
          createdAt: newMessage[0].timestamp, // Actual column is timestamp
          timestamp: newMessage[0].timestamp,
          sender: {
            id: newMessage[0].sender_id,
            username: username || 'Anonymous',
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

