// PM2 ecosystem file for password reset server
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Status: pm2 status
// Logs: pm2 logs password-reset-server

module.exports = {
  apps: [{
    name: 'password-reset-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      EMAIL_USER: process.env.EMAIL_USER || '',
      EMAIL_PASS: process.env.EMAIL_PASS || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || ''
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

