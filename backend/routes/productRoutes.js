const express = require("express");
const router = express.Router();

const pool = require("../db");
const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");

// GET all products
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.unit,
                p.stock_quantity,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.is_active = true
            ORDER BY p.id;
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
});
// ADD new product
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
    try {
        const {
    name,
    description,
    price,
    unit,
    category_id
} = req.body;

        // Basic validation
        if (!category_id || !name || price === undefined) {
            return res.status(400).json({
                message: "Category, product name and price are required"
            });
        }

        const result = await pool.query(
            `
           UPDATE products
SET
    name = $1,
    description = $2,
    price = $3,
    unit = $4,
    category_id = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6
RETURNING *;
  `,
            [
                category_id,
                name,
                description || null,
                price,
                unit || "sapling",
                //stock_quantity || 0
            ]
        );

        res.status(201).json({
            message: "Product added successfully 🌱",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Error adding product:", error);

        res.status(500).json({
            message: "Failed to add product"
        });
    }
});
// GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.unit,
                p.stock_quantity,
                p.is_active,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error fetching product:", error);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
});
// UPDATE PRODUCT
// UPDATE PRODUCT
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;

            const {
                name,
                description,
                price,
                unit,
                category_id
            } = req.body;

            // Basic validation
            if (!name || price === undefined || !category_id) {
                return res.status(400).json({
                    message: "Name, price and category are required"
                });
            }

            const result = await pool.query(
                `
                UPDATE products
                SET
                    name = $1,
                    description = $2,
                    price = $3,
                    unit = $4,
                    category_id = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING *;
                `,
                [
                    name,
                    description || null,
                    price,
                    unit || "sapling",
                    category_id,
                    id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            res.status(200).json({
                message: "Product updated successfully 🌱",
                product: result.rows[0]
            });

        } catch (error) {
            console.error("Error updating product:", error);

            res.status(500).json({
                message: "Failed to update product"
            });
        }
    }
);
// DEACTIVATE / ACTIVATE PRODUCT
route.patch(
    "/:id/status",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                message: "is_active must be true or false"
            });
        }

        const result = await pool.query(
            `
            UPDATE products
            SET
                is_active = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
            `,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: is_active
                ? "Product activated successfully 🌱"
                : "Product deactivated successfully",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Error changing product status:", error);

        res.status(500).json({
            message: "Failed to update product status"
        });
    }
});


module.exports = router;