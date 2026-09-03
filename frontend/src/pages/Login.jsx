import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Wallet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  AlertCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";
import "./Auth.css";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
    if (unverifiedEmail) setUnverifiedEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.isUnverified || err.response?.data?.isUnverified) {
        setUnverifiedEmail(err.email || form.email);
        setError("Please verify your email before logging in.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, label: "Track weekly & monthly spending" },
    { icon: BarChart3, label: "Visual reports by category" },
    { icon: ShieldCheck, label: "Secure, private expense data" },
  ];

  return (
    <main className="auth-page animate-fade-in">
      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Wallet size={22} />
          </div>
          <span className="auth-brand-name">ExpenseTrack</span>
        </div>

        <div className="auth-panel-content">
          <h2 className="auth-panel-heading">
            Take control of your <span>personal finances</span>
          </h2>
          <p className="auth-panel-desc">
            Set budgets, log expenses, and get real-time insights into where
            your money goes — all in one clean dashboard.
          </p>
        </div>

        <div className="auth-features-list">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="auth-feature-item">
              <div className="auth-feature-icon">
                <Icon size={16} />
              </div>
              <span className="auth-feature-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Sign up free
              </Link>
            </p>
          </div>

          {error && (
            <div className="auth-alert-error" role="alert">
              <AlertCircle size={16} className="auth-alert-icon" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>{error}</span>
                {unverifiedEmail && (
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      marginTop: 2,
                    }}
                  >
                    Enter 6-digit verification code <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                Email address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                <Mail size={16} className="auth-input-icon" />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
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
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
