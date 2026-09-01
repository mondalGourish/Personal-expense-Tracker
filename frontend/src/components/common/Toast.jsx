import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import "./Toast.css";

export const Toast = () => {
  const { toast } = useExpenses();

  if (!toast) return null;

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    danger: AlertCircle,
    info: Info,
  };

  const IconComponent = icons[toast.type] || CheckCircle2;

  return (
    <div className={`toast-container toast-${toast.type || "success"} animate-fade-in`}>
      <IconComponent size={18} className="toast-icon" />
      <span className="toast-message">{toast.message}</span>
    </div>
  );
};
