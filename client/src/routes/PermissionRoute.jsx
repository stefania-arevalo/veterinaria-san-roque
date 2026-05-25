import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PermissionRoute({ children, pagina }) {
  const { user, canAccess, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (user.idRol === 1) return children; // Admin siempre pasa

  // ── Acceso automático por rol (sin necesitar permiso en BD) ──
  // Basado en tu tabla de permisos del informe:
  const accesoPorRol = {
    citas:             [2, 3],
    clientes:          [2, 3, 4],
    pacientes:         [2, 3],
    historial_clinico: [2],
    tratamientos:      [2, 3],
    ventas:            [3, 4],
    compras:           [3, 4],
    productos:        [3, 4],
    configuracion:     [],
  };

  if (accesoPorRol[pagina]?.includes(Number(user.idRol))) return children;

  // Si no está en accesoPorRol, necesita permiso explícito de BD
  // (útil para roles que el admin habilita manualmente desde PermissionsPage)
  if (!canAccess(pagina)) return <Navigate to="/sin-permiso" replace />;

  return children;
}