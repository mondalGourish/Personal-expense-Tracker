/**
 * Category Metadata & Utility Helpers for Expense Tracker
 */

export const CATEGORIES = [
  { id: "Food", name: "Food", icon: "Utensils", color: "#10B981", bg: "#D1FAE5", border: "#A7F3D0" },
  { id: "Groceries", name: "Groceries", icon: "ShoppingBag", color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" },
  { id: "Transport", name: "Transport", icon: "Car", color: "#0EA5E9", bg: "#E0F2FE", border: "#BAE6FD" },
  { id: "Bills", name: "Bills", icon: "Zap", color: "#F43F5E", bg: "#FFE4E6", border: "#FECDD3" },
  { id: "Shopping", name: "Shopping", icon: "ShoppingBag", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  { id: "Health", name: "Health", icon: "PlusCircle", color: "#14B8A6", bg: "#CCFBF1", border: "#99F6E4" },
  { id: "Education", name: "Education", icon: "BookOpen", color: "#6366F1", bg: "#E0E7FF", border: "#C7D2FE" },
  { id: "Other", name: "Other", icon: "Tag", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
];

/**
 * Helper to format currency numbers into ₹12,450.00
 */
export const formatCurrency = (amount, symbol = "₹") => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0.00`;
  return `${symbol}${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format readable dates e.g. "May 24, 2025" or "Today"
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Get category configuration object
 */
export const getCategoryMeta = (categoryName) => {
  return (
    CATEGORIES.find((cat) => cat.name.toLowerCase() === (categoryName || "").toLowerCase()) || {
      id: "Other",
      name: categoryName || "Other",
      icon: "Tag",
      color: "#64748B",
      bg: "#F1F5F9",
      border: "#E2E8F0",
    }
  );
};
