const express = require("express");
const router = express.Router();

const pool = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");


// ========================================
// ADMIN: GET ALL ORDERS
// ========================================
router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    o.id,
                    o.customer_id,
                    u.name AS customer_name,
                    u.email AS customer_email,
                    o.status,
                    o.total_amount,
                    o.created_at
                FROM orders o
                LEFT JOIN users u
                    ON o.customer_id = u.id
                ORDER BY o.created_at DESC;
            `);

            res.status(200).json({
                message: "Orders fetched successfully",
                orders: result.rows
            });

        } catch (error) {
            console.error("Error fetching orders:", error);

            res.status(500).json({
                message: "Failed to fetch orders"
            });
        }
    }
);


// ADMIN: Create order from an approved request
router.post(
    "/from-request/:requestId",
    authenticateToken,
    requireAdmin,
    async (req, res) => {router.post

        const client = await pool.connect();

        try {
            const { requestId } = req.params;

            await client.query("BEGIN");

            // 1. Get approved request + request item
            const requestResult = await client.query(
    `
    SELECT
        r.id AS request_id,
        r.customer_id,
        r.status,
        r.order_id,
        ri.product_id,
        ri.quantity,
        p.price,
        p.is_active
    FROM requests r
    JOIN request_items ri
        ON r.id = ri.request_id
    JOIN products p
        ON ri.product_id = p.id
    WHERE r.id = $1
    FOR UPDATE;
    `,
    [requestId]
);

            if (requestResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "Request not found"
                });
            }

            const request = requestResult.rows[0];
if (request.order_id) {
    await client.query("ROLLBACK");

    return res.status(400).json({
        message: "An order has already been created for this request",
        order_id: request.order_id
    });
}
// Check if product is active
if (!request.is_active) {
    await client.query("ROLLBACK");

    return res.status(400).json({
        message: "Cannot create order. Product is currently inactive"
    });
}
            // 2. Check request status
            if (request.status !== "APPROVED") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Only approved requests can be converted into orders"
                });
            }

            // 3. Check inventory
            const inventoryResult = await client.query(
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
                    ) AS available_stock
                FROM inventory
                WHERE product_id = $1;
                `,
                [request.product_id]
            );

            const availableStock =
                Number(inventoryResult.rows[0].available_stock);

            if (availableStock < request.quantity) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Insufficient stock",
                    available_stock: availableStock,
                    requested_quantity: request.quantity
                });
            }

            // 4. Calculate total
            const price = Number(request.price);
            const quantity = Number(request.quantity);
            const subtotal = price * quantity;

            // 5. Create order
            const orderResult = await client.query(
                `
                INSERT INTO orders
                (customer_id, status, total_amount)
                VALUES ($1, $2, $3)
                RETURNING *;
                `,
                [
                    request.customer_id,
                    "CONFIRMED",
                    subtotal
                ]
            );

            const order = orderResult.rows[0];
            //Record initial order status
            await client.query(
                `
    INSERT INTO order_status_history
    (order_id, status)
    VALUES ($1, $2);
    `,
    [
        order.id,
        "CONFIRMED"
    ]
);
    

            // 6. Create order item
            const itemResult = await client.query(
                `
                INSERT INTO order_items
                (order_id, product_id, quantity, price, subtotal)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
                `,
                [
                    order.id,
                    request.product_id,
                    quantity,
                    price,
                    subtotal
                ]
            );

            // 7. Record inventory sale
            await client.query(
                `
                INSERT INTO inventory
                (product_id, quantity, movement_type, note)
                VALUES ($1, $2, $3, $4);
                `,
                [
                    request.product_id,
                    quantity,
                    "SALE",
                    `Order #${order.id}`
                ]
            );

            // 8. Commit transaction
            await client.query("COMMIT");

            res.status(201).json({
                message: "Order created successfully 🌱",
                order: order,
                item: itemResult.rows[0]
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error("Error creating order:", error);

            res.status(500).json({
                message: "Failed to create order"
            });

        } finally {
            client.release();
        }
    }
);

