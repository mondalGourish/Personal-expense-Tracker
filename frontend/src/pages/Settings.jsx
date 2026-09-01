import React, { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { Button } from "../components/common/Button";
import {
  User,
  DollarSign,
  Moon,
  Sun,
  Bell,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import "./Settings.css";

export const Settings = () => {
  const {
    user,
    setUser,
    settings,
    setSettings,
    budget,
    updateBudget,
    setTheme,
    showToast,
  } = useExpenses();

  // Local Form States
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
  });

  const [budgetForm, setBudgetForm] = useState({
    weeklyBudget: budget.weeklyBudget,
    monthlyBudget: budget.monthlyBudget,
    alertThreshold: budget.alertThreshold || 80,
  });

  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
    { code: "USD", symbol: "$", name: "US Dollar (USD)" },
    { code: "EUR", symbol: "€", name: "Euro (EUR)" },
    { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  ];

  const handleProfileSave = (e) => {
    e.preventDefault();
    setUser((prev) => ({ ...prev, ...profileForm }));
    showToast("Profile information updated successfully!");
  };

  const handleBudgetSave = (e) => {
    e.preventDefault();
    updateBudget({
      weeklyBudget: Number(budgetForm.weeklyBudget),
      monthlyBudget: Number(budgetForm.monthlyBudget),
      alertThreshold: Number(budgetForm.alertThreshold),
    });
  };

  const handleCurrencyChange = (curr) => {
    setSelectedCurrency(curr.code);
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
          Customize your profile, budget limits, currency, and notifications.
        </p>
      </div>

      <div className="settings-sections-list">
        {/* 1. Profile Information */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <User size={20} className="icon-purple" />
              <div>
                <h3 className="settings-section-title">Profile Information</h3>
                <p className="settings-section-sub">Update your personal account details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="settings-form">
            <div className="profile-edit-row">
              <div className="user-avatar lg">
                <span>{profileForm.name.charAt(0)}</span>
              </div>
              <div className="profile-meta-text">
                <span className="profile-name-bold">{profileForm.name}</span>
                <span className="profile-badge-role">{user.role}</span>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-email">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="settings-form-footer">
              <Button type="submit" variant="primary" icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Budget Limits Configuration */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <Sliders size={20} className="icon-purple" />
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
                  className="form-input"
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
                  Triggers warning badge when spending crosses this percentage of your limit.
                </span>
              </div>
            </div>

            <div className="settings-form-footer">
              <Button type="submit" variant="primary" icon={Save}>
                Save Budget Limits
              </Button>
            </div>
          </form>
        </div>

        {/* 3. Currency Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <DollarSign size={20} className="icon-purple" />
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
              <Moon size={20} className="icon-purple" />
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
              <span className="theme-opt-desc">Clean white UI with purple accents</span>
            </button>

            <button
              className={`theme-card-option ${settings.theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <Moon size={24} className="theme-opt-icon" />
              <span className="theme-opt-title">Dark Mode</span>
              <span className="theme-opt-desc">Sleek high-contrast dark dashboard</span>
            </button>
          </div>
        </div>

        {/* 5. Notification Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-lead">
              <Bell size={20} className="icon-purple" />
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
                  Notify when total spending reaches 80% of weekly or monthly limits.
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
