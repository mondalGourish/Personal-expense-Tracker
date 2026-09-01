import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_EXPENSES, INITIAL_BUDGET, getCategoryMeta } from "../data/mockExpenses";

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // State for expenses list
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);

  // State for budget configuration
  const [budget, setBudget] = useState(INITIAL_BUDGET);

  // User Profile State
  const [user, setUser] = useState({
    name: "Aman",
    email: "aman.dev@example.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Premium Member",
  });

  // Settings State
  const [settings, setSettings] = useState({
    currency: "INR",
    currencySymbol: "₹",
    theme: "light",
    notifications: {
      budgetAlerts: true,
      weeklySummary: true,
      billReminders: false,
    },
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Toggle Theme
  const toggleTheme = () => {
    setSettings((prev) => {
      const nextTheme = prev.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      return { ...prev, theme: nextTheme };
    });
  };

  // Set specific theme
  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    setSettings((prev) => ({ ...prev, theme }));
  };

  // Add Expense
  const addExpense = (newExpenseData) => {
    const newExpense = {
      id: `exp-${Date.now()}`,
      ...newExpenseData,
      amount: Number(newExpenseData.amount),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Added ${newExpense.category} expense of ${settings.currencySymbol}${newExpense.amount}!`);
    return newExpense;
  };

  // Edit Expense
  const editExpense = (id, updatedData) => {
    setExpenses((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedData,
              amount: Number(updatedData.amount),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    showToast("Expense updated successfully!");
  };

  // Delete Expense
  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    showToast("Expense deleted", "info");
  };

  // Update Budget Limits
  const updateBudget = (updatedBudget) => {
    setBudget((prev) => ({ ...prev, ...updatedBudget }));
    showToast("Budget limits updated successfully!");
  };

  // Quick Modal State for Add Expense
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        budget,
        user,
        settings,
        toast,
        isAddModalOpen,
        setIsAddModalOpen,
        showToast,
        toggleTheme,
        setTheme,
        addExpense,
        editExpense,
        deleteExpense,
        updateBudget,
        setUser,
        setSettings,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
