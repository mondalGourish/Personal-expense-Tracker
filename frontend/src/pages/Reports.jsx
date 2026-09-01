import React, { useState, useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../data/mockExpenses";
import { CategoryIcon } from "../components/common/CategoryIcon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart2,
} from "lucide-react";
import { Button } from "../components/common/Button";
import "./Reports.css";

export const Reports = () => {
  const { expenses, settings, showToast } = useExpenses();
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  // Summary Metrics calculation
  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length || 1;
    const avgPerExpense = total / count;
    const avgDaily = total / 30;

    return {
      total,
      weeklySpending: total * 0.35,
      monthlySpending: total,
      avgDaily,
      avgPerExpense,
    };
  }, [expenses]);

  // Category breakdown list
  const categoryStats = useMemo(() => {
    const map = {};
    let total = 0;

    expenses.forEach((exp) => {
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
  }, [expenses]);

  // Chart data by day/week
  const timelineChartData = useMemo(() => {
    if (selectedPeriod === "This Week") {
      return [
        { name: "Mon", amount: 1400 },
        { name: "Tue", amount: 850 },
        { name: "Wed", amount: 2100 },
        { name: "Thu", amount: 1250 },
        { name: "Fri", amount: 2450 },
        { name: "Sat", amount: 3100 },
        { name: "Sun", amount: 950 },
      ];
    }

    return [
      { name: "Week 1", amount: 7800 },
      { name: "Week 2", amount: 12400 },
      { name: "Week 3", amount: 15600 },
      { name: "Week 4", amount: 9430 },
    ];
  }, [selectedPeriod]);

  const handleExport = () => {
    showToast("Expense report CSV exported successfully!", "success");
  };

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
            Export
          </Button>
        </div>
      </div>

      {/* 4 Analytics Metrics Cards */}
      <div className="reports-metrics-grid">
        <div className="report-metric-card">
          <span className="metric-label">Total Spending</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.total, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            <span className="metric-tag up">+12.5%</span> vs previous period
          </div>
        </div>

        <div className="report-metric-card">
          <span className="metric-label">Weekly Average</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.weeklySpending, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            <span className="metric-tag down">-4.2%</span> vs last week
          </div>
        </div>

        <div className="report-metric-card">
          <span className="metric-label">Daily Average</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.avgDaily, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">
            <span className="metric-tag up">+2.1%</span> daily budget
          </div>
        </div>

        <div className="report-metric-card">
          <span className="metric-label">Average Per Transaction</span>
          <h3 className="metric-val">
            {formatCurrency(metrics.avgPerExpense, settings.currencySymbol)}
          </h3>
          <div className="metric-sub">Based on {expenses.length} records</div>
        </div>
      </div>

      {/* Reports Charts Grid */}
      <div className="reports-charts-grid">
        {/* Spending Over Time Bar Chart */}
        <div className="report-chart-card">
          <div className="report-chart-header">
            <div className="chart-title-group">
              <BarChart2 size={20} className="chart-icon" />
              <h3 className="card-heading">Spending Over Time ({selectedPeriod})</h3>
            </div>
          </div>

          <div className="report-chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={6} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val, settings.currencySymbol), "Amount"]}
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
          </div>
        </div>

        {/* Category Breakdown Table & Donut */}
        <div className="report-chart-card">
          <div className="report-chart-header">
            <div className="chart-title-group">
              <PieIcon size={20} className="chart-icon" />
              <h3 className="card-heading">Category Spending Distribution</h3>
            </div>
          </div>

          <div className="category-report-table-wrapper">
            <table className="category-report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
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
                    <td>{item.count} txns</td>
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
          </div>
        </div>
      </div>
    </div>
  );
};
