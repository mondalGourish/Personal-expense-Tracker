import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import "./SummaryCard.css";

export const SummaryCard = ({
  title,
  value,
  change,
  isPositive = true,
  period = "vs last week",
  icon: Icon,
  iconBg = "#EDE9FE",
  iconColor = "#7C3AED",
}) => {
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div
          className="summary-icon-container"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {Icon && <Icon size={22} />}
        </div>
      </div>

      <div className="summary-card-content">
        <span className="summary-card-title">{title}</span>
        <h3 className="summary-card-value">{value}</h3>

        {change !== undefined && (
          <div className="summary-trend">
            <span className={`trend-badge ${isPositive ? "trend-up" : "trend-down"}`}>
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{change}</span>
            </span>
            <span className="trend-period">{period}</span>
          </div>
        )}
      </div>
    </div>
  );
};
