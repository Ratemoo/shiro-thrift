import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { isAdmin, isSuperAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/admin" replace />;

  return children;
}