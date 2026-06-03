import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { authApi, getRoleUser, saveRoleSession, clearRoleSession, ROLE_KEYS } from "../services/api";

const AuthContext = createContext(null);

function normalizeAuthData(data) {
  const userData = data?.user || data || null;
  const token = data?.access_token || data?.accessToken || data?.token || "";
  return { userData, token };
}

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function roleFromPath(pathname = "") {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/tutor")) return "tutor";
  if (pathname.startsWith("/student")) return "student";
  return "student";
}

function loadUsers() {
  return {
    admin: getRoleUser("admin"),
    tutor: getRoleUser("tutor"),
    student: getRoleUser("student"),
  };
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const activeRole = roleFromPath(location.pathname);
  const [users, setUsers] = useState(loadUsers);

  const reloadAuth = () => setUsers(loadUsers());

  useEffect(() => {
    reloadAuth();
  }, [location.pathname]);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key) return;
      const authKeys = Object.values(ROLE_KEYS).flatMap((item) => [item.userKey, item.tokenKey]);
      if (authKeys.includes(event.key)) reloadAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (data, forcedRole) => {
    const { userData, token } = normalizeAuthData(data);
    const role = normalizeRole(forcedRole || userData?.role);

    if (!userData || !token || !ROLE_KEYS[role]) {
      throw new Error("Invalid login response. Please try again.");
    }

    saveRoleSession(role, userData, token);
    reloadAuth();
    return { role, user: userData, token };
  };

  const logout = async (role = activeRole) => {
    const normalizedRole = normalizeRole(role);
    try {
      await authApi.logout(normalizedRole);
    } catch {}
    clearRoleSession(normalizedRole);
    reloadAuth();
  };

  const getUserForRole = (role) => users[normalizeRole(role)] || null;

  const value = useMemo(() => ({
    user: users[activeRole] || null,
    users,
    activeRole,
    login,
    logout,
    getUserForRole,
    reloadAuth,
  }), [users, activeRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
