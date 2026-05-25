import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles: 1=Admin, 2=Veterinario, 3=Asistente, 4=Vendedor, 5=Cliente
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.idRol)) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}