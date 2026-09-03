import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Wallet,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import "./Auth.css";

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    if (error) setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
            Your finances, <span>finally organized</span>
          </h2>
          <p className="auth-panel-desc">
            Create your free account and start tracking expenses with weekly
            and monthly budget limits in under a minute.
          </p>
        </div>

        <div className="auth-features-list">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="auth-feature-item">
              <div className="auth-feature-icon">
                <Icon size={16} />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-subtitle">
              Already have an account? <Link to="/login">Sign in instead</Link>
            </p>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">
                Full name
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-name"
                  className={`auth-input ${fieldErrors.name ? "has-error" : ""}`}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
                <User size={16} className="auth-input-icon" />
              </div>
              {fieldErrors.name && (
                <span className="auth-error-text">
                  <AlertCircle size={13} />
                  {fieldErrors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">
                Email address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-email"
                  className={`auth-input ${fieldErrors.email ? "has-error" : ""}`}
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
              {fieldErrors.email && (
                <span className="auth-error-text">
                  <AlertCircle size={13} />
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-password"
                  className={`auth-input ${fieldErrors.password ? "has-error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
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
              {fieldErrors.password && (
                <span className="auth-error-text">
                  <AlertCircle size={13} />
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-confirm">
                Confirm password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-confirm"
                  className={`auth-input ${fieldErrors.confirmPassword ? "has-error" : ""}`}
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
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
              {fieldErrors.confirmPassword && (
                <span className="auth-error-text">
                  <AlertCircle size={13} />
                  {fieldErrors.confirmPassword}
                </span>
              )}
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
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
