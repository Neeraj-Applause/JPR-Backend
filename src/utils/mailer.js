const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service instead of manual SMTP
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Railway-specific optimizations
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  // Retry configuration
  pool: true,
  maxConnections: 1, // Reduced for Gmail
  maxMessages: 10,   // Reduced for Gmail
  // TLS configuration
  tls: {
    rejectUnauthorized: false
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
