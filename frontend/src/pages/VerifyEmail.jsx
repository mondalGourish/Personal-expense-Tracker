import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import * as authService from "../services/auth.service";
import {
  Wallet,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import "./Auth.css";

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(60);

  // 60-second cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) {
      setError("Please provide both your email address and the 6-digit code.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit numeric code.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await authService.verifyEmail(email.trim(), otp.trim());
      setSuccess(res.message || "Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Please provide your email address to receive a new code.");
      return;
    }
    if (cooldown > 0) return;

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const res = await authService.resendVerification(email.trim());
      setSuccess(res.message || "A new 6-digit code has been sent to your email.");
      setCooldown(60);
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
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
            Verify your <span>email address</span>
          </h2>
          <p className="auth-panel-desc">
            We sent a 6-digit security code to your email. Enter it to activate
            your account and access your dashboard.
          </p>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Verify your email</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to{" "}
              <strong>{email || "your email address"}</strong>
            </p>
          </div>

          {error && (
            <div className="auth-alert-error" role="alert">
              <AlertCircle size={16} className="auth-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert-success" role="alert">
              <CheckCircle2 size={16} className="auth-alert-icon" />
              <span>{success}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleVerify}>
            {/* Email field if not pre-filled */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="verify-email">
                Email address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="verify-email"
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                  required
                />
                <Mail size={16} className="auth-input-icon" />
              </div>
            </div>

            {/* 6-Digit OTP field */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="verify-otp">
                6-Digit Verification Code
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="verify-otp"
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
                Code expires in 10 minutes. Check your spam folder if not received.
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
                  Verify Email
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Resend Code Section */}
            <div className="otp-resend-row">
              <span className="resend-text">Didn't receive the code?</span>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
              >
                {resending ? (
                  "Sending..."
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <>
                    <RefreshCw size={13} style={{ display: "inline", marginRight: 4 }} />
                    Resend Code
                  </>
                )}
              </button>
            </div>

            <div className="auth-footer-link">
              <Link to="/login" className="back-to-login">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
