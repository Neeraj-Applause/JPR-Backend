const express = require("express");
const router = express.Router();
const pool = require("../db");

/* =========================================================
   ✅ GET ALL PUBLICATIONS (search, sort, pagination)
   GET /api/publications?search=&type=&published=true&sort=pub_date&order=desc&page=1&limit=10
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    type = "all",         // filter by publication type (or "all")
    published,            // "true" | "false" | undefined
    sort = "pub_date",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  // ✅ Whitelist sortable columns to avoid SQL injection
  const sortableColumns = ["pub_date", "created_at", "title"];
  const sortColumn = sortableColumns.includes(sort) ? sort : "pub_date";
  const sortOrder = order && order.toLowerCase() === "asc" ? "ASC" : "DESC";

  // Dynamic WHERE builder
  const whereClauses = [];
  const params = [];

  if (search && search.trim()) {
    whereClauses.push(
      `(title LIKE ? OR highlight LIKE ? OR authors LIKE ? OR type LIKE ?)`
    );
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (type && type !== "all") {
    whereClauses.push(`type = ?`);
    params.push(type);
  }

  if (published === "true") {
    whereClauses.push(`is_published = 1`);
  } else if (published === "false") {
    whereClauses.push(`is_published = 0`);
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  try {
    // Data query
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

    // Count query (same WHERE, no LIMIT/OFFSET)
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
   ✅ GET PUBLICATION TYPE COUNTS
   GET /api/publications/type-counts
   Counts only published publications
========================================================= */
router.get("/type-counts", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT type, COUNT(*) AS total
      FROM publications
      WHERE is_published = 1
      GROUP BY type
    `);

    const counts = { All: 0 };

    rows.forEach((r) => {
      counts[r.type] = r.total;
      counts.All += r.total;
    });

    res.json(counts);
  } catch (err) {
    console.error("Type counts error:", err);
    res.status(500).json({ error: "Failed to load type counts" });
  }
});


/* =========================================================
   ✅ GET RESEARCH FOCUS AREAS (from type)
   GET /api/publications/focus-areas
========================================================= */
router.get("/focus-areas", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        type,
        COUNT(*) AS total
      FROM publications
      WHERE is_published = 1
      GROUP BY type
      ORDER BY total DESC
    `);

    res.json(rows); // 👈 return raw counts
  } catch (err) {
    console.error("Focus areas error:", err);
    res.status(500).json({ error: "Failed to load focus areas" });
  }
});


/* =========================================================
   ✅ GET SINGLE PUBLICATION BY ID
   GET /api/publications/:id
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
   ✅ GET PUBLICATIONS BY YEAR
   GET /api/publications/year/2024
========================================================= */
router.get("/year/:year", async (req, res) => {
  const year = parseInt(req.params.year, 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM publications
      WHERE YEAR(pub_date) = ?
      ORDER BY pub_date DESC
      `,
      [year]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch publications by year" });
  }
});

/* =========================================================
   ✅ CREATE PUBLICATION
   POST /api/publications
   body JSON:
   {
     type,           // 'Technical Paper' | 'Research Report' | 'Presentation' | 'Other'
     title,
     highlight,
     pub_date,       // 'YYYY-MM-DD' or null
     authors,
     abstract,
     link,
     is_published    // boolean (optional, default true)
   }
========================================================= */
router.post("/", async (req, res) => {
  const {
    type = "Technical Paper",
    title,
    highlight,
    pub_date,
    authors,
    abstract,
    link,
    is_published = 1,
  } = req.body;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO publications
      (type, title, highlight, pub_date, authors, abstract, link, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type,
        title,
        highlight,
        pub_date || null,
        authors,
        abstract,
        link,
        is_published ? 1 : 0,
      ]
    );

    res.status(201).json({
      message: "Publication created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create publication" });
  }
});



/* =========================================================
   ✅ UPDATE PUBLICATION
   PUT /api/publications/:id
========================================================= */
router.put("/:id", async (req, res) => {
  const {
    type = "Technical Paper",
    title,
    highlight,
    pub_date,
    authors,
    abstract,
    link,
    is_published = 1,
  } = req.body;

  try {
    const [result] = await pool.query(
      `
      UPDATE publications
      SET type = ?, title = ?, highlight = ?, pub_date = ?, authors = ?, abstract = ?, link = ?, is_published = ?
      WHERE id = ?
      `,
      [
        type,
        title,
        highlight,
        pub_date || null,
        authors,
        abstract,
        link,
        is_published ? 1 : 0,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ message: "Publication updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update publication" });
  }
});




/* =========================================================
   ✅ DELETE PUBLICATION
   DELETE /api/publications/:id
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
