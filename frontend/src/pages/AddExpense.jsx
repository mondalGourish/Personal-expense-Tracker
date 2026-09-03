import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ExpenseForm } from "../components/expenses/ExpenseForm";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency } from "../data/mockExpenses";
import { calculateBudgetHealth } from "../utils/budgetHealth";
import {
  Wallet,
  Sparkles,
  Sliders,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./AddExpense.css";

export const AddExpense = () => {
  const navigate = useNavigate();
  const { budget, expenses, settings } = useExpenses();

  // Calculate monthly spending strictly for the current calendar month
  const monthlyHealth = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthlySpent = 0;
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d >= startOfMonth) {
        monthlySpent += Number(exp.amount) || 0;
      }
    });

    return calculateBudgetHealth({
      budgetLimit: budget?.monthlyBudget,
      spent: monthlySpent,
      alertThreshold: budget?.alertThreshold || 80,
      currencySymbol: settings.currencySymbol,
    });
  }, [expenses, budget, settings.currencySymbol]);

  const hasBudget = monthlyHealth.isConfigured;

  return (
    <div className="add-expense-page animate-fade-in">
      <div className="add-page-header">
        <h2 className="page-heading">Add Expense</h2>
        <p className="page-subheading">
          Log your daily expenses to keep your personalized budget limits updated.
        </p>
      </div>

      <div className="add-expense-layout">
        {/* Main Form Card */}
        <div className="add-form-card">
          <div className="form-card-header">
            <h3 className="card-heading">Expense Details</h3>
            <span className="card-subtext">Fill in the fields below</span>
          </div>

          <ExpenseForm
            onSuccess={() => navigate("/expenses")}
            onCancel={() => navigate("/expenses")}
            submitLabel="Add Expense"
          />
        </div>

        {/* Side Info & Budget Tips Card */}
        <div className="add-info-column">
          {/* Current Budget Limits Summary */}
          <div className="info-card budget-summary-info">
            <div className="info-card-header">
              <Wallet size={18} className="info-icon" />
              <h4 className="info-card-title">Budget Overview</h4>
            </div>

            {hasBudget ? (
              <div className="budget-info-rows">
                <div className="budget-info-row">
                  <span className="info-row-label">Weekly Limit</span>
                  <span className="info-row-val">
                    {formatCurrency(budget.weeklyBudget, settings.currencySymbol)}
                  </span>
                </div>
                <div className="budget-info-row">
                  <span className="info-row-label">Monthly Limit</span>
                  <span className="info-row-val">
                    {formatCurrency(budget.monthlyBudget, settings.currencySymbol)}
                  </span>
                </div>
                <div className="divider-line" />
                <div
                  className={`budget-info-row highlight-row row-${monthlyHealth.status.toLowerCase()}`}
                >
                  <span className="info-row-label">
                    {monthlyHealth.isExceeded ? "Monthly Status" : "Monthly Remaining"}
                  </span>
                  <span
                    className={`info-row-val remaining-val val-${monthlyHealth.status.toLowerCase()}`}
                  >
                    {monthlyHealth.isExceeded
                      ? `${formatCurrency(monthlyHealth.overAmount, settings.currencySymbol)} over`
                      : formatCurrency(monthlyHealth.remaining, settings.currencySymbol)}
                  </span>
                </div>

                <div className="budget-health-pill-row">
                  <span
                    className={`budget-pill pill-${monthlyHealth.status.toLowerCase()}`}
                  >
                    {monthlyHealth.isExceeded && <AlertCircle size={12} />}
                    {monthlyHealth.isWarning && <AlertTriangle size={12} />}
                    {monthlyHealth.isSafe && <CheckCircle2 size={12} />}
                    <span>{monthlyHealth.alertLabel}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 10 }}>
                  No budget limits configured yet.
                </p>
                <Link
                  to="/settings"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  <Sliders size={14} /> Configure in Settings →
                </Link>
              </div>
            )}
          </div>

          {/* Smart Budget Tip Card */}
          <div className="info-card tip-card">
            <div className="tip-header">
              <Sparkles size={18} className="sparkle-icon" />
              <h4 className="info-card-title">Smart Budget Tip</h4>
            </div>
            <p className="tip-text">
              Categorizing your transactions accurately helps generate clear
              weekly insights and gives you precise alerts before exceeding
              limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
