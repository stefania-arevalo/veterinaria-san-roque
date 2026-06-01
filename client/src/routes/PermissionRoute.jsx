import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PermissionRoute({ children, pagina }) {
  const { user, canAccess, loading } = useAuth();

  // Mientras el contexto inicializa el token y los permisos, frenamos el render
  // para que ningún componente hijo intente disparar redirecciones raras.
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6b7280" }}>
        <span>Verificando credenciales...</span>
      </div>
    );
  }

  // Si no hay usuario logueado, directo al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 1️⃣ El Administrador (idRol: 1) tiene las llaves de toda la casa
  if (user.idRol === 1) return children; 

  // 2️⃣ Matriz de accesos automáticos estricta (Basada 100% en tu tabla)
  // Roles: 2 = Veterinario, 3 = Asistente, 4 = Vendedor
  const accesoPorRol = {
    ventas:            [3, 4],    // Admin, Asistente y Vendedor
    compras:           [3, 4],    // Admin, Asistente y Vendedor
    clientes:          [2, 3, 4], // Todo el staff tiene acceso
    citas:             [2, 3],    // Admin, Vet y Asistente (Vendedor N/A)
    pacientes:         [2, 3, 4], // Todo el staff puede ver pacientes
    historial_clinico: [2],       // ⚠️ Solo Veterinario puede entrar a esta sección
    productos:         [2, 3, 4], // Todo el staff puede ver el Inventario (Solo ver o Gestionar)
    tratamientos:      [2, 3],    // Admin, Vet y Asistente
    
    // 🚫 Secciones EXCLUSIVAS de Admin (Nadie del staff pasa automáticamente)
    configuracion:     [],
    usuarios:          [],
    reportes:          []
  };

  // Si el rol del usuario está autorizado para esta página, entra directo
  if (accesoPorRol[pagina]?.includes(Number(user.idRol))) {
    return children;
  }

  // 3️⃣ Si no tiene acceso automático, revisamos si el Admin le dio un permiso especial en la BD
  if (canAccess && canAccess(pagina)) {
    return children;
  }

  // 4️⃣ Si fallan todos los controles anteriores: Al calabozo (Redirección limpia a /sin-permiso)
  return <Navigate to="/sin-permiso" replace />;
}