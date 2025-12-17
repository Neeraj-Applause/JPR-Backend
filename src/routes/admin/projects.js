const express = require("express");
const router = express.Router();
const pool = require("../../db");
const { authRequired, adminOnly } = require("../../middleware/authMiddleware");

router.use(authRequired, adminOnly);

/* =========================================================
   ✅ ADMIN: GET ALL PROJECTS
   GET /api/admin/projects?search=&category=&sort=&order=&page=&limit=
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    category,
    sort = "period",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const sortableColumns = [
    "period",
    "project_title",
    "location",
    "created_at",
  ];
  const sortColumn = sortableColumns.includes(sort) ? sort : "period";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  const filters = [];
  const params = [];

  // 🔍 Search
  if (search.trim()) {
    filters.push(`
      (
        project_title LIKE ?
        OR client LIKE ?
        OR location LIKE ?
        OR summary LIKE ?
      )
    `);
    params.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  // 🏷 Category filter
  if (category) {
    filters.push("category = ?");
    params.push(category);
  }

  const whereSQL = filters.length
    ? `WHERE ${filters.join(" AND ")}`
    : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM projects
      ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM projects
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
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/* =========================================================
   ✅ ADMIN: GET SINGLE PROJECT
   GET /api/admin/projects/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM projects WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

/* =========================================================
   ✅ ADMIN: CREATE PROJECT
   POST /api/admin/projects
========================================================= */
router.post("/", async (req, res) => {
  const {
    period,
    project_title,
    client,
    location,
    summary,
    category,
    is_published = 1,
  } = req.body;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO projects
      (period, project_title, client, location, summary, category, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        period,
        project_title,
        client,
        location,
        summary,
        category,
        Number(is_published),
      ]
    );

    const [rows] = await pool.query(
      `SELECT * FROM projects WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/* =========================================================
   ✅ ADMIN: UPDATE PROJECT
   PUT /api/admin/projects/:id
========================================================= */
router.put("/:id", async (req, res) => {
  const {
    period,
    project_title,
    client,
    location,
    summary,
    category,
    is_published,
  } = req.body;

  try {
    const [result] = await pool.query(
      `
      UPDATE projects
      SET
        period = ?,
        project_title = ?,
        client = ?,
        location = ?,
        summary = ?,
        category = ?,
        is_published = ?
      WHERE id = ?
      `,
      [
        period,
        project_title,
        client,
        location,
        summary,
        category,
        Number(is_published),
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

/* =========================================================
   ✅ ADMIN: DELETE PROJECT
   DELETE /api/admin/projects/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM projects WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
