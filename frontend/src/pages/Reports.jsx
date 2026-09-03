import React, { useState, useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../data/mockExpenses";
import { CategoryIcon } from "../components/common/CategoryIcon";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { calculateBudgetHealth } from "../utils/budgetHealth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./Reports.css";

export const Reports = () => {
  const { expenses, settings, showToast, setIsAddModalOpen, budget } = useExpenses();
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  // Filter expenses strictly belonging to the selected period
  const { currentPeriodExpenses, previousPeriodExpenses, periodLabel } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (selectedPeriod === "This Week") {
      const day = now.getDay(); // 0 is Sun, 1 is Mon
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() + diffToMonday);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

      const current = expenses.filter((e) => new Date(e.date) >= startOfThisWeek);
      const previous = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= startOfLastWeek && d < startOfThisWeek;
      });

      return { currentPeriodExpenses: current, previousPeriodExpenses: previous, periodLabel: "vs last week" };
    }

    if (selectedPeriod === "Last Month") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const startOf2MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const endOf2MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);

      const current = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
      const previous = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= startOf2MonthsAgo && d <= endOf2MonthsAgo;
      });

      return { currentPeriodExpenses: current, previousPeriodExpenses: previous, periodLabel: "vs prior month" };
    }

    // Default: "This Month"
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const current = expenses.filter((e) => new Date(e.date) >= startOfThisMonth);
    const previous = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });

    return { currentPeriodExpenses: current, previousPeriodExpenses: previous, periodLabel: "vs last month" };
  }, [expenses, selectedPeriod]);

  // Real data metrics computation
  const metrics = useMemo(() => {
    const total = currentPeriodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const prevTotal = previousPeriodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = currentPeriodExpenses.length;
    const avgPerExpense = count > 0 ? total / count : 0;

    const daysCount = selectedPeriod === "This Week" ? 7 : 30;
    const avgDaily = total / daysCount;

    // Calculate percentage change only if previous data exists
    let percentChange = null;
    let isIncrease = null;
    if (prevTotal > 0) {
      const diff = ((total - prevTotal) / prevTotal) * 100;
      percentChange = Math.abs(Number(diff.toFixed(1)));
      isIncrease = diff >= 0;
    }

    return {
      total,
      prevTotal,
      count,
      avgDaily,
      avgPerExpense,
      percentChange,
      isIncrease,
    };
  }, [currentPeriodExpenses, previousPeriodExpenses, selectedPeriod]);

  // Compute budget health for the selected period
  const periodBudgetHealth = useMemo(() => {
    if (!budget) return null;
    const limit =
      selectedPeriod === "This Week"
        ? budget.weeklyBudget
        : selectedPeriod === "This Month"
        ? budget.monthlyBudget
        : null;

    if (limit === null || limit === undefined) return null;

    return calculateBudgetHealth({
      budgetLimit: limit,
      spent: metrics.total,
      alertThreshold: budget.alertThreshold || 80,
      currencySymbol: settings.currencySymbol,
    });
  }, [budget, selectedPeriod, metrics.total, settings.currencySymbol]);

  // Real Category breakdown for current period (or all expenses if period has 0)
  const categoryStats = useMemo(() => {
    const list = currentPeriodExpenses.length > 0 ? currentPeriodExpenses : expenses;
    const map = {};
    let total = 0;

    list.forEach((exp) => {
      const cat = exp.category || "Other";
      if (!map[cat]) {
        map[cat] = { spent: 0, count: 0 };
      }
      map[cat].spent += Number(exp.amount);
      map[cat].count += 1;
      total += Number(exp.amount);
    });

    if (total === 0) return [];

    return Object.entries(map)
      .map(([cat, data]) => {
        const meta = getCategoryMeta(cat);
        const percent = Math.round((data.spent / total) * 100);
        return {
          category: cat,
          spent: data.spent,
          count: data.count,
          percent,
          color: meta.color,
          bg: meta.bg,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [currentPeriodExpenses, expenses]);

  // Real timeline chart data derived strictly from user's actual expenses
  const timelineChartData = useMemo(() => {
    if (selectedPeriod === "This Week") {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];

      currentPeriodExpenses.forEach((exp) => {
        const d = new Date(exp.date);
        const dayIdx = (d.getDay() + 6) % 7; // Convert Sun(0)..Sat(6) to Mon(0)..Sun(6)
        dayTotals[dayIdx] += Number(exp.amount);
      });

      return dayNames.map((name, i) => ({
        name,
        amount: dayTotals[i],
      }));
    }

    // Monthly view: group into 4 weeks of the month
    const weekNames = ["Week 1 (1-7)", "Week 2 (8-14)", "Week 3 (15-21)", "Week 4 (22+)"];
    const weekTotals = [0, 0, 0, 0];

    currentPeriodExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      const dateNum = d.getDate();
      if (dateNum <= 7) weekTotals[0] += Number(exp.amount);
      else if (dateNum <= 14) weekTotals[1] += Number(exp.amount);
      else if (dateNum <= 21) weekTotals[2] += Number(exp.amount);
      else weekTotals[3] += Number(exp.amount);
    });

    return weekNames.map((name, i) => ({
      name,
      amount: weekTotals[i],
    }));
  }, [currentPeriodExpenses, selectedPeriod]);

  const handleExport = () => {
    if (expenses.length === 0) {
      showToast("No expenses to export yet.", "info");
      return;
    }
    const headers = "Date,Category,Description,Amount\n";
    const rows = expenses
      .map((e) => `"${new Date(e.date).toISOString().split("T")[0]}","${e.category}","${(e.description || "").replace(/"/g, '""')}","${e.amount}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("Expense report CSV exported successfully!", "success");
  };

  // If user has recorded no expenses whatsoever, display a clean empty report state
  if (expenses.length === 0) {
    return (
      <div className="reports-page animate-fade-in">
        <div className="reports-header-row">
          <div>
            <h2 className="page-heading">Spending Reports & Analytics</h2>
            <p className="page-subheading">
              Analyze your spending patterns, category distributions, and trends.
            </p>
          </div>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No spending data available yet"
          description="Your analytical spending reports, category charts, and period-over-period comparisons will automatically populate as you record transactions."
          actionText="Add First Expense"
          onAction={() => setIsAddModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="reports-page animate-fade-in">
      {/* Top Header */}
      <div className="reports-header-row">
        <div>
          <h2 className="page-heading">Spending Reports & Analytics</h2>
          <p className="page-subheading">
            Analyze your spending patterns, category distributions, and trends.
          </p>
        </div>

        <div className="reports-actions">
          {/* Period Selector Tabs */}
          <div className="period-tabs">
            {["This Week", "This Month", "Last Month"].map((period) => (
              <button
                key={period}
                className={`period-tab ${selectedPeriod === period ? "active" : ""}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 4 Analytics Metrics Cards */}
      <div className="reports-metrics-grid">
        {/* Metric 1: Total Spending */}
        <div className="report-metric-card">
          <span className="metric-label">Total Spending ({selectedPeriod})</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.total, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            {metrics.percentChange !== null ? (
              <>
                <span className={`metric-tag ${metrics.isIncrease ? "up" : "down"}`}>
                  {metrics.isIncrease ? (
                    <TrendingUp size={11} style={{ display: "inline", marginRight: 2 }} />
                  ) : (
                    <TrendingDown size={11} style={{ display: "inline", marginRight: 2 }} />
                  )}
                  {metrics.isIncrease ? "+" : "-"}
                  {metrics.percentChange}%
                </span>{" "}
                {periodLabel}
              </>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>
                {metrics.count > 0 ? "Initial baseline period" : "No expenses in period"}
              </span>
            )}
          </div>
          {periodBudgetHealth && periodBudgetHealth.isConfigured && (
            <div className="metric-budget-health-row" style={{ marginTop: 6, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
              {periodBudgetHealth.isExceeded && <AlertCircle size={12} style={{ color: "var(--danger)" }} />}
              {periodBudgetHealth.isWarning && <AlertTriangle size={12} style={{ color: "var(--warning)" }} />}
              {periodBudgetHealth.isSafe && <CheckCircle2 size={12} style={{ color: "var(--success)" }} />}
              <span
                style={{
                  fontWeight: 600,
                  color: periodBudgetHealth.isExceeded
                    ? "var(--danger)"
                    : periodBudgetHealth.isWarning
                    ? "var(--warning)"
                    : "var(--success)",
                }}
              >
                {periodBudgetHealth.percentageUsed}% of limit ({periodBudgetHealth.statusMessage})
              </span>
            </div>
          )}
        </div>

        {/* Metric 2: Period Average */}
        <div className="report-metric-card">
          <span className="metric-label">Daily Average</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.avgDaily, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            Across {selectedPeriod === "This Week" ? "7 days" : "30 days"} cycle
          </div>
        </div>

        {/* Metric 3: Average Transaction */}
        <div className="report-metric-card">
          <span className="metric-label">Average Per Transaction</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.avgPerExpense, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            Based on {metrics.count} transaction{metrics.count === 1 ? "" : "s"}
          </div>
        </div>

        {/* Metric 4: Transaction Volume */}
        <div className="report-metric-card">
          <span className="metric-label">Total Transactions</span>
          <h3 className="metric-val">{metrics.count}</h3>
          <div className="metric-sub">
            {metrics.count > 0 ? "Recorded in this cycle" : "None recorded for period"}
          </div>
        </div>
      </div>

      {/* Reports Charts Grid */}
      <div className="reports-charts-grid">
        {/* Spending Over Time Bar Chart */}
        <div className="report-chart-card">
          <div className="report-chart-header">
            <div className="chart-title-group">
              <BarChart2 size={20} className="chart-icon" />
              <h3 className="card-heading">Spending Breakdown ({selectedPeriod})</h3>
            </div>
          </div>

          <div className="report-chart-body">
            {metrics.total === 0 ? (
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No spending recorded for {selectedPeriod.toLowerCase()}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} dy={6} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val, settings.currencySymbol), "Spent"]}
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="report-chart-card">
          <div className="report-chart-header">
            <div className="chart-title-group">
              <PieIcon size={20} className="chart-icon" />
              <h3 className="card-heading">Category Spending Distribution</h3>
            </div>
          </div>

          <div className="category-report-table-wrapper">
            {categoryStats.length === 0 ? (
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No category breakdown available for this period.
              </div>
            ) : (
              <table className="category-report-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Total Spent</th>
                    <th className="text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map((item) => (
                    <tr key={item.category}>
                      <td>
                        <div className="cat-table-lead">
                          <CategoryIcon category={item.category} size="sm" />
                          <span className="cat-table-name">{item.category}</span>
                        </div>
                      </td>
                      <td>{item.count} txn{item.count === 1 ? "" : "s"}</td>
                      <td className="font-bold">
                        {formatCurrency(item.spent, settings.currencySymbol)}
                      </td>
                      <td className="text-right">
                        <span className="share-pill" style={{ backgroundColor: item.bg, color: item.color }}>
                          {item.percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
