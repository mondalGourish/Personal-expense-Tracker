import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../../data/mockExpenses";
import "./CategoryChart.css";

export const CategoryChart = () => {
  const { expenses, settings } = useExpenses();

  // Aggregate category data from actual expenses
  const categoryData = useMemo(() => {
    const map = {};
    let total = 0;

    expenses.forEach((exp) => {
      const cat = exp.category || "Other";
      map[cat] = (map[cat] || 0) + Number(exp.amount);
      total += Number(exp.amount);
    });

    // If empty, supply placeholder data matching mockup
    if (total === 0) {
      return {
        total: 12450,
        items: [
          { name: "Food", value: 3250, color: "#8B5CF6", percent: 26 },
          { name: "Transport", value: 2150, color: "#0EA5E9", percent: 17 },
          { name: "Shopping", value: 1980, color: "#10B981", percent: 16 },
          { name: "Bills", value: 1750, color: "#F43F5E", percent: 14 },
          { name: "Health", value: 1200, color: "#14B8A6", percent: 10 },
          { name: "Others", value: 2120, color: "#64748B", percent: 17 },
        ],
      };
    }

    const items = Object.entries(map).map(([category, amount]) => {
      const meta = getCategoryMeta(category);
      const percent = Math.round((amount / total) * 100);
      return {
        name: category,
        value: amount,
        color: meta.color,
        percent,
      };
    });

    // Sort largest to smallest
    items.sort((a, b) => b.value - a.value);

    return { total, items };
  }, [expenses]);

  return (
    <div className="category-chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Expenses by Category</h3>
        <Link to="/reports" className="view-all-link">
          View All
        </Link>
      </div>

      <div className="category-chart-content">
        {/* Donut Chart with Center Total */}
        <div className="donut-wrapper">
          <ResponsiveContainer width={190} height={190}>
            <PieChart>
              <Pie
                data={categoryData.items}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.items.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => formatCurrency(val, settings.currencySymbol)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center-label">
            <span className="donut-total">
              {formatCurrency(categoryData.total, settings.currencySymbol).split(".")[0]}
            </span>
            <span className="donut-sub">Total</span>
          </div>
        </div>

        {/* Legend on the right matching reference image */}
        <div className="category-legend-list">
          {categoryData.items.slice(0, 6).map((item) => (
            <div key={item.name} className="category-legend-row">
              <div className="legend-name-group">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-label">{item.name}</span>
              </div>
              <div className="legend-value-group">
                <span className="legend-amount">
                  {formatCurrency(item.value, settings.currencySymbol).split(".")[0]}
                </span>
                <span className="legend-percent">({item.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
