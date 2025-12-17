const express = require("express");
const router = express.Router();
const pool = require("../db");

/* =========================================================
   ✅ GET ALL PROJECTS
   GET /api/projects?search=&category=&sort=period&order=desc&page=1&limit=10
========================================================= */
router.get("/", async (req, res) => {
  const {
    search = "",
    category,
    sort = "period",
    order = "desc",
    page = 1,
    limit = 10,
    published, // ✅ NO DEFAULT
  } = req.query;

  const offset = (page - 1) * limit;

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

  // ✅ Only filter when explicitly requested
  if (published !== undefined) {
    filters.push("is_published = ?");
    params.push(Number(published));
  }

  if (category) {
    filters.push("category = ?");
    params.push(category);
  }

  if (search) {
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

  const whereClause = filters.length
    ? `WHERE ${filters.join(" AND ")}`
    : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM projects
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM projects
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
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});




/* =========================================================
   ✅ GET SINGLE PROJECT
   GET /api/projects/:id
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
   ✅ GET PROJECTS BY CATEGORY
   GET /api/projects/category/:category
========================================================= */
router.get("/category/:category", async (req, res) => {
  const category = decodeURIComponent(req.params.category);

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM projects
      WHERE category = ? AND is_published = 1
      ORDER BY period DESC
      `,
      [category]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects by category" });
  }
});



/* =========================================================
   ✅ CREATE PROJECT
   POST /api/projects
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
        is_published,
      ]
    );

    res.status(201).json({
      message: "Project created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});



/* =========================================================
   ✅ UPDATE PROJECT
   PUT /api/projects/:id
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
        is_published,
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
   ✅ DELETE PROJECT
   DELETE /api/projects/:id
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
