import { createContext, useContext, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

function normalizeAuthData(data) {
  const userData = data?.user || data || null;

  // Login returns access_token, register returns accessToken.
  // Save both formats safely.
  const token = data?.access_token || data?.accessToken || data?.token || "";

  return { userData, token };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("dct_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
    const { userData, token } = normalizeAuthData(data);

    if (userData) {
      localStorage.setItem("dct_user", JSON.stringify(userData));
      setUser(userData);
    }

    if (token) {
      localStorage.setItem("dct_access_token", token);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}

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

export function useAuth() {
  return useContext(AuthContext);
}
