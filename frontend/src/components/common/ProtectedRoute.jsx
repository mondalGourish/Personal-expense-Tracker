import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "./Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Wraps protected routes — redirects unauthenticated users to /login.
 * Displays loading spinner during session restoration, and retry UI if backend connection failed.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authError, retryAuth } = useAuth();

  // While checking session cookie, render loading spinner
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-app)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid var(--border-color)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If session check failed due to server/network outage (not 401), show retry screen
  if (authError && !isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: 24,
          background: "var(--bg-app)",
          color: "var(--text-primary)",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--danger-bg, #fef2f2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger, #ef4444)",
          }}
        >
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Connection Error</h2>
        <p style={{ maxWidth: 400, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {authError || "Unable to reach the server. Please check your backend connection."}
        </p>
        <Button variant="primary" icon={RefreshCw} onClick={retryAuth}>
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
