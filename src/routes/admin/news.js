const express = require("express");
const router = express.Router();
const pool = require("../../db");
const upload = require("../../middleware/upload");
const { authRequired, adminOnly } = require("../../middleware/authMiddleware");

router.use(authRequired, adminOnly);

/* =========================================================
   ✅ ADMIN: GET ALL NEWS (no published filter)
   GET /api/admin/news?search=&sort=&order=&page=&limit=
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    sort = "event_date",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;

  const sortableColumns = ["event_date", "created_at", "title"];
  const sortColumn = sortableColumns.includes(sort) ? sort : "event_date";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        n.*,
        CASE 
          WHEN COUNT(ni.image_url) = 0 THEN JSON_ARRAY()
          ELSE JSON_ARRAYAGG(ni.image_url)
        END AS images
      FROM news n
      LEFT JOIN news_images ni ON n.id = ni.news_id
      WHERE n.title LIKE ?
         OR n.summary LIKE ?
         OR n.category LIKE ?
      GROUP BY n.id
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        Number(limit),
        Number(offset),
      ]
    );

    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM news
      WHERE title LIKE ?
         OR summary LIKE ?
         OR category LIKE ?
      `,
      [`%${search}%`, `%${search}%`, `%${search}%`]
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
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

/* =========================================================
   ✅ ADMIN: GET SINGLE NEWS
   GET /api/admin/news/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        n.*,
        CASE 
          WHEN COUNT(ni.image_url) = 0 THEN JSON_ARRAY()
          ELSE JSON_ARRAYAGG(ni.image_url)
        END AS images
      FROM news n
      LEFT JOIN news_images ni ON n.id = ni.news_id
      WHERE n.id = ?
      GROUP BY n.id
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "News not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

/* =========================================================
   ✅ ADMIN: CREATE NEWS (with images)
   POST /api/admin/news
========================================================= */
router.post("/", upload.array("images", 10), async (req, res) => {
  const { title, summary, content, category, event_date } = req.body;
  const files = req.files || [];

  const { BASE_URL } = require('../../utils/config');
  const imagePaths = files.map(
    (file) => `${BASE_URL}/uploads/news/${file.filename}`
  );

  try {
    const [result] = await pool.query(
      `
      INSERT INTO news (title, summary, content, category, event_date)
      VALUES (?, ?, ?, ?, ?)
      `,
      [title, summary, content, category, event_date]
    );

    const newsId = result.insertId;

    if (imagePaths.length) {
      const values = imagePaths.map((url, i) => [
        newsId,
        url,
        i + 1,
      ]);

      await pool.query(
        `INSERT INTO news_images (news_id, image_url, sort_order) VALUES ?`,
        [values]
      );
    }

    res.status(201).json({ message: "News created", id: newsId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create news" });
  }
});

/* =========================================================
   ✅ ADMIN: UPDATE NEWS (replace images)
   PUT /api/admin/news/:id
========================================================= */
router.put("/:id", upload.array("images", 10), async (req, res) => {
  const { title, summary, content, category, event_date } = req.body;
  const files = req.files || [];

  const { BASE_URL } = require('../../utils/config');
  const imagePaths = files.map(
    (file) => `${BASE_URL}/uploads/news/${file.filename}`
  );

  try {
    const [result] = await pool.query(
      `
      UPDATE news
      SET title=?, summary=?, content=?, category=?, event_date=?
      WHERE id=?
      `,
      [title, summary, content, category, event_date, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "News not found" });
    }

    if (imagePaths.length > 0) {
      await pool.query(`DELETE FROM news_images WHERE news_id=?`, [
        req.params.id,
      ]);

      const values = imagePaths.map((url, i) => [
        req.params.id,
        url,
        i + 1,
      ]);

      await pool.query(
        `INSERT INTO news_images (news_id, image_url, sort_order) VALUES ?`,
        [values]
      );
    }

    res.json({ message: "News updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update news" });
  }
});

/* =========================================================
   ✅ ADMIN: DELETE NEWS
   DELETE /api/admin/news/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM news WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "News not found" });
    }

    res.json({ message: "News deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete news" });
  }
});

module.exports = router;
