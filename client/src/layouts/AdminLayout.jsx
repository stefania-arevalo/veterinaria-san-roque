import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import axios from "../api/axios";

export const VET_COLORS = {
  sidebarBg:      "#ffffff",
  sidebarHover:   "#f0fdf4",
  sidebarActive:  "#1b4332",
  accent:         "#2d6a4f",
  accentLight:    "#d8f3dc",
  headerBg:       "white",
  pageBg:         "#f8fafc",
  text:           "#1a202c",
  textMuted:      "#6b7280",
  border:         "#e2e8f0",
  success:        "#2e7d32",
  danger:         "#c62828",
};

// Paleta del login para coherencia
const G = {
  forest:  "#1a3d28",
  pine:    "#1f5c38",
  leaf:    "#276b42",
  mint:    "#eaf3de",
  border:  "#d1ddd4",
  muted:   "#6b8f76",
  foam:    "#f8fbf9",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
};

const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });

const ROLE_META = {
  1: { label: "Administrador", color: "#6d28d9", bg: "#ede9fe" },
  2: { label: "Veterinario",   color: "#1d4ed8", bg: "#dbeafe" },
  3: { label: "Asistente",     color: "#be185d", bg: "#fce7f3" },
  4: { label: "Vendedor",      color: "#b45309", bg: "#fef3c7" },
  5: { label: "Cliente",       color: "#475569", bg: "#f1f5f9" },
};

const SEXO_MAP = { M: "Masculino", F: "Femenino", O: "Otro" };

const NAV_ITEMS = [
  { label: "Inicio",           emoji: "🏠", pagina: "admin",             path: "/admin" },
  { label: "Ventas",           emoji: "💰", pagina: "ventas",            path: "/admin/ventas" },
  { label: "Turnos",           emoji: "📅", pagina: "citas",             path: "/admin/turnos" },
  { label: "Clientes",         emoji: "👥", pagina: "clientes",          path: "/admin/clientes" },
  { label: "Pacientes",        emoji: "🐾", pagina: "pacientes",         path: "/admin/pacientes" },
  { label: "Historial",        emoji: "📋", pagina: "historial_clinico", path: "/admin/mascotas/historial" },
  { label: "Compras",          emoji: "🛒", pagina: "compras",           path: "/admin/compras" },
  { label: "Inventario",       emoji: "📦", pagina: "inventario",        path: "/admin/productos" },
];

const ADMIN_MENU = [
  { label: "👥 Usuarios",      path: "/admin/usuarios" },
  { label: "🔑 Permisos",      path: "/admin/permisos" },
  { label: "📊 Reportes",      path: "/admin/reportes" },
  { label: "⚙️ Configuración", path: "/admin/configuracion" },
];

// ── Confirm Logout ────────────────────────────────────────────────
function ConfirmLogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div style={{
        position: "relative", background: "white", borderRadius: 14,
        padding: "28px 24px", width: 300, maxWidth: "90vw", textAlign: "center",
        borderTop: `4px solid ${G.forest}`,
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
        <h3 style={{ margin: "0 0 8px", color: G.forest, fontWeight: 800, fontSize: 16 }}>¿Cerrar sesión?</h3>
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 22 }}>¿Estás seguro de que querés salir del sistema?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 8,
            border: `1px solid ${G.border}`, background: "white",
            cursor: "pointer", fontWeight: 600, fontSize: 13, color: G.muted,
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", borderRadius: 8, border: "none",
            background: G.forest, color: "white",
            cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Sí, salir</button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Dropdown ────────────────────────────────────────────────
