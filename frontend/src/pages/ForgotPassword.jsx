import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../services/auth.service";
import { PasswordRequirements } from "../components/auth/PasswordRequirements";
import { checkPasswordRequirements } from "../utils/passwordPolicy";
import {
  Wallet,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import "./Auth.css";

export const ForgotPassword = () => {
  const navigate = useNavigate();

  // Wizard steps: 1 = Enter Email, 2 = Verify Code, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState(""); // Kept purely in memory state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Request Password Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMsg(res.message || "A password reset code has been sent.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Reset Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit numeric reset code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.verifyResetOtp(email.trim(), otp.trim());
      if (res?.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep(3);
      } else {
        setError("Invalid response from server. Please try requesting a new code.");
      }
    } catch (err) {
      setError(err.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const reqs = checkPasswordRequirements(newPassword);
    if (!reqs.isValid) {
      setError("New password does not meet all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authService.resetPassword(email.trim(), resetToken, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.message || "Password reset failed. Please request a new code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page animate-fade-in">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Wallet size={22} />
          </div>
          <span className="auth-brand-name">ExpenseTrack</span>
        </div>

        <div className="auth-panel-content">
          <h2 className="auth-panel-heading">
            Reset your <span>account password</span>
          </h2>
          <p className="auth-panel-desc">
            Follow the 3-step verification process to securely restore access to
            your expense tracking dashboard.
          </p>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          {/* Step 1: Email Form */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-subtitle">
                  Enter your account email to receive a 6-digit verification code.
                </p>
              </div>

              {error && (
                <div className="auth-alert-error" role="alert">
                  <AlertCircle size={16} className="auth-alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleRequestCode}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="forgot-email">
                    Email address
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="forgot-email"
                      className="auth-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                    <Mail size={16} className="auth-input-icon" />
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="auth-submit-spinner" />
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="auth-footer-link">
                  <Link to="/login" className="back-to-login">
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Enter Verification Code</h1>
                <p className="auth-subtitle">
                  {successMsg || `Enter the 6-digit code sent to ${email}`}
                </p>
              </div>

              {error && (
                <div className="auth-alert-error" role="alert">
                  <AlertCircle size={16} className="auth-alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reset-otp">
                    6-Digit Reset Code
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="reset-otp"
                      className="auth-input otp-input"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setOtp(val);
                        if (error) setError("");
                      }}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                    />
                    <KeyRound size={16} className="auth-input-icon" />
                  </div>
                  <span className="auth-helper-text">
                    Code expires in 10 minutes.
                  </span>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <span className="auth-submit-spinner" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="auth-footer-link">
                  <button
                    type="button"
                    className="back-btn-text"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={14} /> Change Email
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: New Password Form */}
          {step === 3 && (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Set New Password</h1>
                <p className="auth-subtitle">
                  Choose a strong, secure password for your account.
                </p>
              </div>

              {error && (
                <div className="auth-alert-error" role="alert">
                  <AlertCircle size={16} className="auth-alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleResetPassword}>
                {/* New Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="new-password"
                      className="auth-input"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="New strong password"
                      required
                      autoFocus
                    />
                    <Lock size={16} className="auth-input-icon" />
                    <button
                      type="button"
                      className="auth-toggle-password"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Live Password Requirements Checklist */}
                  {newPassword && <PasswordRequirements password={newPassword} />}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="confirm-new-password"
                      className="auth-input"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Repeat new password"
                      required
                    />
                    <Lock size={16} className="auth-input-icon" />
                    <button
                      type="button"
                      className="auth-toggle-password"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-submit-spinner" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success State */}
          {step === 4 && (
            <div className="auth-success-card animate-fade-in" style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--success-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--success)",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                Password Reset Complete
              </h2>

              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
                Your password has been securely updated. You can now sign in with your new credentials.
              </p>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate("/login", { replace: true })}
              >
                Sign In Now →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
