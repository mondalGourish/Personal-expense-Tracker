import React, { useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency } from "../data/mockExpenses";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { ExpenseChart } from "../components/dashboard/ExpenseChart";
import { CategoryChart } from "../components/dashboard/CategoryChart";
import { RecentExpenses } from "../components/dashboard/RecentExpenses";
import { BudgetProgress } from "../components/dashboard/BudgetProgress";
import { Button } from "../components/common/Button";
import { calculateBudgetHealth } from "../utils/budgetHealth";
import {
  Wallet,
  Calendar,
  PiggyBank,
  ArrowLeftRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import "./Dashboard.css";

export const Dashboard = () => {
  const {
    expenses,
    expensesLoading,
    expensesError,
    settings,
    budget,
    loadExpenses,
  } = useExpenses();

  // Dynamic calculations separated strictly by timeframe
  const metrics = useMemo(() => {
    const totalAllTime = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Current month start
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Current week start (Monday)
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);

    let thisMonthTotal = 0;
    let thisWeekTotal = 0;

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const amt = Number(exp.amount) || 0;

      if (d >= startOfMonth) {
        thisMonthTotal += amt;
      }
      if (d >= startOfWeek) {
        thisWeekTotal += amt;
      }
    });

    // Compute monthly budget health
    const monthlyHealth = calculateBudgetHealth({
      budgetLimit: budget?.monthlyBudget,
      spent: thisMonthTotal,
      alertThreshold: budget?.alertThreshold || 80,
      currencySymbol: settings.currencySymbol,
    });

    return {
      totalExpenses: formatCurrency(totalAllTime, settings.currencySymbol),
      thisMonthExpenses: formatCurrency(thisMonthTotal, settings.currencySymbol),
      thisWeekExpenses: formatCurrency(thisWeekTotal, settings.currencySymbol),
      transactionCount: count,
      monthlyHealth,
    };
  }, [expenses, settings.currencySymbol, budget]);

  if (expensesError && expenses.length === 0) {
    return (
      <div className="dashboard-error-state animate-fade-in" style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--danger-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger)",
            margin: "0 auto 16px",
          }}
        >
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

  // Determine Card 3 properties (Budget Status vs Remaining)
  const getBudgetCardProps = () => {
    const health = metrics.monthlyHealth;

    if (!health.isConfigured) {
      return {
        title: "Monthly Budget",
        value: "Not Set",
        change: "Configure limits",
        trendStatus: "neutral",
        period: "in settings",
        icon: PiggyBank,
        iconBg: "var(--bg-card-subtle)",
        iconColor: "var(--text-muted)",
      };
    }

    if (health.isExceeded) {
      return {
        title: "Budget Status",
        value: `${formatCurrency(health.overAmount, settings.currencySymbol)} over`,
        change: `${health.percentageUsed}% used`,
        trendStatus: "danger",
        period: "monthly limit exceeded",
        icon: PiggyBank,
        iconBg: "var(--danger-bg)",
        iconColor: "var(--danger)",
      };
    }

    if (health.isWarning) {
      return {
        title: "Budget Remaining",
        value: formatCurrency(health.remaining, settings.currencySymbol),
        change: `${health.percentageUsed}% used`,
        trendStatus: "warning",
        period: "approaching limit",
        icon: PiggyBank,
        iconBg: "var(--warning-bg)",
        iconColor: "var(--warning)",
      };
    }

    // SAFE
    return {
      title: "Budget Remaining",
      value: formatCurrency(health.remaining, settings.currencySymbol),
      change: `${health.percentageUsed}% used`,
      trendStatus: "success",
      period: `of ${formatCurrency(health.budgetLimit, settings.currencySymbol).split(".")[0]} limit`,
      icon: PiggyBank,
      iconBg: "var(--success-bg)",
      iconColor: "var(--success)",
    };
  };

  const budgetCardProps = getBudgetCardProps();

  return (
    <div className="dashboard-page animate-fade-in">
      {/* 4 Top Metric Cards */}
      <section className="metrics-grid">
        <SummaryCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          change={metrics.transactionCount > 0 ? "Active" : "—"}
          isPositive={true}
          trendStatus="neutral"
          period="all-time total"
          icon={Wallet}
          iconBg="var(--primary-100)"
          iconColor="var(--primary)"
        />

        <SummaryCard
          title="This Month"
          value={metrics.thisMonthExpenses}
          change={expenses.length > 0 ? "Current cycle" : "—"}
          isPositive={true}
          trendStatus="neutral"
          period="this month"
          icon={Calendar}
          iconBg="var(--primary-100)"
          iconColor="var(--primary-hover)"
        />

        <SummaryCard {...budgetCardProps} />

        <SummaryCard
          title="Transactions"
          value={metrics.transactionCount}
          change={metrics.transactionCount > 0 ? "Logged" : "None"}
          isPositive={true}
          trendStatus="neutral"
          period="total count"
          icon={ArrowLeftRight}
          iconBg="var(--info-bg)"
          iconColor="var(--info)"
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
