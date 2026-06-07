import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../api/axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { VET_COLORS } from "../../layouts/AdminLayout";
import { ROLE_META, inputStyle, Field, ConfirmModal } from "./StaffCreateDrawer";
import { useWindowSize } from "../../hooks/useWindowSize";

const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function parsePeriodo(fecha) {
  if (!fecha) return { mes: null, anio: null, label: "—" };
  const d    = new Date(fecha + "T00:00:00");
  const mes  = d.getMonth();
  const anio = d.getFullYear();
  return { mes, anio, label: `${MESES[mes]} ${anio}` };
}

// ─── Recibo PDF (template HTML oculto) ────────────────────────────────────
function ReciboTemplate({ ref: _, salary, staff, rolMeta }) {
  const bruto = (parseFloat(salary.tarifaHora) * parseInt(salary.horasTrabajadas));
  const p = parsePeriodo(salary.fechaLiquidacion);
  return (
    <div
      style={{
        width: 600, padding: "40px 48px", fontFamily: "Arial, sans-serif",
        background: "white", color: "#1a202c", boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#166534" }}>🐾 Veterinaria</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Sistema de Gestión</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>RECIBO DE SUELDO</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Período: {p.label}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ID #{salary.idSalario}</div>
        </div>
      </div>

      {/* Empleado */}
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Datos del empleado</div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{staff.nombres} {staff.apellidos}</div>
        <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>DNI: <strong>{staff.dni}</strong></span>
          <span style={{ fontSize: 12, color: "#64748b" }}>Rol: <strong>{rolMeta?.label || "—"}</strong></span>
        </div>
      </div>

      {/* Tabla conceptos */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Concepto</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Cantidad</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Valor</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px" }}>Salario básico</td>
            <td style={{ padding: "10px 12px", textAlign: "right" }}>{salary.horasTrabajadas} hs</td>
            <td style={{ padding: "10px 12px", textAlign: "right" }}>${fmt(salary.tarifaHora)}/h</td>
            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>${fmt(bruto)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0fdf4" }}>
            <td colSpan={3} style={{ padding: "12px 12px", fontWeight: 700, color: "#166534", fontSize: 14 }}>TOTAL NETO A COBRAR</td>
            <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 800, color: "#166534", fontSize: 16 }}>${fmt(bruto)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8" }}>
        <div>Fecha de emisión: {new Date().toLocaleDateString("es-AR")}</div>
        <div>Documento generado automáticamente</div>
      </div>
    </div>
  );
}

// ─── Modal nueva liquidación ───────────────────────────────────────────────
function NuevaLiquidacionModal({ staffList, onClose, onSaved, showToast }) {
  const [formData, setFormData] = useState({
    idPersonal: "", tarifaHora: "", horasTrabajadas: "", fechaLiquidacion: ""
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!formData.idPersonal)      e.idPersonal      = "Obligatorio";
    if (!formData.tarifaHora || parseFloat(formData.tarifaHora) <= 0)
                                   e.tarifaHora       = "Debe ser mayor a 0";
    if (!formData.horasTrabajadas || parseInt(formData.horasTrabajadas) < 0)
                                   e.horasTrabajadas  = "Debe ser 0 o más";
    if (!formData.fechaLiquidacion) e.fechaLiquidacion = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post("/salary", {
        idPersonal:       parseInt(formData.idPersonal),
        tarifaHora:       parseFloat(formData.tarifaHora),
        horasTrabajadas:  parseInt(formData.horasTrabajadas),
        fechaLiquidacion: formData.fechaLiquidacion,
      }, { headers: auth() });
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.msg || "Error al guardar.", "error");
    } finally { setSaving(false); }
  };

  const bruto = formData.tarifaHora && formData.horasTrabajadas
    ? parseFloat(formData.tarifaHora) * parseInt(formData.horasTrabajadas)
    : null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1999 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 2000, width: 480, maxWidth: "94vw", background: "white",
        borderRadius: 16, boxShadow: "0 20px 48px rgba(0,0,0,0.18)", overflow: "hidden"
      }}>
        <div style={{ padding: "18px 22px", background: VET_COLORS.accent, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📝 Nueva liquidación</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 30, height: 30, borderRadius: 7, fontSize: 17, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Empleado" required error={errors.idPersonal}>
            <select style={inputStyle(errors.idPersonal)} value={formData.idPersonal} onChange={e => set("idPersonal", e.target.value)}>
              <option value="">— Seleccionar empleado —</option>
              {staffList.map(s => (
                <option key={s.idPersonal} value={s.idPersonal}>
                  {s.nombres} {s.apellidos} — DNI {s.dni}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Período (fecha de liquidación)" required error={errors.fechaLiquidacion}>
            <input type="date" style={inputStyle(errors.fechaLiquidacion)} value={formData.fechaLiquidacion} onChange={e => set("fechaLiquidacion", e.target.value)} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tarifa por hora ($)" required error={errors.tarifaHora}>
              <input type="number" min="0.01" step="0.01" style={inputStyle(errors.tarifaHora)} value={formData.tarifaHora} onChange={e => set("tarifaHora", e.target.value)} placeholder="ej: 1800" />
            </Field>
            <Field label="Horas trabajadas" required error={errors.horasTrabajadas}>
              <input type="number" min="0" style={inputStyle(errors.horasTrabajadas)} value={formData.horasTrabajadas} onChange={e => set("horasTrabajadas", e.target.value)} placeholder="ej: 160" />
            </Field>
          </div>

          {bruto !== null && (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Total bruto estimado</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>${fmt(bruto)}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancelar</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: saving ? "#94a3b8" : VET_COLORS.accent, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {saving ? "Guardando..." : "Registrar liquidación"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modal editar liquidación ──────────────────────────────────────────────
function EditarLiquidacionModal({ salary, onClose, onSaved, showToast }) {
  const [tarifaHora,       setTarifaHora]       = useState(String(salary.tarifaHora));
  const [horasTrabajadas,  setHorasTrabajadas]  = useState(String(salary.horasTrabajadas));
  const [errors,           setErrors]           = useState({});
  const [saving,           setSaving]           = useState(false);

  const handleSave = async () => {
    const e = {};
    if (!tarifaHora || parseFloat(tarifaHora) <= 0) e.tarifaHora = "Debe ser mayor a 0";
    if (!horasTrabajadas || parseInt(horasTrabajadas) < 0) e.horasTrabajadas = "Debe ser 0 o más";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await axios.patch(`/salary/${salary.idSalario}`, {
        tarifaHora:      parseFloat(tarifaHora),
        horasTrabajadas: parseInt(horasTrabajadas),
      }, { headers: auth() });
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.msg || "Error al actualizar.", "error");
    } finally { setSaving(false); }
  };

  const bruto = tarifaHora && horasTrabajadas
    ? parseFloat(tarifaHora) * parseInt(horasTrabajadas)
    : null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1999 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 2000, width: 400, maxWidth: "94vw", background: "white",
        borderRadius: 16, boxShadow: "0 20px 48px rgba(0,0,0,0.18)", overflow: "hidden"
      }}>
        <div style={{ padding: "18px 22px", background: "#0369a1", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✏️ Editar liquidación #{salary.idSalario}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 30, height: 30, borderRadius: 7, fontSize: 17, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "10px 14px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
            ⚠️ Solo podés modificar tarifa y horas. El período y el empleado no se pueden cambiar para mantener el historial.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tarifa por hora ($)" error={errors.tarifaHora}>
              <input type="number" min="0.01" step="0.01" style={inputStyle(errors.tarifaHora)} value={tarifaHora} onChange={e => setTarifaHora(e.target.value)} />
            </Field>
            <Field label="Horas trabajadas" error={errors.horasTrabajadas}>
              <input type="number" min="0" style={inputStyle(errors.horasTrabajadas)} value={horasTrabajadas} onChange={e => setHorasTrabajadas(e.target.value)} />
            </Field>
          </div>
          {bruto !== null && (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Total bruto</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>${fmt(bruto)}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: saving ? "#94a3b8" : "#0369a1", color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function SalaryTab({ showToast }) {
  const [staffList,    setStaffList]    = useState([]);
  const [salaries,     setSalaries]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  const { isMobile } = useWindowSize();

  // Filtros
  const [staffFilter,  setStaffFilter]  = useState("");
  const [mesFilter,    setMesFilter]    = useState("");
  const [anioFilter,   setAnioFilter]   = useState("");

  // Modales
  const [showNueva,    setShowNueva]    = useState(false);
  const [editSalary,   setEditSalary]   = useState(null);

  // PDF
  const [generatingPdf, setGeneratingPdf] = useState(null);
  const reciboRef = useRef(null);
  const [pdfPendiente, setPdfPendiente] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        axios.get("/salaries", { headers: auth() }),
        axios.get("/staffs",   { headers: auth() }),
      ]);
      // El backend devuelve 404 cuando no hay resultados — normalizamos a []
      setSalaries(Array.isArray(sRes.data) ? sRes.data : []);
      setStaffList(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (err) {
      if (err?.response?.status !== 404) {
        showToast("Error al cargar salarios.", "error");
      }
      setSalaries([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const staffById = (id) => staffList.find(s => s.idPersonal === parseInt(id));

  const rolMetaDeStaff = (s) => {
    if (!s) return null;
    if (s.Admin)        return ROLE_META[1];
    if (s.Veterinarian) return ROLE_META[2];
    if (s.Assistant)    return ROLE_META[3];
    if (s.Seller)       return ROLE_META[4];
    return null;
  };

  // ── Años disponibles para el filtro ───────────────────────────────────
  const aniosDisponibles = [...new Set(
    salaries.map(s => new Date(s.fechaLiquidacion + "T00:00:00").getFullYear())
  )].sort((a, b) => b - a);

  // ── Filtrado ──────────────────────────────────────────────────────────
  const salariesFiltradas = salaries.filter(sal => {
    if (staffFilter && sal.idPersonal !== parseInt(staffFilter)) return false;
    if (mesFilter !== "" || anioFilter !== "") {
      const d    = new Date(sal.fechaLiquidacion + "T00:00:00");
      const mes  = d.getMonth();
      const anio = d.getFullYear();
      if (mesFilter !== "" && mes !== parseInt(mesFilter))  return false;
      if (anioFilter !== "" && anio !== parseInt(anioFilter)) return false;
    }
    return true;
  });

  // ── Agrupado por empleado ─────────────────────────────────────────────
  const grupos = staffList
    .map(s => ({
      staff: s,
      sals:  salariesFiltradas
        .filter(sal => sal.idPersonal === s.idPersonal)
        .sort((a, b) => new Date(b.fechaLiquidacion) - new Date(a.fechaLiquidacion))
    }))
    .filter(g => g.sals.length > 0);

  // ── Dashboard stats ────────────────────────────────────────────────────
  const totalMasa    = salariesFiltradas.reduce((acc, s) => acc + parseFloat(s.tarifaHora) * parseInt(s.horasTrabajadas), 0);
  const totalHoras   = salariesFiltradas.reduce((acc, s) => acc + parseInt(s.horasTrabajadas), 0);
  const empleadosCon = new Set(salariesFiltradas.map(s => s.idPersonal)).size;
  const empleadosSin = staffList.length - empleadosCon;

  useEffect(() => {
    if (!pdfPendiente || !reciboRef.current) return;
  
    const { salary, staff } = pdfPendiente;
    html2canvas(reciboRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
      .then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf     = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pdfW    = pdf.internal.pageSize.getWidth();
        const pdfH    = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
        pdf.save(`recibo_${staff.apellidos}_${salary.fechaLiquidacion}.pdf`);
      })
      .catch(() => showToast("Error al generar el PDF.", "error"))
      .finally(() => { setPdfPendiente(null); setGeneratingPdf(null); });
  }, [pdfPendiente]);

  // ── Exportar PDF ──────────────────────────────────────────────────────
  const exportarPDF = (salary, staff) => {
    setGeneratingPdf(salary.idSalario);
    setPdfPendiente({ salary, staff }); // esto dispara el useEffect cuando el DOM esté listo
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Modales */}
      {showNueva && (
        <NuevaLiquidacionModal
          staffList={staffList}
          onClose={() => setShowNueva(false)}
          showToast={showToast}
          onSaved={() => {
            showToast("Liquidación registrada correctamente.");
            setShowNueva(false);
            fetchAll();
          }}
        />
      )}

      {editSalary && (
        <EditarLiquidacionModal
          salary={editSalary}
          onClose={() => setEditSalary(null)}
          showToast={showToast}
          onSaved={() => {
            showToast("Liquidación actualizada.");
            setEditSalary(null);
            fetchAll();
          }}
        />
      )}

      {/* Recibo oculto para html2canvas */}
      {pdfPendiente !== null && (() => {
        const { salary: sal, staff } = pdfPendiente;
        const rolM = rolMetaDeStaff(staff);
        return (
            <div style={{ position: "absolute", left: -9999, top: 0 }}>
            <div ref={reciboRef}>
                <ReciboTemplate salary={sal} staff={staff} rolMeta={rolM} />
            </div>
            </div>
        );
        })()}

      {/* ── Dashboard ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Masa salarial", value: `$${fmtShort(totalMasa)}`, icon: "💰", color: "#166534", bg: "#f0fdf4" },
          { label: "Total horas",   value: `${fmtShort(totalHoras)} hs`, icon: "🕐", color: "#0369a1", bg: "#eff6ff" },
          { label: "Empleados liquidados", value: empleadosCon, icon: "✅", color: "#166534", bg: "#f0fdf4" },
          { label: "Sin liquidación", value: empleadosSin, icon: "⚠️", color: empleadosSin > 0 ? "#92400e" : "#64748b", bg: empleadosSin > 0 ? "#fef3c7" : "#f8fafc" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${VET_COLORS.border}` }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros + botón ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} style={{ ...inputStyle(false), flex: 2, minWidth: 180 }}>
          <option value="">Todo el personal</option>
          {staffList.map(s => (
            <option key={s.idPersonal} value={s.idPersonal}>{s.nombres} {s.apellidos}</option>
          ))}
        </select>

        <select value={mesFilter} onChange={e => setMesFilter(e.target.value)} style={{ ...inputStyle(false), maxWidth: 140 }}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>

        <select value={anioFilter} onChange={e => setAnioFilter(e.target.value)} style={{ ...inputStyle(false), maxWidth: 110 }}>
          <option value="">Todos los años</option>
          {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {(staffFilter || mesFilter !== "" || anioFilter !== "") && (
          <button
            onClick={() => { setStaffFilter(""); setMesFilter(""); setAnioFilter(""); }}
            style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${VET_COLORS.border}`, background: "white", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Limpiar filtros
          </button>
        )}

        <button
          onClick={() => setShowNueva(true)}
          style={{ marginLeft: "auto", padding: "9px 18px", borderRadius: 8, border: "none", background: VET_COLORS.accent, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(45,106,79,0.25)", whiteSpace: "nowrap" }}
        >
          + Nueva liquidación
        </button>
      </div>

      {/* ── Resultados ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>Cargando...</div>
      ) : grupos.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: VET_COLORS.textMuted }}>
          {salariesFiltradas.length === 0 && salaries.length > 0
            ? "No hay liquidaciones para los filtros seleccionados."
            : "No hay liquidaciones registradas."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {grupos.map(({ staff: s, sals }) => {
            const rolM = rolMetaDeStaff(s) || { label: "—", color: "#64748b", bg: "#f1f5f9" };
            const totalBrutoStaff = sals.reduce((acc, sal) => acc + parseFloat(sal.tarifaHora) * parseInt(sal.horasTrabajadas), 0);

            return (
              <div key={s.idPersonal} style={{ background: "white", border: `1px solid ${VET_COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                {/* Header empleado */}
                <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: `1px solid ${VET_COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: rolM.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>{s.nombres} {s.apellidos}</div>
                    <div style={{ fontSize: 11, color: VET_COLORS.textMuted }}>DNI {s.dni} · {s.User?.usuario ? `@${s.User.usuario}` : "Sin usuario"}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: rolM.bg, color: rolM.color }}>{rolM.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>${fmtShort(totalBrutoStaff)}</div>
                    <div style={{ fontSize: 10, color: VET_COLORS.textMuted }}>{sals.length} liquidación{sals.length !== 1 ? "es" : ""}</div>
                  </div>
                </div>

                {/* Tabla */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      {["Período", "Tarifa/hora", "Horas", "Total bruto", "Acciones"].map((h, i) => (
                        <th key={i} style={{ padding: "9px 16px", textAlign: i === 4 ? "right" : "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: VET_COLORS.textMuted, letterSpacing: "0.04em", borderBottom: `1px solid ${VET_COLORS.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sals.map((sal, idx) => {
                      const bruto = parseFloat(sal.tarifaHora) * parseInt(sal.horasTrabajadas);
                      const p     = parsePeriodo(sal.fechaLiquidacion);
                      const isPdf = generatingPdf === sal.idSalario;
                      return (
                        <tr key={sal.idSalario} style={{ borderBottom: idx < sals.length - 1 ? `1px solid ${VET_COLORS.border}` : "none", background: idx === 0 ? "#f0fdf4" : "white" }}>
                          <td style={{ padding: "11px 16px", fontWeight: idx === 0 ? 700 : 400 }}>
                            {p.label}
                            {idx === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: "#16a34a", color: "white", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>ÚLTIMO</span>}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", fontFamily: "monospace" }}>${fmt(sal.tarifaHora)}/h</td>
                          <td style={{ padding: "11px 16px", color: "#475569" }}>{sal.horasTrabajadas} hs</td>
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: "#166534" }}>${fmt(bruto)}</td>
                          <td style={{ padding: "11px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button
                                onClick={() => setEditSalary(sal)}
                                style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${VET_COLORS.border}`, background: "white", color: "#0369a1", cursor: "pointer" }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => exportarPDF(sal, s)}
                                disabled={isPdf}
                                style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", cursor: isPdf ? "not-allowed" : "pointer", opacity: isPdf ? 0.6 : 1 }}
                              >
                                {isPdf ? "Generando..." : "📄 Recibo PDF"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94a3b8" }}>
        💡 Las liquidaciones son registros contables permanentes. Podés editar tarifa/horas o descargar el recibo en PDF. Para errores graves, contactá al administrador del sistema.
      </p>
    </div>
  );
}