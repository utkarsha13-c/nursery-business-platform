const express = require("express");
const router = express.Router();

const pool = require("../db");

// GET ALL CATEGORIES
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name
            FROM categories
            ORDER BY name;
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Error fetching categories:", error);

        res.status(500).json({
            message: "Failed to fetch categories"
        });
    }
});

module.exports = router;