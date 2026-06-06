import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { VET_COLORS } from "../../layouts/AdminLayout";
import { createAndLinkUser, linkExistingUser, unlinkUser, authHeaders } from "../../hooks/userLinkHelpers";

export const ROLE_META = {
  1: { label: "Administrador", color: "#6d28d9", bg: "#ede9fe" },
  2: { label: "Veterinario",   color: "#0369a1", bg: "#e0f2fe"},
  3: { label: "Asistente",     color: "#b45309", bg: "#fef3c7"},
  4: { label: "Vendedor",      color: "#065f46", bg: "#d1fae5"},
  5: { label: "Cliente",       color: "#be185d", bg: "#fce7f3"}, 
};

export const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

const STAFF_ROLES = [1, 2, 3, 4];

export const inputStyle = (error) => ({
  width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
  border: `1.5px solid ${error ? "#c62828" : VET_COLORS.border}`,
  outline: "none", boxSizing: "border-box", background: "white",
  fontFamily: "inherit", transition: "border-color 0.15s",
});

export function Field({ label, required, error, children, colSpan }) {
  return (
    <div style={colSpan ? { gridColumn: colSpan } : {}}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label} {required && <span style={{ color: "#c62828" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#c62828" }}>{error}</p>}
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onCancel} />
      <div style={{ position: "relative", background: "white", borderRadius: 14, padding: "28px 32px", width: 380, textAlign: "center", borderTop: `6px solid ${danger ? "#c62828" : VET_COLORS.accent}`, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>{danger ? "🗑️" : "❓"}</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: VET_COLORS.textMuted, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: danger ? "#c62828" : VET_COLORS.accent, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// Punto 7: inferir rol desde tablas hijas, no desde User.idRol
export function inferRolFromStaff(staff) {
  if (staff.Admin)        return 1;
  if (staff.Veterinarian) return 2;
  if (staff.Assistant)    return 3;
  if (staff.Seller)       return 4;
  return null;
}

function StepBar({ current, steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderBottom: `1px solid ${VET_COLORS.border}`, padding: "0 24px" }}>
      {steps.map((label, i) => {
        const n = i + 1, done = current > n, active = current === n, last = i === steps.length - 1;
        return (
          <React.Fragment key={label}>
            <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, marginBottom: 4, background: done ? "#16a34a" : active ? VET_COLORS.accent : "#e2e8f0", color: (done || active) ? "white" : "#94a3b8", transition: "all 0.2s" }}>
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", color: active ? VET_COLORS.accent : done ? "#16a34a" : "#94a3b8" }}>{label}</span>
            </div>
            {!last && <div style={{ flex: 1, height: 2, margin: "0 6px", background: done ? "#16a34a" : VET_COLORS.border, transition: "background 0.3s", marginBottom: 16 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function RoleSelector({ value, onChange, error }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Tipo de rol <span style={{ color: "#c62828" }}>*</span>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {STAFF_ROLES.map((idRol) => {
          const m = ROLE_META[idRol], selected = parseInt(value) === idRol;
          return (
            <button key={idRol} type="button" onClick={() => onChange(idRol)} style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected ? m.color : VET_COLORS.border}`, background: selected ? m.bg : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: selected ? m.color : "#334155" }}>{m.label}</div>
              {selected && <span style={{ marginLeft: "auto", fontSize: 14, color: m.color, fontWeight: 700 }}>✓</span>}
            </button>
          );
        })}
      </div>
      {error && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#c62828" }}>{error}</p>}
    </div>
  );
}

function Step1Personal({ form, errors, onChange, localities }) {
  const set = (f) => (e) => onChange(f, e.target.value);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Nombres" required error={errors.nombres}><input style={inputStyle(errors.nombres)} value={form.nombres} onChange={set("nombres")} placeholder="Juan" /></Field>
      <Field label="Apellidos" required error={errors.apellidos}><input style={inputStyle(errors.apellidos)} value={form.apellidos} onChange={set("apellidos")} placeholder="Pérez" /></Field>
      <Field label="DNI" required error={errors.dni}><input style={inputStyle(errors.dni)} value={form.dni} onChange={(e) => onChange("dni", e.target.value.replace(/\D/g, ""))} placeholder="30123456" maxLength={10} /></Field>
      <Field label="Sexo" required error={errors.sexo}>
        <select style={inputStyle(errors.sexo)} value={form.sexo} onChange={set("sexo")}>
          <option value="">— Seleccionar —</option>
          {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Fecha de nacimiento" required error={errors.fechaNacimiento}><input type="date" style={inputStyle(errors.fechaNacimiento)} value={form.fechaNacimiento} onChange={set("fechaNacimiento")} /></Field>
      <Field label="Teléfono" required error={errors.telefono}><input style={inputStyle(errors.telefono)} value={form.telefono} onChange={set("telefono")} placeholder="2983 123456" /></Field>
      <Field label="Correo electrónico" error={errors.correo} colSpan="1 / -1"><input type="email" style={inputStyle(errors.correo)} value={form.correo} onChange={set("correo")} placeholder="juan@ejemplo.com" /></Field>
      <Field label="Dirección" required error={errors.direccion} colSpan="1 / -1"><input style={inputStyle(errors.direccion)} value={form.direccion} onChange={set("direccion")} placeholder="Calle 25 de Mayo 123" /></Field>
      <Field label="Localidad" error={errors.idLocalidad} colSpan="1 / -1">
        <select style={inputStyle(false)} value={form.idLocalidad} onChange={set("idLocalidad")}>
          <option value="">— Seleccionar localidad —</option>
          {localities.map((l) => <option key={l.idLocalidad} value={l.idLocalidad}>{l.nombre}</option>)}
        </select>
      </Field>
      {/* SECCIÓN SALARIO */}
      <div style={{ gridColumn: "1 / -1", borderTop: `1px dashed ${VET_COLORS.border}`, paddingTop: 14, marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
          💰 Salario
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { key: "none",     icon: "⏭️", label: "Sin salario",         desc: "Asignar después" },
            { key: "create",   icon: "➕", label: "Crear nuevo",          desc: "Ingresar tarifa nueva" },
            { key: "existing", icon: "🔗", label: "Asociar existente",    desc: "Vincular salario libre" },
          ].map((opt) => (
            <button key={opt.key} type="button"
              onClick={() => onChange("salaryMode", opt.key)}
              style={{
                padding: "10px 8px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                border: `2px solid ${form.salaryMode === opt.key ? VET_COLORS.accent : VET_COLORS.border}`,
                background: form.salaryMode === opt.key ? "#f0fdf4" : "white",
                transition: "all 0.15s",
                gridColumn: opt.key === "none" ? "1 / -1" : "auto",
              }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: form.salaryMode === opt.key ? VET_COLORS.accent : "#334155" }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        {form.salaryMode === "create" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tarifa por hora ($)" error={errors.tarifaHora}>
              <input type="number" style={inputStyle(errors.tarifaHora)} value={form.tarifaHora}
                onChange={(e) => onChange("tarifaHora", e.target.value)} placeholder="ej: 1500" />
            </Field>
            <Field label="Horas trabajadas" error={errors.horasTrabajadas}>
              <input type="number" style={inputStyle(errors.horasTrabajadas)} value={form.horasTrabajadas}
                onChange={(e) => onChange("horasTrabajadas", e.target.value)} placeholder="ej: 160" />
            </Field>
            <Field label="Fecha de liquidación" error={errors.fechaLiquidacion} colSpan="1 / -1">
              <input type="date" style={inputStyle(errors.fechaLiquidacion)} value={form.fechaLiquidacion}
                onChange={(e) => onChange("fechaLiquidacion", e.target.value)} />
            </Field>
          </div>
        )}

        {form.salaryMode === "existing" && (
          <Field label="Seleccionar salario existente" error={errors.idSalarioExistente}>
            {form.loadingSalaries
              ? <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Cargando...</p>
              : <select style={inputStyle(errors.idSalarioExistente)} value={form.idSalarioExistente}
                  onChange={(e) => onChange("idSalarioExistente", e.target.value)}>
                  <option value="">— Elegir salario —</option>
                  {(form.freeSalaries || []).map(s => (
                    <option key={s.idSalario} value={s.idSalario}>
                      ${s.tarifaHora}/h · {s.horasTrabajadas}hs · {s.fechaLiquidacion}
                    </option>
                  ))}
                </select>
            }
          </Field>
        )}
      </div>
    </div>
  );
}

function Step2Rol({ selectedRole, onRoleChange, roleForm, onRoleFormChange, errors }) {
  const set = (f) => (e) => onRoleFormChange(f, e.target.value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RoleSelector value={selectedRole} onChange={onRoleChange} error={errors.idRol} />
      {selectedRole === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>Datos de Veterinario</div><div style={{ fontSize: 11, color: "#0369a1", opacity: 0.8 }}>Especialidad y matrícula profesional</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Especialidad" required error={errors.especialidad}><input style={inputStyle(errors.especialidad)} value={roleForm.especialidad} onChange={set("especialidad")} placeholder="Clínica General, Cirugía..." /></Field>
            <Field label="N° de matrícula" required error={errors.matricula}><input type="number" style={inputStyle(errors.matricula)} value={roleForm.matricula} onChange={set("matricula")} placeholder="12345" /></Field>
          </div>
        </div>
      )}
      {selectedRole === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: "#b45309" }}>Datos de Asistente</div><div style={{ fontSize: 11, color: "#b45309", opacity: 0.8 }}>Certificados opcionales</div></div>
          </div>
          <Field label="Certificados (opcional)" error={errors.certificados}><textarea style={{ ...inputStyle(false), resize: "vertical", minHeight: 80 }} value={roleForm.certificados} onChange={set("certificados")} placeholder="Primeros auxilios, Administración veterinaria..." /></Field>
        </div>
      )}
      {selectedRole === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: "#6d28d9" }}>Datos de Administrador</div><div style={{ fontSize: 11, color: "#6d28d9", opacity: 0.8 }}>Área de responsabilidad</div></div>
          </div>
          <Field label="Área de responsabilidad" required error={errors.areaResponsabilidad}><input style={inputStyle(errors.areaResponsabilidad)} value={roleForm.areaResponsabilidad} onChange={set("areaResponsabilidad")} placeholder="Gestión general, Finanzas, RRHH..." /></Field>
        </div>
      )}
      {selectedRole === 4 && (
        <div style={{ background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>Vendedor</div><p style={{ margin: "4px 0 0", fontSize: 12, color: "#065f46", opacity: 0.85 }}>No requiere datos adicionales.</p></div>
        </div>
      )}
      {!selectedRole && (
        <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: `1px dashed ${VET_COLORS.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Seleccioná un rol para ver los campos correspondientes</p>
        </div>
      )}
    </div>
  );
}

function Step3Acceso({ selectedRole, accessMode, onModeChange, userForm, onUserFormChange, errors, existingUsers, loadingUsers }) {
  const set = (f) => (e) => onUserFormChange(f, e.target.value);
  const m   = ROLE_META[selectedRole] || {};
  const compatibleUsers = existingUsers.filter(u => u.idRol === selectedRole && !u.Staff && !u.Client);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
          <strong>Paso opcional:</strong> podés crear una cuenta de acceso ahora o hacerlo más tarde desde la tabla de Personal. El rol se asignará automáticamente como <strong>{m.icon} {m.label}</strong>.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { key: "none",     icon: "⏭️", label: "Sin acceso",         desc: "Solo datos personales" },
          { key: "create",   icon: "➕", label: "Crear usuario nuevo", desc: "Generar credenciales" },
          { key: "existing", icon: "🔗", label: "Asociar existente",   desc: "Vincular cuenta libre" },
        ].map((opt) => (
          <button key={opt.key} type="button" onClick={() => onModeChange(opt.key)} style={{ padding: "12px 10px", borderRadius: 10, border: `2px solid ${accessMode === opt.key ? VET_COLORS.accent : VET_COLORS.border}`, background: accessMode === opt.key ? (VET_COLORS.accentLight || "#f0fdf4") : "white", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accessMode === opt.key ? VET_COLORS.accent : "#334155" }}>{opt.label}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
      {accessMode === "create" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px", background: "#f8fafc", borderRadius: 10, border: `1px solid ${VET_COLORS.border}` }}>
          <Field label="Nombre de usuario" required error={errors.usuario}><input style={inputStyle(errors.usuario)} value={userForm.usuario} onChange={set("usuario")} placeholder="ej: jperez" autoComplete="off" /></Field>
          <Field label="Contraseña" required error={errors.contraseña}><input type="password" style={inputStyle(errors.contraseña)} value={userForm.contraseña} onChange={set("contraseña")} placeholder="Mínimo 6 caracteres" autoComplete="new-password" /></Field>
          {m.label && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: m.bg, borderRadius: 8 }}><span style={{ fontSize: 18 }}>{m.icon}</span><div><div style={{ fontSize: 11, color: "#64748b" }}>Rol asignado automáticamente</div><div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.label}</div></div></div>}
        </div>
      )}
      {accessMode === "existing" && (
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: `1px solid ${VET_COLORS.border}` }}>
          {loadingUsers ? <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Cargando usuarios disponibles...</p>
            : compatibleUsers.length === 0 ? <div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No hay usuarios con rol <strong>{m.label}</strong> disponibles para asociar.</p><p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Solo se muestran cuentas sin personal vinculado.</p></div>
            : <Field label="Seleccionar usuario" required error={errors.idUsuarioExistente}><select style={inputStyle(errors.idUsuarioExistente)} value={userForm.idUsuarioExistente} onChange={set("idUsuarioExistente")}><option value="">— Elegir usuario —</option>{compatibleUsers.map((u) => <option key={u.idUsuario} value={u.idUsuario}>@{u.usuario} {u.estado ? "✅" : "❌"}</option>)}</select><p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>Solo usuarios con rol <strong>{m.icon} {m.label}</strong> sin personal asignado.</p></Field>}
        </div>
      )}
      {accessMode === "none" && (
        <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: `1px dashed ${VET_COLORS.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>El personal se creará <strong>sin cuenta de acceso</strong>.<br />Podés vincular un usuario más tarde desde la tabla de Personal.</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// StaffCreateDrawer — default export
// ══════════════════════════════════════════════════════════════════════════════
export default function StaffCreateDrawer({ onClose, onSaved, localities }) {
  const STEPS = ["Datos personales", "Tipo de rol", "Acceso al sistema"];
  const [step, setStep]               = useState(1);
  const [personal, setPersonal] = useState({
    nombres: "", apellidos: "", dni: "", sexo: "",
    fechaNacimiento: "", telefono: "", direccion: "",
    correo: "", idLocalidad: "",
    tarifaHora: "", horasTrabajadas: "", fechaLiquidacion: "",
    salaryMode: "none",           
    idSalarioExistente: "",       
    freeSalaries: [],             
    loadingSalaries: false,      
  });
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    especialidad: "", matricula: "",
    fechaExpedicion: "", fechaVencimiento: "",  // ← agregar
    certificados: "", areaResponsabilidad: ""
  });
  const [accessMode, setAccessMode]   = useState("none");
  const [userForm, setUserForm]       = useState({ usuario: "", contraseña: "", idUsuarioExistente: "" });
  const [existingUsers, setExistingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (step === 3) {
      setLoadingUsers(true);
      axios.get("/users", { headers: authHeaders() }) 
        .then((res) => setExistingUsers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setExistingUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [step]);

  useEffect(() => {
    if (personal.salaryMode === "existing" && personal.freeSalaries.length === 0) {
      setP("loadingSalaries", true);
      axios.get("/salaries", { headers: authHeaders() })
        .then(res => {
          const free = (Array.isArray(res.data) ? res.data : []).filter(s => !s.idPersonal);
          setP("freeSalaries", free);
        })
        .catch(() => setP("freeSalaries", []))
        .finally(() => setP("loadingSalaries", false));
    }
  }, [personal.salaryMode]);

  const setP = (f, v) => setPersonal((p) => ({ ...p, [f]: v }));
  const setR = (f, v) => setRoleForm((p) => ({ ...p, [f]: v }));
  const setU = (f, v) => setUserForm((p) => ({ ...p, [f]: v }));

  const validateStep1 = () => {
    const e = {};
    ["nombres","apellidos","dni","sexo","fechaNacimiento","telefono","direccion"].forEach((f) => { if (!personal[f]?.toString().trim()) e[f] = "Obligatorio"; });
    if (personal.dni && !/^\d{7,10}$/.test(personal.dni)) e.dni = "7 a 10 dígitos numéricos";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateStep2 = () => {
    const e = {};
    if (!selectedRole) e.idRol = "Seleccioná un tipo de rol";
    if (selectedRole === 2) { if (!roleForm.especialidad.trim()) e.especialidad = "Obligatorio"; if (!roleForm.matricula.toString().trim()) e.matricula = "Obligatorio"; if (!roleForm.fechaExpedicion) e.fechaExpedicion = "Obligatorio";}
    if (selectedRole === 1 && !roleForm.areaResponsabilidad.trim()) e.areaResponsabilidad = "Obligatorio";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateStep3 = () => {
    const e = {};
    if (accessMode === "create") {
      if (!userForm.usuario.trim()) e.usuario = "Obligatorio";
      else if (userForm.usuario.trim().length < 4) e.usuario = "Mínimo 4 caracteres";
      if (!userForm.contraseña) e.contraseña = "Obligatorio";
      else if (userForm.contraseña.length < 6) e.contraseña = "Mínimo 6 caracteres";
    }
    if (accessMode === "existing" && !userForm.idUsuarioExistente) e.idUsuarioExistente = "Seleccioná un usuario";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setGlobalError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({}); setStep((s) => s + 1);
  };
  const handleBack = () => { setErrors({}); setGlobalError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSaving(true); setGlobalError("");
    try {
      // 1. Crear Staff sin idUsuario todavía
      const { tarifaHora, horasTrabajadas, fechaLiquidacion, ...staffFields } = personal;
      const staffPayload = { ...staffFields, idLocalidad: personal.idLocalidad ? parseInt(personal.idLocalidad) : null };

      const staffRes = await axios.post("/staff", staffPayload, { headers: authHeaders() });
      const idPersonal = staffRes.data.idPersonal;

      // Crear salario si se completó al menos un campo
      if (personal.salaryMode === "create" && (personal.tarifaHora || personal.horasTrabajadas || personal.fechaLiquidacion)) {
        await axios.post("/salary", {
          idPersonal,
          tarifaHora: personal.tarifaHora,
          horasTrabajadas: personal.horasTrabajadas,
          fechaLiquidacion: personal.fechaLiquidacion
        }, { headers: authHeaders() });
      } else if (personal.salaryMode === "existing" && personal.idSalarioExistente) {
        await axios.patch(`/salary/${personal.idSalarioExistente}`, { idPersonal }, { headers: authHeaders() });
      }

      // 2. Crear datos del rol
      if (selectedRole === 2) await axios.post("/veterinarian", { idPersonal, especialidad: roleForm.especialidad, idMatricula: parseInt(roleForm.matricula) }, { headers: authHeaders() });
      else if (selectedRole === 3) await axios.post("/assistant", { idPersonal, certificados: roleForm.certificados || null }, { headers: authHeaders() });
      else if (selectedRole === 4) await axios.post("/seller", { idPersonal }, { headers: authHeaders() });
      else if (selectedRole === 1) await axios.post("/admin", { idPersonal, areaResponsabilidad: roleForm.areaResponsabilidad }, { headers: authHeaders() });

      // 3. Vincular usuario usando helper centralizado (punto 5)
      if (accessMode === "create") {
        await createAndLinkUser({ usuario: userForm.usuario, contraseña: userForm.contraseña, idRol: selectedRole, entityType: "staff", entityId: idPersonal });
      } else if (accessMode === "existing") {
        await linkExistingUser({ idUsuario: userForm.idUsuarioExistente, entityType: "staff", entityId: idPersonal });
      }

      onSaved("creado");
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.response?.data?.errors?.[0]?.msg || "Error al guardar. Revisá los datos e intentá de nuevo.";
      setGlobalError(msg);
    } finally { setSaving(false); }
  };

  const roleMeta = ROLE_META[selectedRole];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1999 }} onClick={onClose} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2000, width: 520, maxWidth: "96vw", background: "white", boxShadow: "-8px 0 48px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", background: VET_COLORS.accent, color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>➕ Nuevo personal</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>
              Paso {step} de {STEPS.length} — {STEPS[step - 1]}
              {step > 1 && roleMeta && <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{roleMeta.icon} {roleMeta.label}</span>}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>
        <StepBar current={step} steps={STEPS} />
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {globalError && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}><p style={{ margin: 0, fontSize: 13, color: "#c62828", fontWeight: 600 }}>⚠️ {globalError}</p></div>}
          {step === 1 && <Step1Personal form={personal} errors={errors} onChange={setP} localities={localities} />}
          {step === 2 && <Step2Rol selectedRole={selectedRole} onRoleChange={(r) => { setSelectedRole(r); setErrors({}); }} roleForm={roleForm} onRoleFormChange={setR} errors={errors} />}
          {step === 3 && <Step3Acceso selectedRole={selectedRole} accessMode={accessMode} onModeChange={(m) => { setAccessMode(m); setErrors({}); setUserForm({ usuario: "", contraseña: "", idUsuarioExistente: "" }); }} userForm={userForm} onUserFormChange={setU} errors={errors} existingUsers={existingUsers} loadingUsers={loadingUsers} />}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${VET_COLORS.border}`, background: "#fafbfc", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          {step > 1 ? <button onClick={handleBack} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>← Atrás</button>
                    : <button onClick={onClose}    style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancelar</button>}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{step} / {STEPS.length}</span>
          {step < STEPS.length
            ? <button onClick={handleNext} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: VET_COLORS.accent, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Siguiente →</button>
            : <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saving ? "#94a3b8" : VET_COLORS.accent, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>{saving ? "Guardando..." : "✓ Crear personal"}</button>}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// StaffEditDrawer — named export
// ══════════════════════════════════════════════════════════════════════════════
export function StaffEditDrawer({ staff, localities, onClose, onSaved }) {
  // Punto 7: inferir rol desde tablas hijas, no desde User.idRol
  const idRol    = inferRolFromStaff(staff) ?? staff.User?.idRol;
  const roleMeta = ROLE_META[idRol] || { label: "—", color: VET_COLORS.accent, bg: "#f1f5f9", icon: "👤" };

  const hasRoleFields = [1, 2, 3].includes(idRol);
  const hasUser       = !!staff.User;

  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState({
    nombres: staff.nombres || "", apellidos: staff.apellidos || "",
    dni: staff.dni || "", sexo: staff.sexo || "",
    fechaNacimiento: staff.fechaNacimiento || "",
    telefono: staff.telefono || "", direccion: staff.direccion || "",
    correo: staff.correo || "", idLocalidad: staff.idLocalidad || "",
    tarifaHora: staff.Salary?.tarifaHora ?? "",
    horasTrabajadas: staff.Salary?.horasTrabajadas ?? "",
    fechaLiquidacion: staff.Salary?.fechaLiquidacion ?? "",
  });

  const vet  = staff.Veterinarian || null;
  const asst = staff.Assistant    || null;
  const adm  = staff.Admin        || null;

  const [vetForm, setVetFormS] = useState({
    especialidad: vet?.especialidad || "",
    idMatricula: vet?.idMatricula != null ? String(vet.idMatricula) : "",
    fechaExpedicion: vet?.fechaExpedicion || "",   
    fechaVencimiento: vet?.fechaVencimiento || "",  
  });
  const [asstForm, setAsstFormS] = useState({ certificados: asst?.certificados || "" });
  const [admForm,  setAdmFormS]  = useState({ areaResponsabilidad: adm?.areaResponsabilidad || "" });

  const [accessMode,     setAccessMode]     = useState("none");
  const [newUserForm,    setNewUserForm]     = useState({ usuario: "", contraseña: "" });
  const [existingUsers,  setExistingUsers]  = useState([]);
  const [loadingUsers,   setLoadingUsers]   = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userEstado,     setUserEstado]     = useState(staff.User?.estado ?? true);
  const [newPassword,    setNewPassword]    = useState("");
  const [confirmUnlink,  setConfirmUnlink]  = useState(false);

  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [savedTabs, setSavedTabs] = useState({ personal: false, rol: false, acceso: false });
  const [globalErr, setGlobalErr] = useState("");

  const set    = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const setVet = (f, v) => setVetFormS(p => ({ ...p, [f]: v }));
  const setAss = (f, v) => setAsstFormS(p => ({ ...p, [f]: v }));
  const setAdm = (f, v) => setAdmFormS(p => ({ ...p, [f]: v }));
  const setNU  = (f, v) => setNewUserForm(p => ({ ...p, [f]: v }));

  // Punto 7: inferir rol para filtrar usuarios compatibles
  const inferredRol     = inferRolFromStaff(staff);
  const compatibleUsers = existingUsers.filter(u => u.idRol === inferredRol && !u.Staff && !u.Client);

  useEffect(() => {
    if (activeTab === "acceso" && !hasUser) {
      setLoadingUsers(true);
      axios.get("/users", { headers: authHeaders() })
        .then(res => setExistingUsers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setExistingUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab, hasUser]);

  const validatePersonal = () => {
    const e = {};
    ["nombres","apellidos","dni","sexo","fechaNacimiento","telefono","direccion"].forEach(f => { if (!form[f]?.toString().trim()) e[f] = "Obligatorio"; });
    if (form.dni && !/^\d{7,10}$/.test(form.dni)) e.dni = "7 a 10 dígitos numéricos";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateRol = () => {
    const e = {};
    if (idRol === 2) { if (!vetForm.especialidad.trim()) e.especialidad = "Obligatorio"; if (!vetForm.idMatricula.toString().trim()) e.idMatricula = "Obligatorio"; }
    if (idRol === 1 && !admForm.areaResponsabilidad.trim()) e.areaResponsabilidad = "Obligatorio";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateAcceso = () => {
    const e = {};
    if (!hasUser) {
      if (accessMode === "create") {
        if (!newUserForm.usuario.trim()) e.usuario = "Obligatorio";
        else if (newUserForm.usuario.trim().length < 4) e.usuario = "Mínimo 4 caracteres";
        if (!newUserForm.contraseña) e.contraseña = "Obligatorio";
        else if (newUserForm.contraseña.length < 6) e.contraseña = "Mínimo 6 caracteres";
      }
      if (accessMode === "existing" && !selectedUserId) e.selectedUserId = "Seleccioná un usuario";
    } else {
      if (newPassword && newPassword.length < 6) e.newPassword = "Mínimo 6 caracteres";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const flashSaved = (tab) => { setSavedTabs(p => ({ ...p, [tab]: true })); setTimeout(() => setSavedTabs(p => ({ ...p, [tab]: false })), 2500); };

  const handleSavePersonal = async () => {
    if (!validatePersonal()) return;
    setSaving(true); setGlobalErr("");
    try {
      const { tarifaHora, horasTrabajadas, fechaLiquidacion, ...staffFields } = form;

      await axios.patch(`/staff/${staff.idPersonal}`, staffFields, { headers: authHeaders() });

      // Salario: si ya existe lo actualizamos, si no lo creamos
      const salaryPayload = { tarifaHora, horasTrabajadas, fechaLiquidacion, idPersonal: staff.idPersonal };
      if (staff.Salary?.idSalario) {
        await axios.patch(`/salary/${staff.Salary.idSalario}`, salaryPayload, { headers: authHeaders() });
      } else if (tarifaHora || horasTrabajadas || fechaLiquidacion) {
        await axios.post("/salary", salaryPayload, { headers: authHeaders() });
      }

      flashSaved("personal"); onSaved("Datos personales actualizados.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar datos personales."); }
    finally { setSaving(false); }
  };

  const handleSaveRol = async () => {
    if (!validateRol()) return;
    setSaving(true); setGlobalErr("");
    try {
      if (idRol === 2 && vet) await axios.patch(`/veterinarian/${staff.idPersonal}`, {
        especialidad: vetForm.especialidad,
        idMatricula: parseInt(vetForm.idMatricula),
        fechaExpedicion: vetForm.fechaExpedicion || null,   
        fechaVencimiento: vetForm.fechaVencimiento || null,  
      }, { headers: authHeaders() });
      else if (idRol === 3 && asst) await axios.patch(`/assistant/${staff.idPersonal}`, { certificados: asstForm.certificados || null }, { headers: authHeaders() });
      else if (idRol === 1 && adm) await axios.patch(`/admin/${staff.idPersonal}`, { areaResponsabilidad: admForm.areaResponsabilidad }, { headers: authHeaders() });
      flashSaved("rol"); onSaved("Datos del rol actualizados.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar datos del rol."); }
    finally { setSaving(false); }
  };

  // Punto 5: usa helpers centralizados
  const handleSaveAcceso = async () => {
    if (!validateAcceso()) return;
    setSaving(true); setGlobalErr("");
    try {
      if (!hasUser) {
        if (accessMode === "create") {
          if (!inferredRol) { setGlobalErr("No se puede determinar el rol. Verificá que el personal tenga un tipo de rol asignado."); setSaving(false); return; }
          await createAndLinkUser({ usuario: newUserForm.usuario, contraseña: newUserForm.contraseña, idRol: inferredRol, entityType: "staff", entityId: staff.idPersonal });
        }
        if (accessMode === "existing") await linkExistingUser({ idUsuario: selectedUserId, entityType: "staff", entityId: staff.idPersonal });
      } else {
        const payload = { estado: userEstado };
        if (newPassword) payload.contraseña = newPassword;
        await axios.patch(`/user/${staff.User.idUsuario}`, payload, { headers: authHeaders() });
      }
      flashSaved("acceso"); onSaved("Acceso actualizado.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar acceso."); }
    finally { setSaving(false); }
  };

  // Punto 5: usa helper centralizado
  const handleUnlink = async () => {
    setSaving(true); setGlobalErr("");
    try {
      await unlinkUser({ entityType: "staff", entityId: staff.idPersonal });
      setConfirmUnlink(false); onSaved("Usuario desvinculado.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al desvincular usuario."); }
    finally { setSaving(false); }
  };

  const renderRolFields = () => {
    if (idRol === 2) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}><div><div style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>Datos de Veterinario</div></div></div>
        <Field label="Especialidad" required error={errors.especialidad}><input style={inputStyle(errors.especialidad)} value={vetForm.especialidad} onChange={e => setVet("especialidad", e.target.value)} placeholder="Clínica General, Cirugía..." /></Field>
        <Field label="N° de matrícula" required error={errors.matricula}>
          <input type="number" style={inputStyle(errors.idMatricula)} value={vetForm.idMatricula} onChange={e => setVet("idMatricula", e.target.value)} placeholder="12345" />
        </Field>
        <Field label="Fecha de expedición" required error={errors.fechaExpedicion}>
          <input type="date" style={inputStyle(errors.fechaExpedicion)} value={vetForm.fechaExpedicion} onChange={e => setVet("fechaExpedicion", e.target.value)} />
        </Field>
        <Field label="Fecha de vencimiento" error={errors.fechaVencimiento}>
          <input type="date" style={inputStyle(errors.fechaVencimiento)} value={vetForm.fechaVencimiento} onChange={e => setVet("fechaVencimiento", e.target.value)} />
        </Field>
        {staff.Veterinarian?.Horarios?.length > 0 && (
          <div style={{ background: "#f8fafc", border: `1px solid ${VET_COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Horarios registrados</div>
            {staff.Veterinarian.Horarios.map((h, i) => (<div key={i} style={{ fontSize: 12, color: "#475569", display: "flex", gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 600, minWidth: 90 }}>{h.diaSemana || h.dia || `Horario ${i+1}`}</span><span>{h.horaInicio} – {h.horaFin}</span></div>))}
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>Los horarios se gestionan desde la sección de Turnos.</p>
          </div>
        )}
      </div>
    );
    if (idRol === 3) return (<div style={{ display: "flex", flexDirection: "column", gap: 14 }}><div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}><div><div style={{ fontWeight: 700, fontSize: 13, color: "#b45309" }}>Datos de Asistente</div></div></div><Field label="Certificados (opcional)" error={errors.certificados}><textarea style={{ ...inputStyle(false), resize: "vertical", minHeight: 100 }} value={asstForm.certificados} onChange={e => setAss("certificados", e.target.value)} placeholder="Primeros auxilios..." /></Field></div>);
    if (idRol === 1) return (<div style={{ display: "flex", flexDirection: "column", gap: 14 }}><div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}><div><div style={{ fontWeight: 700, fontSize: 13, color: "#6d28d9" }}>Datos de Administrador</div></div></div><Field label="Área de responsabilidad" required error={errors.areaResponsabilidad}><input style={inputStyle(errors.areaResponsabilidad)} value={admForm.areaResponsabilidad} onChange={e => setAdm("areaResponsabilidad", e.target.value)} placeholder="Gestión general..." /></Field></div>);
    if (idRol === 4) return (<div style={{ background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}><div><div style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>Vendedor</div><p style={{ margin: "4px 0 0", fontSize: 12, color: "#065f46", opacity: 0.85 }}>Sin datos adicionales configurables.</p></div></div>);
    return null;
  };

  const renderAcceso = () => {
    if (hasUser) {
      const u = staff.User;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: u.estado ? "#f0fdf4" : "#fff5f5", border: `1px solid ${u.estado ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: u.estado ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔐</div>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>@{u.usuario}</div><div style={{ fontSize: 11, color: "#64748b" }}>ID: {u.idUsuario}</div></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: u.estado ? "#dcfce7" : "#fee2e2", color: u.estado ? "#166534" : "#991b1b", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.estado ? "#16a34a" : "#dc2626" }} />{u.estado ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Rol: <strong>{ROLE_META[u.idRol]?.icon} {ROLE_META[u.idRol]?.label}</strong></div>
          </div>
          <Field label="Estado de la cuenta">
            <div style={{ display: "flex", gap: 10 }}>
              {[{ v: true, l: "✅ Activo" }, { v: false, l: "❌ Inactivo" }].map(opt => (
                <button key={String(opt.v)} type="button" onClick={() => setUserEstado(opt.v)} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `2px solid ${userEstado === opt.v ? VET_COLORS.accent : VET_COLORS.border}`, background: userEstado === opt.v ? (VET_COLORS.accentLight || "#f0fdf4") : "white", color: userEstado === opt.v ? VET_COLORS.accent : "#64748b" }}>{opt.l}</button>
              ))}
            </div>
          </Field>
          <Field label="Nueva contraseña (vacío = no cambiar)" error={errors.newPassword}><input type="password" style={inputStyle(errors.newPassword)} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" /></Field>
          <div style={{ padding: "14px 16px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#c62828", marginBottom: 6 }}>⚠️ Zona peligrosa</div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>Desvincular elimina la asociación. El usuario <strong>no se elimina</strong>, solo queda libre.</p>
            <button type="button" onClick={() => setConfirmUnlink(true)} style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "1.5px solid #c62828", background: "white", color: "#c62828", cursor: "pointer" }}>🔓 Desvincular usuario</button>
          </div>
          {confirmUnlink && <ConfirmModal title="¿Desvincular usuario?" message={`La cuenta "@${staff.User.usuario}" quedará libre y este personal no tendrá acceso hasta que se le asigne otra cuenta.`} onConfirm={handleUnlink} onCancel={() => setConfirmUnlink(false)} danger />}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}><strong>Sin acceso al sistema.</strong> Podés crear una cuenta nueva o asociar una existente.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ key: "create", icon: "➕", label: "Crear usuario nuevo", desc: "Generar nuevas credenciales" }, { key: "existing", icon: "🔗", label: "Asociar existente", desc: "Vincular cuenta libre" }].map(opt => (
            <button key={opt.key} type="button" onClick={() => { setAccessMode(opt.key); setErrors({}); }} style={{ padding: "12px 10px", borderRadius: 10, textAlign: "center", border: `2px solid ${accessMode === opt.key ? VET_COLORS.accent : VET_COLORS.border}`, background: accessMode === opt.key ? (VET_COLORS.accentLight || "#f0fdf4") : "white", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: accessMode === opt.key ? VET_COLORS.accent : "#334155" }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        {accessMode === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px", background: "#f8fafc", borderRadius: 10, border: `1px solid ${VET_COLORS.border}` }}>
            <Field label="Nombre de usuario" required error={errors.usuario}><input style={inputStyle(errors.usuario)} value={newUserForm.usuario} onChange={e => setNU("usuario", e.target.value)} placeholder="ej: jperez" autoComplete="off" /></Field>
            <Field label="Contraseña" required error={errors.contraseña}><input type="password" style={inputStyle(errors.contraseña)} value={newUserForm.contraseña} onChange={e => setNU("contraseña", e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" /></Field>
            {inferredRol && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: ROLE_META[inferredRol]?.bg, borderRadius: 8 }}><span style={{ fontSize: 18 }}>{ROLE_META[inferredRol]?.icon}</span><div><div style={{ fontSize: 11, color: "#64748b" }}>Rol asignado automáticamente</div><div style={{ fontSize: 13, fontWeight: 700, color: ROLE_META[inferredRol]?.color }}>{ROLE_META[inferredRol]?.label}</div></div></div>}
          </div>
        )}
        {accessMode === "existing" && (
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: `1px solid ${VET_COLORS.border}` }}>
            {loadingUsers ? <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Cargando usuarios disponibles...</p>
              : compatibleUsers.length === 0 ? <div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No hay usuarios con rol <strong>{ROLE_META[inferredRol]?.label}</strong> disponibles.</p></div>
              : <Field label="Seleccionar usuario" required error={errors.selectedUserId}><select style={inputStyle(errors.selectedUserId)} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}><option value="">— Elegir usuario —</option>{compatibleUsers.map(u => <option key={u.idUsuario} value={u.idUsuario}>@{u.usuario} — {u.estado ? "✅ Activo" : "❌ Inactivo"}</option>)}</select></Field>}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { key: "personal", label: "Datos personales" },
    ...(hasRoleFields ? [{ key: "rol", label: `Datos del rol` }] : []),
    { key: "acceso", label: "Acceso al sistema" },
  ];
  const currentSaveHandler = activeTab === "personal" ? handleSavePersonal : activeTab === "rol" ? handleSaveRol : handleSaveAcceso;
  const currentSaveLabel   = activeTab === "personal" ? "Guardar datos personales" : activeTab === "rol" ? "Guardar datos del rol" : hasUser ? "Guardar acceso" : accessMode === "none" ? null : "Vincular usuario";

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1999 }} onClick={onClose} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2000, width: 520, maxWidth: "96vw", background: "white", boxShadow: "-8px 0 48px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", background: roleMeta.color, color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{roleMeta.icon}</div>
              <div><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Editar personal</h2><p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.85 }}>{staff.nombres} {staff.apellidos}</p></div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{roleMeta.icon} {roleMeta.label}</span>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>DNI: {staff.dni}</span>
              {staff.User?.usuario ? <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>@{staff.User.usuario}</span> : <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", padding: "2px 10px", borderRadius: 20, fontWeight: 600, opacity: 0.7 }}>Sin usuario</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>
        <div style={{ display: "flex", background: "#f8fafc", borderBottom: `1px solid ${VET_COLORS.border}` }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setErrors({}); setGlobalErr(""); setActiveTab(tab.key); }} style={{ flex: 1, padding: "13px 6px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, background: activeTab === tab.key ? "white" : "#f8fafc", color: activeTab === tab.key ? roleMeta.color : "#64748b", borderBottom: activeTab === tab.key ? `3px solid ${roleMeta.color}` : "3px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {tab.label}{savedTabs[tab.key] && <span style={{ marginLeft: 5, fontSize: 10, color: "#16a34a" }}>✓ Guardado</span>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {globalErr && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}><p style={{ margin: 0, fontSize: 13, color: "#c62828", fontWeight: 600 }}>⚠️ {globalErr}</p></div>}
          {activeTab === "personal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nombres" required error={errors.nombres}><input style={inputStyle(errors.nombres)} value={form.nombres} onChange={e => set("nombres", e.target.value)} /></Field>
                <Field label="Apellidos" required error={errors.apellidos}><input style={inputStyle(errors.apellidos)} value={form.apellidos} onChange={e => set("apellidos", e.target.value)} /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="DNI" required error={errors.dni}><input style={inputStyle(errors.dni)} value={form.dni} onChange={e => set("dni", e.target.value.replace(/\D/g,""))} maxLength={10} /></Field>
                <Field label="Sexo" required error={errors.sexo}><select style={inputStyle(errors.sexo)} value={form.sexo} onChange={e => set("sexo", e.target.value)}><option value="">— Seleccionar —</option>{SEXO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Fecha de nacimiento" required error={errors.fechaNacimiento}><input type="date" style={inputStyle(errors.fechaNacimiento)} value={form.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} /></Field>
                <Field label="Teléfono" required error={errors.telefono}><input style={inputStyle(errors.telefono)} value={form.telefono} onChange={e => set("telefono", e.target.value)} /></Field>
              </div>
              <Field label="Correo electrónico" error={errors.correo}><input type="email" style={inputStyle(errors.correo)} value={form.correo} onChange={e => set("correo", e.target.value)} /></Field>
              <Field label="Dirección" required error={errors.direccion}><input style={inputStyle(errors.direccion)} value={form.direccion} onChange={e => set("direccion", e.target.value)} /></Field>
              <Field label="Localidad"><select style={inputStyle(false)} value={form.idLocalidad} onChange={e => set("idLocalidad", e.target.value)}><option value="">— Seleccionar localidad —</option>{localities.map(l => <option key={l.idLocalidad} value={l.idLocalidad}>{l.nombre}</option>)}</select></Field>
              <div style={{ borderTop: `1px dashed ${VET_COLORS.border}`, paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Salario
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Tarifa por hora ($)" error={errors.tarifaHora}>
                    <input type="number" style={inputStyle(errors.tarifaHora)} value={form.tarifaHora} onChange={e => set("tarifaHora", e.target.value)} placeholder="ej: 1500" />
                  </Field>
                  <Field label="Horas trabajadas" error={errors.horasTrabajadas}>
                    <input type="number" style={inputStyle(errors.horasTrabajadas)} value={form.horasTrabajadas} onChange={e => set("horasTrabajadas", e.target.value)} placeholder="ej: 160" />
                  </Field>
                  <Field label="Fecha de liquidación" error={errors.fechaLiquidacion}>
                    <input type="date" style={inputStyle(errors.fechaLiquidacion)} value={form.fechaLiquidacion} onChange={e => set("fechaLiquidacion", e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          )}
          {activeTab === "rol" && renderRolFields()}
          {activeTab === "acceso" && renderAcceso()}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${VET_COLORS.border}`, background: "#fafbfc", display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancelar</button>
          {!(activeTab === "acceso" && !hasUser && accessMode === "none") && (
            <button onClick={currentSaveHandler} disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saving ? "#94a3b8" : roleMeta.color, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {saving ? "Guardando..." : currentSaveLabel}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