// CUSTOMER: View my orders
// ========================================
// ADMIN: VIEW ALL ORDERS
// ========================================
router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    o.id,
                    o.customer_id,
                    u.name AS customer_name,
                    u.email AS customer_email,
                    o.status,
                    o.total_amount,
                    o.created_at
                FROM orders o
                JOIN users u
                    ON o.customer_id = u.id
                ORDER BY o.created_at DESC;
            `);

            res.status(200).json({
                message: "Orders fetched successfully 🌱",
                orders: result.rows
            });

        } catch (error) {

            console.error(
                "Error fetching admin orders:",
                error
            );

            res.status(500).json({
                message: "Failed to fetch orders",
                
            });
        }
    }
);
router.get("/my-orders", authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                o.id AS order_id,
                o.status,
                o.total_amount,
                o.created_at,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                oi.price,
                oi.subtotal
            FROM orders o
            JOIN order_items oi
                ON o.id = oi.order_id
            JOIN products p
                ON oi.product_id = p.id
            WHERE o.customer_id = $1
            ORDER BY o.created_at DESC;
            `,
            [customerId]
        );

        res.status(200).json({
            message: "Orders fetched successfully 🌱",
            orders: result.rows
        });

    } catch (error) {
        console.error("Error fetching customer orders:", error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
});
// CUSTOMER: View order tracking history
router.get("/:id/tracking", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                osh.id,
                osh.order_id,
                osh.status,
                osh.changed_at
            FROM order_status_history osh
            JOIN orders o
                ON osh.order_id = o.id
            WHERE osh.order_id = $1
              AND o.customer_id = $2
            ORDER BY osh.changed_at ASC;
            `,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Order tracking not found"
            });
        }

        res.status(200).json({
            message: "Order tracking fetched successfully 🌱",
            order_id: Number(id),
            tracking: result.rows
        });

    } catch (error) {
        console.error("Error fetching order tracking:", error);

        res.status(500).json({
            message: "Failed to fetch order tracking"
        });
    }
});

    


// ADMIN: Update order status
router.patch(
    "/:id/status",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { id } = req.params;
            const { status } = req.body;

            const allowedStatuses = [
                "PENDING",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED"
            ];

            if (!status) {
                return res.status(400).json({
                    message: "Status is required"
                });
            }

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status",
                    allowed_statuses: allowedStatuses
                });
            }

            await client.query("BEGIN");

            // Get current order
            const orderResult = await client.query(
                `
                SELECT id, status
                FROM orders
                WHERE id = $1
                FOR UPDATE;
                `,
                [id]
            );

            if (orderResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "Order not found"
                });
            }

            const order = orderResult.rows[0];
            if (order.status === status) {
    await client.query("ROLLBACK");

    return res.status(400).json({
        message: "Order is already in this status",
        current_status: order.status
    });
}

const validTransitions = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: []
};

if (!validTransitions[order.status].includes(status)) {
    await client.query("ROLLBACK");

    return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`,
        current_status: order.status,
        allowed_next_statuses: validTransitions[order.status]
    });
}

            // Prevent changing an already cancelled order
            if (order.status === "CANCELLED") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Cancelled order cannot be updated"
                });
            }

            // If cancelling, return products to inventory
            // Return products to inventory only when
// the order is being cancelled for the first time
if (status === "CANCELLED" && order.status !== "CANCELLED") {

                const itemsResult = await client.query(
                    `
                    SELECT product_id, quantity
                    FROM order_items
                    WHERE order_id = $1;
                    `,
                    [id]
                );

                for (const item of itemsResult.rows) {

                    await client.query(
                        `
                        INSERT INTO inventory
                        (
                            product_id,
                            quantity,
                            movement_type,
                            note
                        )
                        VALUES ($1, $2, 'ADJUSTMENT', $3);
                        `,
                        [
                            item.product_id,
                            item.quantity,
                            `Order #${id} cancelled - stock returned`
                        ]
                    );
                }
            }
            // Record status change in order history
await client.query(
    `
    INSERT INTO order_status_history
    (order_id, status)
    VALUES ($1, $2);
    `,
    [
        id,
        status
    ]
);

            // Update order status
            const result = await client.query(
                `
                UPDATE orders
                SET status = $1
                WHERE id = $2
                RETURNING *;
                `,
                [status, id]
            );

            await client.query("COMMIT");

            res.status(200).json({
                message: status === "CANCELLED"
                    ? "Order cancelled and stock returned successfully 🌱"
                    : "Order status updated successfully 🌱",
                order: result.rows[0]
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error("Error updating order status:", error);

            res.status(500).json({
                message: "Failed to update order status"
            });

        } finally {
            client.release();
        }
    }
);
module.exports = router;