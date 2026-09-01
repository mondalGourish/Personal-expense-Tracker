import React, { useState, useMemo } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { formatCurrency } from "../data/mockExpenses";
import { ExpenseFilters } from "../components/expenses/ExpenseFilters";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { Plus, Download, Receipt } from "lucide-react";
import "./Expenses.css";

export const Expenses = () => {
  const { expenses, settings, setIsAddModalOpen } = useExpenses();

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  // Check if any filters are currently active
  const hasActiveFilters = Boolean(
    search ||
      selectedCategory !== "All" ||
      selectedDateRange !== "All" ||
      minAmount ||
      maxAmount ||
      sortBy !== "date-desc"
  );

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedDateRange("All");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date-desc");
  };

  // Filter and sort the expenses
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (exp) =>
          exp.description.toLowerCase().includes(term) ||
          exp.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter((exp) => exp.category === selectedCategory);
    }

    // Date range filter
    if (selectedDateRange !== "All") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      list = list.filter((exp) => {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);

        if (selectedDateRange === "today") {
          return expDate.getTime() === today.getTime();
        }

        if (selectedDateRange === "this_week") {
          const day = today.getDay();
          const diffToMonday = (day === 0 ? -6 : 1) - day;
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() + diffToMonday);
          return expDate >= startOfWeek;
        }

        if (selectedDateRange === "this_month") {
          return (
            expDate.getMonth() === today.getMonth() &&
            expDate.getFullYear() === today.getFullYear()
          );
        }

        if (selectedDateRange === "last_month") {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return (
            expDate.getMonth() === lastMonth.getMonth() &&
            expDate.getFullYear() === lastMonth.getFullYear()
          );
        }

        return true;
      });
    }

    // Amount min/max filter
    if (minAmount) {
      list = list.filter((exp) => Number(exp.amount) >= Number(minAmount));
    }
    if (maxAmount) {
      list = list.filter((exp) => Number(exp.amount) <= Number(maxAmount));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      }
      if (sortBy === "amount-desc") {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === "amount-asc") {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return list;
  }, [expenses, search, selectedCategory, selectedDateRange, minAmount, maxAmount, sortBy]);

  // Compute total filtered amount
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [filteredExpenses]);

  return (
    <div className="expenses-page animate-fade-in">
      {/* Top Header Row */}
      <div className="page-header-row">
        <div>
          <h2 className="page-heading">Expenses</h2>
          <p className="page-subheading">
            Manage, filter, and track all your recorded transactions.
          </p>
        </div>

        <div className="page-actions-group">
          <div className="total-expense-pill">
            <span className="pill-label">Total Filtered:</span>
            <span className="pill-amount">
              {formatCurrency(filteredTotal, settings.currencySymbol)}
            </span>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Expense List or Empty State */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses match your filters"
          description={
            hasActiveFilters
              ? "Try adjusting or resetting your search and filter criteria to view more expenses."
              : "No expenses recorded yet. Click below to add your first expense."
          }
          actionText={hasActiveFilters ? "Reset Filters" : "Add Expense"}
          onAction={hasActiveFilters ? handleResetFilters : () => setIsAddModalOpen(true)}
        />
      ) : (
        <ExpenseTable expenses={filteredExpenses} />
      )}
    </div>
  );
};
