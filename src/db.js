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
  // Use individual environment variables - prioritize Railway vars in production
  dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME,
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
  console.log('Host:', process.env.MYSQLHOST || process.env.DB_HOST || 'NOT SET');
  console.log('Port:', process.env.MYSQLPORT || process.env.DB_PORT || 3306);
  console.log('User:', process.env.MYSQLUSER || process.env.DB_USER || 'NOT SET');
  console.log('Database:', process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'NOT SET');
  console.log('Password set:', !!(process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD));
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
