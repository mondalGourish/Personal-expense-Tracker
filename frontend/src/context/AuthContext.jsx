import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True during initial session check
  const [authError, setAuthError] = useState(null); // Set when backend is unreachable or 500 error occurs

  // On mount: restore session from HTTP-only cookie
  const restoreSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser); // null if 401 unauthenticated
      setAuthError(null);
    } catch (err) {
      // Network or 500 server error — preserve error state so user knows server is down
      console.error("Session restoration failed due to connection error:", err.message);
      setAuthError(err.message || "Failed to reach server");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.data.user);
    setAuthError(null);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.data.user);
    setAuthError(null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout request failed, clearing local state:", err.message);
    } finally {
      setUser(null);
      setAuthError(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        retryAuth: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
