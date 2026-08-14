const express = require("express");
const router = express.Router();

const pool = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");


// ADMIN: View current inventory
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                COALESCE(
                    SUM(
                        CASE
                            WHEN i.movement_type = 'RESTOCK'
                                THEN i.quantity
                            WHEN i.movement_type = 'SALE'
                                THEN -i.quantity
                            WHEN i.movement_type = 'ADJUSTMENT'
                                THEN i.quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS available_stock
            FROM products p
            LEFT JOIN inventory i
                ON p.id = i.product_id
            GROUP BY p.id, p.name
            ORDER BY p.id;
        `);

        res.status(200).json({
            message: "Inventory fetched successfully 🌱",
            inventory: result.rows
        });

    } catch (error) {
        console.error("Error fetching inventory:", error);

        res.status(500).json({
            message: "Failed to fetch inventory"
        });
    }
});


// ADMIN: Restock inventory
router.post("/restock", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, quantity, note } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            });
        }

        // Check product exists
        const productResult = await pool.query(
            `
            SELECT id, name
            FROM products
            WHERE id = $1;
            `,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Add RESTOCK movement
        const result = await pool.query(
            `
            INSERT INTO inventory
            (product_id, quantity, movement_type, note)
            VALUES ($1, $2, 'RESTOCK', $3)
            RETURNING *;
            `,
            [
                product_id,
                quantity,
                note || "Inventory restocked"
            ]
        );

        res.status(201).json({
            message: "Inventory restocked successfully 🌱",
            inventory: result.rows[0]
        });

    } catch (error) {
        console.error("Error restocking inventory:", error);

        res.status(500).json({
            message: "Failed to restock inventory"
        });
    }
});
// ADMIN: View inventory history
router.get("/history", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                i.id,
                i.product_id,
                p.name AS product_name,
                i.quantity,
                i.movement_type,
                i.note,
                i.created_at
            FROM inventory i
            JOIN products p
                ON i.product_id = p.id
            ORDER BY i.created_at DESC;
        `);

        res.status(200).json({
            message: "Inventory history fetched successfully 🌱",
            history: result.rows
        });

    } catch (error) {
        console.error("Error fetching inventory history:", error);

        res.status(500).json({
            message: "Failed to fetch inventory history"
        });
    }
});
// ADMIN: Adjust inventory
router.post("/adjustment", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, quantity, note } = req.body;

        // Validate required fields
        if (!product_id || quantity === undefined) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }

        if (quantity === 0) {
            return res.status(400).json({
                message: "Adjustment quantity cannot be 0"
            });
        }

        // Check product exists
        const productResult = await pool.query(
            `
            SELECT id, name
            FROM products
            WHERE id = $1;
            `,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check current stock
        const stockResult = await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN movement_type = 'RESTOCK'
                                THEN quantity
                            WHEN movement_type = 'SALE'
                                THEN -quantity
                            WHEN movement_type = 'ADJUSTMENT'
                                THEN quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS current_stock
            FROM inventory
            WHERE product_id = $1;
            `,
            [product_id]
        );

        const currentStock = Number(stockResult.rows[0].current_stock);
        const newStock = currentStock + Number(quantity);

        // Don't allow stock to become negative
        if (newStock < 0) {
            return res.status(400).json({
                message: "Adjustment would make inventory negative",
                current_stock: currentStock,
                adjustment: Number(quantity)
            });
        }

        // Add adjustment movement
        const result = await pool.query(
            `
            INSERT INTO inventory
            (product_id, quantity, movement_type, note)
            VALUES ($1, $2, 'ADJUSTMENT', $3)
            RETURNING *;
            `,
            [
                product_id,
                quantity,
                note || "Inventory adjustment"
            ]
        );

        res.status(201).json({
            message: "Inventory adjusted successfully 🌱",
            adjustment: result.rows[0],
            previous_stock: currentStock,
            new_stock: newStock
        });

    } catch (error) {
        console.error("Error adjusting inventory:", error);

        res.status(500).json({
            message: "Failed to adjust inventory"
        });
    }
});
module.exports = router;