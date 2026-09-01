import React, { useState } from "react";
import {
  Calendar,
  Bell,
  ChevronDown,
  Menu,
  Check,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import "./Header.css";

export const Header = ({ onToggleSidebar }) => {
  const { user } = useExpenses();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRange, setSelectedRange] = useState("This Week");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const notifications = [
    {
      id: 1,
      title: "Budget Alert",
      text: "You have used 86% of your weekly budget.",
      time: "10m ago",
      type: "warning",
    },
    {
      id: 2,
      title: "Monthly Summary Ready",
      text: "Your August expense report is ready to download.",
      time: "2h ago",
      type: "info",
    },
    {
      id: 3,
      title: "New Category Added",
      text: "Education category limit has been set to ₹2,000.",
      time: "1d ago",
      type: "success",
    },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-greeting-wrapper">
          <h1 className="header-title">
            {getGreeting()}, {user.name}! <span className="greeting-wave">👋</span>
          </h1>
          <p className="header-subtitle">
            Here's what's happening with your finances today.
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Date Range Selector Dropdown */}
        <div className="dropdown-container">
          <button
            className="date-range-btn"
            onClick={() => setShowRangeDropdown(!showRangeDropdown)}
          >
            <Calendar size={16} className="date-icon" />
            <span className="date-text">{selectedRange}</span>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          {showRangeDropdown && (
            <div className="dropdown-menu range-menu animate-fade-in">
              {["Today", "This Week", "This Month", "Last Month", "This Year"].map(
                (range) => (
                  <button
                    key={range}
                    className={`dropdown-item ${selectedRange === range ? "active" : ""}`}
                    onClick={() => {
                      setSelectedRange(range);
                      setShowRangeDropdown(false);
                    }}
                  >
                    <span>{range}</span>
                    {selectedRange === range && <Check size={14} />}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="dropdown-container">
          <button
            className="icon-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge" />
          </button>

          {showNotifications && (
            <div className="dropdown-menu notifications-menu animate-fade-in">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                <span className="badge-count">3 New</span>
              </div>
              <div className="notifications-list">
                {notifications.map((n) => (
                  <div key={n.id} className="notification-item">
                    <div className={`notification-dot dot-${n.type}`} />
                    <div className="notification-content">
                      <div className="notification-title-row">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      <p className="notif-text">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="dropdown-container">
          <button
            className="user-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar">
              <span>{user.name.charAt(0)}</span>
            </div>
            <div className="user-info-text">
              <span className="user-name">{user.name}</span>
            </div>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu profile-menu animate-fade-in">
              <div className="profile-dropdown-header">
                <div className="user-avatar lg">
                  <span>{user.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="profile-name">{user.name}</div>
                  <div className="profile-email">{user.email}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  window.location.hash = "#/settings";
                }}
              >
                <User size={16} />
                <span>Account Settings</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                }}
              >
                <ShieldCheck size={16} />
                <span>Privacy & Security</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
