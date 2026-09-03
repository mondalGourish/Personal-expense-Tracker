import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as expenseService from "../services/expense.service";
import * as budgetService from "../services/budget.service";

const ExpenseContext = createContext();

const currencySymbolMap = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const getInitialTheme = () => {
  try {
    return localStorage.getItem("expense_track_theme") || "light";
  } catch (e) {
    return "light";
  }
};

export const ExpenseProvider = ({ children }) => {
  // Expenses — populated from real API
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState(null);

  // Budget — null when not configured on backend, populated when configured
  const [budget, setBudgetState] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState(null);

  // UI settings — theme persisted in localStorage, currency synced from user's budget
  const [settings, setSettings] = useState(() => {
    const theme = getInitialTheme();
    return {
      currency: "INR",
      currencySymbol: "₹",
      theme,
      notifications: {
        budgetAlerts: true,
        weeklySummary: true,
      },
    };
  });

  // Apply theme to document on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Quick-add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────

  /**
   * Load expenses from the backend.
   * Requests limit: 100 to strictly respect backend max allowable query limit.
   */
  const loadExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      setExpensesError(null);
      const response = await expenseService.getExpenses({ limit: 100 });
      setExpenses(response.data || []);
      setExpensesError(null);
    } catch (err) {
      console.error("Failed to load expenses:", err.message);
      setExpensesError(err.message || "Failed to load expenses");
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  /** Load budget configuration from the backend */
  const loadBudget = useCallback(async () => {
    try {
      setBudgetLoading(true);
      setBudgetError(null);
      const response = await budgetService.getBudget();
      if (response && response.data) {
        const curr = response.data.currency || "INR";
        setBudgetState({
          weeklyBudget: response.data.weeklyBudget,
          monthlyBudget: response.data.monthlyBudget,
          alertThreshold: response.data.alertThreshold || 80,
          currency: curr,
          categoryBudgets: response.data.categoryBudgets
            ? response.data.categoryBudgets instanceof Map
              ? Object.fromEntries(response.data.categoryBudgets)
              : response.data.categoryBudgets
            : {},
        });
        // Keep UI currency in sync with single source of truth from budget
        setSettings((prev) => ({
          ...prev,
          currency: curr,
          currencySymbol: currencySymbolMap[curr] || "₹",
        }));
      } else {
        // Honest null state: user has not configured a budget yet
        setBudgetState(null);
      }
      setBudgetError(null);
    } catch (err) {
      console.error("Failed to load budget:", err.message);
      setBudgetError(err.message || "Failed to load budget configuration");
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  // Load data when provider mounts
  useEffect(() => {
    loadExpenses();
    loadBudget();
  }, [loadExpenses, loadBudget]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Theme ─────────────────────────────────────────────────────────────────

  const toggleTheme = () => {
    setSettings((prev) => {
      const nextTheme = prev.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      try {
        localStorage.setItem("expense_track_theme", nextTheme);
      } catch (e) {}
      return { ...prev, theme: nextTheme };
    });
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("expense_track_theme", theme);
    } catch (e) {}
    setSettings((prev) => ({ ...prev, theme }));
  };

  // ── Expense CRUD (real API) ───────────────────────────────────────────────

  const addExpense = async (newExpenseData) => {
    const response = await expenseService.createExpense({
      amount: Number(newExpenseData.amount),
      category: newExpenseData.category,
      description: newExpenseData.description || "",
      date: newExpenseData.date || new Date().toISOString().split("T")[0],
    });
    const created = response.data.expense;
    setExpenses((prev) => [created, ...prev]);
    showToast(`Added ${created.category} expense of ${settings.currencySymbol}${created.amount}!`);
    return created;
  };

  const editExpense = async (id, updatedData) => {
    const response = await expenseService.updateExpense(id, {
      amount: updatedData.amount !== undefined ? Number(updatedData.amount) : undefined,
      category: updatedData.category,
      description: updatedData.description,
      date: updatedData.date,
    });
    const updated = response.data.expense;
    setExpenses((prev) =>
      prev.map((item) => (item._id === id ? updated : item))
    );
    showToast("Expense updated successfully!");
    return updated;
  };

  const deleteExpense = async (id) => {
    await expenseService.deleteExpense(id);
    setExpenses((prev) => prev.filter((item) => item._id !== id));
    showToast("Expense deleted", "info");
  };

  // ── Budget (real API) ─────────────────────────────────────────────────────

  const updateBudget = async (updatedBudget) => {
    const targetCurrency = updatedBudget.currency || settings.currency;
    const payload = {
      weeklyBudget: Number(updatedBudget.weeklyBudget),
      monthlyBudget: Number(updatedBudget.monthlyBudget),
      alertThreshold: Number(updatedBudget.alertThreshold || 80),
      currency: targetCurrency,
      categoryBudgets: updatedBudget.categoryBudgets || {},
    };
    const response = await budgetService.setBudget(payload);
    const saved = response.data.budget;
    setBudgetState({
      weeklyBudget: saved.weeklyBudget,
      monthlyBudget: saved.monthlyBudget,
      alertThreshold: saved.alertThreshold,
      currency: saved.currency || "INR",
      categoryBudgets: saved.categoryBudgets
        ? saved.categoryBudgets instanceof Map
          ? Object.fromEntries(saved.categoryBudgets)
          : saved.categoryBudgets
        : {},
    });
    setSettings((prev) => ({
      ...prev,
      currency: saved.currency || "INR",
      currencySymbol: currencySymbolMap[saved.currency] || "₹",
    }));
    showToast("Budget limits updated successfully!");
    return saved;
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        expensesLoading,
        expensesError,
        budget,
        budgetLoading,
        budgetError,
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
        setSettings,
        loadExpenses,
        loadBudget,
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
