const express = require("express");
const router = express.Router();

const pool = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");

// ========================================
// ADMIN: GET ALL USERS
// ========================================
router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    role,
                    created_at
                FROM users
                ORDER BY id DESC;
            `);

            res.status(200).json({
                message: "Users fetched successfully",
                users: result.rows
            });

        } catch (error) {
            console.error("Error fetching users:", error);

            res.status(500).json({
                message: "Failed to fetch users"
            });
        }
    }
);

module.exports = router;