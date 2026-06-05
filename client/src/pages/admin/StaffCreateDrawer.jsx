import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { VET_COLORS } from "../../layouts/AdminLayout";
import { createAndLinkUser, linkExistingUser, unlinkUser, authHeaders } from "../../hooks/userLinkHelpers";

export const ROLE_META = {
  1: { label: "Administrador", color: "#6d28d9", bg: "#ede9fe", icon: "🛡️" },
  2: { label: "Veterinario",   color: "#0369a1", bg: "#e0f2fe", icon: "🩺" },
  3: { label: "Asistente",     color: "#b45309", bg: "#fef3c7", icon: "🧑‍⚕️" },
  4: { label: "Vendedor",      color: "#065f46", bg: "#d1fae5", icon: "🛒" },
  5: { label: "Cliente",       color: "#be185d", bg: "#fce7f3", icon: "🐾" },
};

export const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

const STAFF_ROLES = [1, 2, 3, 4];

// ─── Token helper ──────────────────────────────────────────────────────────
const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });

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

export function inferRolFromStaff(staff) {
  if (staff.Admin)        return 1;
  if (staff.Veterinarian) return 2;
  if (staff.Assistant)    return 3;
  if (staff.Seller)       return 4;
  return null;
}


// ══════════════════════════════════════════════════════════════════════════════
// SalaryRow — fila horizontal con todos los datos del salario
// Se usa en renderPersonalTab del StaffEditDrawer
// ══════════════════════════════════════════════════════════════════════════════
function SalaryRow({ salary }) {
  if (!salary) return null;
 
  const total = parseFloat(salary.horasTrabajadas) * parseFloat(salary.tarifaHora);
  const totalStr = isNaN(total) ? "—" : `$${total.toLocaleString("es-AR")}`;
 
  const chip = (label, value, accent = false) => (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flex: 1, padding: "10px 14px", background: accent ? "#f0fdf4" : "white",
      borderRight: `1px solid ${VET_COLORS.border}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: accent ? 800 : 600, color: accent ? VET_COLORS.accent : "#1a202c" }}>
        {value}
      </span>
    </div>
  );
 
  return (
    <div style={{
      display: "flex", borderRadius: 10, overflow: "hidden",
      border: `1px solid ${VET_COLORS.border}`, background: "white",
    }}>
      {chip("ID salario",   `#${salary.idSalario}`)}
      {chip("Tarifa / hora", `$${parseFloat(salary.tarifaHora).toLocaleString("es-AR")}/h`)}
      {chip("Horas",         `${salary.horasTrabajadas} h`)}
      {chip("Liquidación",   salary.fechaLiquidacion || "—")}
      {/* último chip sin borde derecho + acento de total */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flex: 1, padding: "10px 14px", background: "#f0fdf4",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
          Total
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: VET_COLORS.accent }}>
          {totalStr}
        </span>
      </div>
    </div>
  );
}
 

