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
        // First, check if messages table exists
        try {
          const [tableCheck] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'messages'
          `, [process.env.MYSQL_DATABASE]);
          
          if (!tableCheck || tableCheck.length === 0) {
            console.error('Messages table does not exist');
            await db.end();
            return res.status(500).json({ 
              success: false, 
              message: 'Messages table does not exist. Please contact support.',
              error: 'Table missing'
            });
          }
        } catch (tableError) {
          console.warn('Could not check if messages table exists:', tableError.message);
          // Continue anyway
        }

        // Check and convert channel_id column type if needed (to support string channel IDs)
        let columnType = null;
        try {
          const [columnInfo] = await db.execute(`
            SELECT DATA_TYPE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'messages' 
            AND COLUMN_NAME = 'channel_id'
          `, [process.env.MYSQL_DATABASE]);
          
          if (columnInfo && columnInfo.length > 0) {
            columnType = columnInfo[0].DATA_TYPE;
            // If channel_id is numeric (int, bigint) but we have string channel IDs, convert it
            if ((columnType === 'int' || columnType === 'bigint') && isNaN(parseInt(channelId))) {
              console.log(`Channel ID "${channelId}" is string but column is ${columnType}. Attempting conversion...`);
              try {
                // Drop foreign key if exists (required before ALTER)
                try {
                  const [fks] = await db.execute(`
                    SELECT CONSTRAINT_NAME 
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = ? 
                    AND TABLE_NAME = 'messages' 
                    AND COLUMN_NAME = 'channel_id' 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                  `, [process.env.MYSQL_DATABASE]);
                  
                  for (const fk of fks) {
                    try {
                      await db.execute(`ALTER TABLE messages DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                      console.log(`Dropped foreign key: ${fk.CONSTRAINT_NAME}`);
                    } catch (fkError) {
                      console.warn('Could not drop foreign key:', fkError.message);
                    }
                  }
                } catch (fkQueryError) {
                  console.warn('Could not query foreign keys:', fkQueryError.message);
                }
                
                // Convert column to VARCHAR
                await db.execute('ALTER TABLE messages MODIFY COLUMN channel_id VARCHAR(255) NOT NULL');
                console.log('Successfully converted messages.channel_id to VARCHAR(255)');
                columnType = 'varchar'; // Update for next insert attempt
              } catch (alterError) {
                console.error('Failed to convert channel_id column type:', alterError.message);
                console.error('Error code:', alterError.code);
                // Continue - we'll try to insert anyway
              }
            } else if (columnType === 'varchar' || columnType === 'char') {
              console.log(`Channel ID column is already ${columnType}, no conversion needed`);
            }
          } else {
            console.warn('Could not find channel_id column in messages table');
          }
        } catch (schemaError) {
          console.warn('Could not check channel_id column type:', schemaError.message);
          // Continue with insert attempt
        }
        
        // Use actual table structure: id, content, encrypted, timestamp, channel_id, sender_id
        // Handle channel_id as either string or number based on column type
        let channelIdValue = channelId; // Default to string
        if (columnType === 'int' || columnType === 'bigint') {
          // If column is numeric, try to convert channelId to number
          const numericId = parseInt(channelId);
          if (!isNaN(numericId)) {
            channelIdValue = numericId;
          } else {
            // Can't convert string to number for numeric column
            console.error(`Cannot convert channel ID "${channelId}" to number for ${columnType} column`);
            await db.end();
            return res.status(500).json({ 
              success: false, 
              message: `Channel ID "${channelId}" is not compatible with database column type ${columnType}`,
              error: 'Type mismatch'
            });
          }
        }
        
        // Insert message - use actual column names
        let result;
        try {
          const insertResult = await db.execute(
            'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())',
            [channelIdValue, userId || null, content.trim()]
          );
          // result is [ResultSetHeader, fields], we need the first element
          result = insertResult[0];
          console.log('Message inserted successfully with ID:', result.insertId);
        } catch (insertError) {
          console.error('Insert error:', insertError.message);
          console.error('Insert error code:', insertError.code);
          console.error('Channel ID value:', channelIdValue, 'Type:', typeof channelIdValue);
          
          // If insert failed, try alternative approaches
          if (insertError.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || 
              insertError.message?.includes('channel_id')) {
            // Try with string conversion
            console.log('Retrying insert with channelId as string...');
            try {
              const retryResult = await db.execute(
                'INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())',
                [String(channelId), userId || null, content.trim()]
              );
              result = retryResult[0];
              console.log('Message inserted successfully on retry with ID:', result.insertId);
            } catch (retryError) {
              console.error('Insert failed even with string conversion:', retryError);
              throw retryError; // Re-throw to be caught by outer catch
            }
          } else {
            throw insertError; // Re-throw other errors
          }
        }

        // Fetch the newly created message - execute returns [rows, fields]
        const [newMessageRows] = await db.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
        const newMessage = newMessageRows[0]; // Get first row
        
        // Also fetch username from users table if userId is provided
        let senderUsername = username || 'Anonymous';
        if (userId) {
          try {
            const [userRows] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
            if (userRows && userRows[0]) {
              senderUsername = userRows[0].username || username || 'Anonymous';
            }
          } catch (userError) {
            console.warn('Could not fetch username from users table:', userError);
            // Use provided username as fallback
          }
        }
        
        await db.end();

        // Map to frontend format
        const message = {
          id: newMessage.id,
          channelId: newMessage.channel_id,
          userId: newMessage.sender_id, // Actual column is sender_id
          username: senderUsername,
          content: newMessage.content,
          createdAt: newMessage.timestamp, // Actual column is timestamp
          timestamp: newMessage.timestamp,
          sender: {
            id: newMessage.sender_id,
            username: senderUsername,
            avatar: '/avatars/avatar_ai.png',
            role: 'USER'
          }
        };

        return res.status(201).json(message);
      } catch (dbError) {
        console.error('Database error creating message:', dbError);
        console.error('Error details:', {
          message: dbError.message,
          code: dbError.code,
          errno: dbError.errno,
          sqlState: dbError.sqlState,
          sqlMessage: dbError.sqlMessage,
          sql: dbError.sql,
          channelId: channelId,
          channelIdType: typeof channelId,
          stack: dbError.stack
        });
        
        // Try to provide more helpful error message
        let errorMessage = 'Failed to create message';
        let errorDetails = null;
        
        if (dbError.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || dbError.code === 'ER_BAD_FIELD_ERROR') {
          errorMessage = 'Channel ID type mismatch. Database schema needs update.';
          errorDetails = `Channel ID "${channelId}" (${typeof channelId}) cannot be inserted into column type.`;
        } else if (dbError.message && dbError.message.includes('channel_id')) {
          errorMessage = 'Invalid channel ID format';
          errorDetails = dbError.message;
        } else if (dbError.code === 'ER_NO_SUCH_TABLE') {
          errorMessage = 'Messages table does not exist';
          errorDetails = 'Database table needs to be created.';
        } else if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ER_DBACCESS_DENIED_ERROR') {
          errorMessage = 'Database access denied';
          errorDetails = 'Check database credentials and permissions.';
        } else {
          errorMessage = dbError.message || 'Database error occurred';
          errorDetails = `Error code: ${dbError.code || 'UNKNOWN'}`;
        }
        
        try {
          if (db && !db.ended) {
            await db.end();
          }
        } catch (endError) {
          // Ignore errors when closing connection
          console.warn('Error closing database connection:', endError.message);
        }
        
        // Return detailed error in development, generic in production
        return res.status(500).json({ 
          success: false, 
          message: errorMessage,
          error: errorDetails,
          code: dbError.code,
          // Include full error in development mode for debugging
          ...(process.env.NODE_ENV === 'development' ? {
            fullError: dbError.message,
            stack: dbError.stack
          } : {})
        });
      }
    }

    if (req.method === 'DELETE') {
      // Delete a message (admin only or message owner)
      const messageId = req.query.messageId || req.query.id;
      
      if (!messageId) {
        return res.status(400).json({ success: false, message: 'Message ID is required' });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: 'Database unavailable' });
      }

      try {
        // Check if message exists and get sender_id for ownership check
        const [messageRows] = await db.execute('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
        
        if (!messageRows || messageRows.length === 0) {
          await db.end();
          return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // TODO: Add admin check from JWT token
        // For now, allow deletion (you can add auth check later)
        const [result] = await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);
        await db.end();

        if (result.affectedRows > 0) {
          return res.status(200).json({ 
            success: true, 
            message: 'Message deleted successfully' 
          });
        } else {
          return res.status(404).json({ 
            success: false, 
            message: 'Message not found' 
          });
        }
      } catch (dbError) {
        console.error('Database error deleting message:', dbError);
        try {
          await db.end();
        } catch (endError) {
          // Ignore errors when closing connection
        }
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete message' 
        });
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

