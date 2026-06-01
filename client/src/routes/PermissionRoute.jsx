import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PermissionRoute({ children, pagina }) {
  const { user, canAccess, loading } = useAuth();

  // Freno de renderizado mientras se valida el token local al cargar la app
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6b7280" }}>
        <span>Verificando credenciales...</span>
      </div>
    );
  }

  // Si no hay usuario en el contexto, directo a loguearse
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // El Administrador (idRol: 1) pasa directo siempre
  if (user.idRol === 1) return children; 

  // Consultamos la única fuente de verdad (el método canAccess del Contexto)
  if (canAccess && canAccess(pagina)) {
    return children;
  }

  // Si no pasó ninguna validación: Al calabozo de sin permiso directamente
  return <Navigate to="/sin-permiso" replace />;
}