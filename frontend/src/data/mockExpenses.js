/**
 * Mock Data for Expense Tracker
 * Separated cleanly from components so it can be easily replaced by backend APIs later.
 */

export const CATEGORIES = [
  { id: "Food", name: "Food", icon: "Utensils", color: "#8B5CF6", bg: "#EDE9FE", border: "#C4B5FD" },
  { id: "Groceries", name: "Groceries", icon: "ShoppingBag", color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" },
  { id: "Transport", name: "Transport", icon: "Car", color: "#0EA5E9", bg: "#E0F2FE", border: "#BAE6FD" },
  { id: "Bills", name: "Bills", icon: "Zap", color: "#F43F5E", bg: "#FFE4E6", border: "#FECDD3" },
  { id: "Shopping", name: "Shopping", icon: "ShoppingBag", color: "#10B981", bg: "#D1FAE5", border: "#A7F3D0" },
  { id: "Health", name: "Health", icon: "PlusCircle", color: "#14B8A6", bg: "#CCFBF1", border: "#99F6E4" },
  { id: "Education", name: "Education", icon: "BookOpen", color: "#6366F1", bg: "#E0E7FF", border: "#C7D2FE" },
  { id: "Other", name: "Other", icon: "Tag", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
];

export const INITIAL_BUDGET = {
  weeklyBudget: 5000,
  monthlyBudget: 20000,
  currency: "INR",
  currencySymbol: "₹",
  alertThreshold: 80,
  categoryBudgets: {
    Food: 5000,
    Transport: 3000,
    Shopping: 4000,
    Bills: 2500,
    Health: 2000,
    Groceries: 3500,
    Education: 2000,
    Other: 1500,
  },
};

// Generate realistic date strings relative to today
const getRelativeDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

export const INITIAL_EXPENSES = [
  {
    id: "exp-1",
    amount: 450,
    category: "Food",
    description: "Lunch at Cafe with team",
    date: getRelativeDate(0), // Today
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-2",
    amount: 120,
    category: "Transport",
    description: "Auto Rickshaw to office",
    date: getRelativeDate(0), // Today
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-3",
    amount: 850,
    category: "Groceries",
    description: "Weekly Grocery & Dairy items",
    date: getRelativeDate(1), // Yesterday
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-4",
    amount: 1250,
    category: "Bills",
    description: "Electricity Bill & Water utility",
    date: getRelativeDate(1),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-5",
    amount: 320,
    category: "Health",
    description: "Pharmacy Medicines & Vitamin supplements",
    date: getRelativeDate(2),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-6",
    amount: 2450,
    category: "Shopping",
    description: "New Sneakers & gym gear",
    date: getRelativeDate(3),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-7",
    amount: 600,
    category: "Food",
    description: "Weekend Family Dinner",
    date: getRelativeDate(4),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-8",
    amount: 350,
    category: "Transport",
    description: "Metro card recharge",
    date: getRelativeDate(5),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-9",
    amount: 1500,
    category: "Education",
    description: "Online Web Development Course subscription",
    date: getRelativeDate(6),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-10",
    amount: 500,
    category: "Bills",
    description: "High speed Broadband Internet",
    date: getRelativeDate(8),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-11",
    amount: 1800,
    category: "Food",
    description: "Monthly Dining & Groceries outing",
    date: getRelativeDate(10),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-12",
    amount: 950,
    category: "Shopping",
    description: "Office desk organizer & notebooks",
    date: getRelativeDate(12),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-13",
    amount: 880,
    category: "Health",
    description: "Dental checkup consultation",
    date: getRelativeDate(15),
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-14",
    amount: 400,
    category: "Other",
    description: "Movie tickets with friends",
    date: getRelativeDate(18),
    createdAt: new Date().toISOString(),
  },
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
