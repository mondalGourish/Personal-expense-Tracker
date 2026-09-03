import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../../data/mockExpenses";
import { CategoryIcon } from "../common/CategoryIcon";
import { calculateBudgetHealth } from "../../utils/budgetHealth";
import { Sliders, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import "./BudgetProgress.css";

export const BudgetProgress = () => {
  const { expenses, budget, budgetLoading, settings } = useExpenses();

  // Calculate monthly spending strictly from expenses within the current month
  const { monthlyHealth, progressList } = useMemo(() => {
    if (!budget) {
      return {
        monthlyHealth: calculateBudgetHealth({ budgetLimit: null }),
        progressList: [],
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Current month start
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthlySpent = 0;
    const categoryTotals = {};

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const amt = Number(exp.amount) || 0;

      if (d >= startOfMonth) {
        monthlySpent += amt;
        const cat = exp.category || "Other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    });

    const threshold = budget.alertThreshold || 80;
    const mHealth = calculateBudgetHealth({
      budgetLimit: budget.monthlyBudget,
      spent: monthlySpent,
      alertThreshold: threshold,
      currencySymbol: settings.currencySymbol,
    });

    // Category breakdown
    const categoryBudgets = budget.categoryBudgets || {};
    const configuredCategories = Object.keys(categoryBudgets);
    const categoriesToShow =
      configuredCategories.length > 0
        ? configuredCategories
        : ["Food", "Transport", "Shopping", "Bills"];

    const list = categoriesToShow.map((catName) => {
      const meta = getCategoryMeta(catName);
      const catSpent = categoryTotals[catName] || 0;
      const catLimit = categoryBudgets[catName] !== undefined ? categoryBudgets[catName] : null;

      const health = calculateBudgetHealth({
        budgetLimit: catLimit,
        spent: catSpent,
        alertThreshold: threshold,
        currencySymbol: settings.currencySymbol,
      });

      return {
        category: catName,
        spent: catSpent,
        limit: catLimit,
        health,
        color: meta.color,
      };
    });

    return {
      monthlyHealth: mHealth,
      progressList: list,
    };
  }, [expenses, budget, settings.currencySymbol]);

  return (
    <div className="budget-progress-card">
      <div className="card-header-row">
        <h3 className="card-heading">Budget Health & Progress</h3>
        <Link to="/settings" className="view-all-link">
          {budget ? "Manage Limits" : "Configure"}
        </Link>
      </div>

      {budgetLoading ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading budget status...
        </div>
      ) : !budget ? (
        <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--bg-app)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              margin: "0 auto 12px",
            }}
          >
            <Sliders size={20} />
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 4, color: "var(--text-primary)" }}>
            No Budget Configured Yet
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Set your weekly and monthly spending limits to track health and receive limit alerts.
          </p>
          <Link
            to="/settings"
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--primary-100)",
              color: "var(--primary)",
              fontWeight: 600,
              fontSize: "0.8125rem",
            }}
          >
            Configure Budget Limits →
          </Link>
        </div>
      ) : (
        <div className="budget-progress-body">
          {/* Top Monthly Summary Banner */}
          <div className={`budget-overall-banner banner-${monthlyHealth.status.toLowerCase()}`}>
            <div className="banner-top-row">
              <div className="banner-title-group">
                <span className="banner-cycle-label">Monthly Limit</span>
                <span className="banner-fraction">
                  <strong>{formatCurrency(monthlyHealth.spent, settings.currencySymbol).split(".")[0]}</strong>
                  {" / "}
                  {formatCurrency(monthlyHealth.budgetLimit, settings.currencySymbol).split(".")[0]}
                </span>
              </div>

              <div className={`health-status-badge badge-${monthlyHealth.status.toLowerCase()}`}>
                {monthlyHealth.isExceeded && <AlertCircle size={13} />}
                {monthlyHealth.isWarning && <AlertTriangle size={13} />}
                {monthlyHealth.isSafe && <CheckCircle2 size={13} />}
                <span>{monthlyHealth.status}</span>
              </div>
            </div>

            {/* Visual Bar capped at 100% */}
            <div className="budget-track">
              <div
                className={`budget-bar bar-${monthlyHealth.status.toLowerCase()}`}
                style={{ width: `${monthlyHealth.visualPercent}%` }}
              />
            </div>

            <div className="banner-bottom-row">
              <span className="percent-text">{monthlyHealth.percentageUsed}% used</span>
              <span className={`status-highlight-text text-${monthlyHealth.status.toLowerCase()}`}>
                {monthlyHealth.statusMessage}
              </span>
            </div>
          </div>

          {/* Category Progress List */}
          <div className="category-section-label">Category Limits</div>
          <div className="budget-progress-list">
            {progressList.map((item) => (
              <div key={item.category} className="budget-progress-item">
                <div className="budget-item-top">
                  <div className="budget-category-info">
                    <CategoryIcon category={item.category} size="sm" />
                    <span className="budget-cat-name">{item.category}</span>
                  </div>

                  <div className="budget-stats">
                    <span className="budget-fraction">
                      <strong className="spent-val">
                        {formatCurrency(item.spent, settings.currencySymbol).split(".")[0]}
                      </strong>{" "}
                      {item.limit !== null
                        ? `/ ${formatCurrency(item.limit, settings.currencySymbol).split(".")[0]}`
                        : "(No Limit)"}
                    </span>
                    {item.limit !== null && (
                      <span
                        className={`budget-percent-badge badge-tag-${item.health.status.toLowerCase()}`}
                      >
                        {item.health.percentageUsed}%
                      </span>
                    )}
                  </div>
                </div>

                {item.limit !== null && (
                  <>
                    <div className="budget-track">
                      <div
                        className={`budget-bar ${item.health.isExceeded ? "bar-exceeded" : item.health.isWarning ? "bar-warning" : ""}`}
                        style={{
                          width: `${item.health.visualPercent}%`,
                          backgroundColor: item.health.isExceeded
                            ? "var(--danger)"
                            : item.health.isWarning
                            ? "var(--warning)"
                            : item.color,
                        }}
                      />
                    </div>
                    <div className="cat-budget-subline">
                      <span className={`cat-status-msg text-${item.health.status.toLowerCase()}`}>
                        {item.health.statusMessage}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
