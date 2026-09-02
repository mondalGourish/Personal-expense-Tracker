import React from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, formatDate } from "../../data/mockExpenses";
import { CategoryIcon, CategoryBadge } from "../common/CategoryIcon";
import "./RecentExpenses.css";

export const RecentExpenses = () => {
  const { expenses, settings } = useExpenses();

  const recentList = expenses.slice(0, 5);

  return (
    <div className="recent-expenses-card">
      <div className="card-header-row">
        <h3 className="card-heading">Recent Expenses</h3>
        <Link to="/expenses" className="view-all-link">
          View All
        </Link>
      </div>

      {recentList.length === 0 ? (
        <div className="recent-empty">No recent expenses logged.</div>
      ) : (
        <div className="recent-expenses-list">
          {recentList.map((item) => (
            <div key={item._id} className="recent-expense-row">
              <div className="expense-lead">
                <CategoryIcon category={item.category} size="md" />
                <div className="expense-meta">
                  <span className="expense-desc">
                    {item.description || item.category}
                  </span>
                  <span className="expense-cat-sub">{item.category}</span>
                </div>
              </div>

              <div className="expense-trail">
                <span className="expense-amount-val">
                  {formatCurrency(item.amount, settings.currencySymbol)}
                </span>
                <span className="expense-date-val">{formatDate(item.date)}</span>
                <CategoryBadge category={item.category} showIcon={false} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
