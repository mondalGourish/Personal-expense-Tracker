import React from "react";
import {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  PlusCircle,
  BookOpen,
  Tag,
  DollarSign,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { getCategoryMeta } from "../../data/mockExpenses";
import "./CategoryIcon.css";

const ICON_MAP = {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  PlusCircle,
  BookOpen,
  Tag,
  DollarSign,
  Briefcase,
};

export const CategoryIcon = ({ category, size = "md", withBackground = true, className = "" }) => {
  const meta = getCategoryMeta(category);
  const IconComponent = ICON_MAP[meta.icon] || Tag;

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  if (!withBackground) {
    return (
      <IconComponent
        size={iconSizes[size] || 18}
        style={{ color: meta.color }}
        className={`category-icon-raw ${className}`}
      />
    );
  }

  return (
    <div
      className={`category-icon-wrapper category-icon-${size} ${className}`}
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
      }}
    >
      <IconComponent size={iconSizes[size] || 18} />
    </div>
  );
};

export const CategoryBadge = ({ category, showIcon = true, size = "sm" }) => {
  const meta = getCategoryMeta(category);

  return (
    <span
      className={`category-badge category-badge-${size}`}
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
      }}
    >
      {showIcon && <CategoryIcon category={category} size="sm" withBackground={false} />}
      <span>{meta.name}</span>
    </span>
  );
};
