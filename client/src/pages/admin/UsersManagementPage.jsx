import React, { useState, useEffect, useCallback } from "react";
import axios from "../../api/axios";
import { VET_COLORS } from "../../layouts/AdminLayout";
import StaffCreateDrawer, { StaffEditDrawer, ROLE_META, inputStyle, Field, ConfirmModal } from "./StaffCreateDrawer";
import SalaryTab from "./SalaryTab";

// ─── API helpers ───────────────────────────────────────────────────────────
const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });

const SEXO_MAP = { M: "Masculino", F: "Femenino", O: "Otro" };

// ─── Helpers de UI ─────────────────────────────────────────────────────────
function RoleBadge({ idRol }) {
  const m = ROLE_META[idRol] || { label: "—", color: "#64748b", bg: "#f1f5f9", icon: "?" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: m.bg, color: m.color }}>
      {m.icon} {m.label}
    </span>
  );
}

function StatusBadge({ estado }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: estado ? "#dcfce7" : "#fee2e2", color: estado ? "#166534" : "#991b1b" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: estado ? "#16a34a" : "#dc2626" }} />
      {estado ? "Activo" : "Inactivo"}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "13px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: toast.type === "error" ? "#c62828" : VET_COLORS.accent, color: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
      {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
    </div>
  );
}

function LinkedEntityBadge({ user }) {
  const person = user.Staff || user.Client;
  if (!person) {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#fef3c7", color: "#92400e", display: "inline-flex", alignItems: "center", gap: 4 }}>
        ⚠️ Sin persona vinculada
      </span>
    );
  }
  const isStaff  = !!user.Staff;
  const fullName = `${person.nombres} ${person.apellidos}`;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a202c" }}>{fullName}</div>
      <div style={{ fontSize: 11, color: VET_COLORS.textMuted }}>{isStaff ? "👥 Personal" : "🐾 Cliente"} · DNI {person.dni}</div>
    </div>
  );
}

