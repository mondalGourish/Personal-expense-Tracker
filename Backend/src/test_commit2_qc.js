require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/user.model");
const Expense = require("./models/expense.model");
const Budget = require("./models/budget.model");
const budgetService = require("./services/budget.service");

async function runCommit2QCTests() {
  console.log("=====================================================================");
  console.log("   COMMIT 2 — PRODUCTION READINESS & DATA INTEGRITY QC TEST SUITE   ");
  console.log("=====================================================================\n");

  let server;
  let testUser;
  let authTokenCookie;
  let createdExpenseId;

  const results = [];

  function record(testName, passed, details = "") {
    results.push({ testName, status: passed ? "PASS" : "FAIL", details });
    console.log(`[${passed ? "PASS" : "FAIL"}] ${testName} ${details ? `— ${details}` : ""}`);
  }

  try {
    // 1. Environment Variable Validation Check
    console.log("--- 1. Testing Environment Variable Validation ---");
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
    const hasJwtSecret = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0);
    const hasMongoUri = Boolean(mongoUri && mongoUri.trim().length > 0);
    record(
      "Critical Environment Variables Present",
      hasJwtSecret && hasMongoUri,
      `JWT_SECRET: ${hasJwtSecret ? "configured" : "MISSING"}, MONGO: ${hasMongoUri ? "configured" : "MISSING"}`
    );

    // 2. Database Connection
    console.log("\n--- 2. Connecting to Database & Checking Indexes ---");
    await connectDB();
    record("Database Connection", mongoose.connection.readyState === 1, `Host: ${mongoose.connection.host}`);

    // Ensure indexes on Budget and Expense models
    await Budget.init();
    await Expense.init();
    await User.init();

    const budgetIndexes = await Budget.collection.indexes();
    const hasUniqueUserIndex = budgetIndexes.some(
      (idx) => idx.key && idx.key.user === 1 && idx.unique === true
    );
    record("One Budget Per User Unique Index Enforced", hasUniqueUserIndex, JSON.stringify(budgetIndexes.map(i => ({ key: i.key, unique: i.unique }))));

    const expenseIndexes = await Expense.collection.indexes();
    const hasCompoundExpenseIndex = expenseIndexes.some(
      (idx) => idx.key && idx.key.user === 1 && idx.key.date === -1
    );
    record("Compound Expense Index (user + date) Exists", hasCompoundExpenseIndex);

    // Clean any prior QC test data
    await User.deleteMany({ email: /qc_test_commit2/ });
    await Expense.deleteMany({ description: /QC_COMMIT2/ });

    // 3. Start Local HTTP Server for API Integration
    console.log("\n--- 3. Starting Express Test Server ---");
    server = app.listen(4088);
    const BASE_URL = "http://localhost:4088";

    // 4. Test CORS Configuration
    console.log("\n--- 4. Testing CORS Policy ---");
    // Allowed origin
    const corsAllowedRes = await fetch(`${BASE_URL}/`, {
      headers: { Origin: "http://localhost:5173" },
    });
    const allowOriginHeader = corsAllowedRes.headers.get("access-control-allow-origin");
    const allowCredsHeader = corsAllowedRes.headers.get("access-control-allow-credentials");
    record(
      "CORS Allowed Origin & Credentials",
      allowOriginHeader === "http://localhost:5173" && allowCredsHeader === "true",
      `Origin: ${allowOriginHeader}, Credentials: ${allowCredsHeader}`
    );

    // 5. Test Auth & Cookie Handling
    console.log("\n--- 5. Testing Auth Registration & Cookie Issuance ---");
    const testEmail = `qc_test_commit2_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Commit2 QC User",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regJson = await regRes.json();
    const rawSetCookie = regRes.headers.get("set-cookie");
    record(
      "User Registration & HTTP-only Cookie",
      regRes.status === 201 && regJson.success === true && Boolean(rawSetCookie && rawSetCookie.includes("HttpOnly")),
      `Status: ${regRes.status}, Cookie: ${rawSetCookie ? "HttpOnly present" : "MISSING"}`
    );

    testUser = regJson.data?.user;
    authTokenCookie = rawSetCookie ? rawSetCookie.split(";")[0] : "";

    // 6. Test /api/auth/me session check
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: authTokenCookie },
    });
    const meJson = await meRes.json();
    record("Session Validation (/api/auth/me)", meRes.status === 200 && meJson.data?.user?.email === testEmail);

    // 7. Test Required User Ownership on Expense Model (Direct Model Defense)
    console.log("\n--- 6. Testing Data Integrity: Required Ownership Fields ---");
    let orphanedExpenseRejected = false;
    try {
      await Expense.create({
        amount: 500,
        category: "Food",
        description: "QC_COMMIT2 Orphan Test",
      });
    } catch (err) {
      orphanedExpenseRejected = err.name === "ValidationError" && Boolean(err.errors?.user);
    }
    record("Orphaned Expense Rejection at Model Level", orphanedExpenseRejected, "Expense without user failed validation as required");

    let orphanedBudgetRejected = false;
    try {
      await Budget.create({
        weeklyBudget: 5000,
        monthlyBudget: 20000,
      });
    } catch (err) {
      orphanedBudgetRejected = err.name === "ValidationError" && Boolean(err.errors?.user);
    }
    record("Orphaned Budget Rejection at Model Level", orphanedBudgetRejected, "Budget without user failed validation as required");

    // 8. Test Model-Level Category Budget Min Value (Defense-in-Depth)
    console.log("\n--- 7. Testing Defense-in-Depth: Negative Category Budget Model Validation ---");
    let negativeCategoryRejected = false;
    try {
      await Budget.create({
        user: new mongoose.Types.ObjectId(),
        weeklyBudget: 5000,
        monthlyBudget: 20000,
        categoryBudgets: { Food: -500 },
      });
    } catch (err) {
      negativeCategoryRejected = err.name === "ValidationError";
    }
    record("Negative Category Budget Rejected at Model Level", negativeCategoryRejected, "Negative category budget blocked by schema validation");

    // 9. Test Budget Uniqueness (Duplicate Rejection)
    console.log("\n--- 8. Testing One Budget Per User Database Enforcement ---");
    // Clean user's previous budget
    await Budget.deleteMany({ user: testUser._id });

    // Set budget via API
    const budgetRes1 = await fetch(`${BASE_URL}/api/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authTokenCookie,
      },
      body: JSON.stringify({
        weeklyBudget: 5000,
        monthlyBudget: 20000,
        currency: "INR",
        alertThreshold: 80,
        categoryBudgets: {
          Food: 6000,
          Transport: 0, // Explicit zero budget test!
        },
      }),
    });
    const budgetJson1 = await budgetRes1.json();
    record("Create User Budget with Zero Category Limit", budgetRes1.status === 200 && budgetJson1.success === true);

    // Try direct insert duplicate document for same user in DB
    let duplicateBudgetBlocked = false;
    try {
      await Budget.create({
        user: testUser._id,
        weeklyBudget: 1000,
        monthlyBudget: 4000,
      });
    } catch (err) {
      duplicateBudgetBlocked = err.code === 11000;
    }
    record("Duplicate Budget Document Blocked by Database Unique Index", duplicateBudgetBlocked, "Direct duplicate insert threw E11000 duplicate key error");

    // 10. Test Zero vs Null Semantics in Status Calculation
    console.log("\n--- 9. Testing Zero vs Null Semantics ---");
    const statusRes = await fetch(`${BASE_URL}/api/budgets/status`, {
      headers: { Cookie: authTokenCookie },
    });
    const statusJson = await statusRes.json();
    const statusData = statusJson.data;

    // Create an expense for Food and Transport (which has budget = 0)
    const expRes1 = await fetch(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authTokenCookie,
      },
      body: JSON.stringify({
        amount: 300,
        category: "Transport",
        description: "QC_COMMIT2 Zero Budget Test Expense",
      }),
    });
    const expJson1 = await expRes1.json();
    createdExpenseId = expJson1.data?.expense?._id;

    // Check status after expense on 0-budget category
    const statusRes2 = await fetch(`${BASE_URL}/api/budgets/status`, {
      headers: { Cookie: authTokenCookie },
    });
    const statusJson2 = await statusRes2.json();
    const transportBreakdown = statusJson2.data?.categoryBreakdown?.find(c => c.category === "Transport");

    const zeroLimitPreserved = transportBreakdown && transportBreakdown.limit === 0 && transportBreakdown.spent === 300 && transportBreakdown.remaining === -300 && !Number.isNaN(transportBreakdown.percentageUsed);
    record("Zero Budget Limit Preserved without NaN/Infinity", Boolean(zeroLimitPreserved), JSON.stringify(transportBreakdown));

    // 11. Test Error Handling & Safety in Production Mode
    console.log("\n--- 10. Testing Safe Production Error Handling ---");
    // Invalid ObjectId format
    const badIdRes = await fetch(`${BASE_URL}/api/expenses/invalid-id-format`, {
      headers: { Cookie: authTokenCookie },
    });
    const badIdJson = await badIdRes.json();
    record("Invalid ID Format Safely Handled (400)", badIdRes.status === 400 && badIdJson.error.includes("Invalid"));

    // 12. Test Expense CRUD & Filtering
    console.log("\n--- 11. Testing Expense CRUD & Query Filtering ---");
    // Update
    const updateRes = await fetch(`${BASE_URL}/api/expenses/${createdExpenseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: authTokenCookie,
      },
      body: JSON.stringify({
        amount: 450,
        description: "QC_COMMIT2 Updated Description",
      }),
    });
    const updateJson = await updateRes.json();
    record("Update Expense", updateRes.status === 200 && updateJson.data?.expense?.amount === 450);

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/expenses/${createdExpenseId}`, {
      method: "DELETE",
      headers: { Cookie: authTokenCookie },
    });
    record("Delete Expense", deleteRes.status === 200);

    // 13. Test Logout Cookie Clearing
    console.log("\n--- 12. Testing Logout Cookie Clearing ---");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    record(
      "Logout Clears Auth Cookie",
      logoutRes.status === 200 && Boolean(/expires=|max-age=0/i.test(logoutCookie)),
      `Cookie header: ${logoutCookie}`
    );

    // Cleanup test user
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await Budget.deleteOne({ user: testUser._id });
      await Expense.deleteMany({ user: testUser._id });
    }

  } catch (err) {
    console.error("QC Test Runner Error:", err);
    record("Overall Test Execution", false, err.message);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();

    console.log("\n=====================================================================");
    console.log("                        FINAL QC SUMMARY TABLE                       ");
    console.log("=====================================================================");
    console.table(results);

    const allPassed = results.every(r => r.status === "PASS");
    console.log(`\nOVERALL SUITE STATUS: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}\n`);
  }
}

runCommit2QCTests().catch(console.error);