function AdminDropdown({ location, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isAnyActive = ADMIN_MENU.some(item => location.pathname === item.path);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(p => !p)} style={{
        padding: "16px 16px", border: "none",
        borderBottom: isAnyActive || open ? `3px solid ${G.leaf}` : "3px solid transparent",
        background: isAnyActive || open ? G.mint : "transparent",
        color: isAnyActive || open ? G.forest : G.gray600,
        fontWeight: isAnyActive || open ? 700 : 600,
        fontSize: 13, cursor: "pointer", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      }}>
        ⚙️ Admin
        <span style={{ fontSize: 9, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", right: 0,
          background: "white", borderRadius: 10,
          border: `1px solid ${G.border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          minWidth: 180, zIndex: 500, overflow: "hidden",
        }}>
          {ADMIN_MENU.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); setOpen(false); }} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "11px 16px", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? G.mint : "white",
                color: active ? G.forest : G.gray600,
                borderLeft: active ? `3px solid ${G.leaf}` : "3px solid transparent",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = G.foam; }}
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

// ── Profile Drawer ────────────────────────────────────────────────
function ProfileDrawer({ user, username, onClose }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [pwNueva,     setPwNueva]    = useState("");
  const [pwConfirm,   setPwConfirm]  = useState("");
  const [pwError,     setPwError]    = useState("");
  const [pwSuccess,   setPwSuccess]  = useState("");
  const [savingPw,    setSavingPw]   = useState(false);
  const [showPwNueva, setShowPwNueva]   = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  const roleMeta = ROLE_META[user?.idRol] || { label: "Usuario", color: G.leaf, bg: G.mint };

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get("/staffs", { headers: auth() });
      const list = Array.isArray(res.data) ? res.data : [];
      const mine = list.find(s =>
        s.idUsuario === user?.user_id || s.idUsuario === user?.idUsuario ||
        s.User?.idUsuario === user?.user_id || s.User?.idUsuario === user?.idUsuario ||
        s.idPersonal === user?.idPersonal || s.User?.idPersonal === user?.idPersonal
      );
      setProfile(mine || null);
    } catch { setError("No se pudo cargar el perfil."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!pwNueva || pwNueva.length < 6) { setPwError("Mínimo 6 caracteres."); return; }
    if (pwNueva !== pwConfirm)          { setPwError("Las contraseñas no coinciden."); return; }
    setSavingPw(true);
    try {
      await axios.patch(`/user/${user?.user_id}`, { contraseña: pwNueva }, { headers: auth() });
      setPwSuccess("Contraseña actualizada."); setPwNueva(""); setPwConfirm("");
    } catch (err) { setPwError(err?.response?.data?.msg || "Error al cambiar la contraseña."); }
    finally { setSavingPw(false); }
  };

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: `1px solid ${G.border}`, outline: "none",
    boxSizing: "border-box", background: "white", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const Field = ({ label, value }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: G.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: G.forest, fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2500 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2600,
        width: 400, maxWidth: "96vw", background: "white",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        {/* Header del drawer */}
        <div style={{ padding: "20px 22px", background: roleMeta.color, color: "white", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Mi perfil</h2>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "white",
              width: 30, height: 30, borderRadius: 8, fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {username ? username.charAt(0).toUpperCase() : "👤"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>@{username}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{roleMeta.label}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {loading && <p style={{ textAlign: "center", color: G.muted, fontSize: 13 }}>Cargando...</p>}
          {!loading && error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 13, color: VET_COLORS.danger }}>⚠️ {error}</p>
            </div>
          )}
          {!loading && !error && profile && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${G.border}` }}>
                👤 Datos personales
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                <Field label="Nombres"      value={profile.nombres} />
                <Field label="Apellidos"    value={profile.apellidos} />
                <Field label="DNI"          value={profile.dni} />
                <Field label="Sexo"         value={SEXO_MAP[profile.sexo]} />
                <Field label="Teléfono"     value={profile.telefono} />
                <Field label="Correo"       value={profile.correo} />
                <Field label="Dirección"    value={profile.direccion} />
                {profile.Locality && <Field label="Localidad" value={profile.Locality?.nombre} />}
              </div>
              {profile.Veterinarian && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: G.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>🩺 Datos del veterinario</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                    <Field label="Especialidad" value={profile.Veterinarian.especialidad} />
                    <Field label="N° Matrícula" value={profile.Veterinarian.idMatricula} />
                  </div>
                </div>
              )}
            </div>
          )}
          {!loading && !error && !profile && (
            <div style={{ background: G.mint, border: `1px solid ${G.border}`, borderRadius: 10, padding: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: G.muted }}>Sin datos de personal vinculados a esta cuenta.</p>
            </div>
          )}

          {/* Cambiar contraseña */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: G.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderTop: `1px solid ${G.border}`, paddingTop: 16 }}>
              🔐 Cambiar contraseña
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <input type={showPwNueva ? "text" : "password"} placeholder="Nueva contraseña"
                  value={pwNueva}
                  onChange={e => { setPwNueva(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                  onFocus={e => e.target.style.borderColor = G.leaf}
                  onBlur={e => e.target.style.borderColor = G.border}
                />
                <button type="button" onClick={() => setShowPwNueva(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <img src={showPwNueva ? "/closeeye.png" : "/openeye.png"} style={{ width: 18, height: 18, opacity: 0.5 }} />
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPwConfirm ? "text" : "password"} placeholder="Confirmar contraseña"
                  value={pwConfirm}
                  onChange={e => { setPwConfirm(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                  onFocus={e => e.target.style.borderColor = G.leaf}
                  onBlur={e => e.target.style.borderColor = G.border}
                />
                <button type="button" onClick={() => setShowPwConfirm(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <img src={showPwConfirm ? "/closeeye.png" : "/openeye.png"} style={{ width: 18, height: 18, opacity: 0.5 }} />
                </button>
              </div>
              {pwError   && <p style={{ margin: 0, fontSize: 12, color: VET_COLORS.danger }}>⚠️ {pwError}</p>}
              {pwSuccess && <p style={{ margin: 0, fontSize: 12, color: G.leaf }}>✅ {pwSuccess}</p>}
              <button onClick={handleChangePassword} disabled={savingPw || !pwNueva || !pwConfirm} style={{
                padding: "10px", borderRadius: 8, border: "none",
                background: (savingPw || !pwNueva || !pwConfirm) ? G.gray200 : G.forest,
                color: (savingPw || !pwNueva || !pwConfirm) ? G.gray400 : "white",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                {savingPw ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── AdminLayout ───────────────────────────────────────────────────
export default function AdminLayout() {
  const { user, canAccess, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile, isTablet } = useWindowSize();

  const [showLogout,     setShowLogout]     = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [currentTime,    setCurrentTime]    = useState(new Date());

  useEffect(() => {
    const pathsAdmin = ["/admin/reportes", "/admin/configuracion", "/admin/usuarios", "/admin/permisos"];
    if (pathsAdmin.some(p => location.pathname.startsWith(p)) && user && user.idRol !== 1) {
      navigate("/sin-permiso", { replace: true });
    }
  }, [location.pathname, user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutConfirm = () => { logout(); navigate("/login"); };

  const username = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.usuario || "usuario";

  const roleMeta  = ROLE_META[user?.idRol] || { label: "Usuario", color: G.leaf, bg: G.mint };
  const roleLabel = roleMeta.label;

  const formatTime = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const isActive   = (path) => location.pathname === path;

  const isCompact = isMobile || isTablet;

  return (
    <div style={{
      height: "100vh", display: "flex", overflow: "hidden",
      background: VET_COLORS.pageBg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {showLogout  && <ConfirmLogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogout(false)} />}
      {showProfile && <ProfileDrawer user={user} username={username} onClose={() => setShowProfile(false)} />}

      {/* ── Drawer mobile/tablet ─────────────────────────────── */}
      {isCompact && showMobileMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1998 }} onClick={() => setShowMobileMenu(false)} />
          <div style={{
            position: "fixed", top: 0, bottom: 0, left: 0,
            width: isTablet ? 300 : 270,
            background: "white", zIndex: 1999,
            boxShadow: "8px 0 32px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header del drawer */}
            <div style={{
              padding: "0 16px", height: 64,
              borderBottom: `1px solid ${G.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: G.forest,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/logocolor.png" alt="Logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
                <div>
                  <div style={{ fontWeight: 800, color: "white", fontSize: 14, lineHeight: 1 }}>SAN ROQUE</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>VETERINARIA</div>
                </div>
              </div>
              <button onClick={() => setShowMobileMenu(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                color: "white", width: 32, height: 32, borderRadius: 8,
                fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>

            {/* Info del usuario en el drawer */}
            <div style={{
              padding: "14px 16px",
              background: G.foam,
              borderBottom: `1px solid ${G.border}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: roleMeta.bg, color: roleMeta.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.forest, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{roleLabel}</div>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.map(item => {
                const tieneAcceso = item.pagina === "admin" || canAccess(item.pagina) || user?.idRol === 1;
                if (!tieneAcceso) return null;
                const active = isActive(item.path);
                return (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowMobileMenu(false); }} style={{
                    width: "100%", padding: "11px 14px", border: "none", borderRadius: 9,
                    textAlign: "left", fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    background: active ? G.mint : "transparent",
                    color: active ? G.forest : G.gray600,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    borderLeft: active ? `3px solid ${G.leaf}` : "3px solid transparent",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = G.foam; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 16 }}>{item.emoji}</span>
                    {item.label}
                  </button>
                );
              })}

              {user?.idRol === 1 && (
                <div style={{ marginTop: 6, borderTop: `1px solid ${G.border}`, paddingTop: 6 }}>
                  <button onClick={() => setMobileAdminOpen(p => !p)} style={{
                    width: "100%", padding: "11px 14px", border: "none",
                    background: "transparent", textAlign: "left",
                    fontSize: 14, fontWeight: 600, color: G.gray600,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", borderRadius: 9,
                  }}>
                    ⚙️ Administración
                    <span style={{ fontSize: 10 }}>{mobileAdminOpen ? "▲" : "▼"}</span>
                  </button>
                  {mobileAdminOpen && (
                    <div style={{ paddingLeft: 10, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                      {ADMIN_MENU.map(sub => {
                        const active = isActive(sub.path);
                        return (
                          <button key={sub.path} onClick={() => { navigate(sub.path); setShowMobileMenu(false); }} style={{
                            width: "100%", padding: "10px 14px", border: "none", borderRadius: 8,
                            textAlign: "left", fontSize: 13,
                            fontWeight: active ? 700 : 500,
                            background: active ? G.mint : "transparent",
                            color: active ? G.forest : G.gray600,
                            cursor: "pointer",
                          }}>
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Cerrar sesión al fondo del drawer */}
            <div style={{ padding: "12px 8px", borderTop: `1px solid ${G.border}` }}>
              <button onClick={() => setShowLogout(true)} style={{
                width: "100%", padding: "11px 14px", border: "none", borderRadius: 9,
                background: "transparent", textAlign: "left",
                fontSize: 14, fontWeight: 600, color: VET_COLORS.danger,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              }}>
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Contenido principal ──────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isCompact ? "0 12px" : "0 24px",
          height: 64, background: "white",
          borderBottom: `1px solid ${G.border}`,
          flexShrink: 0,
        }}>
          {/* Izquierda: hamburguesa + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {isCompact && (
              <button onClick={() => setShowMobileMenu(true)} style={{
                background: "none", border: "none",
                fontSize: 22, color: G.forest, cursor: "pointer", padding: "4px",
                display: "flex", alignItems: "center",
              }}>☰</button>
            )}
            <img src="/logocolor.png" alt="Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            {!isCompact && (
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: G.forest, lineHeight: 1 }}>SAN ROQUE</div>
                <div style={{ fontSize: 10, color: G.muted, fontWeight: 600, marginTop: 2, letterSpacing: "0.05em" }}>VETERINARIA</div>
              </div>
            )}
          </div>

          {/* Centro: hora */}
          <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
            <div style={{ fontSize: isCompact ? 15 : 19, fontWeight: 700, color: G.forest, lineHeight: 1 }}>{formatTime(currentTime)}</div>
            {!isCompact && (
              <div style={{ fontSize: 11, color: G.muted, textTransform: "capitalize", marginTop: 2 }}>{formatDate(currentTime)}</div>
            )}
          </div>

          {/* Derecha: perfil + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: isCompact ? 4 : 8, flexShrink: 0 }}>
            <button onClick={() => setShowProfile(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px", borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => { if (!isCompact) e.currentTarget.style.background = G.foam; }}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
            title="Ver mi perfil">
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: roleMeta.bg, color: roleMeta.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {username.charAt(0).toUpperCase()}
              </div>
              {!isCompact && (
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.forest, lineHeight: 1.2 }}>{username}</div>
                  <div style={{ fontSize: 11, color: G.leaf, fontWeight: 600 }}>{roleLabel}</div>
                </div>
              )}
            </button>

            {!isCompact && (
              <button onClick={() => setShowLogout(true)} title="Cerrar sesión" style={{
                background: "none", border: "none", fontSize: 18, cursor: "pointer",
                padding: 6, borderRadius: 8, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              >🚪</button>
            )}
          </div>
        </header>

        {/* ── Nav horizontal (solo desktop) ──────────────────── */}
        {!isCompact && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "stretch",
            background: "white", borderBottom: `1px solid ${G.border}`,
            padding: "0 20px", flexShrink: 0,
            overflowX: "auto",
          }}>
            {NAV_ITEMS.map(item => {
              const tieneAcceso = item.pagina === "admin" || canAccess(item.pagina) || user?.idRol === 1;
              if (!tieneAcceso) return null;
              const active = isActive(item.path);
              return (
                <button key={item.path} onClick={() => navigate(item.path)} style={{
                  padding: "15px 16px", border: "none",
                  borderBottom: active ? `3px solid ${G.leaf}` : "3px solid transparent",
                  background: active ? G.mint : "transparent",
                  color: active ? G.forest : G.gray600,
                  fontWeight: active ? 700 : 600,
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = G.foam; e.currentTarget.style.color = G.forest; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = G.gray600; } }}
                >
                  {item.emoji} {item.label}
                </button>
              );
            })}
            {user?.idRol === 1 && <AdminDropdown location={location} navigate={navigate} />}
          </div>
        )}

        {/* ── Contenido ─────────────────────────────────────── */}
        <main style={{
          flex: 1,
          padding: isMobile ? "14px" : isTablet ? "18px" : "24px",
          overflowY: "auto",
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}