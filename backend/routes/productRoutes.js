const express = require("express");
const router = express.Router();

const pool = require("../db");
const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");
// ========================================
// ADMIN: GET ALL PRODUCTS
// ACTIVE + INACTIVE
// ========================================
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          p.id,
          p.name,
          p.description,
          p.price,
          p.unit,
          p.stock_quantity,
          p.is_active,
          p.category_id,
          c.name AS category
        FROM products p
        LEFT JOIN categories c
          ON p.category_id = c.id
        ORDER BY p.id;
      `);

      res.status(200).json({
        message: "All products fetched successfully",
        products: result.rows,
      });

    } catch (error) {
      console.error("Error fetching admin products:", error);

      res.status(500).json({
        message: "Failed to fetch products",
      });
    }
  }
);
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
                p.is_active,
                p.category_id,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            
            ORDER BY p.id;
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Error fetching products:",error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
});
// ========================================
// ADMIN: ADD NEW PRODUCT
// ========================================
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        const client = await pool.connect();

        try {
            const {
                name,
                description,
                price,
                unit,
                category_id,
                stock_quantity
            } = req.body;

            // -------------------------------
            // VALIDATION
            // -------------------------------
            if (!name || price === undefined || !category_id) {
                return res.status(400).json({
                    message: "Product name, price and category are required"
                });
            }

            if (Number(price) < 0) {
                return res.status(400).json({
                    message: "Price cannot be negative"
                });
            }

            if (
                stock_quantity !== undefined &&
                Number(stock_quantity) < 0
            ) {
                return res.status(400).json({
                    message: "Stock quantity cannot be negative"
                });
            }

            // -------------------------------
            // CHECK CATEGORY
            // -------------------------------
            const categoryResult = await client.query(
                `
                SELECT id, name
                FROM categories
                WHERE id = $1;
                `,
                [category_id]
            );

            if (categoryResult.rows.length === 0) {
                return res.status(400).json({
                    message: "Invalid category ID. Category does not exist."
                });
            }

            // -------------------------------
            // START TRANSACTION
            // -------------------------------
            await client.query("BEGIN");

            // -------------------------------
            // INSERT PRODUCT
            // -------------------------------
            const productResult = await client.query(
                `
                INSERT INTO products
                (
                    category_id,
                    name,
                    description,
                    price,
                    unit,
                    stock_quantity,
                    is_active
                )
                VALUES
                ($1, $2, $3, $4, $5, $6, true)
                RETURNING *;
                `,
                [
                    category_id,
                    name,
                    description || null,
                    Number(price),
                    unit || "sapling",
                    Number(stock_quantity || 0)
                ]
            );

            const product = productResult.rows[0];

            // -------------------------------
            // ADD INITIAL INVENTORY
            // -------------------------------
            if (Number(stock_quantity || 0) > 0) {

                await client.query(
                    `
                    INSERT INTO inventory
                    (
                        product_id,
                        quantity,
                        movement_type,
                        note
                    )
                    VALUES
                    ($1, $2, 'RESTOCK', $3);
                    `,
                    [
                        product.id,
                        Number(stock_quantity),
                        "Initial stock for new product"
                    ]
                );
            }

            // -------------------------------
            // COMMIT
            // -------------------------------
            await client.query("COMMIT");

            res.status(201).json({
                message: "Product added successfully 🌱",
                product: product
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error(
                "Error adding product:",
                error
            );

            res.status(500).json({
                message: "Failed to add product",
                error: error.message
            });

        } finally {
            client.release();
        }
    }
);
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
router.patch(
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