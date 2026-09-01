import React from "react";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { CATEGORIES } from "../../data/mockExpenses";
import "./ExpenseFilters.css";

export const ExpenseFilters = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedDateRange,
  setSelectedDateRange,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  sortBy,
  setSortBy,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <div className="expense-filters-card">
      <div className="filters-grid">
        {/* Search Field */}
        <div className="filter-item search-filter">
          <div className="filter-input-wrapper">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search expenses, notes, or merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="filter-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-item">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="filter-item">
          <select
            className="filter-select"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
          >
            <option value="All">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="filter-item">
          <div className="filter-sort-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              className="filter-select sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <div className="filter-item reset-filter-item">
            <button className="btn-reset-filters" onClick={onReset}>
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
