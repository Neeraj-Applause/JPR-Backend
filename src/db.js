const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway sometimes provides DATABASE_URL instead of individual variables
let dbConfig;

if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL if provided
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  // Use individual environment variables
  dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

const pool = mysql.createPool(dbConfig);

// Debug database configuration
console.log('Database Configuration:');
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
} else {
  console.log('Host:', process.env.DB_HOST || process.env.MYSQLHOST || 'NOT SET');
  console.log('Port:', process.env.DB_PORT || process.env.MYSQLPORT || 3306);
  console.log('User:', process.env.DB_USER || process.env.MYSQLUSER || 'NOT SET');
  console.log('Database:', process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'NOT SET');
  console.log('Password set:', !!(process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD));
}

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
  });

module.exports = pool;
