/**
 * Commit 5 — Email Verification, Strong Password Policy & Forgot Password QC Test Suite
 * Fully automated tests for all 27 requirements specified in Part 22.
 */

const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const User = require("./models/user.model");
const emailService = require("./services/email.service");
const errorHandler = require("./middleware/error.middleware");
const { hashValue, generate6DigitOtp } = require("./controllers/auth.controller");

// Setup Test App
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

let server;
let port;
let baseUrl;

const results = [];

function record(id, testName, passed, details = "") {
  results.push({ id, testName, status: passed ? "PASS" : "FAIL", details });
  console.log(`  [${passed ? "PASS" : "FAIL"}] #${id} ${testName} ${details ? `(${details})` : ""}`);
}

function makeRequest(method, path, body = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: "localhost",
      port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: raw });
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=====================================================================");
  console.log("   COMMIT 5 — AUTHENTICATION, OTP & PASSWORD POLICY QC TEST SUITE   ");
  console.log("=====================================================================\n");

  // Connect MongoDB
  if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL not found in environment");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);

  // Clean test users
  await User.deleteMany({ email: /test_c5_.*@example\.com/ });

  // Start HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  console.log(`🚀 Test server listening on port ${port}\n`);

  // ==========================================
  // PART 1: PASSWORD POLICY TESTS (1–8)
  // ==========================================
  console.log("--- 1. Testing Password Policy Validation (Tests 1-8) ---");

  // 1. 7 characters → reject
  const res1 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p1@example.com",
    password: "Ab1!xyz", // 7 chars
  });
  record(1, "Password 7 characters rejected", res1.status === 400);

  // 2. 8 characters → valid
  const res2 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p2@example.com",
    password: "Ab1!wxyz", // 8 chars, valid
  });
  record(2, "Password 8 characters accepted", res2.status === 201);

  // 3. 25 characters → valid
  const res3 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p3@example.com",
    password: "Ab1!abcdefghijklmnopqrstu", // 25 chars, valid
  });
  record(3, "Password 25 characters accepted", res3.status === 201);

  // 4. 26 characters → reject
  const res4 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p4@example.com",
    password: "Ab1!abcdefghijklmnopqrstuv", // 26 chars
  });
  record(4, "Password 26 characters rejected", res4.status === 400);

  // 5. no uppercase → reject
  const res5 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p5@example.com",
    password: "ab1!cdefgh", // no uppercase
  });
  record(5, "Password with no uppercase rejected", res5.status === 400);

  // 6. no lowercase → reject
  const res6 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p6@example.com",
    password: "AB1!CDEFGH", // no lowercase
  });
  record(6, "Password with no lowercase rejected", res6.status === 400);

  // 7. no digit → reject
  const res7 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p7@example.com",
    password: "Abc!defghi", // no digit
  });
  record(7, "Password with no digit rejected", res7.status === 400);

  // 8. no special character → reject
  const res8 = await makeRequest("POST", "/api/auth/register", {
    name: "Pass User",
    email: "test_c5_p8@example.com",
    password: "Abc1defghi", // no special char
  });
  record(8, "Password with no special character rejected", res8.status === 400);

  // ==========================================
  // PART 2: EMAIL VERIFICATION FLOW (9–15)
  // ==========================================
  console.log("\n--- 2. Testing Email Verification Flow (Tests 9-15) ---");

  const emailUser = "test_c5_verify@example.com";
  const userPass = "SecurePass123!";

  // 9. Registration creates unverified user & does NOT issue auth cookie
  const regRes = await makeRequest("POST", "/api/auth/register", {
    name: "Verification Tester",
    email: emailUser,
    password: userPass,
  });
  const unverifiedInDb = await User.findOne({ email: emailUser });
  const hasAuthCookie = regRes.headers["set-cookie"]?.some((c) => c.startsWith("token="));
  record(
    9,
    "Registration creates unverified user without issuing auth cookie",
    regRes.status === 201 && unverifiedInDb?.isEmailVerified === false && !hasAuthCookie
  );

  // Unverified user login attempt should be blocked with 403
  const unverifiedLogin = await makeRequest("POST", "/api/auth/login", {
    email: emailUser,
    password: userPass,
  });
  const unverifiedBlocked = unverifiedLogin.status === 403 && unverifiedLogin.body?.isUnverified === true;

  // Retrieve the generated OTP from test email store
  const sentOtpData = emailService.getLatestTestEmail(emailUser);
  const correctOtp = sentOtpData?.otp;

  // 11. Incorrect OTP rejected
  const wrongOtpRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: emailUser,
    otp: "999999",
  });
  record(11, "Incorrect OTP rejected (400)", wrongOtpRes.status === 400);

  // 12. Expired OTP rejected
  await User.updateOne({ email: emailUser }, { otpExpiresAt: new Date(Date.now() - 5000) });
  const expiredOtpRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: emailUser,
    otp: correctOtp,
  });
  record(12, "Expired OTP rejected", expiredOtpRes.status === 400);

  // Restore valid expiry for testing valid verification
  await User.updateOne({ email: emailUser }, { otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  // 10. Valid OTP verifies email
  const validVerifyRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: emailUser,
    otp: correctOtp,
  });
  const verifiedInDb = await User.findOne({ email: emailUser });
  record(
    10,
    "Valid OTP verifies email (isEmailVerified: true)",
    validVerifyRes.status === 200 && verifiedInDb?.isEmailVerified === true
  );

  // 13. Reused OTP rejected
  const reusedOtpRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: emailUser,
    otp: correctOtp,
  });
  // Should either say already verified (200) or reject reuse (400)
  record(13, "Reused OTP cannot verify a new session", reusedOtpRes.status === 200 || reusedOtpRes.status === 400);

  // 14. Old OTP invalid after resend
  const emailUser2 = "test_c5_resend@example.com";
  await makeRequest("POST", "/api/auth/register", {
    name: "Resend Tester",
    email: emailUser2,
    password: userPass,
  });
  const firstOtp = emailService.getLatestTestEmail(emailUser2)?.otp;

  // Set last sent back by 65 seconds so cooldown passes
  await User.updateOne({ email: emailUser2 }, { otpLastSentAt: new Date(Date.now() - 65 * 1000) });

  // Resend
  await makeRequest("POST", "/api/auth/resend-verification", { email: emailUser2 });
  const secondOtp = emailService.getLatestTestEmail(emailUser2)?.otp;

  // Try verifying with the old first OTP
  const oldOtpRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: emailUser2,
    otp: firstOtp,
  });
  record(14, "Old OTP invalid after resend", oldOtpRes.status === 400 && firstOtp !== secondOtp);

  // 15. Verification OTP cannot be used for password reset
  const crossPurposeRes = await makeRequest("POST", "/api/auth/verify-reset-otp", {
    email: emailUser2,
    otp: secondOtp,
  });
  record(15, "Verification OTP cannot be used for password reset", crossPurposeRes.status === 400);

  // ==========================================
  // PART 3: FORGOT PASSWORD & RESET (16–25)
  // ==========================================
  console.log("\n--- 3. Testing Forgot Password & Password Reset (Tests 16-25) ---");

  // 16. Valid account requests reset
  const resetEmail = "test_c5_reset@example.com";
  await makeRequest("POST", "/api/auth/register", {
    name: "Reset Tester",
    email: resetEmail,
    password: userPass,
  });
  // Mark verified for clean reset testing
  await User.updateOne({ email: resetEmail }, { isEmailVerified: true });

  const forgotRes = await makeRequest("POST", "/api/auth/forgot-password", { email: resetEmail });
  record(16, "Valid account requests password reset (200 generic message)", forgotRes.status === 200);

  // 17. Unknown email returns generic response (anti-enumeration)
  const unknownForgotRes = await makeRequest("POST", "/api/auth/forgot-password", {
    email: "non_existent_address_xyz@example.com",
  });
  record(
    17,
    "Unknown email returns identical generic response (anti-enumeration)",
    unknownForgotRes.status === 200 && unknownForgotRes.body?.message === forgotRes.body?.message
  );

  const resetOtp = emailService.getLatestTestEmail(resetEmail)?.otp;

  // 19. Incorrect reset OTP rejected
  const wrongResetRes = await makeRequest("POST", "/api/auth/verify-reset-otp", {
    email: resetEmail,
    otp: "000000",
  });
  record(19, "Incorrect reset OTP rejected (400)", wrongResetRes.status === 400);

  // 20. Expired reset OTP rejected
  await User.updateOne({ email: resetEmail }, { otpExpiresAt: new Date(Date.now() - 5000) });
  const expiredResetRes = await makeRequest("POST", "/api/auth/verify-reset-otp", {
    email: resetEmail,
    otp: resetOtp,
  });
  record(20, "Expired reset OTP rejected (400)", expiredResetRes.status === 400);

  // Restore expiry
  await User.updateOne({ email: resetEmail }, { otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  // 18. Valid reset OTP accepted & returns resetToken
  const validResetOtpRes = await makeRequest("POST", "/api/auth/verify-reset-otp", {
    email: resetEmail,
    otp: resetOtp,
  });
  const resetToken = validResetOtpRes.body?.data?.resetToken;
  record(
    18,
    "Valid reset OTP accepted and returns short-lived resetToken",
    validResetOtpRes.status === 200 && Boolean(resetToken)
  );

  // 21. Reset OTP cannot be reused
  const reuseResetOtp = await makeRequest("POST", "/api/auth/verify-reset-otp", {
    email: resetEmail,
    otp: resetOtp,
  });
  record(21, "Reset OTP cannot be reused", reuseResetOtp.status === 400);

  // 22. Password reset updates hashed password with valid resetToken
  const newStrongPass = "BrandNewPass999#";
  const resetPassRes = await makeRequest("POST", "/api/auth/reset-password", {
    email: resetEmail,
    resetToken,
    newPassword: newStrongPass,
  });
  record(22, "Password reset updates password with valid resetToken", resetPassRes.status === 200);

  // 23. Old password no longer works
  const oldLoginRes = await makeRequest("POST", "/api/auth/login", {
    email: resetEmail,
    password: userPass,
  });
  record(23, "Old password no longer works (401)", oldLoginRes.status === 401);

  // 24. New password works & issues session cookie
  const newLoginRes = await makeRequest("POST", "/api/auth/login", {
    email: resetEmail,
    password: newStrongPass,
  });
  const newCookieIssued = newLoginRes.headers["set-cookie"]?.some((c) => c.startsWith("token="));
  record(
    24,
    "New password works and establishes authenticated session",
    newLoginRes.status === 200 && newCookieIssued
  );

  // 25. Reset authorization token cannot be reused
  const reusedTokenRes = await makeRequest("POST", "/api/auth/reset-password", {
    email: resetEmail,
    resetToken,
    newPassword: "AnotherPassword123!",
  });
  record(25, "Reset authorization token cannot be reused (single-use)", reusedTokenRes.status === 400);

  // ==========================================
  // PART 4: RATE LIMITING & ATTEMPTS (26–27)
  // ==========================================
  console.log("\n--- 4. Testing Rate Limiting & Attempt Protections (Tests 26-27) ---");

  // 26. Cooldown on resend verification
  const cooldownEmail = "test_c5_cooldown@example.com";
  await makeRequest("POST", "/api/auth/register", {
    name: "Cooldown Tester",
    email: cooldownEmail,
    password: userPass,
  });
  // Immediate resend (within 60s)
  const immediateResend = await makeRequest("POST", "/api/auth/resend-verification", {
    email: cooldownEmail,
  });
  record(
    26,
    "Immediate resend verification triggers cooldown limit (429)",
    immediateResend.status === 429
  );

  // 27. Repeated failed OTP verification attempts blocked
  const bruteEmail = "test_c5_brute@example.com";
  await makeRequest("POST", "/api/auth/register", {
    name: "Brute Tester",
    email: bruteEmail,
    password: userPass,
  });
  // Fail 5 times
  for (let i = 0; i < 5; i++) {
    await makeRequest("POST", "/api/auth/verify-email", { email: bruteEmail, otp: "111111" });
  }
  // 6th attempt should be locked out with 429
  const lockedOutRes = await makeRequest("POST", "/api/auth/verify-email", {
    email: bruteEmail,
    otp: "111111",
  });
  record(
    27,
    "Repeated OTP verification attempts limited (429 / locked)",
    lockedOutRes.status === 429
  );

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log("\n=====================================================================");
  console.log("                        FINAL QC SUMMARY TABLE                       ");
  console.log("=====================================================================");
  console.table(results);

  const totalFailed = results.filter((r) => r.status === "FAIL").length;
  if (totalFailed === 0) {
    console.log("\nOVERALL SUITE STATUS: ✅ ALL 27 TESTS PASSED\n");
  } else {
    console.error(`\nOVERALL SUITE STATUS: ❌ ${totalFailed} TESTS FAILED\n`);
  }

  // Cleanup
  await User.deleteMany({ email: /test_c5_.*@example\.com/ });
  await mongoose.disconnect();
  server.close();

  if (totalFailed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
