import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { loginApi, refreshTokenApi } from "../api/auth";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

// ── Matriz Única de Accesos Automáticos por Rol ──────────────────
// Roles: 1 = Admin, 2 = Veterinario, 3 = Asistente, 4 = Vendedor, 5 = Cliente
// Debe contener ABSOLUTAMENTE TODAS las "paginas" que usás en App.jsx
const ACCESO_POR_ROL = {
  ventas:            [3, 4],    // Asistente y Vendedor
  compras:           [3, 4],    // Asistente y Vendedor
  clientes:          [2, 3, 4], // Todo el staff tiene acceso
  citas:             [2, 3],    // Vet y Asistente (Ruta: turnos)
  pacientes:         [2, 3, 4], // Todo el staff puede ver pacientes
  historial_clinico: [2],       // ⚠️ Solo Veterinario puede entrar aquí
  productos:         [2, 3, 4], // Todo el staff puede ver el Inventario
  tratamientos:      [2, 3],    // Vet y Asistente
  configuracion:     [],        // Exclusivo de Admin (idRol: 1)
  usuarios:          [],        // Exclusivo de Admin (idRol: 1) (Permisos y Usuarios)
  permisos:          [],
  reportes:          [],        
};

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
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

  // ── canAccess unificado ─────────────────────────────────────────
  const canAccess = (pagina) => {
    if (!user) return false;
    if (user.idRol === 1) return true;   // Admin tiene superpoderes, ve todo
    if (user.idRol === 5) return false;  // Cliente externo nunca entra al panel staff

    // 1. Acceso automático predefinido por el rol técnico
    if (ACCESO_POR_ROL[pagina]?.includes(Number(user.idRol))) return true;

    // 2. Si no lo tiene automático, vemos si se le dio un permiso explícito en la BD
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