// ─── Modal gestión de cuenta de usuario ────────────────────────────────────
function UserAccountModal({ user, onClose, onSaved }) {
  const [estado,      setEstado]      = useState(user.estado);
  const [newPassword, setNewPassword] = useState("");
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [globalErr,   setGlobalErr]   = useState("");

  const validate = () => {
    const e = {};
    if (newPassword && newPassword.length < 6) e.newPassword = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setGlobalErr("");
    try {
      const payload = { estado };
      if (newPassword) payload.contraseña = newPassword;
      await axios.patch(`/user/${user.idUsuario}`, payload, { headers: auth() });
      onSaved();
    } catch (err) {
      setGlobalErr(err?.response?.data?.msg || "Error al guardar.");
    } finally { setSaving(false); }
  };

  const roleMeta = ROLE_META[user.idRol] || { label: "—", color: "#64748b", bg: "#f1f5f9", icon: "?" };
  const person   = user.Staff || user.Client;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1999 }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2000, width: 420, maxWidth: "94vw", background: "white", borderRadius: 16, boxShadow: "0 20px 48px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", background: roleMeta.color, color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🔐 Gestionar cuenta</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.85 }}>@{user.usuario}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 30, height: 30, borderRadius: 7, fontSize: 17, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#f8fafc", border: `1px solid ${VET_COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Persona vinculada</div>
            {person
              ? <div>
                  <div style={{ fontWeight: 600, color: "#1a202c", fontSize: 14 }}>{person.nombres} {person.apellidos}</div>
                  <div style={{ fontSize: 12, color: VET_COLORS.textMuted }}>{user.Staff ? "👥 Personal" : "🐾 Cliente"} · DNI {person.dni}</div>
                </div>
              : <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>⚠️ Sin persona vinculada</span>
            }
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: roleMeta.bg, borderRadius: 8 }}>
            <span style={{ fontSize: 20 }}>{roleMeta.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Rol del sistema</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: roleMeta.color }}>{roleMeta.label}</div>
            </div>
          </div>

          <Field label="Estado de la cuenta">
            <div style={{ display: "flex", gap: 10 }}>
              {[{ v: true, l: "✅ Activo" }, { v: false, l: "❌ Inactivo" }].map(opt => (
                <button key={String(opt.v)} type="button" onClick={() => setEstado(opt.v)} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `2px solid ${estado === opt.v ? VET_COLORS.accent : VET_COLORS.border}`, background: estado === opt.v ? (VET_COLORS.accentLight || "#f0fdf4") : "white", color: estado === opt.v ? VET_COLORS.accent : "#64748b" }}>{opt.l}</button>
              ))}
            </div>
          </Field>

          <Field label="Nueva contraseña (vacío = no cambiar)" error={errors.newPassword}>
            <input type="password" style={inputStyle(errors.newPassword)} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </Field>

          {globalErr && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#c62828", fontWeight: 600 }}>⚠️ {globalErr}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: saving ? "#94a3b8" : VET_COLORS.accent, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PERSONAL
// ══════════════════════════════════════════════════════════════════════════════
function StaffTab({ localities, showToast }) {
  const [staffList,    setStaffList]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [editStaff,    setEditStaff]    = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedRow,  setExpandedRow]  = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search = search;
      if (roleFilter) params.idRol  = roleFilter;  // ← ahora va al backend
      const res  = await axios.get("/staffs", { params, headers: auth() });
      setStaffList(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Error al cargar el personal.", "error");
    } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/staff/${confirmDelete.idPersonal}`, { headers: auth() });
      showToast("Registro de personal eliminado.");
      fetchStaff();
    } catch (err) {
      showToast(err?.response?.data?.msg || "No se pudo eliminar. Puede tener datos asociados.", "error");
    } finally { setConfirmDelete(null); }
  };

  const STAFF_ROLES = [1, 2, 3, 4];

  return (
    <div>
      {confirmDelete && (
        <ConfirmModal
          title="¿Eliminar registro de personal?"
          message={`Se eliminará el registro de "${confirmDelete.nombres} ${confirmDelete.apellidos}". El usuario vinculado NO se elimina, solo los datos personales.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}

      {editStaff && (
        <StaffEditDrawer
          staff={editStaff}
          localities={localities}
          onClose={() => setEditStaff(null)}
          onSaved={(msg) => {
            showToast(msg || "Personal actualizado correctamente.");
            setEditStaff(null);
            fetchStaff();
          }}
        />
      )}

      {showCreate && (
        <StaffCreateDrawer
          localities={localities}
          onClose={() => setShowCreate(false)}
          onSaved={(action) => {
            showToast(`Personal ${action} correctamente.`);
            setShowCreate(false);
            fetchStaff();
          }}
        />
      )}

      {/* Barra de búsqueda y filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 2, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input
            placeholder="Buscar por nombre, apellido, DNI o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle(false), paddingLeft: 36 }}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle(false), maxWidth: 180 }}>
          <option value="">Todos los roles</option>
          {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].icon} {ROLE_META[r].label}</option>)}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: VET_COLORS.accent, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(45,106,79,0.25)" }}
        >
          + Nuevo personal
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: "white", borderRadius: 14, border: `1px solid ${VET_COLORS.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>Cargando personal...</div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>No se encontraron registros de personal.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["", "Nombre completo", "DNI", "Rol / Usuario", "Teléfono", "Correo", "Localidad", "Acciones"].map((h, i) => (
                  <th key={i} style={{ padding: "11px 14px", textAlign: i >= 7 ? "right" : "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: VET_COLORS.textMuted, letterSpacing: "0.04em", borderBottom: `1px solid ${VET_COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((s, i) => {
                const isExpanded   = expandedRow === s.idPersonal;
                const localityName = localities.find(l => l.idLocalidad === s.idLocalidad)?.nombre || "—";
                return (
                  <React.Fragment key={s.idPersonal}>
                    <tr
                      style={{ borderBottom: `1px solid ${VET_COLORS.border}`, background: isExpanded ? "#f0fdf4" : i % 2 === 0 ? "white" : "#fafafa", cursor: "pointer" }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa"; }}
                      onClick={() => setExpandedRow(isExpanded ? null : s.idPersonal)}
                    >
                      <td style={{ padding: "12px 8px 12px 14px", width: 24 }}>
                        <span style={{ fontSize: 10, color: "#94a3b8", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1a202c" }}>{s.nombres} {s.apellidos}</div>
                        <div style={{ fontSize: 11, color: VET_COLORS.textMuted }}>{SEXO_MAP[s.sexo] || "—"} · {s.fechaNacimiento || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#475569" }}>{s.dni}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ marginBottom: 4 }}><RoleBadge idRol={s.User?.idRol} /></div>
                        <div style={{ fontSize: 11, color: VET_COLORS.textMuted, fontFamily: "monospace" }}>{s.User?.usuario || "Sin usuario"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>{s.telefono || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>{s.correo || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>{localityName}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => setEditStaff(s)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${VET_COLORS.border}`, background: "white", color: VET_COLORS.accent, cursor: "pointer" }}>Editar</button>
                          <button onClick={() => setConfirmDelete(s)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #fecaca", background: "#fff5f5", color: "#c62828", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: "#f0fdf4", borderBottom: `1px solid ${VET_COLORS.border}` }}>
                        <td colSpan={8} style={{ padding: "0 14px 16px 42px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 24px", paddingTop: 12 }}>
                            {[
                              { label: "Estado cuenta", value: s.User?.estado !== undefined ? (s.User.estado ? "✅ Activo" : "❌ Inactivo") : "Sin usuario" },
                              { label: "Dirección",     value: s.direccion || "—" },
                              ...(s.Veterinarian ? [{ label: "Especialidad", value: s.Veterinarian.especialidad }, { label: "Matrícula ID", value: s.Veterinarian.idMatricula }] : []),
                              ...(s.Assistant    ? [{ label: "Certificados", value: s.Assistant.certificados || "—" }] : []),
                              ...(s.Admin        ? [{ label: "Área resp.",   value: s.Admin.areaResponsabilidad }] : []),
                            ].map(item => (
                              <div key={item.label}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: 13, color: "#1a202c", fontWeight: 500 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#94a3b8" }}>
        💡 Clic en una fila para ver todos los atributos. Eliminar solo borra los datos de personal, no la cuenta de usuario.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function UsersManagementPage() {
  const [activeTab,     setActiveTab]     = useState("usuarios");
  const [users,         setUsers]         = useState([]);
  const [localities,    setLocalities]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [roleFilter,    setRoleFilter]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [orphanFilter,  setOrphanFilter]  = useState(false);

  const [editUser,      setEditUser]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { user }
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)              params.search = search;
      if (roleFilter)          params.idRol  = roleFilter;
      if (statusFilter !== "") params.estado  = statusFilter;
      const res = await axios.get("/users", { params, headers: auth() });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch { showToast("Error al cargar usuarios.", "error"); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  const fetchLocalities = useCallback(async () => {
    try {
      const res = await axios.get("/localities", { headers: auth() });
      setLocalities(Array.isArray(res.data) ? res.data : []);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); },     [fetchUsers]);
  useEffect(() => { fetchLocalities(); }, [fetchLocalities]);

  const handleDeleteUser = async () => {
    const u = confirmDelete.user;
    try {
      await axios.delete(`/user/${u.idUsuario}`, { headers: auth() });
      showToast("Usuario eliminado.");
      fetchUsers();
    } catch (e) {
      showToast(e?.response?.data?.msg || "No se pudo eliminar.", "error");
    } finally { setConfirmDelete(null); }
  };

  // Filtro client-side de huérfanos (usuarios sin Staff ni Client)
  const displayedUsers = orphanFilter
    ? users.filter(u => !u.Staff && !u.Client)
    : users;

  const stats = Object.entries(ROLE_META).map(([idRol, m]) => ({
    ...m, count: users.filter(u => u.idRol === parseInt(idRol)).length,
  }));

  const orphanCount = users.filter(u => !u.Staff && !u.Client).length;

  const TABS = [
    { key: "usuarios", label: "🔐 Cuentas de usuario" },
    { key: "personal", label: "👥 Personal" },
    { key: "salarios", label: "💰 Salarios" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast toast={toast} />

      {/* Confirmación eliminar usuario */}
      {confirmDelete && (
        <ConfirmModal
          title="¿Eliminar cuenta de usuario?"
          message={`Se eliminará permanentemente la cuenta "${confirmDelete.user.usuario}". Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}

      {/* Modal gestión de cuenta */}
      {editUser && (
        <UserAccountModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            showToast("Cuenta actualizada correctamente.");
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1a202c" }}>Usuarios y Personal</h2>
          <p style={{ margin: 0, fontSize: 13, color: VET_COLORS.textMuted }}>
            {users.length} cuenta{users.length !== 1 ? "s" : ""} registrada{users.length !== 1 ? "s" : ""}
            {orphanCount > 0 && (
              <span style={{ color: "#92400e", fontWeight: 600 }}>{" · "}{orphanCount} sin persona vinculada</span>
            )}
          </p>
        </div>
        {/* Sin botón "Nuevo usuario" — se crean desde Personal o Clientes */}
      </div>

      {/* Stats — solo en tab usuarios */}
      {activeTab === "usuarios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: `1px solid ${VET_COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", background: "white", borderRadius: "12px 12px 0 0", border: `1px solid ${VET_COLORS.border}`, borderBottom: "none", overflow: "hidden" }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: "14px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, background: activeTab === tab.key ? "white" : "#f8fafc", color: activeTab === tab.key ? VET_COLORS.accent : "#64748b", borderBottom: activeTab === tab.key ? `3px solid ${VET_COLORS.accent}` : "3px solid transparent", transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: "white", border: `1px solid ${VET_COLORS.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

        {/* ── TAB USUARIOS ── */}
        {activeTab === "usuarios" && (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 2, minWidth: 220 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                <input placeholder="Buscar por nombre de usuario..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle(false), paddingLeft: 36 }} />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={inputStyle(false)}>
                <option value="">Todos los roles</option>
                {Object.entries(ROLE_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle(false)}>
                <option value="">Todos los estados</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
              {/* Filtro huérfanos — funcional */}
              <button
                onClick={() => setOrphanFilter(p => !p)}
                style={{
                  padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${orphanFilter ? "#92400e" : VET_COLORS.border}`,
                  background: orphanFilter ? "#fef3c7" : "white",
                  color: orphanFilter ? "#92400e" : "#64748b",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {orphanFilter ? "⚠️ Sin vinculación" : "Todos"}
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Usuario", "Persona vinculada", "Rol", "Estado", "Acciones"].map((h, i) => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: i === 4 ? "right" : "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: VET_COLORS.textMuted, letterSpacing: "0.04em", borderBottom: `1px solid ${VET_COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>Cargando...</td></tr>
                  ) : displayedUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>No se encontraron usuarios.</td></tr>
                  ) : displayedUsers.map((u, i) => (
                    <tr key={u.idUsuario} style={{ borderBottom: i < displayedUsers.length - 1 ? `1px solid ${VET_COLORS.border}` : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#1a202c", fontFamily: "monospace", fontSize: 14 }}>@{u.usuario}</div>
                        <div style={{ fontSize: 11, color: VET_COLORS.textMuted }}>ID: {u.idUsuario}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><LinkedEntityBadge user={u} /></td>
                      <td style={{ padding: "13px 16px" }}><RoleBadge idRol={u.idRol} /></td>
                      <td style={{ padding: "13px 16px" }}><StatusBadge estado={u.estado} /></td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => setEditUser(u)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${VET_COLORS.border}`, background: "white", color: VET_COLORS.accent, cursor: "pointer" }}>Gestionar</button>
                          <button onClick={() => setConfirmDelete({ user: u })} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #fecaca", background: "#fff5f5", color: "#c62828", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94a3b8" }}>
              💡 Las cuentas se crean desde las pestañas <strong>Personal</strong> y <strong>Clientes</strong>. Acá solo gestionás estado y contraseña.
            </p>
          </>
        )}

        {/* ── TAB PERSONAL ── */}
        {activeTab === "personal" && (
          <StaffTab localities={localities} showToast={showToast} />
        )}

        {activeTab === "salarios" && (
          <SalaryTab showToast={showToast} />
        )}

      </div>
    </div>
  );
}