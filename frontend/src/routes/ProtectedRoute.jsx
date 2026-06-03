import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function loginPathFor(role) {
  return normalizeRole(role) === "admin" ? "/admin/login" : "/auth/login";
}

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { getUserForRole } = useAuth();
  const allowedRoles = (roles || []).map(normalizeRole);
  const primaryRole = allowedRoles[0] || "student";
  const user = getUserForRole(primaryRole);

  if (!user) {
    return <Navigate to={loginPathFor(primaryRole)} replace state={{ from: location.pathname }} />;
  }

  const userRole = normalizeRole(user.role);

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    const redirects = {
      student: "/student/courses",
      tutor: "/tutor/dashboard",
      admin: "/admin/dashboard",
    };
    return <Navigate to={redirects[userRole] || loginPathFor(primaryRole)} replace />;
  }

  return children;
}
