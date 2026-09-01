import React, { useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency } from "../data/mockExpenses";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { ExpenseChart } from "../components/dashboard/ExpenseChart";
import { CategoryChart } from "../components/dashboard/CategoryChart";
import { RecentExpenses } from "../components/dashboard/RecentExpenses";
import { BudgetProgress } from "../components/dashboard/BudgetProgress";
import { Wallet, Calendar, PiggyBank, ArrowLeftRight } from "lucide-react";
import "./Dashboard.css";

export const Dashboard = () => {
  const { expenses, settings, budget } = useExpenses();

  // Dynamic calculations from current state
  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;
    const estimatedSavings = Math.max(0, budget.monthlyBudget - total);

    return {
      totalExpenses: formatCurrency(total, settings.currencySymbol),
      thisMonthExpenses: formatCurrency(total, settings.currencySymbol),
      totalSavings: formatCurrency(estimatedSavings, settings.currencySymbol),
      transactionCount: count,
    };
  }, [expenses, settings, budget]);

  return (
    <div className="dashboard-page animate-fade-in">
      {/* 4 Top Metric Cards (matching reference image) */}
      <section className="metrics-grid">
        <SummaryCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          change="12.5%"
          isPositive={true}
          period="vs last week"
          icon={Wallet}
          iconBg="#EDE9FE"
          iconColor="#7C3AED"
        />

        <SummaryCard
          title="This Month"
          value={metrics.thisMonthExpenses}
          change="8.2%"
          isPositive={true}
          period="vs last month"
          icon={Calendar}
          iconBg="#D1FAE5"
          iconColor="#10B981"
        />

        <SummaryCard
          title="Total Savings"
          value={metrics.totalSavings}
          change="15.3%"
          isPositive={true}
          period="vs last month"
          icon={PiggyBank}
          iconBg="#E0F2FE"
          iconColor="#0EA5E9"
        />

        <SummaryCard
          title="Transactions"
          value={metrics.transactionCount}
          change="4"
          isPositive={true}
          period="vs last week"
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
