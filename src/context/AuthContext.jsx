import { createContext, useContext, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("dct_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (data) => {
    const userData = data.user || data;
    const token    = data.access_token;
    // Save to localStorage FIRST (synchronously) before setting state
    localStorage.setItem("dct_user", JSON.stringify(userData));
    if (token) localStorage.setItem("dct_access_token", token);
    setUser(userData);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("dct_user");
    localStorage.removeItem("dct_access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }