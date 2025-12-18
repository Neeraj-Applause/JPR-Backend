const { Resend } = require('resend');

// Initialize email service based on environment
let emailService = null;
let emailType = 'none';

if (process.env.RESEND_API_KEY) {
  emailService = new Resend(process.env.RESEND_API_KEY);
  emailType = 'resend';
  console.log('✅ Using Resend email service');
} else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Fallback to SMTP (existing nodemailer)
  emailService = require('./mailer');
  emailType = 'smtp';
  console.log('⚠️ Using SMTP email service (may have issues in Railway)');
} else {
  console.log('📧 No email service configured - emails will be skipped');
}

/**
 * Send email using available service
 */
async function sendEmail({ to, subject, html, from = null }) {
  if (!emailService) {
    console.log('📧 Email service not available - skipping email');
    return { success: false, reason: 'No email service configured' };
  }

  try {
    if (emailType === 'resend') {
      // Use Resend API
      const result = await emailService.emails.send({
        from: from || process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject: subject,
        html: html,
      });
      console.log('✅ Email sent via Resend:', result.data?.id);
      return { success: true, service: 'resend', id: result.data?.id };
    } else if (emailType === 'smtp') {
      // Use SMTP (nodemailer)
      const result = await emailService.sendMail({
        from: from || `"JP Research" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
      });
      console.log('✅ Email sent via SMTP:', result.messageId);
      return { success: true, service: 'smtp', id: result.messageId };
    }
  } catch (error) {
    console.error(`❌ Failed to send email via ${emailType}:`, error.message);
    return { success: false, service: emailType, error: error.message };
  }
}

/**
 * Send admin notification email
 */
async function sendAdminNotification({ name, email, subject, message }) {
  const html = `
    <div style="background:#f4f6f8;padding:24px;font-family:Inter,Arial,sans-serif">
      <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:20px;color:#ffffff">
          <h2 style="margin:0;font-size:20px">New Contact Message</h2>
          <p style="margin:4px 0 0;font-size:13px;opacity:0.9">Submitted via JP Research website</p>
        </div>
        <div style="padding:24px">
          <table style="width:100%;font-size:14px;color:#334155">
            <tr><td style="padding:6px 0;font-weight:600">Name</td><td style="padding:6px 0">${name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Email</td><td style="padding:6px 0">${email}</td></tr>
            ${subject ? `<tr><td style="padding:6px 0;font-weight:600">Subject</td><td style="padding:6px 0">${subject}</td></tr>` : ""}
          </table>
          <div style="margin-top:16px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569">Message</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#334155">${message.replace(/\n/g, "<br/>")}</p>
          </div>
          <div style="margin-top:24px;font-size:12px;color:#64748b">Reply directly to this email to respond to the sender.</div>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: process.env.CONTACT_RECEIVER,
    subject: subject ? `📩 New Contact: ${subject}` : "📩 New Contact Message",
    html: html,
  });
}

/**
 * Send auto-reply to user
 */
async function sendAutoReply({ name, email, message }) {
  const html = `
    <div style="background:#f4f6f8;padding:24px;font-family:Inter,Arial,sans-serif">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08)">
        <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a">Thank you for contacting JP Research India</h2>
        <p style="font-size:14px;color:#334155;line-height:1.6">Hi <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#334155;line-height:1.6">We've successfully received your message and our team will review it shortly. If your inquiry requires follow-up, someone from our team will get back to you.</p>
        <div style="margin:16px 0;padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569">Your message</p>
          <p style="margin:0;font-size:14px;color:#334155;line-height:1.6">${message.replace(/\n/g, "<br/>")}</p>
        </div>
        <p style="font-size:13px;color:#475569;margin-top:20px">Warm regards,<br/><strong>JP Research India</strong><br/>Road safety • Research • Advisory</p>
        <div style="margin-top:16px;font-size:11px;color:#94a3b8">This is an automated confirmation. Please do not reply to this email.</div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "✅ We've received your message",
    html: html,
  });
}

module.exports = {
  sendEmail,
  sendAdminNotification,
  sendAutoReply,
  emailType,
  isAvailable: !!emailService
};