// ══════════════════════════════════════════════════════════════════════════════
// InlineMatriculaPicker
// Permite seleccionar una matrícula existente (sin veterinario asignado)
// o crear una nueva directamente desde el drawer.
// ══════════════════════════════════════════════════════════════════════════════
function InlineMatriculaPicker({ value, onChange, error }) {
  const [mode,        setMode]        = useState("select"); // "select" | "create"
  const [cards,       setCards]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [newCard,     setNewCard]     = useState({ idMatricula: "", fechaExpedicion: "", fechaVencimiento: "" });
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");
  const [createOk,    setCreateOk]    = useState(false);

  // Carga matrículas disponibles (sin veterinario asignado)
  const loadCards = () => {
    setLoading(true);
    axios.get("/cards", { headers: auth() })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        // Filtramos las que ya tienen un veterinario (idPersonal ocupado)
        // El backend idealmente devuelve esto, pero filtramos client-side también
        const free = all.filter(c => !c.Veterinarian);
        setCards(free);
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (mode === "select") loadCards(); }, [mode]);

  const handleCreate = async () => {
    setCreateError("");
    if (!newCard.idMatricula || !newCard.fechaExpedicion || !newCard.fechaVencimiento) {
      setCreateError("Completá los tres campos de la matrícula.");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post("/card", {
        idMatricula:      parseInt(newCard.idMatricula),
        fechaExpedicion:  newCard.fechaExpedicion,
        fechaVencimiento: newCard.fechaVencimiento,
      }, { headers: auth() });
      const created = res.data;
      setCreateOk(true);
      onChange(created.idMatricula); // auto-selecciona la recién creada
      setTimeout(() => {
        setMode("select");
        setCreateOk(false);
        setNewCard({ idMatricula: "", fechaExpedicion: "", fechaVencimiento: "" });
        loadCards();
      }, 1200);
    } catch (err) {
      setCreateError(err?.response?.data?.msg || "Error al crear la matrícula.");
    } finally { setCreating(false); }
  };

  const nc = (f) => (e) => setNewCard(p => ({ ...p, [f]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Toggle mode */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { key: "select", label: "📋 Seleccionar existente" },
          { key: "create", label: "➕ Crear nueva" },
        ].map(opt => (
          <button
            key={opt.key} type="button"
            onClick={() => { setMode(opt.key); onChange(""); setCreateError(""); }}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `2px solid ${mode === opt.key ? "#0369a1" : VET_COLORS.border}`,
              background: mode === opt.key ? "#e0f2fe" : "white",
              color: mode === opt.key ? "#0369a1" : "#64748b", cursor: "pointer",
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* Seleccionar existente */}
      {mode === "select" && (
        loading
          ? <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>Cargando matrículas...</p>
          : cards.length === 0
            ? (
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
                  No hay matrículas disponibles. Creá una nueva con el botón de arriba.
                </p>
              </div>
            )
            : (
              <select
                style={inputStyle(error)}
                value={value}
                onChange={e => onChange(e.target.value)}
              >
                <option value="">— Seleccionar matrícula —</option>
                {cards.map(c => (
                  <option key={c.idMatricula} value={c.idMatricula}>
                    Matrícula #{c.idMatricula} · Vence: {c.fechaVencimiento || "—"}
                  </option>
                ))}
              </select>
            )
      )}

      {/* Crear nueva */}
      {mode === "create" && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="N° matrícula" required>
              <input
                type="number" style={inputStyle(false)}
                value={newCard.idMatricula} onChange={nc("idMatricula")}
                placeholder="ej: 12345"
              />
            </Field>
            <Field label="Expedición" required>
              <input
                type="date" style={inputStyle(false)}
                value={newCard.fechaExpedicion} onChange={nc("fechaExpedicion")}
              />
            </Field>
            <Field label="Vencimiento" required>
              <input
                type="date" style={inputStyle(false)}
                value={newCard.fechaVencimiento} onChange={nc("fechaVencimiento")}
              />
            </Field>
          </div>

          {createError && (
            <p style={{ margin: 0, fontSize: 12, color: "#c62828", fontWeight: 600 }}>⚠️ {createError}</p>
          )}
          {createOk && (
            <p style={{ margin: 0, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Matrícula creada y seleccionada</p>
          )}

          <button
            type="button" onClick={handleCreate} disabled={creating}
            style={{
              padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", background: creating ? "#94a3b8" : "#0369a1",
              color: "white", cursor: creating ? "not-allowed" : "pointer", alignSelf: "flex-start",
            }}
          >{creating ? "Guardando..." : "Guardar matrícula"}</button>
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 11, color: "#c62828" }}>{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// InlineSalarioPicker
// Permite seleccionar un salario existente (sin personal asignado) o crear uno.
// Concepto: cada empleado tiene SU salario individual (Opción B).
// ══════════════════════════════════════════════════════════════════════════════
function InlineSalarioPicker({ value, onChange }) {
  const [mode,        setMode]        = useState("select"); // "select" | "create"
  const [salaries,    setSalaries]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [newSal,      setNewSal]      = useState({ fechaLiquidacion: "", horasTrabajadas: "", tarifaHora: "" });
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");
  const [createOk,    setCreateOk]    = useState(false);

  const loadSalaries = () => {
    setLoading(true);
    axios.get("/salaries", { headers: auth() })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        // Solo los que no están asignados a ningún personal
        const free = all.filter(s => !s.Staff);
        setSalaries(free);
      })
      .catch(() => setSalaries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (mode === "select") loadSalaries(); }, [mode]);

  const handleCreate = async () => {
    setCreateError("");
    if (!newSal.fechaLiquidacion || !newSal.horasTrabajadas || !newSal.tarifaHora) {
      setCreateError("Completá todos los campos del salario.");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post("/salary", {
        fechaLiquidacion: newSal.fechaLiquidacion,
        horasTrabajadas:  parseFloat(newSal.horasTrabajadas),
        tarifaHora:       parseFloat(newSal.tarifaHora),
      }, { headers: auth() });
      const created = res.data;
      setCreateOk(true);
      onChange(created.idSalario);
      setTimeout(() => {
        setMode("select");
        setCreateOk(false);
        setNewSal({ fechaLiquidacion: "", horasTrabajadas: "", tarifaHora: "" });
        loadSalaries();
      }, 1200);
    } catch (err) {
      setCreateError(err?.response?.data?.msg || "Error al crear el salario.");
    } finally { setCreating(false); }
  };

  const ns = (f) => (e) => setNewSal(p => ({ ...p, [f]: e.target.value }));

  // Calcula el total estimado para mostrar en el selector
  const totalEstimado = (s) => {
    const total = parseFloat(s.horasTrabajadas) * parseFloat(s.tarifaHora);
    return isNaN(total) ? "—" : `$${total.toLocaleString("es-AR")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { key: "select", label: "📋 Seleccionar existente" },
          { key: "create", label: "➕ Crear nuevo" },
        ].map(opt => (
          <button
            key={opt.key} type="button"
            onClick={() => { setMode(opt.key); onChange(""); setCreateError(""); }}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `2px solid ${mode === opt.key ? VET_COLORS.accent : VET_COLORS.border}`,
              background: mode === opt.key ? (VET_COLORS.accentLight || "#f0fdf4") : "white",
              color: mode === opt.key ? VET_COLORS.accent : "#64748b", cursor: "pointer",
            }}
          >{opt.label}</button>
        ))}
      </div>

      {mode === "select" && (
        loading
          ? <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>Cargando salarios...</p>
          : salaries.length === 0
            ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>
                  No hay salarios disponibles sin asignar. Creá uno nuevo arriba.
                </p>
              </div>
            )
            : (
              <select
                style={inputStyle(false)}
                value={value}
                onChange={e => onChange(e.target.value)}
              >
                <option value="">— Seleccionar salario (opcional) —</option>
                {salaries.map(s => (
                  <option key={s.idSalario} value={s.idSalario}>
                    ID {s.idSalario} · ${s.tarifaHora}/h · {s.horasTrabajadas}h · Total: {totalEstimado(s)} · {s.fechaLiquidacion}
                  </option>
                ))}
              </select>
            )
      )}

      {mode === "create" && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Fecha liquidación" required>
              <input type="date" style={inputStyle(false)} value={newSal.fechaLiquidacion} onChange={ns("fechaLiquidacion")} />
            </Field>
            <Field label="Horas trabajadas" required>
              <input type="number" style={inputStyle(false)} value={newSal.horasTrabajadas} onChange={ns("horasTrabajadas")} placeholder="ej: 160" />
            </Field>
            <Field label="Tarifa/hora ($)" required>
              <input type="number" style={inputStyle(false)} value={newSal.tarifaHora} onChange={ns("tarifaHora")} placeholder="ej: 500" />
            </Field>
          </div>

          {/* Preview del total */}
          {newSal.horasTrabajadas && newSal.tarifaHora && (
            <div style={{ background: "white", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Total estimado</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: VET_COLORS.accent }}>
                ${(parseFloat(newSal.horasTrabajadas) * parseFloat(newSal.tarifaHora)).toLocaleString("es-AR")}
              </span>
            </div>
          )}

          {createError && <p style={{ margin: 0, fontSize: 12, color: "#c62828", fontWeight: 600 }}>⚠️ {createError}</p>}
          {createOk    && <p style={{ margin: 0, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Salario creado y seleccionado</p>}

          <button
            type="button" onClick={handleCreate} disabled={creating}
            style={{
              padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", background: creating ? "#94a3b8" : VET_COLORS.accent,
              color: "white", cursor: creating ? "not-allowed" : "pointer", alignSelf: "flex-start",
            }}
          >{creating ? "Guardando..." : "Guardar salario"}</button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

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

// ─── Step 1: Datos personales + Salario (opcional) ───────────────────────────
function Step1Personal({ form, errors, onChange, localities }) {
  const set = (f) => (e) => onChange(f, e.target.value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Nombres"   required error={errors.nombres}>  <input style={inputStyle(errors.nombres)}   value={form.nombres}   onChange={set("nombres")}   placeholder="Juan" /></Field>
        <Field label="Apellidos" required error={errors.apellidos}><input style={inputStyle(errors.apellidos)} value={form.apellidos} onChange={set("apellidos")} placeholder="Pérez" /></Field>
        <Field label="DNI" required error={errors.dni}>
          <input style={inputStyle(errors.dni)} value={form.dni} onChange={(e) => onChange("dni", e.target.value.replace(/\D/g, ""))} placeholder="30123456" maxLength={10} />
        </Field>
        <Field label="Sexo" required error={errors.sexo}>
          <select style={inputStyle(errors.sexo)} value={form.sexo} onChange={set("sexo")}>
            <option value="">— Seleccionar —</option>
            {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Fecha de nacimiento" required error={errors.fechaNacimiento}><input type="date" style={inputStyle(errors.fechaNacimiento)} value={form.fechaNacimiento} onChange={set("fechaNacimiento")} /></Field>
        <Field label="Teléfono" required error={errors.telefono}><input style={inputStyle(errors.telefono)} value={form.telefono} onChange={set("telefono")} placeholder="2983 123456" /></Field>
      </div>
      <Field label="Correo electrónico" error={errors.correo}>
        <input type="email" style={inputStyle(errors.correo)} value={form.correo} onChange={set("correo")} placeholder="juan@ejemplo.com" />
      </Field>
      <Field label="Dirección" required error={errors.direccion}>
        <input style={inputStyle(errors.direccion)} value={form.direccion} onChange={set("direccion")} placeholder="Calle 25 de Mayo 123" />
      </Field>
      <Field label="Localidad" error={errors.idLocalidad}>
        <select style={inputStyle(false)} value={form.idLocalidad} onChange={set("idLocalidad")}>
          <option value="">— Seleccionar localidad —</option>
          {localities.map((l) => <option key={l.idLocalidad} value={l.idLocalidad}>{l.nombre}</option>)}
        </select>
      </Field>

      {/* ── Salario ── */}
      <div style={{ borderTop: `1px solid ${VET_COLORS.border}`, paddingTop: 14, marginTop: 4 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            💰 Salario / Tarifa base <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
            Podés asociarlo ahora o más tarde desde la edición del personal.
          </p>
        </div>
        <InlineSalarioPicker
          value={form.idSalario}
          onChange={(v) => onChange("idSalario", v)}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Rol ─────────────────────────────────────────────────────────────
function Step2Rol({ selectedRole, onRoleChange, roleForm, onRoleFormChange, errors }) {
  const set = (f) => (e) => onRoleFormChange(f, e.target.value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RoleSelector value={selectedRole} onChange={onRoleChange} error={errors.idRol} />

      {/* VETERINARIO — especialidad + matrícula inline */}
      {selectedRole === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>🩺 Datos de Veterinario</div>
            <div style={{ fontSize: 11, color: "#0369a1", opacity: 0.8, marginTop: 2 }}>Especialidad y matrícula profesional</div>
          </div>
          <Field label="Especialidad" required error={errors.especialidad}>
            <input style={inputStyle(errors.especialidad)} value={roleForm.especialidad} onChange={set("especialidad")} placeholder="Clínica General, Cirugía..." />
          </Field>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Matrícula profesional <span style={{ color: "#c62828" }}>*</span>
            </label>
            <InlineMatriculaPicker
              value={roleForm.idMatricula}
              onChange={(v) => onRoleFormChange("idMatricula", v)}
              error={errors.idMatricula}
            />
          </div>
        </div>
      )}

      {/* ASISTENTE */}
      {selectedRole === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#b45309" }}>🧑‍⚕️ Datos de Asistente</div>
            <div style={{ fontSize: 11, color: "#b45309", opacity: 0.8, marginTop: 2 }}>Certificados opcionales</div>
          </div>
          <Field label="Certificados (opcional)" error={errors.certificados}>
            <textarea style={{ ...inputStyle(false), resize: "vertical", minHeight: 80 }} value={roleForm.certificados} onChange={set("certificados")} placeholder="Primeros auxilios, Administración veterinaria..." />
          </Field>
        </div>
      )}

      {/* ADMINISTRADOR */}
      {selectedRole === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#6d28d9" }}>🛡️ Datos de Administrador</div>
            <div style={{ fontSize: 11, color: "#6d28d9", opacity: 0.8, marginTop: 2 }}>Área de responsabilidad</div>
          </div>
          <Field label="Área de responsabilidad" required error={errors.areaResponsabilidad}>
            <input style={inputStyle(errors.areaResponsabilidad)} value={roleForm.areaResponsabilidad} onChange={set("areaResponsabilidad")} placeholder="Gestión general, Finanzas, RRHH..." />
          </Field>
        </div>
      )}

      {/* VENDEDOR */}
      {selectedRole === 4 && (
        <div style={{ background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>🛒 Vendedor</div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#065f46", opacity: 0.85 }}>No requiere datos adicionales.</p>
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

// ─── Step 3: Acceso ───────────────────────────────────────────────────────────
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
          {loadingUsers
            ? <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Cargando usuarios disponibles...</p>
            : compatibleUsers.length === 0
              ? <div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No hay usuarios con rol <strong>{m.label}</strong> disponibles para asociar.</p><p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Solo se muestran cuentas sin personal vinculado.</p></div>
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
  const [personal, setPersonal]       = useState({
    nombres: "", apellidos: "", dni: "", sexo: "",
    fechaNacimiento: "", telefono: "", direccion: "",
    correo: "", idLocalidad: "", idSalario: "",   // ← idSalario incluido
  });
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm]       = useState({ especialidad: "", idMatricula: "", certificados: "", areaResponsabilidad: "" });
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
      // ✓ Fix: usar axios directamente, sin apiUrl
      axios.get("/users", { headers: auth() })
        .then((res) => setExistingUsers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setExistingUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [step]);

  const setP = (f, v) => setPersonal((p) => ({ ...p, [f]: v }));
  const setR = (f, v) => setRoleForm((p) => ({ ...p, [f]: v }));
  const setU = (f, v) => setUserForm((p) => ({ ...p, [f]: v }));

  const validateStep1 = () => {
    const e = {};
    ["nombres","apellidos","dni","sexo","fechaNacimiento","telefono","direccion"].forEach((f) => {
      if (!personal[f]?.toString().trim()) e[f] = "Obligatorio";
    });
    if (personal.dni && !/^\d{7,10}$/.test(personal.dni)) e.dni = "7 a 10 dígitos numéricos";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!selectedRole) e.idRol = "Seleccioná un tipo de rol";
    if (selectedRole === 2) {
      if (!roleForm.especialidad.trim()) e.especialidad = "Obligatorio";
      if (!roleForm.idMatricula.toString().trim()) e.idMatricula = "Seleccioná o creá una matrícula";
    }
    if (selectedRole === 1 && !roleForm.areaResponsabilidad.trim()) e.areaResponsabilidad = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setGlobalError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  };
  const handleBack = () => { setErrors({}); setGlobalError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSaving(true);
    setGlobalError("");
    try {
      // 1. Crear Staff
      const staffPayload = {
        ...personal,
        idLocalidad: personal.idLocalidad ? parseInt(personal.idLocalidad) : null,
        idSalario:   personal.idSalario   ? parseInt(personal.idSalario)   : null,
      };
      // ✓ Fix: axios directo, sin apiUrl
      const staffRes   = await axios.post("/staff", staffPayload, { headers: auth() });
      const idPersonal = staffRes.data.idPersonal;

      // 2. Crear datos del rol
      // ✓ Fix: axios directo en todas las llamadas
      if (selectedRole === 2) await axios.post("/veterinarian", { idPersonal, especialidad: roleForm.especialidad, idMatricula: parseInt(roleForm.idMatricula) }, { headers: auth() });
      else if (selectedRole === 3) await axios.post("/assistant", { idPersonal, certificados: roleForm.certificados || null }, { headers: auth() });
      else if (selectedRole === 4) await axios.post("/seller",    { idPersonal }, { headers: auth() });
      else if (selectedRole === 1) await axios.post("/admin",     { idPersonal, areaResponsabilidad: roleForm.areaResponsabilidad }, { headers: auth() });

      // 3. Vincular usuario
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
          {globalError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#c62828", fontWeight: 600 }}>⚠️ {globalError}</p>
            </div>
          )}
          {step === 1 && <Step1Personal form={personal} errors={errors} onChange={setP} localities={localities} />}
          {step === 2 && <Step2Rol selectedRole={selectedRole} onRoleChange={(r) => { setSelectedRole(r); setErrors({}); }} roleForm={roleForm} onRoleFormChange={setR} errors={errors} />}
          {step === 3 && <Step3Acceso selectedRole={selectedRole} accessMode={accessMode} onModeChange={(m) => { setAccessMode(m); setErrors({}); setUserForm({ usuario: "", contraseña: "", idUsuarioExistente: "" }); }} userForm={userForm} onUserFormChange={setU} errors={errors} existingUsers={existingUsers} loadingUsers={loadingUsers} />}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${VET_COLORS.border}`, background: "#fafbfc", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          {step > 1
            ? <button onClick={handleBack} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>← Atrás</button>
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
// Cambios: apiUrl → axios directo, salario inline en tab "personal",
// matrícula inline en tab "rol" para veterinarios.
// ══════════════════════════════════════════════════════════════════════════════
export function StaffEditDrawer({ staff, localities, onClose, onSaved }) {
  const idRol    = inferRolFromStaff(staff) ?? staff.User?.idRol;
  const roleMeta = ROLE_META[idRol] || { label: "—", color: VET_COLORS.accent, bg: "#f1f5f9", icon: "👤" };

  const hasRoleFields = [1, 2, 3].includes(idRol);
  const hasUser       = !!staff.User;

  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState({
    nombres: staff.nombres || "", apellidos: staff.apellidos || "", dni: staff.dni || "",
    sexo: staff.sexo || "", fechaNacimiento: staff.fechaNacimiento || "",
    telefono: staff.telefono || "", direccion: staff.direccion || "",
    correo: staff.correo || "", idLocalidad: staff.idLocalidad || "",
    idSalario: staff.idSalario || "",   // ← incluido
  });

  const vet  = staff.Veterinarian || null;
  const asst = staff.Assistant    || null;
  const adm  = staff.Admin        || null;

  const [vetForm,  setVetFormS]  = useState({ especialidad: vet?.especialidad || "", idMatricula: vet?.idMatricula != null ? String(vet.idMatricula) : "" });
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

  const inferredRol     = inferRolFromStaff(staff);
  const compatibleUsers = existingUsers.filter(u => u.idRol === inferredRol && !u.Staff && !u.Client);

  useEffect(() => {
    if (activeTab === "acceso" && !hasUser) {
      setLoadingUsers(true);
      // ✓ Fix: axios directo
      axios.get("/users", { headers: auth() })
        .then(res => setExistingUsers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setExistingUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab, hasUser]);

  const validatePersonal = () => {
    const e = {};
    ["nombres","apellidos","dni","sexo","fechaNacimiento","telefono","direccion"].forEach(f => {
      if (!form[f]?.toString().trim()) e[f] = "Obligatorio";
    });
    if (form.dni && !/^\d{7,10}$/.test(form.dni)) e.dni = "7 a 10 dígitos numéricos";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateRol = () => {
    const e = {};
    if (idRol === 2) {
      if (!vetForm.especialidad.trim()) e.especialidad = "Obligatorio";
      if (!vetForm.idMatricula.toString().trim()) e.idMatricula = "Seleccioná o creá una matrícula";
    }
    if (idRol === 1 && !admForm.areaResponsabilidad.trim()) e.areaResponsabilidad = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const flashSaved = (tab) => {
    setSavedTabs(p => ({ ...p, [tab]: true }));
    setTimeout(() => setSavedTabs(p => ({ ...p, [tab]: false })), 2500);
  };

  const handleSavePersonal = async () => {
    if (!validatePersonal()) return;
    setSaving(true); setGlobalErr("");
    try {
      // ✓ Fix: axios directo
      await axios.patch(`/staff/${staff.idPersonal}`, {
        ...form,
        idLocalidad: form.idLocalidad ? parseInt(form.idLocalidad) : null,
        idSalario:   form.idSalario   ? parseInt(form.idSalario)   : null,
      }, { headers: auth() });
      flashSaved("personal");
      onSaved("Datos personales actualizados.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar datos personales."); }
    finally { setSaving(false); }
  };

  const handleSaveRol = async () => {
    if (!validateRol()) return;
    setSaving(true); setGlobalErr("");
    try {
      // ✓ Fix: axios directo
      if      (idRol === 2 && vet)  await axios.patch(`/veterinarian/${staff.idPersonal}`, { especialidad: vetForm.especialidad, idMatricula: parseInt(vetForm.idMatricula) }, { headers: auth() });
      else if (idRol === 3 && asst) await axios.patch(`/assistant/${staff.idPersonal}`,    { certificados: asstForm.certificados || null }, { headers: auth() });
      else if (idRol === 1 && adm)  await axios.patch(`/admin/${staff.idPersonal}`,        { areaResponsabilidad: admForm.areaResponsabilidad }, { headers: auth() });
      flashSaved("rol");
      onSaved("Datos del rol actualizados.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar datos del rol."); }
    finally { setSaving(false); }
  };

  const handleSaveAcceso = async () => {
    if (!validateAcceso()) return;
    setSaving(true); setGlobalErr("");
    try {
      if (!hasUser) {
        if (accessMode === "create") {
          if (!inferredRol) { setGlobalErr("No se puede determinar el rol."); setSaving(false); return; }
          await createAndLinkUser({ usuario: newUserForm.usuario, contraseña: newUserForm.contraseña, idRol: inferredRol, entityType: "staff", entityId: staff.idPersonal });
        }
        if (accessMode === "existing") await linkExistingUser({ idUsuario: selectedUserId, entityType: "staff", entityId: staff.idPersonal });
      } else {
        const payload = { estado: userEstado };
        if (newPassword) payload.contraseña = newPassword;
        // ✓ Fix: axios directo
        await axios.patch(`/user/${staff.User.idUsuario}`, payload, { headers: auth() });
      }
      flashSaved("acceso");
      onSaved("Acceso actualizado.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al guardar acceso."); }
    finally { setSaving(false); }
  };

  const handleUnlink = async () => {
    setSaving(true); setGlobalErr("");
    try {
      await unlinkUser({ entityType: "staff", entityId: staff.idPersonal });
      setConfirmUnlink(false);
      onSaved("Usuario desvinculado.");
    } catch (err) { setGlobalErr(err?.response?.data?.msg || "Error al desvincular usuario."); }
    finally { setSaving(false); }
  };

  const renderRolFields = () => {
    if (idRol === 2) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>🩺 Datos de Veterinario</div>
        </div>
        <Field label="Especialidad" required error={errors.especialidad}>
          <input style={inputStyle(errors.especialidad)} value={vetForm.especialidad} onChange={e => setVet("especialidad", e.target.value)} placeholder="Clínica General, Cirugía..." />
        </Field>
        {/* Matrícula inline en edición */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Matrícula profesional <span style={{ color: "#c62828" }}>*</span>
          </label>
          {/* Muestra la matrícula actual si existe */}
          {vet?.ProfessionalCard && (
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#0369a1" }}>
              Actual: Matrícula #{vet.idMatricula} · Vence: {vet.ProfessionalCard.fechaVencimiento || "—"}
            </div>
          )}
          <InlineMatriculaPicker
            value={vetForm.idMatricula}
            onChange={(v) => setVet("idMatricula", v)}
            error={errors.idMatricula}
          />
        </div>
        {staff.Veterinarian?.Horarios?.length > 0 && (
          <div style={{ background: "#f8fafc", border: `1px solid ${VET_COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Horarios registrados</div>
            {staff.Veterinarian.Horarios.map((h, i) => (
              <div key={i} style={{ fontSize: 12, color: "#475569", display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, minWidth: 90 }}>{h.diaSemana || h.dia || `Horario ${i+1}`}</span>
                <span>{h.horaInicio} – {h.horaFin}</span>
              </div>
            ))}
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>Los horarios se gestionan desde la sección de Turnos.</p>
          </div>
        )}
      </div>
    );
    if (idRol === 3) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#b45309" }}>🧑‍⚕️ Datos de Asistente</div>
        </div>
        <Field label="Certificados (opcional)" error={errors.certificados}>
          <textarea style={{ ...inputStyle(false), resize: "vertical", minHeight: 100 }} value={asstForm.certificados} onChange={e => setAss("certificados", e.target.value)} placeholder="Primeros auxilios..." />
        </Field>
      </div>
    );
    if (idRol === 1) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#6d28d9" }}>🛡️ Datos de Administrador</div>
        </div>
        <Field label="Área de responsabilidad" required error={errors.areaResponsabilidad}>
          <input style={inputStyle(errors.areaResponsabilidad)} value={admForm.areaResponsabilidad} onChange={e => setAdm("areaResponsabilidad", e.target.value)} placeholder="Gestión general..." />
        </Field>
      </div>
    );
    if (idRol === 4) return (
      <div style={{ background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>🛒 Vendedor</div>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#065f46", opacity: 0.85 }}>Sin datos adicionales configurables.</p>
      </div>
    );
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
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>@{u.usuario}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ID: {u.idUsuario}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: u.estado ? "#dcfce7" : "#fee2e2", color: u.estado ? "#166534" : "#991b1b", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.estado ? "#16a34a" : "#dc2626" }} />
                {u.estado ? "Activo" : "Inactivo"}
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
          <Field label="Nueva contraseña (vacío = no cambiar)" error={errors.newPassword}>
            <input type="password" style={inputStyle(errors.newPassword)} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </Field>
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
          {[
            { key: "create",   icon: "➕", label: "Crear usuario nuevo",  desc: "Generar nuevas credenciales" },
            { key: "existing", icon: "🔗", label: "Asociar existente",    desc: "Vincular cuenta libre" },
          ].map(opt => (
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
            {loadingUsers
              ? <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Cargando usuarios disponibles...</p>
              : compatibleUsers.length === 0
                ? <div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No hay usuarios con rol <strong>{ROLE_META[inferredRol]?.label}</strong> disponibles.</p></div>
                : <Field label="Seleccionar usuario" required error={errors.selectedUserId}><select style={inputStyle(errors.selectedUserId)} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}><option value="">— Elegir usuario —</option>{compatibleUsers.map(u => <option key={u.idUsuario} value={u.idUsuario}>@{u.usuario} — {u.estado ? "✅ Activo" : "❌ Inactivo"}</option>)}</select></Field>}
          </div>
        )}
      </div>
    );
  };

  // ─── Tab personal — incluye fila horizontal de salario al final ───────────
  const renderPersonalTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nombres"   required error={errors.nombres}>  <input style={inputStyle(errors.nombres)}   value={form.nombres}   onChange={e => set("nombres", e.target.value)} /></Field>
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
 
      {/* ── Sección salario ── */}
      <div style={{ borderTop: `1px solid ${VET_COLORS.border}`, paddingTop: 16, marginTop: 4 }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              💰 Salario / Tarifa base
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
              {staff.Salary ? "Salario actualmente asociado a este empleado." : "Sin salario asignado aún."}
            </p>
          </div>
          {staff.Salary && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: "#dcfce7", color: "#166534",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              Asignado
            </span>
          )}
        </div>
 
        {/* Fila horizontal con todos los datos del salario actual */}
        {staff.Salary && <SalaryRow salary={staff.Salary} />}
 
        {/* Separador antes del picker */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
            {staff.Salary ? "Cambiar o reasignar salario:" : "Asociar un salario:"}
          </div>
          <InlineSalarioPicker value={form.idSalario} onChange={(v) => set("idSalario", v)} />
        </div>
      </div>
    </div>
  );

  // Tab "personal" ahora incluye salario
  const renderPersonalTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nombres"   required error={errors.nombres}>  <input style={inputStyle(errors.nombres)}   value={form.nombres}   onChange={e => set("nombres", e.target.value)} /></Field>
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

      {/* Salario inline en edición */}
      <div style={{ borderTop: `1px solid ${VET_COLORS.border}`, paddingTop: 14, marginTop: 4 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            💰 Salario / Tarifa base <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
          </div>
          {staff.Salary && (
            <div style={{ marginTop: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534" }}>
              Actual: ${staff.Salary.tarifaHora}/h · {staff.Salary.horasTrabajadas}h · Total: ${(staff.Salary.tarifaHora * staff.Salary.horasTrabajadas).toLocaleString("es-AR")} · {staff.Salary.fechaLiquidacion}
            </div>
          )}
        </div>
        <InlineSalarioPicker
          value={form.idSalario}
          onChange={(v) => set("idSalario", v)}
        />
      </div>
    </div>
  );

  const tabs = [
    { key: "personal", label: "Datos personales" },
    ...(hasRoleFields ? [{ key: "rol", label: "Datos del rol" }] : []),
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
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Editar personal</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.85 }}>{staff.nombres} {staff.apellidos}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{roleMeta.icon} {roleMeta.label}</span>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>DNI: {staff.dni}</span>
              {staff.User?.usuario
                ? <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>@{staff.User.usuario}</span>
                : <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", padding: "2px 10px", borderRadius: 20, fontWeight: 600, opacity: 0.7 }}>Sin usuario</span>}
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
          {globalErr && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#c62828", fontWeight: 600 }}>⚠️ {globalErr}</p>
            </div>
          )}
          {activeTab === "personal" && renderPersonalTab()}
          {activeTab === "rol"      && renderRolFields()}
          {activeTab === "acceso"   && renderAcceso()}
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