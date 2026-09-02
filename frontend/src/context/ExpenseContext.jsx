import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { INITIAL_BUDGET, getCategoryMeta } from "../data/mockExpenses";
import * as expenseService from "../services/expense.service";
import * as budgetService from "../services/budget.service";

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // Expenses — populated from real API
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Budget — populated from real API, falls back to INITIAL_BUDGET defaults
  const [budget, setBudgetState] = useState(INITIAL_BUDGET);
  const [budgetLoading, setBudgetLoading] = useState(true);

  // UI settings (client-side only — currency, theme, notifications)
  const [settings, setSettings] = useState({
    currency: "INR",
    currencySymbol: "₹",
    theme: "light",
    notifications: {
      budgetAlerts: true,
      weeklySummary: true,
    },
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Quick-add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────

  /** Load all expenses from the backend */
  const loadExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const response = await expenseService.getExpenses({ limit: 200 });
      setExpenses(response.data || []);
    } catch (err) {
      console.error("Failed to load expenses:", err.message);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  /** Load budget configuration from the backend */
  const loadBudget = useCallback(async () => {
    try {
      setBudgetLoading(true);
      const response = await budgetService.getBudget();
      if (response.data) {
        // Map backend budget fields to local state
        setBudgetState((prev) => ({
          ...prev,
          weeklyBudget: response.data.weeklyBudget ?? prev.weeklyBudget,
          monthlyBudget: response.data.monthlyBudget ?? prev.monthlyBudget,
          alertThreshold: response.data.alertThreshold ?? prev.alertThreshold,
          currency: response.data.currency ?? prev.currency,
          categoryBudgets: response.data.categoryBudgets
            ? Object.fromEntries(response.data.categoryBudgets)
            : prev.categoryBudgets,
        }));
      }
    } catch (err) {
      console.error("Failed to load budget:", err.message);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  // Load data when provider mounts (user is already authenticated at this point)
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
      return { ...prev, theme: nextTheme };
    });
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
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
    const payload = {
      weeklyBudget: Number(updatedBudget.weeklyBudget),
      monthlyBudget: Number(updatedBudget.monthlyBudget),
      alertThreshold: Number(updatedBudget.alertThreshold || 80),
      currency: settings.currency,
    };
    const response = await budgetService.setBudget(payload);
    const saved = response.data.budget;
    setBudgetState((prev) => ({
      ...prev,
      weeklyBudget: saved.weeklyBudget,
      monthlyBudget: saved.monthlyBudget,
      alertThreshold: saved.alertThreshold,
    }));
    showToast("Budget limits updated successfully!");
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        expensesLoading,
        budget,
        budgetLoading,
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
