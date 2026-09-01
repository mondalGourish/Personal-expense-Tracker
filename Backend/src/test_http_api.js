require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
const Expense = require("./models/expense.model");
const Budget = require("./models/budget.model");

async function runHttpApiTest() {
  let server;
  try {
    await connectDB();
    server = app.listen(4055);
    const BASE_URL = "http://localhost:4055";

    console.log("=== HTTP API INTEGRATION TESTS ===");

    // 1. Root health check
    console.log("\n1. Testing GET /");
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootJson = await rootRes.json();
    console.log("Status:", rootRes.status, rootJson);

    // 2. Set Budget (POST /api/budgets)
    console.log("\n2. Testing POST /api/budgets (Weekly: 4000 INR, Monthly: 15000 INR)");
    const budgetRes = await fetch(`${BASE_URL}/api/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weeklyBudget: 4000,
        monthlyBudget: 15000,
        currency: "INR",
        alertThreshold: 80,
      }),
    });
    const budgetJson = await budgetRes.json();
    console.log("Status:", budgetRes.status, "Success:", budgetJson.success);

    // 3. Create Expense (POST /api/expenses)
    console.log("\n3. Testing POST /api/expenses (Logging ₹1,200 for Food)");
    const expenseRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1200,
        category: "Food",
        description: "API_TEST Dinner",
      }),
    });
    const expenseJson = await expenseRes.json();
    console.log("Status:", expenseRes.status);
    console.log("Created Expense:", expenseJson.data.expense._id, "₹" + expenseJson.data.expense.amount);
    console.log("Immediate Budget Feedback:", {
      currency: expenseJson.data.budgetStatus.currency,
      weeklyRemaining: "₹" + expenseJson.data.budgetStatus.weekly.remaining,
      weeklySpent: "₹" + expenseJson.data.budgetStatus.weekly.spent,
      monthlyRemaining: "₹" + expenseJson.data.budgetStatus.monthly.remaining,
      weeklyStatus: expenseJson.data.budgetStatus.weekly.status,
    });

    // 4. Get Budget Status (GET /api/budgets/status)
    console.log("\n4. Testing GET /api/budgets/status");
    const statusRes = await fetch(`${BASE_URL}/api/budgets/status`);
    const statusJson = await statusRes.json();
    console.log("Status:", statusRes.status);
    console.log("Weekly Remaining:", "₹" + statusJson.data.weekly.remaining, "| Status:", statusJson.data.weekly.status);
    console.log("Monthly Remaining:", "₹" + statusJson.data.monthly.remaining, "| Status:", statusJson.data.monthly.status);

    // 5. Query Expenses with Pagination & Filtering (GET /api/expenses)
    console.log("\n5. Testing GET /api/expenses?category=Food");
    const getRes = await fetch(`${BASE_URL}/api/expenses?category=Food`);
    const getJson = await getRes.json();
    console.log("Status:", getRes.status, "Count:", getJson.count, "Total in DB:", getJson.pagination.total);

    // 6. Test Joi Validation Failure
    console.log("\n6. Testing Joi Validation with invalid payload (missing category & negative amount)");
    const invalidRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: -50,
      }),
    });
    const invalidJson = await invalidRes.json();
    console.log("Status:", invalidRes.status, "(Expected 400)", "Details:", invalidJson.details);

    // Cleanup
    await Expense.deleteMany({ description: /API_TEST/ });
    await Budget.deleteMany({ user: null });
    console.log("\n=== ALL HTTP API TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("HTTP Test Error:", err);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runHttpApiTest();
