import React from "react";
import { TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import "./SummaryCard.css";

export const SummaryCard = ({
  title,
  value,
  change,
  isPositive = true,
  trendStatus, // optional: "success" | "warning" | "danger" | "neutral"
  period = "vs last week",
  icon: Icon,
  iconBg = "#D1FAE5",
  iconColor = "#10B981",
}) => {
  // Determine badge styling based on trendStatus or isPositive
  const statusClass =
    trendStatus === "danger"
      ? "trend-down"
      : trendStatus === "warning"
      ? "trend-warning"
      : trendStatus === "success"
      ? "trend-up"
      : trendStatus === "neutral"
      ? "trend-neutral"
      : isPositive
      ? "trend-up"
      : "trend-down";

  const renderIcon = () => {
    if (trendStatus === "danger") return <AlertCircle size={13} />;
    if (trendStatus === "warning") return <AlertTriangle size={13} />;
    if (trendStatus === "success") return <CheckCircle2 size={13} />;
    return isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />;
  };

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
            <span className={`trend-badge ${statusClass}`}>
              {renderIcon()}
              <span>{change}</span>
            </span>
            {period && <span className="trend-period">{period}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
