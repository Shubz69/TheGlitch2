const mysql = require('mysql2/promise');

// Get database connection
const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    console.error('Missing MySQL environment variables for contact');
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
    console.error('Database connection error in contact:', error.message);
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

  // GET - Fetch all contact messages (admin only)
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
        // Create contact_messages table if it doesn't exist
        await db.execute(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE,
            INDEX idx_email (email),
            INDEX idx_created (created_at)
          )
        `);

        const [rows] = await db.execute(
          'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        await db.end();

        const messages = rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          message: row.message,
          createdAt: row.created_at,
          read: row.read === 1 || row.read === true
        }));

        return res.status(200).json(messages);
      } catch (dbError) {
        console.error('Database error fetching contact messages:', dbError.message);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch contact messages'
        });
      }
    } catch (error) {
      console.error('Error in contact GET:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contact messages'
      });
    }
  }

  // POST - Submit new contact message
  if (req.method === 'POST') {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required'
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
        await db.execute(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE
          )
        `);

        await db.execute(
          'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
          [name, email, subject || '', message]
        );
        await db.end();

        return res.status(200).json({
          success: true,
          message: 'Contact message submitted successfully'
        });
      } catch (dbError) {
        console.error('Database error submitting contact message:', dbError.message);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to submit contact message'
        });
      }
    } catch (error) {
      console.error('Error in contact POST:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit contact message'
      });
    }
  }

  // DELETE - Delete contact message (admin only)
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required'
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
        const [result] = await db.execute(
          'DELETE FROM contact_messages WHERE id = ?',
          [id]
        );
        await db.end();

        if (result.affectedRows > 0) {
          return res.status(200).json({
            success: true,
            message: 'Contact message deleted successfully'
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'Message not found'
          });
        }
      } catch (dbError) {
        console.error('Database error deleting contact message:', dbError.message);
        if (db && !db.ended) await db.end();
        return res.status(500).json({
          success: false,
          message: 'Failed to delete contact message'
        });
      }
    } catch (error) {
      console.error('Error in contact DELETE:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete contact message'
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};

