import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { VET_COLORS } from "../../layouts/AdminLayout";

const token = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ── Definición de páginas con metadatos ───────────────────────────
// rolesPermitidos: qué roles PUEDEN tener este permiso gestionado
// (el Admin siempre ve todo y no aparece aquí)
const PAGES = [
  {
    key: "ventas",
    label: "Ventas",
    icon: "💰",
    desc: "Registrar ventas de productos y cobrar servicios atendidos.",
    rolesPermitidos: [3, 4], // Asistente, Vendedor
  },
  {
    key: "compras",
    label: "Compras",
    icon: "🛒",
    desc: "Registrar órdenes de compra e ingreso de stock.",
    rolesPermitidos: [3, 4],
  },
  {
    key: "clientes",
    label: "Clientes",
    icon: "👥",
    desc: "Ver, crear y editar clientes registrados.",
    rolesPermitidos: [2, 3, 4],
  },
  {
    key: "citas",
    label: "Turnos / Citas",
    icon: "📅",
    desc: "Ver y gestionar los turnos de la clínica.",
    rolesPermitidos: [2, 3],
  },
  {
    key: "pacientes",           // datos básicos de la mascota
    label: "Pacientes / Mascotas",
    icon: "🐾",
    desc: "Ver y editar fichas básicas de mascotas (nombre, raza, tamaño).",
    rolesPermitidos: [2, 3, 4],
  },
  {
    key: "historial_clinico",   // clave para solo vets
    label: "Historial Clínico",
    icon: "📋",
    desc: "Acceder a fichas clínicas, diagnósticos y tratamientos médicos.",
    rolesPermitidos: [2],       // SOLO veterinario
  },
  {
    key: "productos",  
    label: "Inventario",
    icon: "📦",
    desc: "Consultar stock, lotes y productos disponibles.",
    rolesPermitidos: [2, 3, 4],
  },
  {
    key: "tratamientos",
    label: "Tratamientos",
    icon: "💊",
    desc: "Ver tratamientos activos y medicamentos recetados.",
    rolesPermitidos: [2, 3],
  },
];

const ROLE_LABELS = { 2: "Veterinario", 3: "Asistente", 4: "Vendedor" };
const ROLE_COLORS = {
  2: { bg: "#dbeafe", color: "#1e40af", accent: "#1d4ed8" },
  3: { bg: "#fce7f3", color: "#9d174d", accent: "#be185d" },
  4: { bg: "#fef3c7", color: "#92400e", accent: "#b45309" },
};

// Descripción de lo que puede hacer cada rol por defecto
const ROLE_DESC = {
  2: "Accede a citas, historial clínico, pacientes y tratamientos.",
  3: "Gestiona la agenda, clientes, ventas y coordinación general.",
  4: "Enfocado en ventas, compras e inventario.",
};

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none",
        background: checked ? "#1f5c38" : "#d1d5db",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
        boxShadow: checked ? "0 0 0 3px rgba(31,92,56,0.15)" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// Badge del rol
function RoleBadge({ idRol }) {
  const rc = ROLE_COLORS[idRol] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, background: rc.bg, color: rc.color,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {ROLE_LABELS[idRol] || "—"}
    </span>
  );
}

