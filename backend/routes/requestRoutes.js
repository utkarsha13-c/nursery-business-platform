const express = require("express");
const router = express.Router();
const pool = require("../db");

const { authenticateToken,requireAdmin } = require("../middleware/authMiddleware");

// CUSTOMER: Create a product request
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity, message } = req.body;

        // Validate input
if (!product_id || quantity === undefined) {
    return res.status(400).json({
        message: "Product ID and quantity are required"
    });
}

if (Number(quantity) <= 0) {
    return res.status(400).json({
        message: "Quantity must be greater than 0"
    });
}

// Check if product exists
const productResult = await pool.query(
    `
    SELECT id, name, price, is_active
    FROM products
    WHERE id = $1
    `,
    [product_id]
);

if (productResult.rows.length === 0) {
    return res.status(404).json({
        message: "Product not found"
    });
}

const product = productResult.rows[0];

// Don't allow requests for inactive products
if (!product.is_active) {
    return res.status(400).json({
        message: "Product is currently inactive"
    });
}

// Create request
const requestResult = await pool.query(
            `
            INSERT INTO requests
            (customer_id, status, message)
            VALUES ($1, 'PENDING', $2)
            RETURNING *;
            `,
            [
                req.user.id,
                message || null
            ]
        );

        const request = requestResult.rows[0];

        // Add requested product
        const itemResult = await pool.query(
            `
            INSERT INTO request_items
            (request_id, product_id, quantity)
            VALUES ($1, $2, $3)
            RETURNING *;
            `,
            [
                request.id,
                product_id,
                quantity
            ]
        );

        res.status(201).json({
            message: "Product request created successfully 🌱",
            request: request,
            item: itemResult.rows[0]
        });

    } catch (error) {
        console.error("Request creation error:", error);

        res.status(500).json({
            message: "Failed to create request"
        });
    }
});
// ADMIN: View all customer requests
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.customer_id,
                u.name AS customer_name,
                u.email AS customer_email,
                r.status,
                r.message,
                r.created_at,
                r.updated_at,
                ri.product_id,
                p.name AS product_name,
                ri.quantity,
                p.price
            FROM requests r
            JOIN users u
                ON r.customer_id = u.id
            JOIN request_items ri
                ON r.id = ri.request_id
            JOIN products p
                ON ri.product_id = p.id
            ORDER BY r.created_at DESC
        `);

        res.status(200).json({
            message: "Customer requests fetched successfully 🌱",
            requests: result.rows
        });

    } catch (error) {
        console.error("Error fetching requests:", error);

        res.status(500).json({
            message: "Failed to fetch customer requests"
        });
    }
});




// CUSTOMER: Create a product request
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity, message } = req.body;

        // Validate input
if (!product_id || quantity === undefined) {
    return res.status(400).json({
        message: "Product ID and quantity are required"
    });
}

if (Number(quantity) <= 0) {
    return res.status(400).json({
        message: "Quantity must be greater than 0"
    });
}

// Check if product exists
const productResult = await pool.query(
    `
    SELECT id, name, price, is_active
    FROM products
    WHERE id = $1
    `,
    [product_id]
);

if (productResult.rows.length === 0) {
    return res.status(404).json({
        message: "Product not found"
    });
}

const product = productResult.rows[0];

// Don't allow requests for inactive products
if (!product.is_active) {
    return res.status(400).json({
        message: "Product is currently inactive"
    });
}

// Create request
const requestResult = await pool.query(
            `
            INSERT INTO requests
            (customer_id, status, message)
            VALUES ($1, 'PENDING', $2)
            RETURNING *;
            `,
            [
                req.user.id,
                message || null
            ]
        );

        const request = requestResult.rows[0];

        // Add requested product
        const itemResult = await pool.query(
            `
            INSERT INTO request_items
            (request_id, product_id, quantity)
            VALUES ($1, $2, $3)
            RETURNING *;
            `,
            [
                request.id,
                product_id,
                quantity
            ]
        );

        res.status(201).json({
            message: "Product request created successfully 🌱",
            request: request,
            item: itemResult.rows[0]
        });

    } catch (error) {
        console.error("Request creation error:", error);

        res.status(500).json({
            message: "Failed to create request"
        });
    }
});
// ADMIN: View all customer requests
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.customer_id,
                u.name AS customer_name,
                u.email AS customer_email,
                r.status,
                r.message,
                r.created_at,
                r.updated_at,
                ri.product_id,
                p.name AS product_name,
                ri.quantity,
                p.price
            FROM requests r
            JOIN users u
                ON r.customer_id = u.id
            JOIN request_items ri
                ON r.id = ri.request_id
            JOIN products p
                ON ri.product_id = p.id
            ORDER BY r.created_at DESC
        `);

        res.status(200).json({
            message: "Customer requests fetched successfully 🌱",
            requests: result.rows
        });

    } catch (error) {
        console.error("Error fetching requests:", error);

        res.status(500).json({
            message: "Failed to fetch customer requests"
        });
    }
});
/// ADMIN: Approve or reject a customer request
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED"
            });
        }

        await client.query("BEGIN");

        // Get request + requested product
        const requestResult = await client.query(
            `
            SELECT
                r.id,
                r.customer_id,
                r.status,
                ri.product_id,
                ri.quantity,
                p.name AS product_name,
                p.price,
                p.stock_quantity,
                p.is_active
            FROM requests r
            JOIN request_items ri
                ON r.id = ri.request_id
            JOIN products p
                ON ri.product_id = p.id
            WHERE r.id = $1
            `,
            [id]
        );

        if (requestResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Request not found"
            });
        }

        const request = requestResult.rows[0];

        // Only PENDING requests can be processed
        if (request.status !== "PENDING") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Request has already been processed",
                current_status: request.status
            });
        }

        // ------------------------------------------------
        // REJECT REQUEST
        // ------------------------------------------------
        if (status === "REJECTED") {

            const updatedRequest = await client.query(
                `
                UPDATE requests
                SET
                    status = 'REJECTED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message: "Request rejected successfully",
                request: updatedRequest.rows[0]
            });
        }

        // ------------------------------------------------
        // APPROVE REQUEST
        // ------------------------------------------------

        // Check stock
        if (request.quantity > request.stock_quantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Not enough stock. Available stock: ${request.stock_quantity}`
            });
        }

        // Check product active
        if (!request.is_active) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Product is currently inactive"
            });
        }

        // Calculate total
        const totalAmount =
            Number(request.price) * Number(request.quantity);

        // 1. Create order
        const orderResult = await client.query(
            `
            INSERT INTO orders
            (
                customer_id,
                status,
                total_amount
            )
            VALUES
            (
                $1,
                'PENDING',
                $2
            )
            RETURNING *
            `,
            [
                request.customer_id,
                totalAmount
            ]
        );

        const order = orderResult.rows[0];

        // 2. Create order item
        const orderItemResult = await client.query(
            `
            INSERT INTO order_items
            (
                order_id,
                product_id,
                quantity,
                price,
                subtotal
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
            `,
            [
                order.id,
                request.product_id,
                request.quantity,
                request.price,
                totalAmount
            ]
        );

        // 3. Reduce product stock
        await client.query(
            `
            UPDATE products
            SET
                stock_quantity = stock_quantity - $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
                request.quantity,
                request.product_id
            ]
        );

        // 4. Add inventory SALE record
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
            (
                $1,
                $2,
                'SALE',
                $3
            )
            `,
            [
                request.product_id,
                request.quantity,
                `Order #${order.id} created from customer request #${request.id}`
            ]
        );

        // 5. Update request
        const updatedRequest = await client.query(
            `
            UPDATE requests
            SET
                status = 'APPROVED',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Request approved and order created successfully 🌱",
            request: updatedRequest.rows[0],
            order: order,
            order_item: orderItemResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error processing request:", error);

        res.status(500).json({
            message: "Failed to process request",
            error: error.message
        });

    } finally {
        client.release();
    }
});
        
module.exports = router;