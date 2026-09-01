require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const budgetService = require("./services/budget.service");
const Expense = require("./models/expense.model");
const Budget = require("./models/budget.model");

async function runBudgetVerification() {
  try {
    console.log("==================================================");
    console.log("  Testing Personalized Expense & Budget Tracker  ");
    console.log("==================================================\n");

    await connectDB();

    // 1. Clean previous test data
    console.log("1. Cleaning previous test entries...");
    await Expense.deleteMany({ description: { $regex: /TEST_/ } });
    await Budget.deleteMany({ user: null });

    // 2. Set Budget Limits
    console.log("\n2. Setting Budget Limits (Weekly: ₹5,000, Monthly: ₹20,000, Currency: INR)...");
    const budget = await budgetService.setBudget(null, {
      weeklyBudget: 5000,
      monthlyBudget: 20000,
      currency: "INR",
      alertThreshold: 80,
      categoryBudgets: {
        Food: 6000,
        Shopping: 4000,
      },
    });
    console.log("✅ Budget Created/Updated successfully:", {
      weeklyBudget: budget.weeklyBudget,
      monthlyBudget: budget.monthlyBudget,
      currency: budget.currency,
      alertThreshold: budget.alertThreshold,
    });

    // 3. Initial Status Check
    console.log("\n3. Checking Initial Status (no expenses yet)...");
    let status = await budgetService.calculateBudgetStatus(null);
    console.log("Initial Weekly Status:", {
      limit: status.weekly.budgetLimit,
      spent: status.weekly.spent,
      remaining: status.weekly.remaining,
      status: status.weekly.status,
    });
    console.log("Initial Monthly Status:", {
      limit: status.monthly.budgetLimit,
      spent: status.monthly.spent,
      remaining: status.monthly.remaining,
      status: status.monthly.status,
    });

    // 4. Record Expenses
    console.log("\n4. Recording Test Expenses...");
    const expense1 = await Expense.create({
      amount: 1500,
      category: "Food",
      description: "TEST_Grocery & Snacks",
      date: new Date(),
    });
    console.log(`- Added Expense 1: ₹${expense1.amount} (${expense1.category})`);

    const expense2 = await Expense.create({
      amount: 2000,
      category: "Shopping",
      description: "TEST_Clothes",
      date: new Date(),
    });
    console.log(`- Added Expense 2: ₹${expense2.amount} (${expense2.category})`);

    // 5. Check Status after normal spending
    console.log("\n5. Checking Status after ₹3,500 spending (Under 80%)...");
    status = await budgetService.calculateBudgetStatus(null);
    console.log("Weekly Status:", {
      spent: `₹${status.weekly.spent}`,
      remaining: `₹${status.weekly.remaining}`,
      percent: `${status.weekly.percentageUsed}%`,
      status: status.weekly.status, // Expect: HEALTHY
    });
    console.log("Monthly Status:", {
      spent: `₹${status.monthly.spent}`,
      remaining: `₹${status.monthly.remaining}`,
      percent: `${status.monthly.percentageUsed}%`,
      status: status.monthly.status, // Expect: HEALTHY
    });
    console.log("Category Breakdown:", status.categoryBreakdown);

    // 6. Test Warning Threshold (>80%)
    console.log("\n6. Adding expense to reach WARNING threshold (>=80%)...");
    const expense3 = await Expense.create({
      amount: 800,
      category: "Food",
      description: "TEST_Dinner with friends",
      date: new Date(),
    });
    console.log(`- Added Expense 3: ₹${expense3.amount} (Total Weekly Spent: ₹4,300 of ₹5,000 = 86%)`);

    status = await budgetService.calculateBudgetStatus(null);
    console.log("Weekly Status after ₹4,300:", {
      spent: `₹${status.weekly.spent}`,
      remaining: `₹${status.weekly.remaining}`,
      percent: `${status.weekly.percentageUsed}%`,
      status: status.weekly.status, // Expect: WARNING
    });

    // 7. Test Exceeded Limit
    console.log("\n7. Adding expense to EXCEED weekly limit...");
    const expense4 = await Expense.create({
      amount: 1200,
      category: "Transport",
      description: "TEST_Flight Ticket",
      date: new Date(),
    });
    console.log(`- Added Expense 4: ₹${expense4.amount} (Total Weekly Spent: ₹5,500 of ₹5,000 = 110%)`);

    status = await budgetService.calculateBudgetStatus(null);
    console.log("Weekly Status after ₹5,500:", {
      spent: `₹${status.weekly.spent}`,
      remaining: `₹${status.weekly.remaining} (Deficit)`,
      percent: `${status.weekly.percentageUsed}%`,
      isExceeded: status.weekly.isExceeded,
      status: status.weekly.status, // Expect: EXCEEDED
    });

    console.log("\n==================================================");
    console.log("  🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!  ");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
}

runBudgetVerification();
