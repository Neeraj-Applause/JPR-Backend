const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Railway-specific optimizations
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  // Retry configuration
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // TLS configuration for better compatibility
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
    ciphers: 'SSLv3'
  }
});

// ✅ Verify connection with timeout and better error handling
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready to send emails");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error.message);
    // Don't crash the app, just log the error
    console.log("📧 Email functionality may be limited");
  }
};

// Verify connection with a delay to allow Railway to fully initialize
setTimeout(verifyConnection, 5000);

module.exports = transporter;