export default function PermissionsPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [permisos, setPermisos] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("all");

  useEffect(() => {
    axios.get("/users", { headers: headers() })
      .then(res => setUsers((res.data || []).filter(u => [2, 3, 4].includes(u.idRol))))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  const loadPermisos = async (user) => {
    setSelected(user);
    setLoadingPermisos(true);
    try {
      const res = await axios.get(`/user-permission/${user.idUsuario}`, { headers: headers() });
      const map = {};
      (res.data || []).forEach(p => { map[p.pagina] = p.habilitado; });
      // Completar con false las que no estén
      PAGES.forEach(p => { if (map[p.key] === undefined) map[p.key] = false; });
      setPermisos(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPermisos(false);
    }
  };

  const handleToggle = async (pagina, newValue) => {
    setSaving(pagina);
    try {
      await axios.post("/user-permission", {
        idUsuario: selected.idUsuario,
        pagina,
        habilitado: newValue,
      }, { headers: headers() });
      setPermisos(prev => ({ ...prev, [pagina]: newValue }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  // Páginas aplicables al rol del usuario seleccionado
  const paginasDelRol = selected
    ? PAGES.filter(p => p.rolesPermitidos.includes(selected.idRol))
    : [];

  // Páginas no aplicables (las que el admin gestiona o no corresponden al rol)
  const paginasNoAplicables = selected
    ? PAGES.filter(p => !p.rolesPermitidos.includes(selected.idRol))
    : [];

  const filteredUsers = users.filter(u => {
    const matchSearch = u.usuario.toLowerCase().includes(search.toLowerCase());
    const matchRol = filterRol === "all" || String(u.idRol) === filterRol;
    return matchSearch && matchRol;
  });

  const enabledCount = paginasDelRol.filter(p => permisos[p.key]).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1a202c" }}>
          Gestión de Permisos
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: VET_COLORS.textMuted }}>
          Habilitá o deshabilitá el acceso a cada sección del sistema según el rol del empleado.
          El <strong>Administrador</strong> siempre tiene acceso completo y no requiere configuración.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Panel izquierdo: lista de usuarios ── */}
        <div style={{
          background: "white", borderRadius: 14, overflow: "hidden",
          border: `0.5px solid ${VET_COLORS.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${VET_COLORS.border}`, background: "#fafbfc" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1a202c" }}>Empleados</h3>
            <input
              placeholder="Buscar por usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "8px 12px", borderRadius: 8, fontSize: 13,
                border: `0.5px solid ${VET_COLORS.border}`,
                background: "#f8fafc", outline: "none", marginBottom: 8,
              }}
            />
            <select
              value={filterRol}
              onChange={e => setFilterRol(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 8,
                border: `0.5px solid ${VET_COLORS.border}`,
                fontSize: 12, background: "#f8fafc", outline: "none", cursor: "pointer",
              }}
            >
              <option value="all">Todos los roles</option>
              <option value="2">Veterinario</option>
              <option value="3">Asistente</option>
              <option value="4">Vendedor</option>
            </select>
          </div>

          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {loadingUsers ? (
              <div style={{ padding: 24, textAlign: "center", color: VET_COLORS.textMuted, fontSize: 13 }}>Cargando...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: VET_COLORS.textMuted, fontSize: 13 }}>Sin resultados.</div>
            ) : filteredUsers.map(u => {
              const rc = ROLE_COLORS[u.idRol] || { bg: "#f1f5f9", color: "#475569", accent: "#475569" };
              const isSelected = selected?.idUsuario === u.idUsuario;
              return (
                <button
                  key={u.idUsuario}
                  onClick={() => loadPermisos(u)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 16px", border: "none",
                    borderBottom: `0.5px solid ${VET_COLORS.border}`,
                    borderLeft: isSelected ? `3px solid ${rc.accent}` : "3px solid transparent",
                    background: isSelected ? rc.bg + "55" : "white",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: isSelected ? rc.accent : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "white" : "#6b7280",
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {u.usuario.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a202c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.usuario}
                      </div>
                      <RoleBadge idRol={u.idRol} />
                    </div>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={rc.accent} strokeWidth="2.5" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel derecho: permisos ── */}
        <div style={{
          background: "white", borderRadius: 14, overflow: "hidden",
          border: `0.5px solid ${VET_COLORS.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          {!selected ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.3 }}>🔐</div>
              <p style={{ color: VET_COLORS.textMuted, fontSize: 14, margin: 0 }}>
                Seleccioná un empleado de la lista para gestionar sus permisos de acceso.
              </p>
            </div>
          ) : (
            <>
              {/* Header del panel */}
              <div style={{
                padding: "16px 24px", borderBottom: `0.5px solid ${VET_COLORS.border}`,
                background: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: ROLE_COLORS[selected.idRol]?.accent || "#475569",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: 18,
                  }}>
                    {selected.usuario.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a202c" }}>{selected.usuario}</div>
                    <div style={{ fontSize: 12, color: VET_COLORS.textMuted, marginTop: 2 }}>
                      <RoleBadge idRol={selected.idRol} />
                      <span style={{ marginLeft: 8 }}>{ROLE_DESC[selected.idRol]}</span>
                    </div>
                  </div>
                </div>
                {!loadingPermisos && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1f5c38" }}>
                      {enabledCount}/{paginasDelRol.length}
                    </div>
                    <div style={{ fontSize: 11, color: VET_COLORS.textMuted }}>secciones activas</div>
                  </div>
                )}
              </div>

              {loadingPermisos ? (
                <div style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted, fontSize: 14 }}>
                  Cargando permisos...
                </div>
              ) : (
                <>
                  {/* ── Páginas aplicables al rol ── */}
                  <div style={{ padding: "12px 24px 4px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: VET_COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Accesos configurables para {ROLE_LABELS[selected.idRol]}
                    </p>
                  </div>

                  {paginasDelRol.map((page, idx) => {
                    const enabled = permisos[page.key] || false;
                    const isSaving = saving === page.key;
                    return (
                      <div
                        key={page.key}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 24px",
                          borderTop: idx === 0 ? `0.5px solid ${VET_COLORS.border}` : "none",
                          borderBottom: `0.5px solid ${VET_COLORS.border}`,
                          background: enabled ? "#f8fbf9" : "white",
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 9,
                            background: enabled ? "#eaf3de" : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, flexShrink: 0,
                            border: enabled ? "0.5px solid #c0dd97" : "0.5px solid #e2e8f0",
                          }}>
                            {page.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a202c" }}>{page.label}</div>
                            <div style={{ fontSize: 12, color: VET_COLORS.textMuted, marginTop: 1 }}>{page.desc}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: isSaving ? "#1f5c38" : enabled ? "#1f5c38" : "#94a3b8",
                          }}>
                            {isSaving ? "Guardando..." : enabled ? "Habilitado" : "Deshabilitado"}
                          </span>
                          <Toggle
                            checked={enabled}
                            onChange={(v) => handleToggle(page.key, v)}
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Páginas no aplicables al rol ── */}
                  {paginasNoAplicables.length > 0 && (
                    <>
                      <div style={{ padding: "16px 24px 8px" }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          No aplicables a este rol
                        </p>
                      </div>
                      {paginasNoAplicables.map((page, idx) => (
                        <div
                          key={page.key}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 24px",
                            borderBottom: idx < paginasNoAplicables.length - 1 ? `0.5px solid ${VET_COLORS.border}` : "none",
                            opacity: 0.45,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 9,
                              background: "#f1f5f9", fontSize: 18,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              {page.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a202c" }}>{page.label}</div>
                              <div style={{ fontSize: 12, color: VET_COLORS.textMuted, marginTop: 1 }}>
                                No corresponde a este rol
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 10px",
                            background: "#f1f5f9", color: "#94a3b8", borderRadius: 20,
                          }}>
                            N/A
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Footer informativo */}
                  <div style={{ padding: "14px 24px", background: "#fafbfc", borderTop: `0.5px solid ${VET_COLORS.border}` }}>
                    <p style={{ margin: 0, fontSize: 12, color: VET_COLORS.textMuted, lineHeight: 1.5 }}>
                      Los cambios se aplican de inmediato. El empleado verá las secciones habilitadas la próxima vez que inicie sesión o recargue la página.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}