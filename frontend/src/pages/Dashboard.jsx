import React, { useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency } from "../data/mockExpenses";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { ExpenseChart } from "../components/dashboard/ExpenseChart";
import { CategoryChart } from "../components/dashboard/CategoryChart";
import { RecentExpenses } from "../components/dashboard/RecentExpenses";
import { BudgetProgress } from "../components/dashboard/BudgetProgress";
import { Button } from "../components/common/Button";
import { Wallet, Calendar, PiggyBank, ArrowLeftRight, AlertTriangle, RefreshCw } from "lucide-react";
import "./Dashboard.css";

export const Dashboard = () => {
  const { expenses, expensesLoading, expensesError, settings, budget, loadExpenses } = useExpenses();

  // Dynamic calculations from current state
  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;
    // Calculate savings only if monthlyBudget is configured
    const estimatedSavings = budget && typeof budget.monthlyBudget === "number"
      ? Math.max(0, budget.monthlyBudget - total)
      : null;

    return {
      totalExpenses: formatCurrency(total, settings.currencySymbol),
      thisMonthExpenses: formatCurrency(total, settings.currencySymbol),
      totalSavings: estimatedSavings !== null ? formatCurrency(estimatedSavings, settings.currencySymbol) : "Not Set",
      transactionCount: count,
    };
  }, [expenses, settings, budget]);

  if (expensesError && expenses.length === 0) {
    return (
      <div className="dashboard-error-state animate-fade-in" style={{ padding: 40, textAlign: "center" }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--danger-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--danger)",
          margin: "0 auto 16px",
        }}>
          <AlertTriangle size={28} />
        </div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>Unable to Load Dashboard Data</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20, maxWidth: 450, margin: "0 auto 20px" }}>
          {expensesError}
        </p>
        <Button variant="primary" icon={RefreshCw} onClick={loadExpenses}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">
      {/* 4 Top Metric Cards */}
      <section className="metrics-grid">
        <SummaryCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          change={expenses.length > 0 ? "Active" : "—"}
          isPositive={true}
          period="all-time"
          icon={Wallet}
          iconBg="#D1FAE5"
          iconColor="#10B981"
        />

        <SummaryCard
          title="This Month"
          value={metrics.thisMonthExpenses}
          change={expenses.length > 0 ? "Current cycle" : "—"}
          isPositive={true}
          period="this month"
          icon={Calendar}
          iconBg="#D1FAE5"
          iconColor="#059669"
        />

        <SummaryCard
          title="Monthly Savings"
          value={metrics.totalSavings}
          change={budget ? `${budget.currency} budget` : "No limit set"}
          isPositive={true}
          period={budget ? "vs monthly limit" : "configure in settings"}
          icon={PiggyBank}
          iconBg="#E0F2FE"
          iconColor="#0EA5E9"
        />

        <SummaryCard
          title="Transactions"
          value={metrics.transactionCount}
          change={metrics.transactionCount > 0 ? "Logged" : "None"}
          isPositive={true}
          period="total count"
          icon={ArrowLeftRight}
          iconBg="#FEF3C7"
          iconColor="#F59E0B"
        />
      </section>

      {/* Main Charts & Breakdown Section (2 Column Grid) */}
      <section className="dashboard-grid">
        {/* Top Left: Expense Overview Area Chart */}
        <div className="grid-item">
          <ExpenseChart />
        </div>

        {/* Top Right: Expenses by Category Donut Chart */}
        <div className="grid-item">
          <CategoryChart />
        </div>

        {/* Bottom Left: Recent Expenses List */}
        <div className="grid-item">
          <RecentExpenses />
        </div>

        {/* Bottom Right: Monthly Budget Progress */}
        <div className="grid-item">
          <BudgetProgress />
        </div>
      </section>
    </div>
  );
};
