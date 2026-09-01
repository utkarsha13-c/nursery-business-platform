const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

const pool = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");


// ========================================
// ADMIN: GET NURSERY SETTINGS
// ========================================

router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM nursery_settings
                ORDER BY id
                LIMIT 1;
            `);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Nursery settings not found"
                });
            }

            res.status(200).json({
                settings: result.rows[0]
            });

        } catch (error) {
            console.error("Fetch settings error:", error);

            res.status(500).json({
                message: "Failed to fetch nursery settings"
            });
        }
    }
);


// ========================================
// ADMIN: UPDATE NURSERY SETTINGS
// ========================================

router.put(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                nursery_name,
                phone,
                email,
                address,
                description,
                low_stock_limit,
                notify_new_request,
                notify_low_stock
            } = req.body;

            if (!nursery_name) {
                return res.status(400).json({
                    message: "Nursery name is required"
                });
            }

            const result = await pool.query(
                `
                UPDATE nursery_settings
                SET
                    nursery_name = $1,
                    phone = $2,
                    email = $3,
                    address = $4,
                    description = $5,
                    low_stock_limit = $6,
                    notify_new_request = $7,
                    notify_low_stock = $8,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = (
                    SELECT id
                    FROM nursery_settings
                    ORDER BY id
                    LIMIT 1
                )
                RETURNING *;
                `,
                [
                    nursery_name,
                    phone || null,
                    email || null,
                    address || null,
                    description || null,
                    Number(low_stock_limit) || 10,
                    notify_new_request,
                    notify_low_stock
                ]
            );

            res.status(200).json({
                message: "Nursery settings saved successfully 🌱",
                settings: result.rows[0]
            });

        } catch (error) {
            console.error("Update settings error:", error);

            res.status(500).json({
                message: "Failed to update nursery settings"
            });
        }
    }
);


// ========================================
// ADMIN: CHANGE PASSWORD
// ========================================

router.patch(
    "/change-password",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword
            } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    message: "Current password and new password are required"
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    message: "New password must be at least 6 characters"
                });
            }

            const userResult = await pool.query(
                `
                SELECT id, password_hash
                FROM users
                WHERE id = $1;
                `,
                [req.user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Admin user not found"
                });
            }

            const admin = userResult.rows[0];

            const passwordMatch = await bcrypt.compare(
                currentPassword,
                admin.password_hash
            );

            if (!passwordMatch) {
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }

            const newPasswordHash = await bcrypt.hash(
                newPassword,
                10
            );

            await pool.query(
                `
                UPDATE users
                SET
                    password_hash = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2;
                `,
                [
                    newPasswordHash,
                    req.user.id
                ]
            );

            res.status(200).json({
                message: "Password changed successfully"
            });

        } catch (error) {
            console.error("Change password error:", error);

            res.status(500).json({
                message: "Failed to change password"
            });
        }
    }
);


module.exports = router;