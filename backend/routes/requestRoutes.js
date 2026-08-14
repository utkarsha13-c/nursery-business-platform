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
// ADMIN: Approve or reject a customer request
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
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

        // Check current request status
const requestResult = await pool.query(
    `
    SELECT id, status
    FROM requests
    WHERE id = $1;
    `,
    [id]
);

if (requestResult.rows.length === 0) {
    return res.status(404).json({
        message: "Request not found"
    });
}

const currentStatus = requestResult.rows[0].status;

// Only PENDING requests can be approved or rejected
if (currentStatus !== "PENDING") {
    return res.status(400).json({
        message: "Request has already been processed",
        current_status: currentStatus
    });
}

// Update request status
const result = await pool.query(
    `
    UPDATE requests
    SET status = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
    `,
    [status, id]
);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        res.status(200).json({
            message: `Request ${status.toLowerCase()} successfully 🌱`,
            request: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating request:", error);

        res.status(500).json({
            message: "Failed to update request"
        });
    }
});

module.exports = router;