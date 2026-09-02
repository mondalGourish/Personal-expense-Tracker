import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency } from "../../data/mockExpenses";
import { ChevronDown, BarChart2 } from "lucide-react";
import "./ExpenseChart.css";

// Custom SaaS Styled Tooltip
const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-custom-tooltip">
        <div className="tooltip-date">{label}</div>
        <div className="tooltip-amount">
          {formatCurrency(payload[0].value, currencySymbol)}
        </div>
      </div>
    );
  }
  return null;
};

export const ExpenseChart = () => {
  const { expenses, settings } = useExpenses();
  const [timeframe, setTimeframe] = useState("This Week");
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate chart data strictly from user's actual expenses
  const { chartData, totalInView } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeframe === "This Week") {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];

      // Calculate start of current week (Monday)
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);

      let sum = 0;
      expenses.forEach((exp) => {
        const d = new Date(exp.date);
        d.setHours(0, 0, 0, 0);
        if (d >= startOfWeek) {
          const dayIdx = (d.getDay() + 6) % 7;
          const amt = Number(exp.amount) || 0;
          dayTotals[dayIdx] += amt;
          sum += amt;
        }
      });

      return {
        chartData: dayNames.map((name, idx) => ({
          name,
          amount: dayTotals[idx],
        })),
        totalInView: sum,
      };
    } else {
      // Monthly view: 4 weeks of the current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekNames = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const weekTotals = [0, 0, 0, 0];

      let sum = 0;
      expenses.forEach((exp) => {
        const d = new Date(exp.date);
        if (d >= startOfMonth && d.getMonth() === now.getMonth()) {
          const dateNum = d.getDate();
          const amt = Number(exp.amount) || 0;
          if (dateNum <= 7) weekTotals[0] += amt;
          else if (dateNum <= 14) weekTotals[1] += amt;
          else if (dateNum <= 21) weekTotals[2] += amt;
          else weekTotals[3] += amt;
          sum += amt;
        }
      });

      return {
        chartData: weekNames.map((name, idx) => ({
          name,
          amount: weekTotals[idx],
        })),
        totalInView: sum,
      };
    }
  }, [expenses, timeframe]);

  return (
    <div className="dashboard-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Expense Overview</h3>
        </div>

        <div className="chart-actions">
          <div className="dropdown-container">
            <button
              className="chart-timeframe-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{timeframe}</span>
              <ChevronDown size={14} />
            </button>

            {showDropdown && (
              <div className="dropdown-menu range-menu animate-fade-in">
                {["This Week", "This Month"].map((tf) => (
                  <button
                    key={tf}
                    className={`dropdown-item ${timeframe === tf ? "active" : ""}`}
                    onClick={() => {
                      setTimeframe(tf);
                      setShowDropdown(false);
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-body">
        {expenses.length === 0 ? (
          <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--bg-app)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              marginBottom: 8,
            }}>
              <BarChart2 size={18} />
            </div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No Spending Logged</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Your spending timeline will visualize here once you add expenses.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={<CustomTooltip currencySymbol={settings.currencySymbol} />}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#emeraldGradient)"
                activeDot={{
                  r: 6,
                  fill: "#10B981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
