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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Default courses list (fallback if database is unavailable)
    const defaultCourses = [
      { id: 1, title: "E-Commerce", description: "Master Amazon FBA, Shopify, and dropshipping to build multiple income streams", level: "All Levels", duration: 6, price: 99.99, imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" },
      { id: 2, title: "Health & Fitness", description: "Build profitable fitness brands, coaching businesses, and supplement companies", level: "All Levels", duration: 5, price: 79.99, imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" },
      { id: 3, title: "Trading", description: "Master forex, stocks, and crypto trading strategies", level: "Intermediate", duration: 8, price: 149.99, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" },
      { id: 4, title: "Real Estate", description: "Master strategic property investment, REIT analysis, and PropTech opportunities", level: "Intermediate", duration: 7, price: 119.99, imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80" },
      { id: 5, title: "Social Media", description: "Build massive personal brands and monetize digital influence", level: "All Levels", duration: 4, price: 59.99, imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2339&q=80" }
    ];

    // Try to fetch from database
    const db = await getDbConnection();
    if (db) {
      try {
        // Create courses table if it doesn't exist
        await db.execute(`
          CREATE TABLE IF NOT EXISTS courses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            level VARCHAR(50),
            duration INT,
            price DECIMAL(10, 2),
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        // Check if courses exist
        const [rows] = await db.execute('SELECT * FROM courses ORDER BY id ASC');
        await db.end();

        if (rows && rows.length > 0) {
          // Map database rows to API format
          const courses = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            level: row.level,
            duration: row.duration,
            price: parseFloat(row.price),
            imageUrl: row.image_url
          }));
          return res.status(200).json(courses);
        }
      } catch (dbError) {
        console.error('Database error fetching courses:', dbError);
        await db.end();
      }
    }

    // Return default courses if database unavailable or empty
    return res.status(200).json(defaultCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch courses. Please try again later.' 
    });
  }
};

