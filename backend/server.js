const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const orderRoutes = require("./routes/orderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const settingRoutes = require("./routes/settingRoutes");
const app = express();

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://172.22.240.1:3000"
    ],
    credentials: true
}));
app.use(express.json());


// Product routes
app.use("/api/requests", requestRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/settings", settingRoutes);


// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Nursery Business API is running 🌱"
    });
});

// Database test route
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connected successfully! 🌱",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});