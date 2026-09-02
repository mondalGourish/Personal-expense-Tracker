import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../../data/mockExpenses";
import { CategoryIcon } from "../common/CategoryIcon";
import { Sliders } from "lucide-react";
import "./BudgetProgress.css";

export const BudgetProgress = () => {
  const { expenses, budget, budgetLoading, settings } = useExpenses();

  const progressList = useMemo(() => {
    if (!budget) return [];

    const categoryTotals = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
    });

    const categoryBudgets = budget.categoryBudgets || {};
    const configuredCategories = Object.keys(categoryBudgets);

    // Categories to display: configured categories or default key categories
    const categoriesToShow =
      configuredCategories.length > 0
        ? configuredCategories
        : ["Food", "Transport", "Shopping", "Bills"];

    return categoriesToShow.map((catName) => {
      const meta = getCategoryMeta(catName);
      const spent = categoryTotals[catName] || 0;
      const limit = categoryBudgets[catName] !== undefined ? categoryBudgets[catName] : null;
      const percent = limit && limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

      return {
        category: catName,
        spent,
        limit,
        percent,
        color: meta.color,
        isNearLimit: limit !== null && limit > 0 && percent >= (budget.alertThreshold || 80) && percent < 100,
        isExceeded: limit !== null && spent > limit,
      };
    });
  }, [expenses, budget]);

  return (
    <div className="budget-progress-card">
      <div className="card-header-row">
        <h3 className="card-heading">Monthly Budget Progress</h3>
        <Link to="/settings" className="view-all-link">
          {budget ? "Manage" : "Configure"}
        </Link>
      </div>

      {budgetLoading ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading budget status...
        </div>
      ) : !budget ? (
        <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--bg-app)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
            margin: "0 auto 12px"
          }}>
            <Sliders size={20} />
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 4, color: "var(--text-primary)" }}>
            No Budget Configured Yet
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Set your weekly and monthly spending limits to track progress and get alerts.
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
      ) : progressList.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No category limits configured. Total Monthly Limit: {formatCurrency(budget.monthlyBudget, settings.currencySymbol)}
        </div>
      ) : (
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
                    {item.limit !== null ? `/ ${formatCurrency(item.limit, settings.currencySymbol).split(".")[0]}` : "(No Limit)"}
                  </span>
                  {item.limit !== null && (
                    <span
                      className={`budget-percent-badge ${
                        item.isExceeded ? "percent-exceeded" : item.isNearLimit ? "percent-warning" : ""
                      }`}
                    >
                      {item.percent}%
                    </span>
                  )}
                </div>
              </div>

              {item.limit !== null && (
                <div className="budget-track">
                  <div
                    className="budget-bar"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
