import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../../api/axios";

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getUserFromToken = () => {
  try {
    const t = localStorage.getItem("accessToken");
    if (!t) return null;
    const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(b64));
  } catch { return null; }
};

const hasPermission = (pageKey) => {
  try {
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
    return permissions.includes(pageKey);
  } catch {
    return false;
  }
};

const THEME = {
  primary:   "#0f2a4a",
  accent:    "#1a6bc4",
  green:     "#16a34a",
  greenBg:   "#f0fdf4",
  greenBdr:  "#86efac",
  amber:     "#b45309",
  amberBg:   "#fffbeb",
  amberBdr:  "#fde68a",
  red:       "#dc2626",
  redBg:     "#fef2f2",
  redBdr:    "#fecaca",
  blue:      "#0284c7",
  blueBg:    "#f0f9ff",
  blueBdr:   "#bae6fd",
  muted:     "#64748b",
  border:    "#e8edf3",
  surface:   "#ffffff",
  bg:        "#f4f6f9",
};

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .panel { animation: fadeSlideUp 0.3s ease both; }
  .panel:nth-child(1) { animation-delay: 0.05s; }
  .panel:nth-child(2) { animation-delay: 0.12s; }
  .panel:nth-child(3) { animation-delay: 0.19s; }
  .panel:nth-child(4) { animation-delay: 0.26s; }
  .row-item { transition: background 0.15s; border-radius: 10px; }
  .row-item:hover { background: #f8fafc; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
`;

function AgendaDashboard({ citas, fechaHoy }) {
  const CITA_ESTADOS = {
    1: { label: "Pendiente",  color: "#b45309", bg: "#fef3c7" },
    2: { label: "Confirmada", color: "#1d4ed8", bg: "#dbeafe" },
    3: { label: "Cancelada",  color: "#dc2626", bg: "#fee2e2" },
    4: { label: "Finalizada", color: "#166534", bg: "#dcfce7" },
    5: { label: "Reprogr.",   color: "#ea580c", bg: "#fff7ed" },
  };

  const TIPO_COLOR = {
    1: { border: "#378ADD", bg: "#E6F1FB", label: "Control"    },
    2: { border: "#E24B4A", bg: "#FCEBEB", label: "Emergencia" },
    3: { border: "#639922", bg: "#EAF3DE", label: "General"    },
  };

  const citasHoy = citas
    .filter(c => c.fecha === fechaHoy)
    .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

  if (citasHoy.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: THEME.muted }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📅</div>
        <p style={{ margin: 0, fontSize: 13 }}>No tenés citas programadas para hoy.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {citasHoy.map(cita => {
        const est  = CITA_ESTADOS[cita.idEstadoCita] || CITA_ESTADOS[1];
        const tc   = TIPO_COLOR[cita.idTipoCita]     || TIPO_COLOR[3];
        const cancelada = cita.idEstadoCita === 3;

        return (
          <div key={cita.idCita} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: cancelada ? "#fafafa" : tc.bg,
            borderLeft: `3px solid ${cancelada ? "#ef4444" : tc.border}`,
            opacity: cancelada ? 0.6 : 1,
          }}>
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.primary }}>
                {cita.hora?.slice(0, 5) || "—"}
              </div>
              <div style={{ fontSize: 9, color: THEME.muted, textTransform: "uppercase" }}>hs</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: THEME.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cita.Mascota?.nombre || "—"}
                <span style={{ fontWeight: 400, color: THEME.muted, fontSize: 12, marginLeft: 6 }}>
                  · {cita.Mascota?.Dueño?.nombres} {cita.Mascota?.Dueño?.apellidos}
                </span>
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                {cita.TipoCita?.descripcion || tc.label}
                {cita.detalles?.length > 0 && (
                  <span style={{ marginLeft: 6 }}>
                    · {cita.detalles.map(d => d.PrecioServicio?.Service?.descripcion).filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <span className="badge" style={{ background: est.bg, color: est.color, flexShrink: 0 }}>
              {cancelada ? "Anulada" : est.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ title, icon, iconBg, iconColor, count, countColor, children, style, action }) {
  return (
    <div className="panel" style={{
      background: THEME.surface, borderRadius: 18,
      border: `1.5px solid ${THEME.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.055)",
      display: "flex", flexDirection: "column",
      overflow: "hidden", ...style
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: `1.5px solid ${THEME.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fafbfc", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: iconBg, color: iconColor,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>{icon}</div>
          <span style={{ fontWeight: 800, fontSize: 13, color: THEME.primary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {action}
          {count !== undefined && (
            <span style={{
              background: countColor + "18", color: countColor,
              borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 800,
            }}>{count}</span>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 14px" }}>
        {children}
      </div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0", color: THEME.muted }}>
      <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13 }}>{text}</p>
    </div>
  );
}

function CitaRow({ cita, isRecent, onClick, style }) {
  const estadoMap = {
    1: { label: "Pendiente",  bg: "#fef9c3", color: "#854d0e" },
    2: { label: "Confirmada", bg: THEME.greenBg, color: THEME.green },
    3: { label: "Cancelada",  bg: THEME.redBg,   color: THEME.red },
    4: { label: "Atendida",   bg: "#ede9fe",     color: "#7c3aed" },
    5: { label: "Reprogr.",   bg: "#fff7ed",     color: "#ea580c" },
  };
  const est = estadoMap[cita.idEstadoCita] || { label: "—", bg: "#f1f5f9", color: THEME.muted };
  return (
    <div 
      className="row-item" 
      onClick={onClick}
      style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "9px 8px", 
        borderBottom: `1px solid ${THEME.border}`,
        cursor: onClick ? "pointer" : "default",
        ...style 
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: THEME.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {cita.Mascota?.nombre || "—"}
          {isRecent && <span style={{ fontSize: 10, color: THEME.muted, marginLeft: 6 }}>({cita.fecha})</span>}
          <span style={{ fontWeight: 400, color: THEME.muted }}> · {cita.Mascota?.Dueño?.nombres} {cita.Mascota?.Dueño?.apellidos}</span>
        </div>
        <div style={{ fontSize: 11, color: THEME.muted, marginTop: 1 }}>🕒 {cita.hora?.slice(0, 5)} hs</div>
      </div>
      <span className="badge" style={{ background: est.bg, color: est.color, marginLeft: 10, flexShrink: 0 }}>{est.label}</span>
    </div>
  );
}

function VentaRow({ v, isRecent }) {
  const anulada = v.EstadoVenta?.descripcion?.toLowerCase() === "anulada";
  return (
    <div className="row-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 8px", borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: THEME.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {v.Cliente?.nombres || "Consumidor"} {v.Cliente?.apellidos || "Final"}
          {isRecent && <span style={{ fontSize: 10, color: THEME.muted, marginLeft: 6 }}>({v.fecha})</span>}
        </div>
        <div style={{ fontSize: 11, color: THEME.muted, marginTop: 1 }}>🕒 {v.hora?.slice(0, 5)} hs · {v.detalles?.length || 0} ítem(s)</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: THEME.primary }}>${fmt(v.total)}</div>
        <span className="badge" style={{ background: anulada ? THEME.redBg : THEME.greenBg, color: anulada ? THEME.red : THEME.green }}>
          {anulada ? "Anulada" : "Pagada"}
        </span>
      </div>
    </div>
  );
}

function StockRow({ icon, iconColor, title, sub }) {
  return (
    <div className="row-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 8px", borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: iconColor + "15", color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11, color: THEME.muted, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-CA");

  const [citas,            setCitas]            = useState([]);
  const [citasRec,         setCitasRec]         = useState([]);
  const [ventas,           setVentas]           = useState([]);
  const [ventasRec,        setVentasRec]        = useState([]);
  const [stockBajo,        setStockBajo]        = useState([]);
  const [stockVenc,        setStockVenc]        = useState([]);
  const [cobrosPendientes, setCobrosPendientes] = useState([]);
  const [loading,          setLoading]          = useState(true);

  const token   = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const user          = getUserFromToken();
  const rolLogueado   = user?.idRol      ? Number(user.idRol)      : null;
  const idPersonal    = user?.idPersonal ? Number(user.idPersonal) : null;

  const canSeeCitas   = hasPermission("citas");
  const canSeeVentas  = hasPermission("ventas");
  const canSeeStock   = hasPermission("compras");

  useEffect(() => {
    async function fetchAll() {
      const resultados = await Promise.allSettled([
        axios.get(`/appointments?date=${today}`, { headers }),
        axios.get(`/sales?date=${today}`,        { headers }),
        axios.get("/appointments",               { headers }),
        axios.get("/sales",                      { headers }),
        axios.get("/batches",                    { headers }),
      ]);

      const [citasHoyRes, ventasHoyRes, todasCitasRes, todasVentasRes, lotesRes] = resultados;

      if (todasCitasRes.status === "fulfilled") {
        const todas = todasCitasRes.value.data || [];

        const deudas = todas.filter(c => {
          const esFinalizada = Number(c.idEstadoCita) === 4;
          const lista = c.AppointmentDetails || c.detalles || [];
          return esFinalizada && lista.some(d => [1, 2, 3].includes(Number(d.idEstadoServicio)));
        });
        setCobrosPendientes(deudas);

        setCitasRec(todas.filter(c => c.fecha !== today).slice(0, 6));
      }

      if (citasHoyRes.status === "fulfilled") {
        const todas = citasHoyRes.value.data || [];
        if (rolLogueado === 2 && idPersonal) {
          setCitas(todas.filter(c =>
            Number(c.idVeterinario) === idPersonal ||
            (c.detalles || []).some(d => Number(d.idPersonalRealiza) === idPersonal)
          ));
        } else {
          setCitas(todas.slice(0, 6));
        }
      }

      if (ventasHoyRes.status === "fulfilled") {
        const ventasHoy = ventasHoyRes.value.data || [];
        setVentas(ventasHoy.slice(0, 6));
      }
      
      if (todasVentasRes.status === "fulfilled") {
        const todas = todasVentasRes.value.data || [];
        setVentasRec(todas.filter(v => v.fecha !== today).slice(0, 6));
      }

      if (lotesRes.status === "fulfilled") {
        const lotes = lotesRes.value.data || [];
        const en30 = new Date(); en30.setDate(en30.getDate() + 30);
        setStockBajo(lotes.filter(l => l.cantidadDisponible <= 5 && l.cantidadDisponible > 0).slice(0, 5));
        setStockVenc(lotes.filter(l => {
          if (!l.fechaVencimiento) return false;
          return new Date(l.fechaVencimiento + "T00:00:00") <= en30;
        }).slice(0, 5));
      }

      setLoading(false);
    }
    fetchAll();
  }, [rolLogueado, idPersonal]);

  const hayVentasHoy = ventas.length > 0;
  const hayCitasHoy  = citas.length  > 0;

  if (rolLogueado === 2) {
    return (
      <div style={{ padding: "16px 20px", background: THEME.bg, minHeight: "calc(100vh - 60px)" }}>
        <style>{GLOBAL_CSS}</style>

        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: THEME.primary }}>
              Buenos días, Dr/a. 👋
            </h2>
          </div>
          <button
            onClick={() => navigate("/admin/turnos")}
            style={{
              background: THEME.primary, color: "white",
              border: "none", borderRadius: 10, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Ver agenda completa →
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "calc(100vh - 160px)" }}>
          <Panel
            title="Mi agenda de hoy"
            icon="📅"
            iconBg={THEME.blueBg}
            iconColor={THEME.blue}
            count={hayCitasHoy ? citas.length : undefined}
            countColor={THEME.blue}
            action={
              !hayCitasHoy && !loading
                ? <span style={{ fontSize: 11, color: THEME.muted }}>Sin citas hoy</span>
                : null
            }
          >
            {loading ? (
              <Empty icon="⏳" text="Cargando..." />
            ) : (
              <AgendaDashboard citas={citas} fechaHoy={today} />
            )}
          </Panel>

          <Panel
            title="Historial reciente"
            icon="📋"
            iconBg={THEME.blueBg}
            iconColor={THEME.blue}
            action={
              <button
                onClick={() => navigate("/admin/mascotas/historial")}
                style={{
                  fontSize: 11, fontWeight: 700, color: THEME.blue,
                  background: THEME.blueBg, border: `1px solid ${THEME.blueBdr}`,
                  borderRadius: 7, padding: "4px 10px", cursor: "pointer",
                }}
              >
                Ver todo →
              </button>
            }
          >
            {loading ? (
              <Empty icon="⏳" text="Cargando..." />
            ) : (
              <HistorialRecienteVet idPersonal={idPersonal} headers={headers} />
            )}
          </Panel>

          <Panel
            title="Stock bajo — vacunas y medicamentos"
            icon="💉"
            iconBg={THEME.amberBg}
            iconColor={THEME.amber}
            count={stockBajo.length || undefined}
            countColor={THEME.amber}
          >
            {loading ? (
              <Empty icon="⏳" text="Cargando..." />
            ) : stockBajo.length === 0 ? (
              <Empty icon="✅" text="Sin alertas de stock bajo." />
            ) : (
              stockBajo.map(l => (
                <StockRow
                  key={l.idLote}
                  icon="📦"
                  iconColor={THEME.amber}
                  title={l.Producto?.nombre ? `${l.Producto.nombre} — Lote #${l.idLote}` : `Lote #${l.idLote}`}
                  sub={`${l.cantidadDisponible} unidades restantes`}
                />
              ))
            )}
          </Panel>

          <Panel
            title="Por vencerse (30 días)"
            icon="⏳"
            iconBg={THEME.redBg}
            iconColor={THEME.red}
            count={stockVenc.length || undefined}
            countColor={THEME.red}
          >
            {loading ? (
              <Empty icon="⏳" text="Cargando..." />
            ) : stockVenc.length === 0 ? (
              <Empty icon="✅" text="Sin vencimientos próximos." />
            ) : (
              stockVenc.map(l => (
                <StockRow
                  key={l.idLote}
                  icon="📆"
                  iconColor={THEME.red}
                  title={l.Producto?.nombre ? `${l.Producto.nombre} — Lote #${l.idLote}` : `Lote #${l.idLote}`}
                  sub={`Vence: ${new Date(l.fechaVencimiento + "T00:00:00").toLocaleDateString("es-AR")}`}
                />
              ))
            )}
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 20px", background: THEME.bg, minHeight: "calc(100vh - 60px)" }}>
      <style>{GLOBAL_CSS}</style>

      {/* CORRECCIÓN DE LA ALERTA: Ahora redirige directo a Ventas */}
      {cobrosPendientes.length > 0 && canSeeVentas && (
        <div
          onClick={() => navigate("/admin/ventas")}
          style={{
            background: "#fffbeb", border: "1px solid #fcd34d", borderLeft: "5px solid #f59e0b",
            borderRadius: 12, padding: "16px 20px", marginBottom: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ color: "#92400e", fontWeight: 800, fontSize: 15 }}>ACCIONES PENDIENTES</div>
              <div style={{ color: "#b45309", fontSize: 14 }}>
                Hay {cobrosPendientes.length} cita{cobrosPendientes.length > 1 ? "s" : ""} finalizada{cobrosPendientes.length > 1 ? "s" : ""} que aún no se cobró.
              </div>
            </div>
          </div>
          <div style={{ background: "#f59e0b", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            IR A COBRAR →
          </div>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        height: cobrosPendientes.length > 0 && canSeeVentas ? "calc(100vh - 190px)" : "calc(100vh - 110px)",
      }}>

        {canSeeCitas && (
          <Panel
            title={hayCitasHoy ? "Citas de hoy" : "Citas recientes"}
            icon="📅" iconBg="#eff6ff" iconColor={THEME.blue}
            count={hayCitasHoy ? citas.length : citasRec.length} countColor={THEME.blue}
          >
            {loading ? <Empty icon="⏳" text="Cargando..." /> :
              hayCitasHoy ? citas.map(c => <CitaRow key={c.idCita} cita={c} isRecent={false} />) :
              citasRec.length > 0 ? (
                <>
                  <div style={{ padding: "6px 8px 8px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                      Sin citas hoy — mostrando las más recientes
                    </span>
                  </div>
                  {citasRec.map(c => <CitaRow key={c.idCita} cita={c} isRecent={true} />)}
                </>
              ) : <Empty icon="📅" text="No hay citas registradas." />
            }
          </Panel>
        )}

        {canSeeVentas && (
          <Panel
            title={hayVentasHoy ? "Ventas de hoy" : "Ventas recientes"}
            icon="💰" iconBg="#f0fdf4" iconColor={THEME.green}
            count={hayVentasHoy ? ventas.length : ventasRec.length} countColor={THEME.green}
          >
            {loading ? <Empty icon="⏳" text="Cargando..." /> :
              hayVentasHoy ? ventas.map(v => <VentaRow key={v.idVenta} v={v} isRecent={false} />) :
              ventasRec.length > 0 ? (
                <>
                  <div style={{ padding: "6px 8px 8px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                      Sin ventas hoy — mostrando las más recientes
                    </span>
                  </div>
                  {ventasRec.map(v => <VentaRow key={v.idVenta} v={v} isRecent={true} />)}
                </>
              ) : <Empty icon="💳" text="No hay ventas registradas." />
            }
          </Panel>
        )}

        {canSeeStock && (
          <>
            <Panel title="Stock por terminarse" icon="📉" iconBg={THEME.amberBg} iconColor={THEME.amber}
              count={stockBajo.length || undefined} countColor={THEME.amber}>
              {loading ? <Empty icon="⏳" text="Cargando..." /> :
                stockBajo.length === 0 ? <Empty icon="✅" text="Sin alertas de stock bajo." /> :
                stockBajo.map(l => (
                  <StockRow key={l.idLote} icon="📦" iconColor={THEME.amber}
                    title={l.Producto?.nombre ? `${l.Producto.nombre} — Lote #${l.idLote}` : `Lote #${l.idLote}`}
                    sub={`${l.amountAvailable || l.cantidadDisponible} unidades restantes`}
                  />
                ))
              }
            </Panel>

            <Panel title="Productos por vencerse" icon="⏳" iconBg={THEME.redBg} iconColor={THEME.red}
              count={stockVenc.length || undefined} countColor={THEME.red}>
              {loading ? <Empty icon="⏳" text="Cargando..." /> :
                stockVenc.length === 0 ? <Empty icon="✅" text="Sin vencimientos próximos." /> :
                stockVenc.map(l => (
                  <StockRow key={l.idLote} icon="📆" iconColor={THEME.red}
                    title={l.Producto?.nombre ? `${l.Producto.nombre} — Lote #${l.idLote}` : `Lote #${l.idLote}`}
                    sub={`Vence: ${new Date(l.fechaVencimiento + "T00:00:00").toLocaleDateString("es-AR")}`}
                  />
                ))
              }
            </Panel>
          </>
        )}

        {/* CORRECCIÓN EN EL PANEL DE ABAJO: Cada ítem de cita te lleva a Ventas pasándole el Dueño en el estado */}
        {canSeeVentas && cobrosPendientes.length > 0 && (
          <Panel title="Cobros pendientes" icon="💰" iconBg={THEME.amberBg} iconColor={THEME.amber}
            count={cobrosPendientes.length || undefined} countColor={THEME.amber}
            action={
              <button onClick={() => navigate("/admin/ventas")}
                style={{ fontSize: 11, fontWeight: 700, color: THEME.amber, background: THEME.amberBg, border: `1px solid ${THEME.amberBdr}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>
                Ir a Ventas →
              </button>
            }
          >
            {cobrosPendientes.slice(0, 6).map(c => (
              <CitaRow 
                key={c.idCita} 
                cita={c} 
                isRecent={true} 
                onClick={() => navigate("/admin/ventas", { state: { autoSelectCliente: c.Mascota?.Dueño } })}
                style={{ transition: "all 0.2s" }}
              />
            ))}
          </Panel>
        )}

      </div>
    </div>
  );
}

function HistorialRecienteVet({ idPersonal, headers }) {
  const [historiales, setHistoriales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/clinical-histories", { headers })
      .then(res => {
        const data = res.data || [];
        const mios = data
          .filter(h => idPersonal ? Number(h.idVeterinario) === idPersonal : true)
          .reverse()
          .slice(0, 6);
        setHistoriales(mios);
      })
      .catch(() => setHistoriales([]))
      .finally(() => setLoading(false));
  }, [idPersonal]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: THEME.muted, fontSize: 13 }}>Cargando...</div>;
  if (historiales.length === 0) return <Empty icon="📝" text="Aún no registraste fichas clínicas." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {historiales.map(h => (
        <div key={h.idHistorial} className="row-item"
          style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 8px", borderBottom: `1px solid ${THEME.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.blueBg, color: THEME.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
            📋
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: THEME.primary, display: "flex", justifyContent: "space-between" }}>
              <span>🐾 {h.Cita?.Mascota?.nombre || "Paciente"}</span>
              <span style={{ fontSize: 11, color: THEME.muted, fontWeight: 500 }}>#{h.idHistorial}</span>
            </div>
            <div style={{ fontSize: 12, color: THEME.muted, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {h.diagnostico || "Sin diagnóstico registrado"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "flex", gap: 8 }}>
              {h.peso        && <span>⚖️ {h.peso} kg</span>}
              {h.temperatura && <span>🌡️ {h.temperatura}°C</span>}
              {h.Cita?.fecha && <span>📅 {new Date(h.Cita.fecha + "T00:00:00").toLocaleDateString("es-AR")}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}