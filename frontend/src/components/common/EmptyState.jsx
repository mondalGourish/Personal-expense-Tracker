import React from "react";
import { Receipt, Search, Plus } from "lucide-react";
import { Button } from "./Button";
import "./EmptyState.css";

export const EmptyState = ({
  icon: Icon = Receipt,
  title = "No expenses found",
  description = "You haven't recorded any expenses yet. Start tracking your spending by adding an expense.",
  actionText = "Add Expense",
  onAction,
}) => {
  return (
    <div className="empty-state-container animate-fade-in">
      <div className="empty-state-icon-wrapper">
        <Icon size={32} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" icon={Plus} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
