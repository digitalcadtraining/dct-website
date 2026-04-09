import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  // Check both React state AND localStorage (handles timing issue on navigate)
  const { user: ctxUser } = useAuth();
  const user = ctxUser || (() => {
    try { return JSON.parse(localStorage.getItem("dct_user")); } catch { return null; }
  })();

  if (!user) return <Navigate to="/auth/login" replace />;

  const userRole     = user.role?.toUpperCase();
  const allowedRoles = roles?.map(r => r.toUpperCase());

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const redirects = {
      STUDENT: "/student/courses",
      TUTOR:   "/tutor/dashboard",
      ADMIN:   "/admin/dashboard",
    };
    return <Navigate to={redirects[userRole] || "/auth/login"} replace />;
  }

  return children;
}