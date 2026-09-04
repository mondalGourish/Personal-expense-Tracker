import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True during initial session check
  const [authError, setAuthError] = useState(null); // Set when backend is unreachable or 500 error occurs

  // On mount: restore session if a previous session flag was set
  const restoreSession = useCallback(async () => {
    if (!localStorage.getItem("has_session")) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      const currentUser = await authService.getMe();
      if (currentUser) {
        setUser(currentUser);
      } else {
        localStorage.removeItem("has_session");
        setUser(null);
      }
      setAuthError(null);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("has_session");
        setUser(null);
      } else {
        // Network or 500 server error — preserve error state so user knows server is down
        console.error("Session restoration failed due to connection error:", err.message);
        setAuthError(err.message || "Failed to reach server");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem("has_session", "true");
    if (data?.data?.token) {
      localStorage.setItem("auth_token", data.data.token);
    }
    setUser(data.data.user);
    setAuthError(null);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register(name, email, password);
    // Note: Do not establish session until email is verified
    setAuthError(null);
    return data;
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    const res = await authService.verifyEmail(email, otp);
    if (res?.data?.user) {
      localStorage.setItem("has_session", "true");
      if (res.data.token) {
        localStorage.setItem("auth_token", res.data.token);
      }
      setUser(res.data.user);
    }
    setAuthError(null);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout request failed, clearing local state:", err.message);
    } finally {
      localStorage.removeItem("has_session");
      localStorage.removeItem("auth_token");
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
        verifyEmail,
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
