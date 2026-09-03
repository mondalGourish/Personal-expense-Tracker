import assert from "node:assert/strict";
import { calculateBudgetHealth } from "./budgetHealth.js";

console.log("========================================");
console.log("Running Budget Health & Limit Alerts QC Test Suite");
console.log("========================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. spending = 0 with normal budget
test("1. spending = 0 with normal budget (5000 limit)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 0, alertThreshold: 80 });
  assert.equal(res.status, "SAFE");
  assert.equal(res.percentageUsed, 0);
  assert.equal(res.remaining, 5000);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isSafe, true);
  assert.equal(res.isExceeded, false);
});

// 2. Exact Boundary: Spent = 3980 / 5000 (79.6% raw -> SAFE)
test("2. Exact boundary: 3980 / 5000 (79.6% raw -> SAFE)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 3980, alertThreshold: 80 });
  assert.equal(res.status, "SAFE");
  assert.equal(res.percentageUsed, 80); // Rounded display percentage is 80%
  assert.equal(res.remaining, 1020);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isSafe, true);
  assert.equal(res.isWarning, false);
  assert.equal(res.statusMessage, "₹1,020.00 remaining");
});

// 3. Exact Boundary: Spent = 4000 / 5000 (80.0% raw -> WARNING)
test("3. Exact boundary: 4000 / 5000 (80.0% raw -> WARNING)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 4000, alertThreshold: 80 });
  assert.equal(res.status, "WARNING");
  assert.equal(res.percentageUsed, 80);
  assert.equal(res.remaining, 1000);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isWarning, true);
  assert.equal(res.statusMessage, "₹1,000.00 remaining");
});

// 4. Exact Boundary: Spent = 4980 / 5000 (99.6% raw -> WARNING)
test("4. Exact boundary: 4980 / 5000 (99.6% raw -> WARNING)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 4980, alertThreshold: 80 });
  assert.equal(res.status, "WARNING");
  assert.equal(res.percentageUsed, 100); // Rounded display is 100%
  assert.equal(res.remaining, 20);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isWarning, true);
  assert.equal(res.isExceeded, false);
  assert.equal(res.statusMessage, "₹20.00 remaining");
});

// 5. Exact Boundary: Spent = 5000 / 5000 (100.0% raw -> limit reached)
test("5. Exact boundary: 5000 / 5000 (100.0% raw -> limit reached)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 5000, alertThreshold: 80 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 100);
  assert.equal(res.remaining, 0);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isExceeded, true);
  assert.equal(res.statusMessage, "Budget limit reached");
  assert.equal(res.alertLabel, "Budget limit reached");
});

// 6. Exact Boundary: Spent = 5005 / 5000 (100.1% raw -> EXCEEDED)
test("6. Exact boundary: 5005 / 5000 (100.1% raw -> EXCEEDED)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 5005, alertThreshold: 80 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 100);
  assert.equal(res.remaining, -5);
  assert.equal(res.overAmount, 5);
  assert.equal(res.isExceeded, true);
  assert.equal(res.statusMessage, "₹5.00 over budget");
  assert.equal(res.alertLabel, "Budget limit exceeded");
});

// 7. Spending above budget: 8650 / 5000 (173.0% raw -> EXCEEDED, 3650 over)
test("7. spending above budget: 8650 / 5000 (173.0% raw -> EXCEEDED, 3650 over)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 8650, alertThreshold: 80 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 173);
  assert.equal(res.visualPercent, 100); // capped for progress bar
  assert.equal(res.remaining, -3650);
  assert.equal(res.overAmount, 3650);
  assert.equal(res.statusMessage, "₹3,650.00 over budget");
  assert.equal(res.alertLabel, "Budget limit exceeded");
  assert.equal(res.isExceeded, true);
});

// 8. Zero budget limit (0 limit with 0 spent vs >0 spent)
test("8a. zero limit with 0 spent", () => {
  const res = calculateBudgetHealth({ budgetLimit: 0, spent: 0 });
  assert.equal(res.status, "SAFE");
  assert.equal(res.percentageUsed, 0);
  assert.equal(res.visualPercent, 0);
  assert.equal(res.remaining, 0);
});

test("8b. zero limit with 250 spent", () => {
  const res = calculateBudgetHealth({ budgetLimit: 0, spent: 250 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 100);
  assert.equal(res.overAmount, 250);
  assert.equal(res.statusMessage, "₹250.00 over budget");
  assert.equal(res.alertLabel, "Budget limit exceeded");
});

// 9. Unconfigured budget (null / undefined)
test("9. unconfigured budget (budgetLimit: null)", () => {
  const res = calculateBudgetHealth({ budgetLimit: null, spent: 1200 });
  assert.equal(res.isConfigured, false);
  assert.equal(res.status, "NOT_CONFIGURED");
  assert.equal(res.remaining, null);
  assert.equal(res.alertLabel, "Not Set");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
