import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { loginApi, refreshTokenApi } from "../api/auth";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

// ── Matriz de Seguridad Máxima por Rol ──────────────────
// Roles: 1 = Admin, 2 = Veterinario, 3 = Asistente, 4 = Vendedor, 5 = Cliente
// Define qué secciones TIENEN PERMITIDO existir para cada rol.
const ACCESO_POR_ROL = {
  ventas:            [3, 4],    // Asistente y Vendedor
  compras:           [3, 4],    // Asistente y Vendedor
  clientes:          [2, 3, 4], // Todo el staff
  citas:             [2, 3],    // Vet y Asistente
  pacientes:         [2, 3, 4], // Todo el staff
  historial_clinico: [2],       // ⚠️ SOLO Veterinario
  inventario:         [2, 3, 4], // Todo el staff (Inventario)
  configuracion:     [],        // Exclusivo Admin
  usuarios:          [],        // Exclusivo Admin
  permisos:          [],        // Exclusivo Admin
  reportes:          [],        
};

export function AuthProvider({ children }) {
  const [user,       setUser]     = useState(null);
  const [permisos, setPermisos] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token             = localStorage.getItem("accessToken");
      const permisosGuardados = localStorage.getItem("permisos");

      if (token) {
        try {
          const decoded   = jwtDecode(token);
          const isExpired = decoded.exp * 1000 < Date.now();

          if (!isExpired) {
            setUser(decoded);
            setPermisos(permisosGuardados ? JSON.parse(permisosGuardados) : {});
          } else {
            const refresh = localStorage.getItem("refreshToken");
            if (refresh) {
              await refreshSession(refresh);
            } else {
              logout();
            }
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (formData) => {
    const data = await loginApi(formData);
    localStorage.setItem("accessToken",  data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("permisos",     JSON.stringify(data.permisos || {}));
    const decoded = jwtDecode(data.access);
    setUser(decoded);
    setPermisos(data.permisos || {});
    return decoded;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("permisos");
    setUser(null);
    setPermisos({});
  }, []);

  const refreshSession = async (refreshToken) => {
    try {
      const data = await refreshTokenApi(refreshToken);
      localStorage.setItem("accessToken", data.access);
      const decoded = jwtDecode(data.access);
      setUser(decoded);
    } catch {
      logout();
    }
  };

  // ── canAccess dinámico y estricto ─────────────────────────────────────────
  const canAccess = (pagina) => {
    if (!user) return false;
    if (user.idRol === 1) return true;   // Admin siempre ve todo
    if (user.idRol === 5) return false;  // Cliente nunca entra al panel de gestión

    // 1. Validar primero si el rol técnicamente tiene permitido ver esta sección
    const rolesPermitidos = ACCESO_POR_ROL[pagina];
    if (!rolesPermitidos || !rolesPermitidos.includes(Number(user.idRol))) {
      return false; // Si es N/A para este rol, rebota de inmediato
    }

    // 2. Si es una página aplicable a su rol, LA BASE DE DATOS TIENE LA ÚLTIMA PALABRA
    return permisos[pagina] === true;
  };

  return (
    <AuthContext.Provider value={{ user, permisos, loading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};