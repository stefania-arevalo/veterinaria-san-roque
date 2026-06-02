import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize"; 
import axios from "../api/axios";

export const VET_COLORS = {
  sidebarBg:      "#ffffff",
  sidebarHover:  "#f0fdf4",
  sidebarActive: "#1b4332",
  accent:        "#2d6a4f",
  accentLight:   "#d8f3dc",
  headerBg:      "white",
  pageBg:        "#f8fafc",
  text:          "#1a202c",
  textMuted:     "#6b7280",
  border:        "#e2e8f0",
  success:       "#2e7d32",
  danger:        "#c62828",
};

const token  = () => localStorage.getItem("accessToken");
const auth   = () => ({ Authorization: `Bearer ${token()}` });

const ROLE_META = {
  1: { label: "Administrador", color: "#6d28d9", bg: "#ede9fe" },
  2: { label: "Veterinario",   color: "#1d4ed8", bg: "#dbeafe"}, 
  3: { label: "Asistente",     color: "#be185d", bg: "#fce7f3"}, 
  4: { label: "Vendedor",      color: "#b45309", bg: "#fef3c7"}, 
  5: { label: "Cliente",       color: "#475569", bg: "#f1f5f9"}, 
};

const SEXO_MAP = { M: "Masculino", F: "Femenino", O: "Otro" };

const NAV_ITEMS = [
  { label: "🏠 Inicio",         pagina: "admin",             path: "/admin" },
  { label: "Ventas",            pagina: "ventas",            path: "/admin/ventas" },
  { label: "Turnos",            pagina: "citas",             path: "/admin/turnos" },
  { label: "Clientes",          pagina: "clientes",          path: "/admin/clientes" },
  { label: "Pacientes",          pagina: "pacientes",         path: "/admin/pacientes" },
  { label: "Historial Clínico", pagina: "historial_clinico", path: "/admin/mascotas/historial" },
  { label: "Compras",           pagina: "compras",           path: "/admin/compras" },
  { label: "Inventario",        pagina: "inventario",         path: "/admin/productos" },
];

const ADMIN_MENU = [
  { label: "👥 Usuarios",      path: "/admin/usuarios" },
  { label: "🔑 Permisos",      path: "/admin/permisos" },
  { label: "📊 Reportes",      path: "/admin/reportes" },
  { label: "⚙️ Configuración", path: "/admin/configuracion" },
];

function ConfirmLogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onCancel} />
      <div style={{ position: "relative", background: "white", borderRadius: 12, padding: 25, width: 320, maxWidth: "90vw", textAlign: "center", borderTop: `8px solid ${VET_COLORS.accent}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
        <h3 style={{ margin: "0 0 10px", color: VET_COLORS.sidebarActive, fontWeight: 800 }}>¿CERRAR SESIÓN?</h3>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 25 }}>¿Estás seguro de que quieres salir del sistema?</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: VET_COLORS.accent, color: "white", cursor: "pointer", fontWeight: 600 }}>Sí, salir</button>
        </div>
      </div>
    </div>
  );
}

function AdminDropdown({ location, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAnyActive = ADMIN_MENU.some(item => location.pathname === item.path);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          padding: "16px 18px", border: "none",
          borderBottom: isAnyActive || open ? `3px solid ${VET_COLORS.accent}` : "3px solid transparent",
          background: isAnyActive || open ? VET_COLORS.sidebarHover : "transparent",
          color: isAnyActive || open ? VET_COLORS.accent : "#64748b",
          fontWeight: isAnyActive || open ? 700 : 600,
          fontSize: 13, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        Admin
        <span style={{ fontSize: 10, display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", right: 0, background: "white", borderRadius: 10, border: `1px solid ${VET_COLORS.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 180, zIndex: 500, overflow: "hidden" }}>
          {ADMIN_MENU.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "11px 16px", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? VET_COLORS.accentLight : "white",
                  color: active ? VET_COLORS.accent : "#334155",
                  borderLeft: active ? `3px solid ${VET_COLORS.accent}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = VET_COLORS.sidebarHover; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "white"; }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileDrawer({ user, username, onClose }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [pwNueva,    setPwNueva]    = useState("");
  const [pwConfirm,  setPwConfirm]  = useState("");
  const [pwError,    setPwError]    = useState("");
  const [pwSuccess,  setPwSuccess]  = useState("");
  const [savingPw,   setSavingPw]   = useState(false);
  const [showPwNueva, setShowPwNueva] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  const roleMeta = ROLE_META[user?.idRol] || { label: "Usuario", color: VET_COLORS.accent, bg: "#f1f5f9", icon: "👤" };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/staffs", { headers: auth() });
      const list = Array.isArray(res.data) ? res.data : [];
      const mine = list.find(s => 
        s.idUsuario === user?.user_id || 
        s.idUsuario === user?.idUsuario || 
        s.User?.idUsuario === user?.user_id || 
        s.User?.idUsuario === user?.idUsuario ||
        s.idPersonal === user?.idPersonal || 
        s.User?.idPersonal === user?.idPersonal
      );
      setProfile(mine || null);
    } catch {
      setError("No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!pwNueva || pwNueva.length < 6) { setPwError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if (pwNueva !== pwConfirm)          { setPwError("Las contraseñas no coinciden."); return; }

    setSavingPw(true);
    try {
      await axios.patch(`/user/${user?.user_id}`, { contraseña: pwNueva }, { headers: auth() });
      setPwSuccess("Contraseña actualizada correctamente.");
      setPwNueva(""); setPwConfirm("");
    } catch (err) {
      setPwError(err?.response?.data?.msg || "Error al cambiar la contraseña.");
    } finally { setSavingPw(false); }
  };

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: `1.5px solid ${VET_COLORS.border}`, outline: "none",
    boxSizing: "border-box", background: "white", fontFamily: "inherit",
  };

  const Field = ({ label, value }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#1a202c", fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2500 }} onClick={onClose} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2600,
        width: 420, maxWidth: "96vw", background: "white",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>

        <div style={{ padding: "20px 24px", background: roleMeta.color, color: "white", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mi perfil</h2>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {username ? username.charAt(0).toUpperCase() : "👤"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{username}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{roleMeta.label}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 1 }}>ID: {user?.user_id}</div>
            </div>
          </div>
        </div>      

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: VET_COLORS.textMuted }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <p style={{ margin: 0, fontSize: 13 }}>Cargando datos...</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#c62828" }}>⚠️ {error}</p>
            </div>
          )}

          {!loading && !error && !profile && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "16px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                <strong>Sin datos personales.</strong> Cuenta sin registro de personal vinculado.
              </p>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${VET_COLORS.border}` }}>
                  👤 Datos personales
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                  <Field label="Nombres"           value={profile.nombres} />
                  <Field label="Apellidos"          value={profile.apellidos} />
                  <Field label="DNI"                value={profile.dni} />
                  <Field label="Sexo"               value={SEXO_MAP[profile.sexo]} />
                  <Field label="Fecha de nac."      value={profile.fechaNacimiento} />
                  <Field label="Teléfono"           value={profile.telefono} />
                  <Field label="Correo"             value={profile.correo} />
                  <Field label="Dirección"          value={profile.direccion} />
                  {profile.Locality && <Field label="Localidad" value={profile.Locality?.nombre} />}
                </div>
              </div>

              {(profile.Veterinarian || profile.Assistant || profile.Admin || profile.Seller) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${VET_COLORS.border}` }}>
                    {roleMeta.icon} Datos del rol
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                    {profile.Veterinarian && (
                      <>
                        <Field label="Especialidad"  value={profile.Veterinarian.especialidad} />
                        <Field label="N° Matrícula"  value={profile.Veterinarian.idMatricula} />
                      </>
                    )}
                    {profile.Assistant && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <Field label="Certificados" value={profile.Assistant.certificados || "Sin certificados registrados"} />
                      </div>
                    )}
                    {profile.Admin && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <Field label="Área de responsabilidad" value={profile.Admin.areaResponsabilidad} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${VET_COLORS.border}` }}>
              🔐 Cambiar contraseña
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwNueva ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={pwNueva}
                  onChange={e => { setPwNueva(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPwNueva(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <img src={showPwNueva ? "/closeeye.png" : "/openeye.png"} style={{ width: 20, height: 20, opacity: 0.6 }} />
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type={showPwConfirm ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={pwConfirm}
                  onChange={e => { setPwConfirm(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPwConfirm(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <img src={showPwConfirm ? "/closeeye.png" : "/openeye.png"} style={{ width: 20, height: 20, opacity: 0.6 }} />
                </button>
              </div>

              {pwError   && <p style={{ margin: 0, fontSize: 12, color: "#c62828" }}>⚠️ {pwError}</p>}
              {pwSuccess && <p style={{ margin: 0, fontSize: 12, color: "#16a34a" }}>✅ {pwSuccess}</p>}

              <button
                onClick={handleChangePassword}
                disabled={savingPw || !pwNueva || !pwConfirm}
                style={{
                  padding: "10px 0", borderRadius: 8, border: "none",
                  background: (savingPw || !pwNueva || !pwConfirm) ? "#94a3b8" : VET_COLORS.accent,
                  color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 5
                }}
              >
                {savingPw ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, canAccess, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile } = useWindowSize(); 

  const [showLogout,   setShowLogout]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); 
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false); 
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🔒 CONTROL DE SEGURIDAD EXCLUSIVO DE RUTAS ADMIN LADO FRONTEND
  useEffect(() => {
    const pathsExclusivosAdmin = ["/admin/reportes", "/admin/configuracion", "/admin/usuarios","/admin/permisos"];
    const esRutaAdmin = pathsExclusivosAdmin.some(path => location.pathname.startsWith(path));
    
    // Si la ruta requiere admin y el idRol del usuario NO es 1 (Administrador), lo pateamos
    if (esRutaAdmin && user && user.idRol !== 1) {
      navigate("/sin-permiso", { replace: true });
    }
  }, [location.pathname, user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutConfirm = () => { logout(); navigate("/login"); };

  const username =
    user?.nombres && user?.apellidos
      ? `${user.nombres} ${user.apellidos}`
      : user?.usuario || "usuario";
  const roleMeta   = ROLE_META[user?.idRol] || { label: "Usuario", color: "#475569", bg: "#f1f5f9" };
  const roleLabel  = roleMeta.label;

  const formatTime = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const isActive   = (path) => location.pathname === path;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: VET_COLORS.pageBg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {showLogout  && <ConfirmLogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogout(false)} />}
      {showProfile && <ProfileDrawer user={user} username={username} onClose={() => setShowProfile(false)} />}

      {/* Sidebar Desplegable Móvil */}
      {isMobile && showMobileMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1998 }} onClick={() => setShowMobileMenu(false)} />
          <div style={{
            position: "fixed", top: 0, bottom: 0, left: 0, width: 280, background: "white",
            zIndex: 1999, boxShadow: "8px 0 30px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflowY: "auto"
          }}>
            <div style={{ padding: "20px 16px", borderBottom: `1px solid ${VET_COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, color: VET_COLORS.sidebarActive, fontSize: 15 }}>MENÚ GENERAL</div>
              <button onClick={() => setShowMobileMenu(false)} style={{ background: "none", border: "none", fontSize: 20, color: VET_COLORS.textMuted, cursor: "pointer" }}>×</button>
            </div>
            
            <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_ITEMS.map(item => {
                const tieneAcceso = item.pagina === "admin" || canAccess(item.pagina) || user?.idRol === 1;
                if (!tieneAcceso) return null;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                    style={{
                      width: "100%", padding: "12px 14px", border: "none", borderRadius: 8, textAlign: "left", fontSize: 14, fontWeight: active ? 700 : 500,
                      background: active ? VET_COLORS.sidebarHover : "transparent", color: active ? VET_COLORS.accent : "#475569", cursor: "pointer"
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* 🔒 Menú de administración móvil oculto dinámicamente si no es admin */}
              {user?.idRol === 1 && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${VET_COLORS.border}`, paddingTop: 8 }}>
                  <button
                    onClick={() => setMobileAdminOpen(p => !p)}
                    style={{
                      width: "100%", padding: "12px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: 14, fontWeight: 600,
                      color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer"
                    }}
                  >
                    ⚙️ Administración
                    <span>{mobileAdminOpen ? "▲" : "▼"}</span>
                  </button>
                  {mobileAdminOpen && (
                    <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                      {ADMIN_MENU.map(subItem => {
                        const active = isActive(subItem.path);
                        return (
                          <button
                            key={subItem.path}
                            onClick={() => { navigate(subItem.path); setShowMobileMenu(false); }}
                            style={{
                              width: "100%", padding: "10px 14px", border: "none", borderRadius: 6, textAlign: "left", fontSize: 13, fontWeight: active ? 700 : 500,
                              background: active ? VET_COLORS.accentLight : "transparent", color: active ? VET_COLORS.accent : "#64748b", cursor: "pointer"
                            }}
                          >
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: isMobile ? "0 12px" : "0 24px", height: 64, background: "white", 
          borderBottom: `1px solid ${VET_COLORS.border}`, flexShrink: 0 
        }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12, flexShrink: 0 }}>
            {isMobile && (
              <button 
                onClick={() => setShowMobileMenu(true)}
                style={{ background: "none", border: "none", fontSize: 22, color: VET_COLORS.sidebarActive, cursor: "pointer", padding: "4px" }}
              >
                ☰
              </button>
            )}
            <img src="/logocolor.png" alt="Logo" style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }} />
            {!isMobile && (
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: VET_COLORS.sidebarActive, lineHeight: 1 }}>SAN ROQUE</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>VETERINARIA</div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", flex: 1, minWidth: 0, padding: "0 8px" }}>
            <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, color: "#1e293b", lineHeight: 1 }}>{formatTime(currentTime)}</div>
            {!isMobile && (
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginTop: 2 }}>{formatDate(currentTime)}</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 10, flexShrink: 0 }}>
            <button
              onClick={() => setShowProfile(true)}
              title="Ver mi perfil"
              style={{
                textAlign: "right", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: 10, transition: "background 0.2s"
              }}
              onMouseEnter={e => { if(!isMobile) e.currentTarget.style.background = VET_COLORS.sidebarHover; }}
              onMouseLeave={e => { if(!isMobile) e.currentTarget.style.background = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: roleMeta.bg, 
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: roleMeta.color, flexShrink: 0, textTransform: "uppercase"
                }}>
                  {username ? username.charAt(0).toUpperCase() : "👤"}
                </div>
                {!isMobile && (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>{username}</div>
                    <div style={{ fontSize: 11, color: VET_COLORS.accent, fontWeight: 600 }}>{roleLabel}</div>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setShowLogout(true)}
              title="Cerrar sesión"
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 6, borderRadius: 8, transition: "background 0.2s", flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              🚪
            </button>
          </div>
        </header>

        {/* Navbar Horizontal (Escritorio) */}
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", background: "white", borderBottom: `1px solid ${VET_COLORS.border}`, padding: "0 20px", flexShrink: 0 }}>
            {NAV_ITEMS.map(item => {
              const tieneAcceso = item.pagina === "admin" || canAccess(item.pagina) || user?.idRol === 1;
              if (!tieneAcceso) return null;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = VET_COLORS.sidebarHover;
                      e.currentTarget.style.color = VET_COLORS.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#64748b";
                    }
                  }}
                  style={{
                    padding: "16px 18px", border: "none",
                    borderBottom: isActive(item.path) ? `3px solid ${VET_COLORS.accent}` : "3px solid transparent",
                    background: isActive(item.path) ? VET_COLORS.sidebarHover : "transparent",
                    color: isActive(item.path) ? VET_COLORS.accent : "#64748b",
                    fontWeight: isActive(item.path) ? 700 : 600,
                    fontSize: 13, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
            {user?.idRol === 1 && <AdminDropdown location={location} navigate={navigate} />}
          </div>
        )}

        {/* Contenido Principal */}
        <main style={{ flex: 1, padding: isMobile ? "16px" : "24px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}