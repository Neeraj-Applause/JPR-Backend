const express = require("express");
const router = express.Router();
const pool = require("../../db");
const { authRequired, adminOnly } = require("../../middleware/authMiddleware");
const uploadPdf = require("../../middleware/uploadPublicationPdf");
const { BASE_URL } = require("../../utils/config");


router.use(authRequired, adminOnly);

/* =========================================================
   ✅ ADMIN: GET ALL PUBLICATIONS
   GET /api/admin/publications?search=&type=&sort=&order=&page=&limit=
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    type = "all",
    sort = "pub_date",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const sortableColumns = ["pub_date", "created_at", "title"];
  const sortColumn = sortableColumns.includes(sort) ? sort : "pub_date";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  const where = [];
  const params = [];

  if (search.trim()) {
    where.push(
      `(title LIKE ? OR highlight LIKE ? OR authors LIKE ? OR abstract LIKE ?)`
    );
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (type !== "all") {
    where.push("type = ?");
    params.push(type);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM publications
      ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM publications
      ${whereSQL}
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
    res.status(500).json({ error: "Failed to fetch publications" });
  }
});

/* =========================================================
   ✅ ADMIN: GET SINGLE PUBLICATION
   GET /api/admin/publications/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM publications WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch publication" });
  }
});

/* =========================================================
   ✅ ADMIN: CREATE PUBLICATION
   POST /api/admin/publications
========================================================= */
router.post("/", uploadPdf.single("pdf"), async (req, res) => {
  console.log("Creating publication with body:", req.body);
  console.log("PDF file received:", req.file ? req.file.filename : "No file");
  
  const {
    type,
    title,
    highlight,
    pub_date,
    authors,
    abstract,
    is_published = 1,
  } = req.body;

  const pdfPath = req.file
    ? `${BASE_URL}/uploads/publications/${req.file.filename}`
    : null;
    
  console.log("PDF path:", pdfPath);

  try {
    const [result] = await pool.query(
      `
      INSERT INTO publications
      (type, title, highlight, pub_date, authors, abstract, pdf_path, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type,
        title,
        highlight,
        pub_date || null,
        authors,
        abstract,
        pdfPath,          // ✅ THIS WAS MISSING
        Number(is_published),
      ]
    );

    const [rows] = await pool.query(
      `SELECT * FROM publications WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create publication" });
  }
});



/* =========================================================
   ✅ ADMIN: UPDATE PUBLICATION
   PUT /api/admin/publications/:id
========================================================= */
router.put("/:id", uploadPdf.single("pdf"), async (req, res) => {
  console.log("Updating publication ID:", req.params.id);
  console.log("Update body:", req.body);
  console.log("PDF file received:", req.file ? req.file.filename : "No file");
  
  const {
    type,
    title,
    highlight,
    pub_date,
    authors,
    abstract,
    is_published,
  } = req.body;

  const pdfPath = req.file
    ? `${BASE_URL}/uploads/publications/${req.file.filename}`
    : null;
    
  console.log("PDF path:", pdfPath);

  try {
    const [result] = await pool.query(
      `
      UPDATE publications
      SET
        type = ?,
        title = ?,
        highlight = ?,
        pub_date = ?,
        authors = ?,
        abstract = ?,
        pdf_path = COALESCE(?, pdf_path), -- ✅ CRITICAL
        is_published = ?
      WHERE id = ?
      `,
      [
        type,
        title,
        highlight,
        pub_date || null,
        authors,
        abstract,
        pdfPath,
        Number(is_published),
        req.params.id,
      ]
    );

    res.json({ message: "Publication updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update publication" });
  }
});



/* =========================================================
   ✅ ADMIN: DELETE PUBLICATION
   DELETE /api/admin/publications/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM publications WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ message: "Publication deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete publication" });
  }
});

module.exports = router;
