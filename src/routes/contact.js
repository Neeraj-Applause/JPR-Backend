const express = require("express");
const router = express.Router();
const pool = require("../db");
const { sendAdminNotification, sendAutoReply } = require("../utils/emailService");

/* =========================================================
   ✅ SUBMIT CONTACT MESSAGE (with improved error handling)
   POST /api/contact
========================================================= */
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "Name, email and message are required",
    });
  }

  try {
    /* 1️⃣ Save to database FIRST (most important) */
    const [result] = await pool.query(
      `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, subject || null, message]
    );

    console.log(`📝 Contact message saved to database (ID: ${result.insertId})`);

    /* 2️⃣ Try to send emails (but don't fail if SMTP is down) */
    let emailStatus = {
      adminNotification: false,
      autoReply: false
    };

    // Send admin notification email
    const adminResult = await sendAdminNotification({ name, email, subject, message });
    if (adminResult.success) {
      emailStatus.adminNotification = true;
    }

    // Send auto-reply to user
    const replyResult = await sendAutoReply({ name, email, message });
    if (replyResult.success) {
      emailStatus.autoReply = true;
    }

    // Always return success if message was saved to database
    res.status(201).json({
      message: "Message sent successfully",
      id: result.insertId,
      emailStatus: emailStatus // Optional: include email status for debugging
    });

  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;