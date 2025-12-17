const express = require("express");
const router = express.Router();
const pool = require("../../db");
const { authRequired, adminOnly } = require("../../middleware/authMiddleware");

router.use(authRequired, adminOnly);

/* =========================================================
   ✅ GET ALL CONTACT MESSAGES (admin)
   GET /api/admin/contact?search=&page=1&limit=10
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;

  const filters = [];
  const params = [];

  if (search) {
    filters.push(`
      (
        name LIKE ?
        OR email LIKE ?
        OR subject LIKE ?
        OR message LIKE ?
      )
    `);
    params.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  const whereClause = filters.length
    ? `WHERE ${filters.join(" AND ")}`
    : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM contact_messages
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM contact_messages
      ${whereClause}
      `,
      params
    );

    res.json({
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count.total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

/* =========================================================
   ✅ GET SINGLE CONTACT MESSAGE
   GET /api/admin/contact/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM contact_messages WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

/* =========================================================
   ✅ DELETE CONTACT MESSAGE
   DELETE /api/admin/contact/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM contact_messages WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
