const express = require("express");
const router = express.Router();
const pool = require("../db");

/* =========================================================
   ✅ GET ALL NEWS (with images, search, sort, pagination)
   GET /api/news?search=&sort=event_date&order=desc&page=1&limit=10
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

  // ✅ Whitelist sortable columns to avoid SQL injection
  const sortableColumns = ["event_date", "created_at", "title"];
  const sortColumn = sortableColumns.includes(sort) ? sort : "event_date";
  const sortOrder = order && order.toLowerCase() === "asc" ? "ASC" : "DESC";

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
      `SELECT COUNT(*) AS total FROM news`
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
   ✅ GET SINGLE NEWS BY ID
   GET /api/news/:id
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
   ✅ GET NEWS BY YEAR
   GET /api/news/year/2024
========================================================= */
router.get("/year/:year", async (req, res) => {
  const year = parseInt(req.params.year, 10);

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
      WHERE YEAR(n.event_date) = ?
      GROUP BY n.id
      ORDER BY n.event_date DESC
      `,
      [year]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news by year" });
  }
});

/* =========================================================
   ✅ CREATE NEWS (with multiple images)
   POST /api/news
   body:
   {
     title, summary, content, category, event_date,
     images: ["/uploads/news/1.jpg", "/uploads/news/2.jpg"]
   }
========================================================= */
const upload = require("../middleware/upload");

router.post("/", upload.array("images", 10), async (req, res) => {
  console.log("Creating news with body:", req.body);
  console.log("Files received:", req.files?.length || 0);
  
  const { title, summary, content, category, event_date } = req.body;
  const files = req.files || [];

  const { BASE_URL } = require('../utils/config');
  const imagePaths = files.map(
    (file, i) => `${BASE_URL}/uploads/news/${file.filename}`
  );
  
  console.log("Image paths:", imagePaths);

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

    res.status(201).json({ message: "News created successfully", id: newsId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create news" });
  }
});


/* =========================================================
   ✅ UPDATE NEWS (replace images)
   PUT /api/news/:id
========================================================= */
router.put("/:id", upload.array("images", 10), async (req, res) => {
  console.log("Updating news ID:", req.params.id);
  console.log("Update body:", req.body);
  console.log("Files received:", req.files?.length || 0);
  
  const { title, summary, content, category, event_date } = req.body;
  const files = req.files || [];

  const { BASE_URL } = require('../utils/config');
  const imagePaths = files.map(
    (file) => `${BASE_URL}/uploads/news/${file.filename}`
  );
  
  console.log("Image paths:", imagePaths);

  try {
    await pool.query(
      `
      UPDATE news
      SET title=?, summary=?, content=?, category=?, event_date=?
      WHERE id=?
      `,
      [title, summary, content, category, event_date, req.params.id]
    );

    // Only update images if new images are uploaded
    if (imagePaths.length > 0) {
      // Delete existing images
      await pool.query(`DELETE FROM news_images WHERE news_id=?`, [
        req.params.id,
      ]);

      // Insert new images
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

    res.json({ message: "News updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update news" });
  }
});




/* =========================================================
   ✅ DELETE NEWS (auto deletes images via cascade)
   DELETE /api/news/:id
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

    res.json({ message: "News deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete news" });
  }
});

module.exports = router;
