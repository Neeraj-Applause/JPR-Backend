const nodemailer = require("nodemailer");

// Use SendGrid if API key is provided, otherwise use SMTP
const transporter = process.env.SENDGRID_API_KEY 
  ? nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
    });

// ✅ Verify connection on startup (optional but recommended)
// Only verify if SMTP credentials are provided
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Use setTimeout to make verification non-blocking
  setTimeout(() => {
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP connection failed:", error.message);
        console.log("📧 Email functionality will be limited");
      } else {
        console.log("✅ SMTP server is ready to send emails");
      }
    });
  }, 5000); // Wait 5 seconds after server starts
} else {
  console.log("⚠️ SMTP credentials not configured - email functionality disabled");
}

module.exports = transporter;
