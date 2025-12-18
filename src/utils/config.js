// Configuration utility for handling different environments
// Only load .env file in development (not in Railway production)
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

// Debug: Log available database environment variables
console.log('🔍 Available DB Environment Variables:', {
  DB_HOST: process.env.DB_HOST,
  MYSQL_HOST: process.env.MYSQL_HOST,
  DB_USER: process.env.DB_USER,
  MYSQL_USER: process.env.MYSQL_USER,
  DB_NAME: process.env.DB_NAME,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  BASE_URL: process.env.BASE_URL,
});

const getBaseUrl = () => {
  // If BASE_URL is explicitly set, use it
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // For Railway deployment, use the Railway URL
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }
  
  // Alternative Railway detection
  if (process.env.RAILWAY_ENVIRONMENT) {
    return `https://jpr-backend-production.up.railway.app`;
  }
  
  // For other cloud platforms, try to detect from common environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  
  // Default to localhost for development
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

module.exports = {
  BASE_URL: getBaseUrl(),
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  DB_CONFIG: {
    host: process.env.DB_HOST || process.env.MYSQL_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER,
    password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  },
  SMTP_CONFIG: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  CONTACT_RECEIVER: process.env.CONTACT_RECEIVER,
};