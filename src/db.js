const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('./utils/config');

// Add debugging to see what config is being used
console.log('🔍 Database Configuration:', {
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  user: DB_CONFIG.user,
  database: DB_CONFIG.database,
  // Don't log password for security
});

const pool = mysql.createPool({
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
