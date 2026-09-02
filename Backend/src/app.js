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

    if (isProduction) {
      // In production, strictly match the configured CLIENT_URL
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    } else {
      // In development, allow localhost origins or CLIENT_URL
      if (
        allowedDevOrigins.includes(origin) ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    }
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
