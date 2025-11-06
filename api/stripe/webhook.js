const mysql = require('mysql2/promise');

const getDbConnection = async () => {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return null;
  }

  try {
    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      connectTimeout: 5000
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
    console.error('Database connection error:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Handle different Stripe webhook events
    if (event.type === 'invoice.payment_failed' || event.type === 'customer.subscription.deleted') {
      // Payment failed or subscription cancelled
      const customerId = event.data.object.customer;
      const subscriptionId = event.data.object.subscription || event.data.object.id;
      
      console.log('Payment failed for customer:', customerId, 'subscription:', subscriptionId);
      
      const db = await getDbConnection();
      if (!db) {
        console.error('Database connection failed for webhook');
        return res.status(500).json({ success: false, message: 'Database connection error' });
      }

      try {
        // Find user by Stripe customer ID or subscription ID
        // You may need to store stripe_customer_id in users table
        // For now, we'll try to find by email from the invoice
        let userId = null;
        
        if (event.data.object.customer_email) {
          const [userRows] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [event.data.object.customer_email]
          );
          if (userRows.length > 0) {
            userId = userRows[0].id;
          }
        }

        if (userId) {
          // Mark payment as failed
          await db.execute(
            'UPDATE users SET payment_failed = TRUE, subscription_status = ? WHERE id = ?',
            ['inactive', userId]
          );
          console.log('Marked payment as failed for user:', userId);
        }
        
        await db.end();
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
        if (db && !db.ended) await db.end();
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      // Payment succeeded - reactivate subscription
      const customerId = event.data.object.customer;
      
      const db = await getDbConnection();
      if (!db) {
        return res.status(500).json({ success: false, message: 'Database connection error' });
      }

      try {
        let userId = null;
        
        if (event.data.object.customer_email) {
          const [userRows] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [event.data.object.customer_email]
          );
          if (userRows.length > 0) {
            userId = userRows[0].id;
          }
        }

        if (userId) {
          // Clear payment failed flag and reactivate
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 1 month from now
          
          await db.execute(
            'UPDATE users SET payment_failed = FALSE, subscription_status = ?, subscription_expiry = ? WHERE id = ?',
            ['active', expiryDate.toISOString().slice(0, 19).replace('T', ' '), userId]
          );
          console.log('Reactivated subscription for user:', userId);
        }
        
        await db.end();
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
        if (db && !db.ended) await db.end();
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

