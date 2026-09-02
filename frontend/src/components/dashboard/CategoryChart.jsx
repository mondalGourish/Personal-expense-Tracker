import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { useExpenses } from "../../context/ExpenseContext";
import { formatCurrency, getCategoryMeta } from "../../data/mockExpenses";
import { PieChart as PieIcon } from "lucide-react";
import "./CategoryChart.css";

export const CategoryChart = () => {
  const { expenses, settings } = useExpenses();

  // Aggregate category data strictly from user's actual expenses
  const categoryData = useMemo(() => {
    const map = {};
    let total = 0;

    expenses.forEach((exp) => {
      const cat = exp.category || "Other";
      map[cat] = (map[cat] || 0) + Number(exp.amount);
      total += Number(exp.amount);
    });

    if (total === 0) {
      return { total: 0, items: [] };
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

      {categoryData.items.length === 0 ? (
        <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
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
            <PieIcon size={18} />
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No Category Data</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Expenses will automatically break down by category as you add them.</p>
        </div>
      ) : (
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

          {/* Legend on the right */}
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
      )}
    </div>
  );
};
