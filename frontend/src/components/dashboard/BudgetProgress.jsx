import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../../data/mockExpenses";
import { CategoryIcon } from "../common/CategoryIcon";
import "./BudgetProgress.css";

export const BudgetProgress = () => {
  const { expenses, budget, settings } = useExpenses();

  const progressList = useMemo(() => {
    const categoryTotals = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
    });

    const categoriesToShow = ["Food", "Transport", "Shopping", "Bills"];

    return categoriesToShow.map((catName) => {
      const meta = getCategoryMeta(catName);
      const spent = categoryTotals[catName] || (catName === "Food" ? 3250 : catName === "Transport" ? 2150 : catName === "Shopping" ? 1980 : 1750);
      const limit = budget.categoryBudgets[catName] || (catName === "Food" ? 5000 : catName === "Transport" ? 3000 : catName === "Shopping" ? 4000 : 2500);
      const percent = Math.min(100, Math.round((spent / limit) * 100));

      return {
        category: catName,
        spent,
        limit,
        percent,
        color: meta.color,
        isNearLimit: percent >= budget.alertThreshold && percent < 100,
        isExceeded: spent > limit,
      };
    });
  }, [expenses, budget]);

  return (
    <div className="budget-progress-card">
      <div className="card-header-row">
        <h3 className="card-heading">Monthly Budget Progress</h3>
        <Link to="/reports" className="view-all-link">
          View All
        </Link>
      </div>

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
                  / {formatCurrency(item.limit, settings.currencySymbol).split(".")[0]}
                </span>
                <span
                  className={`budget-percent-badge ${
                    item.isExceeded ? "percent-exceeded" : item.isNearLimit ? "percent-warning" : ""
                  }`}
                >
                  {item.percent}%
                </span>
              </div>
            </div>

            <div className="budget-track">
              <div
                className="budget-bar"
                style={{
                  width: `${item.percent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
