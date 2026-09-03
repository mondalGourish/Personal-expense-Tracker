import React, { useState } from "react";
import {
  Calendar,
  Bell,
  ChevronDown,
  Menu,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Formatted current date for display
  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Display name from real authenticated user
  const displayName = user?.name || "there";

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate("/login", { replace: true });
  };

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
            {getGreeting()}, {displayName}! <span className="greeting-wave">👋</span>
          </h1>
          <p className="header-subtitle">
            Here's what's happening with your finances today.
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Today's Date Badge — clean, authentic indicator */}
        <div className="header-date-badge" title="Today's Date">
          <Calendar size={15} className="date-icon" />
          <span className="date-text">{currentDateFormatted}</span>
        </div>

        {/* Notifications Bell - visual status indicator */}
        <div
          className="header-notif-indicator"
          title="Notifications (No unread alerts)"
          aria-label="No unread notifications"
        >
          <Bell size={18} />
        </div>

        {/* User Profile */}
        <div className="dropdown-container">
          <button
            className="user-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-label="User account menu"
          >
            <div className="user-avatar">
              <span>{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-info-text">
              <span className="user-name">{displayName}</span>
            </div>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu profile-menu animate-fade-in">
              <div className="profile-dropdown-header">
                <div className="user-avatar lg">
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="profile-text-group">
                  <div className="profile-name">{user?.name}</div>
                  <div className="profile-email">{user?.email}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/settings");
                }}
              >
                <User size={16} />
                <span>Account Settings</span>
              </button>
              <button
                className="dropdown-item danger-item"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
