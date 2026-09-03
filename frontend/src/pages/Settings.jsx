import React, { useState, useEffect } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import {
  User,
  DollarSign,
  Moon,
  Sun,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
} from "lucide-react";
import "./Settings.css";

export const Settings = () => {
  const {
    settings,
    setSettings,
    budget,
    updateBudget,
    setTheme,
    showToast,
  } = useExpenses();

  // Real authenticated user from AuthContext
  const { user } = useAuth();

  // Budget form local state — safely handles budget === null
  const [budgetForm, setBudgetForm] = useState({
    weeklyBudget: budget?.weeklyBudget ?? 5000,
    monthlyBudget: budget?.monthlyBudget ?? 20000,
    alertThreshold: budget?.alertThreshold ?? 80,
  });

  // Keep form in sync when budget finishes loading
  useEffect(() => {
    if (budget) {
      setBudgetForm({
        weeklyBudget: budget.weeklyBudget,
        monthlyBudget: budget.monthlyBudget,
        alertThreshold: budget.alertThreshold || 80,
      });
    }
  }, [budget]);

  const [budgetSaving, setBudgetSaving] = useState(false);

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
    { code: "USD", symbol: "$", name: "US Dollar (USD)" },
    { code: "EUR", symbol: "€", name: "Euro (EUR)" },
    { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  ];

  const isWeeklyExceedingMonthly =
    Number(budgetForm.weeklyBudget) > Number(budgetForm.monthlyBudget);

  const handleBudgetSave = async (e) => {
    e.preventDefault();

    const weekly = Number(budgetForm.weeklyBudget);
    const monthly = Number(budgetForm.monthlyBudget);

    if (weekly > monthly) {
      showToast("Weekly spending limit cannot be greater than monthly spending limit", "error");
      return;
    }

    setBudgetSaving(true);
    try {
      await updateBudget({
        weeklyBudget: weekly,
        monthlyBudget: monthly,
        alertThreshold: Number(budgetForm.alertThreshold),
      });
    } catch {
      showToast("Failed to save budget. Please try again.", "error");
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleCurrencyChange = (curr) => {
    setSettings((prev) => ({
      ...prev,
      currency: curr.code,
      currencySymbol: curr.symbol,
    }));
    showToast(`Default currency changed to ${curr.name}`);
  };

  const toggleNotification = (key) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
    showToast("Notification preferences updated");
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-page-header">
        <h2 className="page-heading">Settings & Preferences</h2>
        <p className="page-subheading">
          Customize your budget limits, currency, appearance, and notifications.
        </p>
      </div>

      <div className="settings-sections-list">
        {/* 1. Account Info (read-only — from AuthContext) */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <User size={20} className="icon-emerald" />
              <div>
                <h3 className="settings-section-title">Account Information</h3>
                <p className="settings-section-sub">Your registered account details</p>
              </div>
            </div>
          </div>

          <div className="profile-edit-row">
            <div className="user-avatar lg">
              <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="profile-meta-text">
              <span className="profile-name-bold">{user?.name || "—"}</span>
              <span className="profile-email-sub">{user?.email || "—"}</span>
            </div>
          </div>
          <p className="settings-section-sub" style={{ marginTop: 12, fontSize: "0.8rem" }}>
            Account authenticated securely via JWT session.
          </p>
        </div>

        {/* 2. Budget Limits Configuration */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <Sliders size={20} className="icon-emerald" />
              <div>
                <h3 className="settings-section-title">Budget Limit Configuration</h3>
                <p className="settings-section-sub">
                  Define your maximum spending capacity for weekly and monthly cycles
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBudgetSave} className="settings-form">
            <div className="settings-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="weekly-limit">
                  Weekly Spending Limit ({settings.currencySymbol})
                </label>
                <input
                  id="weekly-limit"
                  type="number"
                  className={`form-input ${isWeeklyExceedingMonthly ? "input-error" : ""}`}
                  value={budgetForm.weeklyBudget}
                  onChange={(e) =>
                    setBudgetForm((prev) => ({
                      ...prev,
                      weeklyBudget: e.target.value,
                    }))
                  }
                  min="0"
                  required
                />
                {isWeeklyExceedingMonthly && (
                  <span className="form-error-msg">
                    Weekly limit cannot exceed monthly limit ({settings.currencySymbol}{budgetForm.monthlyBudget})
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="monthly-limit">
                  Monthly Spending Limit ({settings.currencySymbol})
                </label>
                <input
                  id="monthly-limit"
                  type="number"
                  className="form-input"
                  value={budgetForm.monthlyBudget}
                  onChange={(e) =>
                    setBudgetForm((prev) => ({
                      ...prev,
                      monthlyBudget: e.target.value,
                    }))
                  }
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="alert-threshold">
                  Alert Warning Threshold (%)
                </label>
                <input
                  id="alert-threshold"
                  type="number"
                  className="form-input"
                  value={budgetForm.alertThreshold}
                  onChange={(e) =>
                    setBudgetForm((prev) => ({
                      ...prev,
                      alertThreshold: e.target.value,
                    }))
                  }
                  min="10"
                  max="100"
                  required
                />
                <span className="form-helper">
                  Triggers warning indicator when spending crosses this percentage of your limit.
                </span>
              </div>
            </div>

            <div className="settings-form-footer">
              <Button type="submit" variant="primary" icon={Save} loading={budgetSaving}>
                Save Budget Limits
              </Button>
            </div>
          </form>
        </div>

        {/* 3. Currency Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <DollarSign size={20} className="icon-emerald" />
              <div>
                <h3 className="settings-section-title">Currency Preference</h3>
                <p className="settings-section-sub">
                  Select your primary display currency (Default is INR ₹)
                </p>
              </div>
            </div>
          </div>

          <div className="currency-selector-grid">
            {currencies.map((curr) => (
              <div
                key={curr.code}
                className={`currency-option-card ${
                  settings.currency === curr.code ? "selected" : ""
                }`}
                onClick={() => handleCurrencyChange(curr)}
              >
                <div className="currency-sym-circle">{curr.symbol}</div>
                <div className="currency-text-info">
                  <span className="currency-code">{curr.code}</span>
                  <span className="currency-name-sub">{curr.name}</span>
                </div>
                {settings.currency === curr.code && (
                  <CheckCircle2 size={18} className="check-icon-selected" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Theme & Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <Moon size={20} className="icon-emerald" />
              <div>
                <h3 className="settings-section-title">Appearance & Theme</h3>
                <p className="settings-section-sub">Choose between Light and Dark visual modes</p>
              </div>
            </div>
          </div>

          <div className="theme-options-row">
            <button
              className={`theme-card-option ${settings.theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
            >
              <Sun size={24} className="theme-opt-icon" />
              <span className="theme-opt-title">Light Mode</span>
              <span className="theme-opt-desc">Clean slate UI with emerald accents</span>
            </button>

            <button
              className={`theme-card-option ${settings.theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <Moon size={24} className="theme-opt-icon" />
              <span className="theme-opt-title">Dark Mode</span>
              <span className="theme-opt-desc">Midnight navy dashboard with emerald highlights</span>
            </button>
          </div>
        </div>

        {/* 5. Notification Preferences (client-side only) */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <Bell size={20} className="icon-emerald" />
              <div>
                <h3 className="settings-section-title">Notification Preferences</h3>
                <p className="settings-section-sub">Control in-app alerts and budget notifications</p>
              </div>
            </div>
          </div>

          <div className="notification-toggle-list">
            <div className="notif-toggle-row">
              <div>
                <span className="notif-row-title">Budget Threshold Alerts</span>
                <p className="notif-row-desc">
                  Notify when total spending reaches your configured alert threshold.
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.budgetAlerts}
                  onChange={() => toggleNotification("budgetAlerts")}
                />
                <span className="slider round" />
              </label>
            </div>

            <div className="notif-toggle-row">
              <div>
                <span className="notif-row-title">Weekly Digest & Summary</span>
                <p className="notif-row-desc">
                  Receive weekly spending analysis and category insights.
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.weeklySummary}
                  onChange={() => toggleNotification("weeklySummary")}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
