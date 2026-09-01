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
import { ChevronDown } from "lucide-react";
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

  // Generate chart data based on expenses
  const chartData = useMemo(() => {
    if (timeframe === "This Week") {
      const days = ["May 18", "May 19", "May 20", "May 21", "May 22", "May 23", "May 24"];
      const baseValues = [1200, 1850, 1600, 2450, 1400, 1750, 950];

      // Blend in actual expenses if any
      return days.map((day, idx) => ({
        name: day,
        amount: baseValues[idx] + (expenses[idx] ? expenses[idx].amount * 0.4 : 0),
      }));
    } else {
      // Monthly view
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const baseValues = [8400, 12600, 15400, 8830];
      return weeks.map((w, idx) => ({
        name: w,
        amount: baseValues[idx],
      }));
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
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
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
              stroke="#7C3AED"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleGradient)"
              activeDot={{
                r: 6,
                fill: "#7C3AED",
                stroke: "#ffffff",
                strokeWidth: 2,
                boxShadow: "0 0 10px rgba(124, 58, 237, 0.5)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
