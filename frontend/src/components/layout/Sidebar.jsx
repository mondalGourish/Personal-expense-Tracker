import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import "./Sidebar.css";

export const Sidebar = ({ isOpen, onClose }) => {
  const { settings, toggleTheme } = useExpenses();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Expenses", path: "/expenses", icon: Receipt },
    { label: "Add Expense", path: "/add-expense", icon: PlusCircle },
    { label: "Reports", path: "/reports", icon: BarChart3 },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Wallet size={22} />
          </div>
          <span className="brand-title">ExpenseTrack</span>

          {/* Close button for mobile */}
          <button className="sidebar-mobile-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? "active" : ""}`
                }
                onClick={onClose}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme Toggle */}
        <div className="sidebar-footer">
          <div className="theme-toggle-row">
            <div className="theme-label">
              {settings.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              <span>Dark Mode</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.theme === "dark"}
                onChange={toggleTheme}
              />
              <span className="slider round" />
            </label>
          </div>
        </div>
      </aside>
    </>
  );
};
