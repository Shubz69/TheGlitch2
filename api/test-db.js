// Test database connection endpoint
const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const envVars = {
    hasHost: !!process.env.MYSQL_HOST,
    hasUser: !!process.env.MYSQL_USER,
    hasPassword: !!process.env.MYSQL_PASSWORD,
    hasDatabase: !!process.env.MYSQL_DATABASE,
    hasSSL: !!process.env.MYSQL_SSL,
    host: process.env.MYSQL_HOST || 'NOT SET',
    user: process.env.MYSQL_USER || 'NOT SET',
    database: process.env.MYSQL_DATABASE || 'NOT SET',
    ssl: process.env.MYSQL_SSL || 'NOT SET',
    port: process.env.MYSQL_PORT || '3306 (default)'
  };

  if (!envVars.hasHost || !envVars.hasUser || !envVars.hasPassword || !envVars.hasDatabase) {
    return res.status(200).json({
      success: false,
      message: 'Missing environment variables',
      envVars: {
        ...envVars,
        password: envVars.hasPassword ? '***SET***' : 'NOT SET'
      }
    });
  }

  try {
    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      connectTimeout: 5000,
      acquireTimeout: 5000
    };

    if (process.env.MYSQL_SSL === 'true') {
      connectionConfig.ssl = { rejectUnauthorized: false };
    } else {
      connectionConfig.ssl = false;
    }

    console.log('Testing connection with config:', {
      host: connectionConfig.host,
      user: connectionConfig.user,
      database: connectionConfig.database,
      port: connectionConfig.port,
      ssl: connectionConfig.ssl
    });

    const connection = await mysql.createConnection(connectionConfig);
    await connection.ping();
    await connection.end();

    return res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      config: {
        host: connectionConfig.host,
        user: connectionConfig.user,
        database: connectionConfig.database,
        port: connectionConfig.port,
        ssl: connectionConfig.ssl
      }
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return res.status(200).json({
      success: false,
      message: 'Database connection failed',
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      },
      config: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT || 3306,
        ssl: process.env.MYSQL_SSL
      }
    });
  }
};

