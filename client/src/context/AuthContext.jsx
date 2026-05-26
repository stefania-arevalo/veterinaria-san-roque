import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { loginApi, refreshTokenApi } from "../api/auth";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

// ── Acceso automático por rol, sin necesitar permiso en BD ──────
// Debe coincidir exactamente con PermissionRoute.jsx
const ACCESO_POR_ROL = {
  citas:             [2, 3],
  clientes:          [2, 3, 4],
  pacientes:         [2, 3],
  historial_clinico: [2],
  tratamientos:      [2, 3],
  ventas:            [3, 4],
  compras:           [3, 4],
  productos:         [3, 4],
  configuracion:     [],
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

  // ── canAccess: unifica acceso por rol + permiso en BD ─────────
  // Mismo criterio que PermissionRoute para que el menú y las rutas
  // sean siempre consistentes.
  const canAccess = (pagina) => {
    if (!user) return false;
    if (user.idRol === 1) return true;   // Admin ve todo
    if (user.idRol === 5) return false;  // Cliente nunca accede al panel staff

    // Acceso automático por rol
    if (ACCESO_POR_ROL[pagina]?.includes(Number(user.idRol))) return true;

    // Permiso explícito otorgado por el admin desde PermissionsPage
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