// Configuration utility for handling different environments
// Only load .env file in development (not in Railway production)
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

// Debug: Log environment info
console.log('🔍 Environment:', {
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  MYSQL_PUBLIC_URL: process.env.MYSQL_PUBLIC_URL ? 'Available' : 'Not Available',
  BASE_URL: process.env.BASE_URL,
  RAILWAY_ENV: process.env.RAILWAY_ENVIRONMENT || 'local',
  RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
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
  
  // Check for Railway public domain
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
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
  DB_CONFIG: (() => {
    // For Railway, use MYSQL_PUBLIC_URL if individual variables aren't available
    if (process.env.MYSQL_PUBLIC_URL && (!process.env.MYSQL_HOST)) {
      try {
        const url = new URL(process.env.MYSQL_PUBLIC_URL);
        return {
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1), // Remove leading slash
        };
      } catch (error) {
        console.error('❌ Failed to parse MYSQL_PUBLIC_URL:', error);
      }
    }
    
    // Use individual variables (for local development)
    return {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    };
  })(),
  SMTP_CONFIG: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  CONTACT_RECEIVER: process.env.CONTACT_RECEIVER,
};