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

// 2. spending below warning threshold
test("2. spending below warning threshold (3000 / 5000 = 60%)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 3000, alertThreshold: 80 });
  assert.equal(res.status, "SAFE");
  assert.equal(res.percentageUsed, 60);
  assert.equal(res.remaining, 2000);
  assert.equal(res.overAmount, 0);
  assert.equal(res.statusMessage, "₹2,000.00 remaining");
});

// 3. spending exactly at warning threshold (4000 / 5000 = 80%)
test("3. spending exactly at warning threshold (4000 / 5000 = 80%)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 4000, alertThreshold: 80 });
  assert.equal(res.status, "WARNING");
  assert.equal(res.percentageUsed, 80);
  assert.equal(res.remaining, 1000);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isWarning, true);
});

// 4. spending between warning threshold and 100% (4500 / 5000 = 90%)
test("4. spending between warning threshold and 100% (4500 / 5000 = 90%)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 4500, alertThreshold: 80 });
  assert.equal(res.status, "WARNING");
  assert.equal(res.percentageUsed, 90);
  assert.equal(res.remaining, 500);
  assert.equal(res.overAmount, 0);
});

// 5. spending exactly equal to budget (5000 / 5000 = 100%)
test("5. spending exactly equal to budget (5000 / 5000 = 100%)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 5000, alertThreshold: 80 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 100);
  assert.equal(res.remaining, 0);
  assert.equal(res.overAmount, 0);
  assert.equal(res.isExceeded, true);
});

// 6. spending above budget (8650 / 5000 = 173%)
test("6. spending above budget (8650 / 5000 = 173%, 3650 over budget)", () => {
  const res = calculateBudgetHealth({ budgetLimit: 5000, spent: 8650, alertThreshold: 80 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 173);
  assert.equal(res.visualPercent, 100); // capped for progress bar
  assert.equal(res.remaining, -3650);
  assert.equal(res.overAmount, 3650);
  assert.equal(res.statusMessage, "₹3,650.00 over budget");
  assert.equal(res.isExceeded, true);
});

// 7. budget = 0 (spent = 0 vs spent > 0)
test("7a. budget = 0 with spent = 0", () => {
  const res = calculateBudgetHealth({ budgetLimit: 0, spent: 0 });
  assert.equal(res.status, "SAFE");
  assert.equal(res.percentageUsed, 0);
  assert.equal(res.visualPercent, 0);
});

test("7b. budget = 0 with spent = 250", () => {
  const res = calculateBudgetHealth({ budgetLimit: 0, spent: 250 });
  assert.equal(res.status, "EXCEEDED");
  assert.equal(res.percentageUsed, 100);
  assert.equal(res.overAmount, 250);
  assert.equal(res.statusMessage, "₹250.00 over budget");
});

// 8. no budget configured (null / undefined)
test("8. no budget configured (budgetLimit: null)", () => {
  const res = calculateBudgetHealth({ budgetLimit: null, spent: 1200 });
  assert.equal(res.isConfigured, false);
  assert.equal(res.status, "NOT_CONFIGURED");
  assert.equal(res.remaining, null);
});

// 9. warning threshold = 100%
test("9. warning threshold = 100% (4950 / 5000 = 99% -> SAFE, 5000 -> EXCEEDED)", () => {
  const resSafe = calculateBudgetHealth({ budgetLimit: 5000, spent: 4950, alertThreshold: 100 });
  assert.equal(resSafe.status, "SAFE");
  assert.equal(resSafe.percentageUsed, 99);

  const resExceeded = calculateBudgetHealth({ budgetLimit: 5000, spent: 5000, alertThreshold: 100 });
  assert.equal(resExceeded.status, "EXCEEDED");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
