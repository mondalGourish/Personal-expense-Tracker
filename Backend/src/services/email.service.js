/**
 * Email Service Abstraction
 * Supports SMTP transport via environment variables or safe development/test logger.
 */

// In-memory test store for test suites (accessible in test environment)
const testEmailStore = new Map();

function recordTestEmail(to, type, otp) {
  if (process.env.NODE_ENV === "test" || !process.env.SMTP_HOST) {
    testEmailStore.set(to.toLowerCase(), { type, otp, sentAt: new Date() });
  }
}

function getLatestTestEmail(email) {
  return testEmailStore.get(email.toLowerCase()) || null;
}

function clearTestEmails() {
  testEmailStore.clear();
}

// Cached SMTP transporter instance
let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const nodemailer = require("nodemailer");
  const port = Number(process.env.SMTP_PORT) || 587;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Set robust connection and socket timeouts to prevent indefinite buffering/hanging
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return cachedTransporter;
}

/**
 * Send an email using configured SMTP provider or dev fallback.
 */
async function sendEmail({ to, subject, text, html }) {
  const isConfigured = Boolean(
    process.env.NODE_ENV !== "test" &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (isConfigured) {
    try {
      const transporter = getTransporter();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ExpenseTrack" <no-reply@expensetrack.app>',
        to,
        subject,
        text,
        html,
      });

      return { success: true, mode: "smtp" };
    } catch (error) {
      console.error("⚠️ SMTP email sending error:", error.message);
      // If cached transporter failed on stale socket, reset cache for next attempt
      cachedTransporter = null;
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to send email. Please try again later.");
      }
    }
  }

  // Development / Test mode safe fallback
  if (process.env.NODE_ENV !== "production") {
    console.log(`✉️  [EmailService] ${subject} -> ${to}`);
  }

  return { success: true, mode: "development" };
}

/**
 * Send 6-digit email verification OTP.
 */
async function sendVerificationEmail(toEmail, otp) {
  recordTestEmail(toEmail, "EMAIL_VERIFICATION", otp);

  const subject = "Verify your ExpenseTrack account";
  const text = `Welcome to ExpenseTrack! Your 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not sign up for ExpenseTrack, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 800; color: #10b981;">ExpenseTrack</span>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Verify your email address</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
        Thank you for signing up. Please enter the 6-digit verification code below to activate your account:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
        ⏱ This verification code will expire in <strong>10 minutes</strong>.
      </p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
        If you did not create an ExpenseTrack account, no further action is required.
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, text, html });
}

/**
 * Send 6-digit password reset OTP.
 */
async function sendPasswordResetEmail(toEmail, otp) {
  recordTestEmail(toEmail, "PASSWORD_RESET", otp);

  const subject = "Your ExpenseTrack Password Reset Code";
  const text = `You requested a password reset for ExpenseTrack. Your 6-digit reset code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this password reset, please secure your account immediately.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 800; color: #10b981;">ExpenseTrack</span>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Password Reset Request</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
        We received a request to reset your password. Use the 6-digit verification code below to proceed:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
        ⏱ This reset code will expire in <strong>10 minutes</strong>.
      </p>
      <p style="font-size: 13px; color: #ef4444; line-height: 1.5;">
        ⚠️ If you did not request a password reset, please ignore this email. Your current password remains safe.
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, text, html });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  getLatestTestEmail,
  clearTestEmails,
};
