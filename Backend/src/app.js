const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const expenseRoutes = require("./routes/expense.routes");
const budgetRoutes = require("./routes/budget.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Body Parser Middleware
app.use(express.json());

// Cookie Parser — required for reading HTTP-only auth cookie
app.use(cookieParser());

// CORS Configuration
const isProduction = process.env.NODE_ENV === "production";

const normalizeUrl = (url) => (url ? url.trim().replace(/\/+$/, "") : "");

const allowedDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const clientUrls = (process.env.CLIENT_URL || "")
      .split(",")
      .map((u) => normalizeUrl(u))
      .filter(Boolean);

    const normalizedOrigin = normalizeUrl(origin);

    // 1. Explicitly configured client URLs
    if (clientUrls.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 2. Allow any vercel.app deployment domain
    try {
      const parsedHostname = new URL(origin).hostname;
      if (parsedHostname.endsWith(".vercel.app") || parsedHostname === "localhost") {
        return callback(null, true);
      }
    } catch {
      // invalid URL format, ignore
    }

    // 3. Fallback: dynamically allow origin with credentials support
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Personalized Expense & Budget Tracker API is running",
    version: "2.0.0",
    defaultCurrency: "INR",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);

// 404 Not Found Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
