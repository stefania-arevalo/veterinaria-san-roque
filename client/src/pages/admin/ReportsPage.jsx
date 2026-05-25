import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── API helpers ─────────────────────────────────────────────────────────────
const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });
const api   = (path) => `/api/V1${path}`;

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  accent:  "#1f5c38",
  accent2: "#276b42",
  light:   "#eaf3de",
  border:  "#d1ddd4",
  muted:   "#6b8f76",
  text:    "#1a3d28",
  surface: "#f8fbf9",
  white:   "#ffffff",
  red:     "#a32d2d",
  redBg:   "#fcebeb",
  amber:   "#BA7517",
  amberBg: "#FAEEDA",
  blue:    "#185fa5",
  blueBg:  "#e6f1fb",
};

const TAB_LABELS = {
  turnos:     "Turnos",
  ventas:     "Ventas",
  clinico:    "Clínico",
  inventario: "Inventario",
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : "—";

const fmtPeso = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

function hoy() {
  return new Date().toISOString().split("T")[0];
}
function primerDiaMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Componentes base ─────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, subColor }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: "16px 18px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function BarChart({ data, colorFn }) {
  if (!data || Object.keys(data).length === 0)
    return <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Sin datos para el período.</p>;
  const max = Math.max(...Object.values(data));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
      {Object.entries(data).map(([label, val]) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{val}</div>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            background: colorFn ? colorFn(label) : C.accent,
            height: max > 0 ? `${Math.round((val / max) * 84)}px` : "4px",
            minHeight: 4, opacity: 0.85,
          }} />
          <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function RankList({ items, labelKey, valueKey, color, formatValue }) {
  if (!items || items.length === 0)
    return <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Sin datos.</p>;
  const max = Math.max(...items.map(i => i[valueKey]));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: C.muted, minWidth: 16, textAlign: "right" }}>{i + 1}</span>
          <span style={{ fontSize: 12, color: C.text, minWidth: 140, flex: 1 }}>{item[labelKey]}</span>
          <div style={{ flex: 2, height: 6, background: C.surface, borderRadius: 3 }}>
            <div style={{ height: 6, borderRadius: 3, background: color || C.accent, width: max > 0 ? `${Math.round((item[valueKey] / max) * 100)}%` : "0%" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 50, textAlign: "right" }}>
            {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, emptyMsg }) {
  if (!rows || rows.length === 0)
    return <p style={{ color: C.muted, fontSize: 12, margin: "12px 0 0" }}>{emptyMsg || "Sin registros."}</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.surface }}>
            {columns.map((c, i) => (
              <th key={i} style={{ padding: "8px 12px", textAlign: c.right ? "right" : "left", fontWeight: 700, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = C.white}>
              {columns.map((c, ci) => (
                <td key={ci} style={{ padding: "9px 12px", textAlign: c.right ? "right" : "left", color: C.text }}>
                  {c.render ? c.render(row) : (row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StateBadge({ estado, idEstado }) {
  const map = {
    1: { bg: "#e6f1fb", color: "#185fa5" },
    2: { bg: "#eaf3de", color: C.accent },
    3: { bg: C.redBg,   color: C.red },
    4: { bg: "#eaf3de", color: C.accent },
    5: { bg: C.amberBg, color: C.amber },
  };
  const style = map[idEstado] || { bg: C.surface, color: C.muted };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: style.bg, color: style.color }}>
      {estado}
    </span>
  );
}

function SaleStateBadge({ idEstado }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: idEstado === 3 ? C.redBg : C.light, color: idEstado === 3 ? C.red : C.accent }}>
      {idEstado === 3 ? "Anulada" : "Activa"}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABS DE REPORTE
// ══════════════════════════════════════════════════════════════════════════════

function TabTurnos({ data }) {
  if (!data) return null;
  const { kpis, porVeterinario, porDia, porTipo, porEspecie, detalle } = data;

  const vetRank     = Object.entries(porVeterinario || {}).sort((a, b) => b[1] - a[1]).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  const tipoRank    = Object.entries(porTipo || {}).sort((a, b) => b[1] - a[1]).map(([tipo, cantidad]) => ({ tipo, cantidad }));
  const especieRank = Object.entries(porEspecie || {}).sort((a, b) => b[1] - a[1]).map(([especie, cantidad]) => ({ especie, cantidad }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard label="Total turnos"  value={fmt(kpis.total)} />
        <KpiCard label="Completados"    value={fmt(kpis.completados)} sub={`${kpis.tasaAsistencia}% asistencia`} subColor={C.accent} />
        <KpiCard label="Pendientes"     value={fmt(kpis.pendientes)} />
        <KpiCard label="Cancelados"     value={fmt(kpis.cancelados)} subColor={C.red} />
        <KpiCard label="Ausentes"       value={fmt(kpis.ausentes)} subColor={C.amber} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Turnos por día de la semana"><BarChart data={porDia} /></SectionCard>
        <SectionCard title="Turnos por tipo de cita"><RankList items={tipoRank} labelKey="tipo" valueKey="cantidad" color={C.blue} /></SectionCard>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Ranking de veterinarios"><RankList items={vetRank} labelKey="nombre" valueKey="cantidad" /></SectionCard>
        <SectionCard title="Especie más atendida"><RankList items={especieRank} labelKey="especie" valueKey="cantidad" color={C.amber} /></SectionCard>
      </div>
      <SectionCard title={`Detalle de turnos (últimos ${detalle?.length || 0})`}>
        <DataTable
          columns={[
            { label: "Fecha",       key: "fecha" },
            { label: "Hora",        key: "hora" },
            { label: "Mascota",     key: "mascota" },
            { label: "Especie",     key: "especie" },
            { label: "Dueño",       key: "dueño" },
            { label: "Veterinario", key: "veterinario" },
            { label: "Tipo",        key: "tipo" },
            { label: "Estado",      render: (r) => <StateBadge estado={r.estado} idEstado={r.idEstado} /> },
          ]}
          rows={detalle}
        />
      </SectionCard>
    </div>
  );
}

function TabVentas({ data }) {
  if (!data) return null;
  const { kpis, porFormaPago, porVendedor, porFecha, topProductos, detalle } = data;

  const vendedorRank = Object.entries(porVendedor || {}).sort((a, b) => b[1] - a[1]).map(([nombre, total]) => ({ nombre, total }));
  const pagoRank     = Object.entries(porFormaPago || {}).sort((a, b) => b[1] - a[1]).map(([forma, total]) => ({ forma, total }));
  const fechaData    = Object.fromEntries(
    Object.entries(porFecha || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-15).map(([f, v]) => [f.slice(5), Math.round(v)])
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Ventas activas"   value={fmt(kpis.totalVentas)} />
        <KpiCard label="Ingresos totales"  value={fmtPeso(kpis.ingresos)} />
        <KpiCard label="Ticket promedio"   value={fmtPeso(kpis.ticketPromedio)} />
        <KpiCard label="Descuentos"        value={fmtPeso(kpis.descuentos)} />
        <KpiCard label="Anuladas"          value={fmt(kpis.anuladas)} subColor={C.red} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Ingresos por fecha (últimos 15 días)"><BarChart data={fechaData} colorFn={() => C.blue} /></SectionCard>
        <SectionCard title="Por forma de pago"><RankList items={pagoRank} labelKey="forma" valueKey="total" color={C.amber} formatValue={fmtPeso} /></SectionCard>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Ranking de vendedores"><RankList items={vendedorRank} labelKey="nombre" valueKey="total" formatValue={fmtPeso} /></SectionCard>
        <SectionCard title="Productos más vendidos (cantidad)"><RankList items={topProductos || []} labelKey="nombre" valueKey="cantidad" color={C.blue} /></SectionCard>
      </div>
      <SectionCard title={`Detalle de ventas (últimas ${detalle?.length || 0})`}>
        <DataTable
          columns={[
            { label: "#",          key: "idVenta" },
            { label: "Fecha",      key: "fecha" },
            { label: "Hora",       key: "hora" },
            { label: "Cliente",    key: "cliente" },
            { label: "Vendedor",   key: "vendedor" },
            { label: "Forma pago", key: "formaPago" },
            { label: "Items",      key: "items",  right: true },
            { label: "Descuento",  render: (r) => fmtPeso(r.descuento), right: true },
            { label: "Total",      render: (r) => fmtPeso(r.total),     right: true },
            { label: "Estado",     render: (r) => <SaleStateBadge idEstado={r.idEstado} /> },
          ]}
          rows={detalle}
        />
      </SectionCard>
    </div>
  );
}

function TabClinico({ data }) {
  if (!data) return null;
  const { kpis, topDiagnosticos, topMotivos, porEspecie, detalle } = data;
  const especieRank = Object.entries(porEspecie || {}).sort((a, b) => b[1] - a[1]).map(([especie, cantidad]) => ({ especie, cantidad }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Consultas registradas" value={fmt(kpis.totalConsultas)} />
        <KpiCard label="Peso promedio"         value={kpis.pesoPromedio ? `${kpis.pesoPromedio} kg` : "—"} />
        <KpiCard label="Especie más atendida"  value={kpis.especieTop} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Diagnósticos más frecuentes"><RankList items={topDiagnosticos || []} labelKey="diagnostico" valueKey="cantidad" /></SectionCard>
        <SectionCard title="Motivos de consulta más frecuentes"><RankList items={topMotivos || []} labelKey="motivo" valueKey="cantidad" color={C.blue} /></SectionCard>
      </div>
      <SectionCard title="Atenciones por especie"><RankList items={especieRank} labelKey="especie" valueKey="cantidad" color={C.amber} /></SectionCard>
      <SectionCard title={`Historial clínico (últimos ${detalle?.length || 0})`}>
        <DataTable
          columns={[
            { label: "#",           key: "idHistorial" },
            { label: "Fecha",       key: "fecha" },
            { label: "Mascota",     key: "mascota" },
            { label: "Especie",     key: "especie" },
            { label: "Dueño",       key: "dueño" },
            { label: "Veterinario", key: "veterinario" },
            { label: "Motivo",      key: "motivo" },
            { label: "Diagnóstico", key: "diagnostico" },
            { label: "Peso (kg)",   key: "peso",        right: true },
            { label: "Temp (°C)",   key: "temperatura", right: true },
          ]}
          rows={detalle}
        />
      </SectionCard>
    </div>
  );
}

function TabInventario({ data }) {
  if (!data) return null;
  const { kpis, topStock, vencidos, proximos, sinStock } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Total lotes"           value={fmt(kpis.totalLotes)} />
        <KpiCard label="Vencidos"              value={fmt(kpis.lotesVencidos)}     subColor={C.red} />
        <KpiCard label="Por vencer (≤30 días)" value={fmt(kpis.lotesPorVencer)}   subColor={C.amber} />
        <KpiCard label="Sin stock"              value={fmt(kpis.productosSinStock)} subColor={C.muted} />
      </div>
      {vencidos?.length > 0 && (
        <div style={{ background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 10 }}>🚨 Lotes VENCIDOS — requieren atención inmediata</div>
          <DataTable columns={[{ label: "Producto", key: "producto" }, { label: "Código lote", key: "lote" }, { label: "Vencimiento", key: "vencimiento" }, { label: "Stock", key: "stock", right: true }]} rows={vencidos} />
        </div>
      )}
      {proximos?.length > 0 && (
        <div style={{ background: C.amberBg, border: "1px solid #f3d28a", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 10 }}>⏰ Próximos a vencer (≤30 días)</div>
          <DataTable columns={[{ label: "Producto", key: "producto" }, { label: "Código lote", key: "lote" }, { label: "Vencimiento", key: "vencimiento" }, { label: "Stock", key: "stock", right: true }]} rows={proximos} />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Top 10 productos con más stock"><RankList items={topStock || []} labelKey="nombre" valueKey="stock" color={C.accent} /></SectionCard>
        <SectionCard title="Lotes sin stock">
          {sinStock?.length === 0
            ? <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>✅ No hay lotes sin stock.</p>
            : <DataTable columns={[{ label: "Producto", key: "producto" }, { label: "Código lote", key: "lote" }, { label: "Vencimiento", key: "vencimiento" }]} rows={sinStock} />
          }
        </SectionCard>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: "turnos",     label: "Turnos" },
  { key: "ventas",     label: "Ventas" },
  { key: "clinico",    label: "Clínico" },
  { key: "inventario", label: "Inventario" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("turnos");
  const [desde,     setDesde]     = useState(primerDiaMes());
  const [hasta,     setHasta]     = useState(hoy());
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [exporting, setExporting] = useState(false);

  // Referencia al contenido que se va a capturar para PDF
  const contentRef = useRef(null);

  const fetchReport = useCallback(async (tab, d, h) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = { tab, desde: d, hasta: h };
      if (tab === "inventario") { delete params.desde; delete params.hasta; }
      const res = await axios.get(api("/reports"), { params, headers: auth() });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.msg || "Error al cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab, desde, hasta);
  }, [activeTab, desde, hasta, fetchReport]);

  // ── Exportar PDF ─────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!contentRef.current || !data) return;
    setExporting(true);

    try {
      const element = contentRef.current;

      // Capturamos el contenido como imagen
      const canvas = await html2canvas(element, {
        scale: 2,              // mayor resolución
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // Scrollea el elemento completo aunque esté fuera de viewport
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      // Dimensiones en mm (A4 landscape para reportes anchos)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin     = 10;
      const usableW    = pageWidth  - margin * 2;
      const usableH    = pageHeight - margin * 2;

      // Calcular la altura proporcional al ancho usable
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = imgW / usableW;
      const totalImgH = imgH / ratio; // alto en mm de la imagen completa

      // Si la imagen es más alta que una página, la dividimos en varias
      let yPos = 0;
      let page = 0;

      while (yPos < totalImgH) {
        if (page > 0) pdf.addPage();

        // Encabezado en cada página
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`San Roque Veterinaria — Reporte de ${TAB_LABELS[activeTab]}`, margin, margin - 2);
        if (activeTab !== "inventario") {
          pdf.text(`Período: ${desde} al ${hasta}`, pageWidth - margin, margin - 2, { align: "right" });
        }
        pdf.text(
          `Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
          margin, pageHeight - 4
        );
        pdf.text(`Página ${page + 1}`, pageWidth - margin, pageHeight - 4, { align: "right" });

        // Recortamos la porción de canvas correspondiente a esta página
        const srcY      = yPos * ratio;
        const srcH      = Math.min(usableH * ratio, imgH - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = imgW;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceH    = srcH / ratio;

        pdf.addImage(sliceData, "PNG", margin, margin, usableW, sliceH);

        yPos += usableH;
        page++;
      }

      // Nombre del archivo
      const fechaStr = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
      pdf.save(`reporte_${activeTab}_${fechaStr}.pdf`);

    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Hubo un error al generar el PDF. Intentá de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const inp = {
    padding: "7px 11px", borderRadius: 8, fontSize: 13,
    border: `1px solid ${C.border}`, background: C.white,
    color: C.text, outline: "none",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>📊 Reportes</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Panel de administración · San Roque Veterinaria</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Filtro de fechas — oculto en inventario */}
          {activeTab !== "inventario" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 12, color: C.muted }}>Desde</label>
                <input type="date" style={inp} value={desde} onChange={e => setDesde(e.target.value)} max={hasta} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 12, color: C.muted }}>Hasta</label>
                <input type="date" style={inp} value={hasta} onChange={e => setHasta(e.target.value)} min={desde} max={hoy()} />
              </div>
              {/* Atajos rápidos */}
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { label: "Hoy",      d: hoy(), h: hoy() },
                  { label: "Este mes", d: primerDiaMes(), h: hoy() },
                  { label: "7d",       d: (() => { const x = new Date(); x.setDate(x.getDate() - 7);  return x.toISOString().split("T")[0]; })(), h: hoy() },
                  { label: "30d",      d: (() => { const x = new Date(); x.setDate(x.getDate() - 30); return x.toISOString().split("T")[0]; })(), h: hoy() },
                ].map(a => (
                  <button key={a.label} onClick={() => { setDesde(a.d); setHasta(a.h); }}
                    style={{ padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, background: C.white, color: C.muted, cursor: "pointer" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Botón exportar PDF ── */}
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading || !data}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: "none",
              background: exporting || loading || !data ? "#94a3b8" : C.accent,
              color: "white",
              cursor: exporting || loading || !data ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(31,92,56,0.2)",
              transition: "background 0.2s",
            }}
          >
            {exporting ? (
              <>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                Generando…
              </>
            ) : (
              <>📄 Exportar PDF</>
            )}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", background: C.white, borderRadius: "12px 12px 0 0", border: `1px solid ${C.border}`, borderBottom: "none", overflow: "hidden" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "13px 16px", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
              background: activeTab === tab.key ? C.white : C.surface,
              color: activeTab === tab.key ? C.accent : C.muted,
              borderBottom: activeTab === tab.key ? `3px solid ${C.accent}` : "3px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido (ref para captura PDF) ── */}
      <div
        ref={contentRef}
        style={{
          background: C.white, border: `1px solid ${C.border}`, borderTop: "none",
          borderRadius: "0 0 14px 14px", padding: "20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          minHeight: 400,
        }}
      >
        {/* Encabezado interno solo visible en el PDF */}
        {data && (
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                San Roque Veterinaria — Reporte de {TAB_LABELS[activeTab]}
              </div>
              {activeTab !== "inventario" && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Período: {desde} al {hasta}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
              Generado: {new Date().toLocaleDateString("es-AR")}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: `3px solid ${C.light}`, borderTopColor: C.accent, animation: "spin 0.7s linear infinite" }} />
            <span style={{ color: C.muted, fontSize: 13 }}>Cargando reporte...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: 13, color: C.red, fontWeight: 600 }}>⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {activeTab === "turnos"     && <TabTurnos     data={data} />}
            {activeTab === "ventas"     && <TabVentas     data={data} />}
            {activeTab === "clinico"    && <TabClinico    data={data} />}
            {activeTab === "inventario" && <TabInventario data={data} />}
          </>
        )}

        {!loading && !error && !data && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontSize: 13 }}>
            Seleccioná un período y una pestaña para ver el reporte.
          </div>
        )}
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 11, color: C.muted, textAlign: "right" }}>
        💡 Los reportes de Inventario no dependen del período — muestran el estado actual del stock.
      </p>
    </div>
  );
}