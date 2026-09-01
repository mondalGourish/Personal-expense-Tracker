const express = require("express");
const expenseRoutes = require("./routes/expense.routes");
const budgetRoutes = require("./routes/budget.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Body Parser Middleware
app.use(express.json());

// Basic CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

// API Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Personalized Expense & Budget Tracker API is running",
    version: "1.0.0",
    defaultCurrency: "INR",
  });
});

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
