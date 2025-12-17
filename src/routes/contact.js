const express = require("express");
const router = express.Router();
const pool = require("../db");
const transporter = require("../utils/mailer");

/* =========================================================
   ✅ SUBMIT CONTACT MESSAGE
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
    /* 1️⃣ Save to database */
    const [result] = await pool.query(
      `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, subject || null, message]
    );

    /* ==============================
       2️⃣ ADMIN NOTIFICATION EMAIL
    ============================== */
    await transporter.sendMail({
      from: `"JP Research Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER,
      replyTo: email,
      subject: subject
        ? `📩 New Contact: ${subject}`
        : "📩 New Contact Message",
      html: `
        <div style="background:#f4f6f8;padding:24px;font-family:Inter,Arial,sans-serif">
          <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)">

            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:20px;color:#ffffff">
              <h2 style="margin:0;font-size:20px">New Contact Message</h2>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.9">
                Submitted via JP Research website
              </p>
            </div>

            <div style="padding:24px">
              <table style="width:100%;font-size:14px;color:#334155">
                <tr>
                  <td style="padding:6px 0;font-weight:600">Name</td>
                  <td style="padding:6px 0">${name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600">Email</td>
                  <td style="padding:6px 0">${email}</td>
                </tr>
                ${
                  subject
                    ? `
                <tr>
                  <td style="padding:6px 0;font-weight:600">Subject</td>
                  <td style="padding:6px 0">${subject}</td>
                </tr>
                `
                    : ""
                }
              </table>

              <div style="margin-top:16px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569">
                  Message
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#334155">
                  ${message.replace(/\n/g, "<br/>")}
                </p>
              </div>

              <div style="margin-top:24px;font-size:12px;color:#64748b">
                Reply directly to this email to respond to the sender.
              </div>
            </div>
          </div>
        </div>
      `,
    });

    /* ==============================
       3️⃣ AUTO-REPLY TO SENDER
    ============================== */
    await transporter.sendMail({
      from: `"JP Research India" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "✅ We’ve received your message",
      html: `
        <div style="background:#f4f6f8;padding:24px;font-family:Inter,Arial,sans-serif">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08)">
            
            <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a">
              Thank you for contacting JP Research India
            </h2>

            <p style="font-size:14px;color:#334155;line-height:1.6">
              Hi <strong>${name}</strong>,
            </p>

            <p style="font-size:14px;color:#334155;line-height:1.6">
              We’ve successfully received your message and our team will review it shortly.
              If your inquiry requires follow-up, someone from our team will get back to you.
            </p>

            <div style="margin:16px 0;padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569">
                Your message
              </p>
              <p style="margin:0;font-size:14px;color:#334155;line-height:1.6">
                ${message.replace(/\n/g, "<br/>")}
              </p>
            </div>

            <p style="font-size:13px;color:#475569;margin-top:20px">
              Warm regards,<br/>
              <strong>JP Research India</strong><br/>
              Road safety • Research • Advisory
            </p>

            <div style="margin-top:16px;font-size:11px;color:#94a3b8">
              This is an automated confirmation. Please do not reply to this email.
            </div>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      message: "Message sent successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;
