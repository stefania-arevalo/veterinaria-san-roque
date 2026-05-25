import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export const VET_COLORS = {
  sidebarBg:     "#ffffff",
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
const apiUrl = (path) => `/api/V1${path}`;

// Se unificó incluyendo el rol 5 (Cliente) e íconos por defecto
const ROLE_META = {
  1: { label: "Administrador", color: "#6d28d9", bg: "#ede9fe" },
  2: { label: "Veterinario",   color: "#1d4ed8", bg: "#dbeafe"}, 
  3: { label: "Asistente",     color: "#be185d", bg: "#fce7f3"}, 
  4: { label: "Vendedor",      color: "#b45309", bg: "#fef3c7"}, 
  5: { label: "Cliente",       color: "#475569", bg: "#f1f5f9"}, 
};


const SEXO_MAP = { M: "Masculino", F: "Femenino", O: "Otro" };

const NAV_ITEMS = [
  { label: "🏠 Inicio",        pagina: "admin",             path: "/admin" },
  { label: "Ventas",            pagina: "ventas",            path: "/admin/ventas" },
  { label: "Turnos",            pagina: "citas",             path: "/admin/turnos" },
  { label: "Clientes",          pagina: "clientes",          path: "/admin/clientes" },
  { label: "Pacientes",         pagina: "pacientes",         path: "/admin/pacientes" },
  { label: "Historial Clínico", pagina: "historial_clinico", path: "/admin/mascotas/historial" },
  { label: "Compras",           pagina: "compras",           path: "/admin/compras" },
  { label: "Inventario",        pagina: "productos",         path: "/admin/productos" },
];

const ADMIN_MENU = [
  { label: "👥 Usuarios",      path: "/admin/empleados/usuarios" },
  { label: "🔑 Permisos",      path: "/admin/empleados/permisos" },
  { label: "📊 Reportes",      path: "/admin/reportes" },
  { label: "⚙️ Configuración", path: "/admin/configuracion" },
];

// ─── Modal logout ─────────────────────────────────────────────────────────────
function ConfirmLogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onCancel} />
      <div style={{ position: "relative", background: "white", borderRadius: 12, padding: 25, width: 350, textAlign: "center", borderTop: `8px solid ${VET_COLORS.accent}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
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

// ─── Dropdown admin ───────────────────────────────────────────────────────────
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

// ─── Drawer de perfil propio ──────────────────────────────────────────────────
function ProfileDrawer({ user, username, onClose }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Cambio de contraseña
  const [pwActual,   setPwActual]   = useState("");
  const [pwNueva,    setPwNueva]    = useState("");
  const [pwConfirm,  setPwConfirm]  = useState("");
  const [pwError,    setPwError]    = useState("");
  const [pwSuccess,  setPwSuccess]  = useState("");
  const [savingPw,   setSavingPw]   = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [showPwNueva, setShowPwNueva] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  const roleMeta = ROLE_META[user?.idRol] || { label: "Usuario", color: VET_COLORS.accent, bg: "#f1f5f9", icon: "👤" };

  // Cargar datos del personal asociado al usuario logueado
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // GET /staffs → filtramos el que tiene nuestro idUsuario
      const res = await axios.get(apiUrl("/staffs"), { headers: auth() });
      const list = Array.isArray(res.data) ? res.data : [];
      const mine = list.find(s => s.idUsuario === user?.user_id || s.User?.idUsuario === user?.user_id);
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
      await axios.patch(apiUrl(`/user/${user?.user_id}`), { contraseña: pwNueva }, { headers: auth() });
      setPwSuccess("Contraseña actualizada correctamente.");
      setPwActual(""); setPwNueva(""); setPwConfirm("");
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
      {/* Overlay */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1999 }} onClick={onClose} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2000,
        width: 420, maxWidth: "96vw", background: "white",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", background: roleMeta.color, color: "white", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mi perfil</h2>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          {/* Avatar + info usuario */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {username ? username.charAt(0).toUpperCase() : "👤"}
            </div>
            
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>@{username}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{roleMeta.label}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 1 }}>ID: {user?.user_id}</div>
            </div>
          </div>
        </div>      
        {/* Cuerpo */}
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
                <strong>Sin datos personales.</strong> Tu cuenta de usuario no tiene un registro de personal vinculado.
                Contactá al administrador para asociar tus datos.
              </p>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              {/* ── Datos personales ── */}
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

              {/* ── Datos del rol ── */}
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
                    {profile.Seller && (
                      <div style={{ gridColumn: "1/-1", padding: "10px 12px", background: "#d1fae5", borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#065f46" }}>💼 Rol de Vendedor — sin datos adicionales.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Horarios (solo veterinarios) ── */}
              {profile.Veterinarian?.Horarios?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${VET_COLORS.border}` }}>
                    🕐 Mis horarios
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {profile.Veterinarian.Horarios.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, minWidth: 100, color: VET_COLORS.accent }}>{h.diaSemana || h.dia || `Día ${i + 1}`}</span>
                        <span style={{ color: "#475569" }}>{h.horaInicio} – {h.horaFin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Cambiar contraseña ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${VET_COLORS.border}` }}>
              🔐 Cambiar contraseña
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              
              {/* Campo Nueva Contraseña */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPwNueva ? "text" : "password"}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  value={pwNueva}
                  onChange={e => { setPwNueva(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwNueva(p => !p)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <img
                    src={showPwNueva ? "/closeeye.png" : "/openeye.png"}
                    alt={showPwNueva ? "Ocultar" : "Mostrar"}
                    style={{ width: 20, height: 20, opacity: 0.6 }}
                  />
                </button>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPwConfirm ? "text" : "password"}
                  placeholder="Confirmar nueva contraseña"
                  value={pwConfirm}
                  onChange={e => { setPwConfirm(e.target.value); setPwError(""); setPwSuccess(""); }}
                  style={{ ...inp, paddingRight: 38 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwConfirm(p => !p)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <img
                    src={showPwConfirm ? "/closeeye.png" : "/openeye.png"}
                    alt={showPwConfirm ? "Ocultar" : "Mostrar"}
                    style={{ width: 20, height: 20, opacity: 0.6 }}
                  />
                </button>
              </div>

              {/* Mensajes de error o éxito */}
              {pwError   && <p style={{ margin: 0, fontSize: 12, color: "#c62828" }}>⚠️ {pwError}</p>}
              {pwSuccess && <p style={{ margin: 0, fontSize: 12, color: "#16a34a" }}>✅ {pwSuccess}</p>}

              {/* --- EL BOTÓN QUE TE FALTABA --- */}
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !pwNueva || !pwConfirm}
                style={{
                  padding: "10px 0", borderRadius: 8, border: "none",
                  background: (savingPw || !pwNueva || !pwConfirm) ? "#94a3b8" : VET_COLORS.accent,
                  color: "white", fontWeight: 700, fontSize: 13,
                  cursor: (savingPw || !pwNueva || !pwConfirm) ? "not-allowed" : "pointer",
                  marginTop: 5
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

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { user, canAccess, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [showLogout,  setShowLogout]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutConfirm = () => { logout(); navigate("/login"); };

  const username   = user?.usuario || "usuario";

  // Usamos ROLE_META unificado para extraer la información y el color directamente
  const roleMeta   = ROLE_META[user?.idRol] || { label: "Usuario", color: "#475569", bg: "#f1f5f9" };
  const roleLabel  = roleMeta.label;

  const formatTime = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const isActive   = (path) => location.pathname === path;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: VET_COLORS.pageBg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {showLogout  && <ConfirmLogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogout(false)} />}
      {showProfile && <ProfileDrawer user={user} username={username} onClose={() => setShowProfile(false)} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, background: "white", borderBottom: `1px solid ${VET_COLORS.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logocolor.png" alt="Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: VET_COLORS.sidebarActive, lineHeight: 1 }}>SAN ROQUE</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>VETERINARIA</div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", lineHeight: 1 }}>{formatTime(currentTime)}</div>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize", marginTop: 4 }}>{formatDate(currentTime)}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* ── Botón de perfil — clic en nombre/rol ── */}
            <button
              onClick={() => setShowProfile(true)}
              title="Ver mi perfil"
              style={{
                textAlign: "right", background: "none", border: "none",
                cursor: "pointer", padding: "6px 8px", borderRadius: 10,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = VET_COLORS.sidebarHover}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Mini avatar con INICIAL */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  // Usamos el color de fondo del rol para mantener la identidad visual
                  background: roleMeta.bg, 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, // Añadimos peso a la fuente para que resalte
                  color: roleMeta.color, // Usamos el color de texto del rol
                  flexShrink: 0,
                  textTransform: "uppercase" // Aseguramos que siempre sea mayúscula
                }}>
                  {/* Lógica para sacar la inicial: toma el primer caracter del usuario */}
                  {username ? username.charAt(0).toUpperCase() : "👤"}
                </div>
                
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>{username}</div>
                  <div style={{ fontSize: 11, color: VET_COLORS.accent, fontWeight: 600 }}>{roleLabel}</div>
                </div>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={() => setShowLogout(true)}
              title="Cerrar sesión"
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 6, borderRadius: 8, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              🚪
            </button>
          </div>
        </header>

        {/* ── Navbar ── */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", background: "white", borderBottom: `1px solid ${VET_COLORS.border}`, padding: "0 20px", flexShrink: 0 }}>
          {NAV_ITEMS.map(item => {
            const tieneAcceso = item.pagina === "admin" || canAccess(item.pagina) || user?.idRol === 1;
            if (!tieneAcceso) return null;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                // AÑADE ESTOS DOS EVENTOS:
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = VET_COLORS.sidebarHover;
                    e.currentTarget.style.color = VET_COLORS.accent; // Opcional: cambia el color de texto también
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748b"; // Vuelve al color original
                  }
                }}
                style={{
                  padding: "16px 18px", 
                  border: "none",
                  borderBottom: isActive(item.path) ? `3px solid ${VET_COLORS.accent}` : "3px solid transparent",
                  background: isActive(item.path) ? VET_COLORS.sidebarHover : "transparent",
                  color: isActive(item.path) ? VET_COLORS.accent : "#64748b",
                  fontWeight: isActive(item.path) ? 700 : 600,
                  fontSize: 13, 
                  cursor: "pointer", 
                  transition: "all 0.2s", 
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
          {user?.idRol === 1 && <AdminDropdown location={location} navigate={navigate} />}
        </div>

        {/* ── Contenido ── */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}