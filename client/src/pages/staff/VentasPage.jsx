import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import EmailComprobanteModal from '../../components/shared/EmailComprobanteModal';

const token = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const IVA_RATE = 0.21;

// ── Paleta clínica ────────────────────────────────────────────────
const C = {
  bg: "#f0f4f1",
  white: "#ffffff",
  green900: "#1a3d28",
  green800: "#1f5c38",
  green700: "#2d7a4f",
  green100: "#eaf3de",
  green200: "#c0dd97",
  greenMint: "#7ed4a0",
  border: "#d1ddd4",
  borderLight: "#e8eee9",
  muted: "#6b8f76",
  text: "#1a3d28",
  textSoft: "#2d5c3f",
  surface: "#f8fbf9",
  amber: "#ba7517",
  amberBg: "#faeeda",
  purple: "#534ab7",
  purpleBg: "#eeedfe",
  blue: "#185fa5",
  blueBg: "#e6f1fb",
  red: "#a32d2d",
  redBg: "#fcebeb",
};

// ── SVG Icons ─────────────────────────────────────────────────────
const Icon = {
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  chevronLeft: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  plus: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  x: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  grid: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  card: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  pulse: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  syringe: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m18 2 4 4-14 14H4v-4L18 2z" /><path d="m14.5 5.5 4 4" />
    </svg>
  ),
  pill: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  ),
  clipboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  back: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  warning: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.5" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  success: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.green800} strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  paw: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" />
      <path d="M12 18c-3.5 0-6-2-6-5 0-1.5.5-3 1.5-4.5C8.5 7 10 6 12 6s3.5 1 4.5 2.5C17.5 10 18 11.5 18 13c0 3-2.5 5-6 5z" />
    </svg>
  ),
};

export default function ComponenteVentas() {
  const location = useLocation(); // Hook para obtener el estado enviado por la navegación
  const { user } = useAuth();

  // Estados de la vista de ventas (Simulados para mantener consistencia de compilación)
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");

  // Supongamos que aquí cargas tus clientes desde la API al iniciar
  useEffect(() => {
    async function cargarClientes() {
      try {
        const res = await axios.get("/customers", { headers: headers() });
        const listaClientes = res.data || [];
        setClientes(listaClientes);

        // LÓGICA DE AUTO-SELECCIÓN:
        // Verificamos si venimos desde el Dashboard con un cliente asignado en el state
        if (location.state?.autoSelectCliente) {
          const clienteDashboard = location.state.autoSelectCliente;
          
          // Buscamos coincidencia exacta en la lista cargada (por ID preferentemente)
          const encontrado = listaClientes.find(cl => cl.idCliente === clienteDashboard.idCliente);
          
          if (encontrado) {
            setClienteSeleccionado(encontrado);
            setBusquedaCliente(`${encontrado.nombres} ${encontrado.apellidos}`);
          } else {
            // Si por alguna razón no está en la lista general todavía, usamos el objeto directo del estado
            setClienteSeleccionado(clienteDashboard);
            setBusquedaCliente(`${clienteDashboard.nombres} ${clienteDashboard.apellidos}`);
          }
        }
      } catch (err) {
        console.error("Error cargando clientes en ventas:", err);
      }
    }
    cargarClientes();
  }, [location.state]);

  return (
    <div style={{ padding: 20, background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ background: C.white, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <h2 style={{ marginTop: 0, color: C.green900, display: "flex", alignItems: "center", gap: 8 }}>
          {Icon.grid} Módulo de Facturación y Ventas
        </h2>
        <hr style={{ borderColor: C.borderLight, margin: "15px 0" }} />
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
            Cliente Seleccionado:
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14
                }}
              />
            </div>
            {clienteSeleccionado && (
              <span style={{ background: C.green100, color: C.green800, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                {Icon.check} Activo
              </span>
            )}
          </div>
          {clienteSeleccionado && (
            <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
              ID Cliente: #{clienteSeleccionado.idCliente} · Documento/Detalles listo para asociar items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overlay Modal ─────────────────────────────────────────────────
function AlertModal({ icon, iconBg, title, message, onConfirm, onCancel, confirmText, confirmBg, cancelText }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(10,30,20,0.55)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, padding: "36px 32px",
        maxWidth: 400, width: "100%", textAlign: "center",
        border: `0.5px solid ${C.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
          border: `0.5px solid ${C.border}`,
        }}>{icon}</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 500, color: C.text }}>{title}</h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: message }} />
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && (
            <button onClick={onCancel} style={{
              flex: 1, padding: "11px", border: `0.5px solid ${C.border}`,
              borderRadius: 8, background: C.white, fontWeight: 500,
              fontSize: 13, cursor: "pointer", color: C.muted,
            }}>{cancelText || "Cancelar"}</button>
          )}
          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px", border: "none", borderRadius: 8,
            background: confirmBg, color: "white", fontWeight: 500,
            fontSize: 13, cursor: "pointer",
          }}>{confirmText || "Aceptar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ icon, iconBg, iconColor, title, count, countBg }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px",
      borderBottom: `0.5px solid ${C.borderLight}`,
      background: C.surface,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: iconColor, flexShrink: 0,
        border: `0.5px solid ${C.border}`,
      }}>{icon}</div>
      <span style={{ fontSize: 11, fontWeight: 500, color: C.textSoft, letterSpacing: "0.4px", textTransform: "uppercase", flex: 1 }}>{title}</span>
      <span style={{
        background: countBg || C.green800, color: "white",
        borderRadius: 12, fontSize: 10, fontWeight: 500, padding: "2px 8px",
      }}>{count}</span>
    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────────────
function ItemRow({ nombre, mascota, precio, cantidad, badge, onAdd, last }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", padding: "10px 16px",
        borderBottom: last ? "none" : `0.5px solid ${C.borderLight}`,
        gap: 12, background: hover ? C.surface : C.white, transition: "background 0.12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {nombre}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, fontSize: 11, color: C.muted }}>
          <span style={{ color: C.muted }}>{Icon.paw}</span>
          {mascota}
          {cantidad && cantidad > 1 && <span style={{ color: C.border }}>·</span>}
          {cantidad && cantidad > 1 && <span>{cantidad} un.</span>}
          {badge && (
            <span style={{ background: C.amberBg, color: "#7a4208", fontSize: 10, fontWeight: 500, padding: "1px 5px", borderRadius: 4 }}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: C.green800, whiteSpace: "nowrap" }}>${fmt(precio)}</span>
      <button
        onClick={onAdd}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: hover ? C.green800 : C.surface,
          border: `0.5px solid ${hover ? C.green800 : C.border}`,
          color: hover ? "white" : C.green800,
          borderRadius: 6, padding: "6px 12px",
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}
      >
        {Icon.plus} Agregar
      </button>
    </div>
  );
}

// ── Card contenedor ───────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: C.white, border: `0.5px solid ${C.border}`,
      borderRadius: 10, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

// ── Empty mini ────────────────────────────────────────────────────
function EmptyMini({ label }) {
  return (
    <div style={{ padding: "12px 16px", fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: C.border }}>{Icon.check}</span> {label}
    </div>
  );
}

// ── PendingSection ────────────────────────────────────────────────
function PendingSection({ titulo, icon, iconBg, iconColor, countBg, items, onAdd }) {
  if (!items) return null;
  return (
    <Card>
      <SectionHeader icon={icon} iconBg={iconBg} iconColor={iconColor} title={titulo} count={items.length} countBg={countBg} />
      {items.length === 0
        ? <EmptyMini label="Sin pendientes" />
        : items.map((item, idx) => (
          <ItemRow
            key={item.idServicioAtendido ?? item.idVacunaAplicada ?? item.idTratMed ?? idx}
            nombre={item.nombreServicio}
            mascota={item.nombreMascota}
            precio={item.precio}
            cantidad={item.cantidad}
            badge={item.stockYaDescontado ? "Stock descontado" : null}
            onAdd={() => onAdd(item)}
            last={idx === items.length - 1}
          />
        ))
      }
    </Card>
  );
}

// ── Stepper ───────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ["Cliente", "Ítems", "Pago"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: done || active ? C.green800 : C.border,
                color: done || active ? "white" : C.muted,
                fontSize: 11, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done ? <span style={{ color: "white" }}>{Icon.check}</span> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: active ? C.text : C.muted }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 28, height: 1, background: step > n ? C.green800 : C.border, margin: "0 8px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Historial de Ventas ───────────────────────────────────────────
function HistorialVentas({ onBack, user, canAnular }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [confirmAnular, setConfirmAnular] = useState(null);
  const [modalExito, setModalExito] = useState("");
  const [modalError, setModalError] = useState("");

  const [ventaParaEmail, setVentaParaEmail] = useState(null);

  const fetchVentas = async () => {
    try {
      const res = await axios.get("/sales", { headers: headers() });
      setVentas(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVentas(); }, []);

  const handleAnularConfirmado = async () => {
    try {
      await axios.delete(`/sale/${confirmAnular}`, { headers: headers() });
      setConfirmAnular(null);
      setModalExito("La venta fue anulada y el stock fue restaurado correctamente.");
      fetchVentas();
    } catch {
      setConfirmAnular(null);
      setModalError("No se pudo anular la venta. Intentá de nuevo.");
    }
  };

  const statusStyle = (desc) => {
    const anulada = desc?.toLowerCase() === "anulada";
    return {
      padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500,
      background: anulada ? C.redBg : C.green100,
      color: anulada ? C.red : C.green800,
    };
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 20, background: C.bg, minHeight: "100vh" }}>
      {confirmAnular && (
        <AlertModal icon={Icon.warning} iconBg={C.amberBg}
          title="¿Anular esta venta?"
          message="Esta acción <strong>no se puede deshacer</strong>. El stock será restaurado."
          confirmText="Sí, anular" confirmBg={C.red}
          cancelText="Cancelar"
          onConfirm={handleAnularConfirmado}
          onCancel={() => setConfirmAnular(null)}
        />
      )}
      {modalExito && (
        <AlertModal icon={Icon.success} iconBg={C.green100}
          title="Operación exitosa" message={modalExito}
          confirmText="Aceptar" confirmBg={C.green800}
          onConfirm={() => setModalExito("")}
        />
      )}
      {modalError && (
        <AlertModal icon={Icon.error} iconBg={C.redBg}
          title="Ocurrió un error" message={modalError}
          confirmText="Cerrar" confirmBg={C.red}
          onConfirm={() => setModalError("")}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.white, border: `0.5px solid ${C.border}`,
          padding: "9px 16px", borderRadius: 8, cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: C.muted,
        }}>
          {Icon.back} Volver a Nueva Venta
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.green800, color: "white", padding: 8, borderRadius: 8, display: "flex" }}>
            {Icon.clipboard}
          </div>
          <h2 style={{ margin: 0, color: C.text, fontWeight: 500, fontSize: 20 }}>Historial de Ventas</h2>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `0.5px solid ${C.border}` }}>
              {["ID", "Cliente", "Fecha y hora", "Total", "Estado", "Acciones"].map((h, i) => (
                <th key={h} style={{
                  padding: "12px 16px", fontSize: 11, fontWeight: 500,
                  color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px",
                  textAlign: i === 5 ? "right" : "left",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>Cargando ventas...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>No hay ventas registradas.</td></tr>
            ) : ventas.map((v, idx) => (
              <tr key={v.idVenta} style={{ borderBottom: idx < ventas.length - 1 ? `0.5px solid ${C.borderLight}` : "none" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: C.text, fontSize: 13 }}>#{v.idVenta}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.text }}>{v.Cliente?.nombres} {v.Cliente?.apellidos}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.text }}>
                  {new Date(v.fecha + "T00:00:00").toLocaleDateString()}
                  <span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>{v.hora}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: C.green800 }}>${fmt(v.total)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={statusStyle(v.EstadoVenta?.descripcion)}>
                    {v.EstadoVenta?.descripcion || "Completada"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", minWidth: 280 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setVentaDetalle(v)} style={{
                      background: C.blueBg, color: C.blue, border: `0.5px solid #b5d4f4`,
                      padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
                    }}>Ver detalle</button>
                    <button
                      onClick={() => setVentaParaEmail(v)}
                      style={{
                        background: '#eaf3de', color: '#1f5c38',
                        border: '0.5px solid #c0dd97',
                        padding: '6px 12px', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}
                    >
                      📧 Enviar
                    </button>
                    {canAnular && v.EstadoVenta?.descripcion?.toLowerCase() !== "anulada" && (
                      <button onClick={() => setConfirmAnular(v.idVenta)} style={{
                        background: C.redBg, color: C.red, border: `0.5px solid #f7c1c1`,
                        padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
                      }}>Anular</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {ventaParaEmail && (
        <EmailComprobanteModal
          venta={ventaParaEmail}
          onClose={() => setVentaParaEmail(null)}
        />
      )}

      {/* Modal detalle */}
      {ventaDetalle && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,30,20,0.55)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 2000, padding: 20,
        }}>
          <div style={{
            background: C.white, borderRadius: 14, width: "100%", maxWidth: 520,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            overflow: "hidden", border: `0.5px solid ${C.border}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            {/* Header */}
            <div style={{
              background: C.green900, color: "white",
              padding: "16px 20px", display: "flex",
              justifyContent: "space-between", alignItems: "center", flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>Venta #{ventaDetalle.idVenta}</span>
                <span style={{
                  background: "rgba(255,255,255,0.15)", padding: "3px 8px",
                  borderRadius: 6, fontSize: 11, fontWeight: 500,
                }}>{ventaDetalle.EstadoVenta?.descripcion || "Completada"}</span>
              </div>
              <button onClick={() => setVentaDetalle(null)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", color: "white",
                width: 32, height: 32, borderRadius: 6, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{Icon.x}</button>
            </div>

            {/* Info grid */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                marginBottom: 16, background: C.surface, padding: 14,
                borderRadius: 8, border: `0.5px solid ${C.border}`,
              }}>
                {[
                  ["Cliente", `${ventaDetalle.Cliente?.nombres} ${ventaDetalle.Cliente?.apellidos}`],
                  ["Vendedor", ventaDetalle.Vendedor?.nombres || "Personal"],
                  ["Fecha y hora", `${new Date(ventaDetalle.fecha + "T00:00:00").toLocaleDateString()} - ${ventaDetalle.hora}`],
                  ["Medio de pago", ventaDetalle.FormaPago?.descripcion || "N/A"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span style={{ fontSize: 10, color: C.muted, display: "block", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>{label}</span>
                    <strong style={{ fontSize: 13, color: C.text }}>{val}</strong>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10, borderBottom: `0.5px solid ${C.borderLight}`, paddingBottom: 8 }}>
                Ítems comprados
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ventaDetalle.detalles?.map((d, i) => {
                  const esProducto = !!d.idProducto;
                  const nombreServicio = d.DetalleCita?.PrecioServicio?.Service?.descripcion;
                  const nombreItem = esProducto ? (d.Producto?.nombre || "Producto") : (nombreServicio || "Servicio Técnico");
                  const loteInfo = d.Lote?.codigoLote ? `Lote: ${d.Lote.codigoLote}` : "";
                  const mascotaInfo = d.DetalleCita?.Cita?.Mascota?.nombre ? `${d.DetalleCita.Cita.Mascota.nombre}` : "";
                  return (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      paddingBottom: 10, borderBottom: `0.5px solid ${C.borderLight}`,
                      alignItems: "flex-start",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: C.text, fontSize: 13 }}>
                          {nombreItem}
                          {(loteInfo || mascotaInfo) && (
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginLeft: 6 }}>
                              {esProducto ? loteInfo : mascotaInfo}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {d.cantidad} un. × ${fmt(d.precioUnidad)}
                        </div>
                      </div>
                      <strong style={{ fontSize: 13, color: C.text }}>${fmt(d.precioUnidad * d.cantidad)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totales */}
            <div style={{ padding: "14px 20px", background: C.surface, borderTop: `0.5px solid ${C.border}`, flexShrink: 0 }}>
              {[
                ["IVA registrado (21%)", `$${fmt(ventaDetalle.iva)}`],
                ["Descuento aplicado", `-$${fmt(ventaDetalle.descuento || 0)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 6 }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, textTransform: "uppercase", letterSpacing: "0.3px" }}>Total pagado</span>
                <span style={{ fontSize: 22, fontWeight: 500, color: C.green800 }}>${fmt(ventaDetalle.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────
function ProductModal({ isOpen, onClose, onAddProduct, categories, productResults, loadingProducts }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPresentation, setFilterPresentation] = useState("all");
  const [quantities, setQuantities] = useState({});

  if (!isOpen) return null;

  const presentations = [];
  const seenPres = new Set();
  productResults.forEach((p) => {
    const pres = p.presentacion || p.nombrePresentacion;
    if (pres && !seenPres.has(pres)) { seenPres.add(pres); presentations.push(pres); }
  });

  const filtered = productResults.filter((p) => {
    const matchName = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === "all" || String(p.idCategoria) === String(filterCategory);
    const pres = p.presentacion || p.nombrePresentacion || "";
    const matchPres = filterPresentation === "all" || pres === filterPresentation;
    return matchName && matchCat && matchPres;
  });

  const handleClose = () => {
    setSearchTerm(""); setFilterCategory("all");
    setFilterPresentation("all"); setQuantities({});
    onClose();
  };

  const handleUpdateQty = (id, delta, stock) => {
    setQuantities((prev) => {
      const cur = prev[id] || 1;
      const next = cur + delta;
      if (next < 1 || next > stock) return prev;
      return { ...prev, [id]: next };
    });
  };

  const handleQtyInput = (id, value, stock) => {
    if (value === "") { setQuantities((p) => ({ ...p, [id]: "" })); return; }
    let num = parseInt(value);
    if (isNaN(num)) return;
    num = Math.max(1, Math.min(num, stock));
    setQuantities((p) => ({ ...p, [id]: num }));
  };

  const selectStyle = {
    flex: "1 1 160px", padding: "9px 12px", borderRadius: 8,
    border: `0.5px solid ${C.border}`, fontSize: 13, background: C.surface,
    color: C.text, cursor: "pointer", outline: "none",
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,0.55)", backdropFilter: "blur(6px)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(94vw, 960px)", maxHeight: "88vh",
        background: C.bg, borderRadius: 14,
        border: `0.5px solid ${C.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1001,
      }}>
        {/* Header */}
        <div style={{ background: C.green900, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              {Icon.grid}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "white" }}>Inventario de Productos</h2>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{filtered.length} productos encontrados</p>
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", color: "white",
            width: 34, height: 34, borderRadius: 7, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{Icon.x}</button>
        </div>

        {/* Filtros */}
        <div style={{ padding: "14px 24px", background: C.white, borderBottom: `0.5px solid ${C.border}`, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "2 1 220px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Icon.search}</span>
            <input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "9px 12px 9px 38px",
                borderRadius: 8, border: `0.5px solid ${C.border}`,
                fontSize: 13, outline: "none", background: C.surface,
                color: C.text, boxSizing: "border-box",
              }}
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => <option key={cat.idCategoria} value={cat.idCategoria}>{cat.descripcion || cat.nombre}</option>)}
          </select>
          <select value={filterPresentation} onChange={(e) => setFilterPresentation(e.target.value)} style={selectStyle}>
            <option value="all">Todas las presentaciones</option>
            {presentations.map((pres) => <option key={pres} value={pres}>{pres}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div style={{
          overflowY: "auto", padding: 20, flex: 1,
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14, alignContent: "start",
        }}>
          {loadingProducts ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 13, color: C.muted }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 13, color: C.muted }}>Sin resultados</div>
          ) : filtered.map((prod) => {
            const idProd = prod.idProducto || prod.id;
            const pres = prod.presentacion || prod.nombrePresentacion || null;
            const stock = prod.stock ?? 0;
            const precio = parseFloat(prod.precio || 0);
            const sinStock = stock <= 0;
            const qty = quantities[idProd] || 1;

            return (
              <div key={idProd} style={{
                background: C.white, border: `0.5px solid ${sinStock ? "#f7c1c1" : C.border}`,
                borderRadius: 10, padding: "14px 16px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: 170, opacity: sinStock ? 0.65 : 1,
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: C.text, flex: 1, lineHeight: 1.3 }}>{prod.nombre}</div>
                    {sinStock && (
                      <span style={{ background: C.redBg, color: C.red, padding: "3px 7px", borderRadius: 5, fontSize: 10, fontWeight: 500, height: "fit-content" }}>
                        Sin stock
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {pres && <span style={{ background: C.blueBg, color: C.blue, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid #b5d4f4` }}>{pres}</span>}
                    <span style={{ background: C.green100, color: C.green800, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid #c0dd97` }}>Stock: {stock}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: C.text }}>${fmt(precio)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {!sinStock && (
                    <div style={{ display: "flex", alignItems: "center", background: C.surface, borderRadius: 7, border: `0.5px solid ${C.border}`, overflow: "hidden" }}>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateQty(idProd, -1, stock); }}
                        style={{ border: "none", background: "none", width: 30, height: 34, cursor: "pointer", fontSize: 16, color: C.text }}>−</button>
                      <input
                        type="text" value={qty}
                        onChange={(e) => handleQtyInput(idProd, e.target.value, stock)}
                        onBlur={() => { if (qty === "") setQuantities((p) => ({ ...p, [idProd]: 1 })); }}
                        style={{ width: 34, border: "none", background: "transparent", textAlign: "center", fontSize: 13, fontWeight: 500, color: C.text, outline: "none", padding: 0 }}
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateQty(idProd, 1, stock); }}
                        style={{ border: "none", background: "none", width: 30, height: 34, cursor: "pointer", fontSize: 16, color: C.text }}>+</button>
                    </div>
                  )}
                  <button
                    disabled={sinStock}
                    onClick={() => { onAddProduct({ ...prod, precio, cantidad: parseInt(qty) || 1 }); handleClose(); }}
                    style={{
                      flex: 1, padding: "9px", borderRadius: 7, border: "none",
                      background: sinStock ? C.border : C.green800,
                      color: "white", fontWeight: 500, fontSize: 13,
                      cursor: sinStock ? "not-allowed" : "pointer",
                    }}
                  >
                    {sinStock ? "Sin stock" : `Agregar (${qty || 0})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── VentasPage ────────────────────────────────────────────────────
export default function VentasPage() {
  const { user } = useAuth();
  const canAnular = [1, 4].includes(user?.idRol);  // Solo admin y vendedor pueden anular
  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [attendedServices, setAttendedServices] = useState([]);
  const [items, setItems] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [idTipoPago, setIdTipoPago] = useState("");
  const [idTipoBoleta, setIdTipoBoleta] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (items.length > 0 || selectedClient) {
        e.preventDefault();
        e.returnValue = "Hay una venta en curso. ¿Estás seguro de que querés salir?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items, selectedClient]);

  useEffect(() => {
    Promise.all([
      axios.get("/categories", { headers: headers() }),
      axios.get("/payment-types", { headers: headers() }),
      axios.get("/receipt-types", { headers: headers() }),
    ]).then(([cat, pt, rt]) => {
      setCategories(cat.data || []);
      setPaymentTypes(pt.data || []);
      setReceiptTypes(rt.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (clientSearch.length < 2) { setClientResults([]); return; }
    const delay = setTimeout(async () => {
      setLoadingClients(true);
      try {
        const res = await axios.get(`/clients?search=${clientSearch}`, { headers: headers() });
        setClientResults(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingClients(false); }
    }, 400);
    return () => clearTimeout(delay);
  }, [clientSearch]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await axios.get(`/products?search=${productSearch}&category=${categoryFilter}&soloVenta=true`, { headers: headers() });
        setProductResults(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingProducts(false); }
    };
    const delay = setTimeout(fetchProducts, 400);
    return () => clearTimeout(delay);
  }, [productSearch, categoryFilter, isProductModalOpen]);

  const selectClient = async (client) => {
    setSelectedClient(client);
    setClientResults([]);
    setClientSearch("");
    setItems([]);
    setStep(2);

    if (client.idCliente === 1) { setAttendedServices([]); return; }

    try {
      const resAppts = await axios.get("/appointments", { headers: headers() });
      const citas = Array.isArray(resAppts.data) ? resAppts.data : (resAppts.data?.data || []);

      const citasDelCliente = citas.filter(
        (cita) =>
          cita.Mascota?.idCliente === client.idCliente ||
          (cita.Mascota?.Dueño?.nombres === client.nombres && cita.Mascota?.Dueño?.apellidos === client.apellidos)
      );

      // ── Servicios atendidos ──
      const servicesFound = [];
      citasDelCliente.forEach((cita) => {
        if (!cita.detalles) return;
        cita.detalles.forEach((det) => {
          if (det.idEstadoServicio !== 3) return;
          servicesFound.push({
            tipo: "servicio",
            idServicioAtendido: det.idDetalle,
            nombreServicio: det.PrecioServicio?.Service?.descripcion || "Servicio",
            nombreMascota: cita.Mascota?.nombre || "Mascota",
            precio: parseFloat(det.PrecioServicio?.precio || 0),
          });
        });
      });

      // ── Vacunas aplicadas sin cobrar ──
      const mascotasIds = [...new Set(citasDelCliente.map((c) => c.Mascota?.idMascota).filter(Boolean))];
      const vacunasAplicadas = [];

      for (const idMascota of mascotasIds) {
        try {
          const resVac = await axios.get(`/applied-vaccines/mascota/${idMascota}`, { headers: headers() });
          const nombreMascota = citasDelCliente.find((c) => c.Mascota?.idMascota === idMascota)?.Mascota?.nombre || "Mascota";

          (resVac.data || []).forEach((v) => {
            const idCitaDeEstaVacuna = v.Historial?.idCita;
            const citaExacta = citasDelCliente.find((c) => c.idCita === idCitaDeEstaVacuna);
            const detalleVacunacion = citaExacta?.detalles?.find(
              (d) => d.idEstadoServicio === 3 && d.PrecioServicio?.Service?.descripcion?.toLowerCase().includes("vacun")
            );
            const precioVacuna = parseFloat(v.precioAplicado || 0);
            const precioServicio = detalleVacunacion ? parseFloat(detalleVacunacion.PrecioServicio?.precio || 0) : 0;

            vacunasAplicadas.push({
              tipo: "vacunaAplicada",
              idVacunaAplicada: v.idVacunaAplicada,
              idLote: v.idLote,
              nombreServicio: v.Vacuna?.Producto?.nombre || "Vacuna",
              nombreMascota,
              precio: precioVacuna + precioServicio,
              precioVacuna,
              precioServicio,
              idServicioVacunacion: detalleVacunacion?.idDetalle || null,
              stockYaDescontado: true,
            });
          });
        } catch (e) {
          console.error(`Error vacunas mascota ${idMascota}:`, e);
        }
      }

      // ── Medicamentos del tratamiento ──
      const medicamentosTrat = [];
      try {
        const resHist = await axios.get("/clinical-histories", { headers: headers() });
        const todosLosHistoriales = resHist.data || [];

        const historialIds = new Set(
          todosLosHistoriales
            .filter((h) => citasDelCliente.some((c) => c.idCita === Number(h.idCita)))
            .map((h) => h.idHistorial)
        );

        const historialToMascota = {};
        todosLosHistoriales
          .filter((h) => historialIds.has(h.idHistorial))
          .forEach((h) => {
            const cita = citasDelCliente.find((c) => c.idCita === Number(h.idCita));
            historialToMascota[h.idHistorial] = cita?.Mascota?.nombre || "Mascota";
          });

        if (historialIds.size > 0) {
          const resTrats = await axios.get("/treatments", { headers: headers() });
          const tratamientosDelCliente = (resTrats.data || []).filter(
            (t) => historialIds.has(Number(t.idHistorial)) && ![3, 6].includes(Number(t.idEstadoTratamiento))
          );

          for (const trat of tratamientosDelCliente) {
            try {
              const resMeds = await axios.get(`/treatment-meds/${trat.idTratamiento}`, { headers: headers() });
              const meds = resMeds.data || [];
              const nombreMascota = historialToMascota[trat.idHistorial] || "Mascota";
              meds.forEach((med) => {
                if (med.aplicadoEnClinica) return;
                medicamentosTrat.push({
                  tipo: "tratMed",
                  idTratMed: med.idTratMed,
                  idTratamiento: trat.idTratamiento,
                  aplicadoEnClinica: med.aplicadoEnClinica,
                  stockYaDescontado: med.aplicadoEnClinica === 1, 
                  nombreServicio: med.Producto?.nombre || `Medicamento #${med.idProd_Pres}`,
                  nombreMascota,
                  precio: parseFloat(med.precioAplicado || 0),
                  cantidad: med.cantidad || 1,
                  instrucciones: med.instrucciones,
                });
              });
            } catch {}
          }
        }
      } catch (e) {
        console.error("Error tratamientos:", e);
      }

      const idsFusionados = new Set(
        vacunasAplicadas.filter((v) => v.idServicioVacunacion !== null).map((v) => v.idServicioVacunacion)
      );
      const serviciosFiltrados = servicesFound.filter((s) => !idsFusionados.has(s.idServicioAtendido));

      setAttendedServices([...serviciosFiltrados, ...vacunasAplicadas, ...medicamentosTrat]);
    } catch (e) {
      console.error("Error general selectClient:", e);
      setAttendedServices([]);
    }
  };

  const removeItem = (item) => {
    setItems((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
    if (item.tipo === "servicio") {
      setAttendedServices((prev) => [...prev, { tipo: "servicio", idServicioAtendido: item.id, nombreServicio: item.nombre, nombreMascota: item.mascota, precio: item.precio }]);
    } else if (item.tipo === "vacunaAplicada") {
      setAttendedServices((prev) => [...prev, { tipo: "vacunaAplicada", idVacunaAplicada: item.id, idLote: item.idLote, nombreServicio: item.nombre, nombreMascota: item.mascota, precio: item.precio, stockYaDescontado: true }]);
    } else if (item.tipo === "tratMed") {
      setAttendedServices((prev) => [...prev, { tipo: "tratMed", idTratMed: item.id, idTratamiento: item.idTratamiento, nombreServicio: item.nombre, nombreMascota: item.mascota, precio: item.precio, cantidad: item.cantidad, instrucciones: item.instrucciones }]);
    }
  };

  const addService = (service) => {
    if (items.find((i) => i.uniqueId?.includes(`${service.tipo}-${service.idServicioAtendido || service.idVacunaAplicada || service.idTratMed}`))) return;

    if (service.tipo === "servicio") {
      setItems((prev) => [...prev, { tipo: "servicio", id: service.idServicioAtendido, uniqueId: `serv-${service.idServicioAtendido}-${Date.now()}`, nombre: service.nombreServicio, mascota: service.nombreMascota, precio: parseFloat(service.precio || 0), cantidad: 1, idLote: null, stockYaDescontado: false }]);
      setAttendedServices((prev) => prev.filter((s) => s.idServicioAtendido !== service.idServicioAtendido));
    } else if (service.tipo === "vacunaAplicada") {
      setItems((prev) => [...prev, { tipo: "vacunaAplicada", id: service.idVacunaAplicada, uniqueId: `vac-${service.idVacunaAplicada}-${Date.now()}`, nombre: `${service.nombreServicio}`, mascota: service.nombreMascota, precio: parseFloat(service.precio || 0), precioVacuna: service.precioVacuna, precioServicio: service.precioServicio, idServicioVacunacion: service.idServicioVacunacion || null, cantidad: 1, idLote: service.idLote, stockYaDescontado: true }]);
      setAttendedServices((prev) => prev.filter((s) => s.idVacunaAplicada !== service.idVacunaAplicada));
    } else if (service.tipo === "tratMed") {
      setItems((prev) => [...prev, { tipo: "tratMed", id: service.idTratMed, uniqueId: `trat-${service.idTratMed}-${Date.now()}`, nombre: service.nombreServicio, mascota: service.nombreMascota, precio: parseFloat(service.precio || 0), cantidad: service.cantidad || 1, instrucciones: service.instrucciones, idTratamiento: service.idTratamiento }]);
      setAttendedServices((prev) => prev.filter((s) => s.idTratMed !== service.idTratMed));
    }
  };

  const addProductToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === (product.id || product.idProducto) && i.tipo === "producto");
      if (existing) return prev.map((i) => i.id === (product.id || product.idProducto) && i.tipo === "producto" ? { ...i, cantidad: i.cantidad + (product.cantidad || 1) } : i);
      return [...prev, { tipo: "producto", id: product.id || product.idProducto, uniqueId: `prod-${product.id || product.idProducto}-${Date.now()}`, nombre: product.nombre, precio: parseFloat(product.precio), cantidad: product.cantidad || 1, presentacion: product.presentacion || null, idLote: product.idLote ?? null }];
    });
  };

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalIva = subtotal * IVA_RATE;
  const totalFinal = subtotal + totalIva - parseFloat(descuento || 0);

  const handleConfirmSale = async () => {
    if (!idTipoPago || !idTipoBoleta) {
      setError("Por favor seleccioná el medio de pago y el tipo de comprobante.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await axios.post("/sale", {
        fecha: new Date().toLocaleDateString("en-CA"),
        hora: new Date().toTimeString().slice(0, 5),
        idEstadoVenta: 1,
        idCliente: selectedClient?.idCliente ?? null,
        idTipoPago: Number(idTipoPago),
        idTipoBoleta: Number(idTipoBoleta),
        descuento: Number(parseFloat(descuento || 0).toFixed(2)),
        iva: Number(totalIva.toFixed(2)),
        total: Number(totalFinal.toFixed(2)),
        items: items.flatMap((i) => {
          if (i.tipo === "servicio") return [{ idDetalleCitaServicio: Number(i.id), idProducto: null, idVacunaAplicada: null, idTratMed: null, idLote: null, cantidad: 1, precioUnidad: parseFloat(i.precio).toFixed(2) }];
          if (i.tipo === "vacunaAplicada") {
            const result = [{ idDetalleCitaServicio: null, idProducto: null, idVacunaAplicada: Number(i.id), idTratMed: null, idLote: i.idLote, cantidad: 1, precioUnidad: parseFloat(i.precioVacuna).toFixed(2) }];
            if (i.idServicioVacunacion) result.push({ idDetalleCitaServicio: Number(i.idServicioVacunacion), idProducto: null, idVacunaAplicada: null, idTratMed: null, idLote: null, cantidad: 1, precioUnidad: parseFloat(i.precioServicio).toFixed(2) });
            return result;
          }
          if (i.tipo === "tratMed") return [{
            idDetalleCitaServicio: null,
            idProducto: null,
            idVacunaAplicada: null,
            idTratMed: Number(i.id),
            idLote: null,
            stockYaDescontado: i.stockYaDescontado ? 1 : 0, // nuevo flag
            cantidad: parseInt(i.cantidad),
            precioUnidad: parseFloat(i.precio).toFixed(2)
          }];

          return [{ idDetalleCitaServicio: null, idProducto: Number(i.id), idVacunaAplicada: null, idTratMed: null, idLote: i.idLote ?? null, cantidad: parseInt(i.cantidad), precioUnidad: parseFloat(i.precio).toFixed(2) }];
        }),
      }, { headers: headers() });

      setSuccess("La venta fue registrada exitosamente.");
      setItems([]); setSelectedClient(null);
      setDescuento(0); setIdTipoPago(""); setIdTipoBoleta(""); setStep(1);
    } catch (e) {
      console.error("Error venta:", JSON.stringify(e.response?.data, null, 2));
      const msg = e.response?.data?.msg || e.response?.data?.message || "Ocurrió un error al procesar la venta.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (showHistory) {
    return (
      <HistorialVentas 
        onBack={() => setShowHistory(false)} 
        user={user}
        canAnular={user?.idRol === 1} 
      />
    );
  }

  const serviciosPendientes = attendedServices.filter((s) => s.tipo === "servicio");
  const vacunasPendientes = attendedServices.filter((s) => s.tipo === "vacunaAplicada");
  const medicamentosPendientes = attendedServices.filter((s) => s.tipo === "tratMed");

  const badgeConfig = {
    servicio:       { label: "Servicio",    bg: C.green100,  color: C.green800 },
    vacunaAplicada: { label: "Vacuna",      bg: C.amberBg,   color: "#7a4208" },
    producto:       { label: "Producto",    bg: C.blueBg,    color: C.blue },
    tratMed:        { label: "Tratamiento", bg: C.purpleBg,  color: C.purple },
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: 8, border: `0.5px solid ${C.border}`,
    fontSize: 14, outline: "none", background: C.white,
    color: C.text, boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 20, background: C.bg, minHeight: "100vh" }}>

      {/* Modales */}
      {success && (
        <AlertModal icon={Icon.success} iconBg={C.green100}
          title="¡Venta registrada!" message={success}
          confirmText="Aceptar" confirmBg={C.green800}
          onConfirm={() => setSuccess("")}
        />
      )}
      {error && (
        <AlertModal icon={Icon.error} iconBg={C.redBg}
          title="Error al crear la venta" message={error}
          confirmText="Cerrar" confirmBg={C.red}
          onConfirm={() => setError("")}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: C.text, fontWeight: 500 }}>Módulo de Ventas</h2>
        <button onClick={() => setShowHistory(true)} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.white, border: `0.5px solid ${C.border}`,
          padding: "9px 16px", borderRadius: 8, cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: C.muted,
        }}>
          {Icon.clipboard} Historial de ventas
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* ── Columna izquierda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Stepper */}
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <Stepper step={step} />
          </div>

          {/* PASO 1: Cliente */}
          {step === 1 && (
            <Card>
              <SectionHeader icon={Icon.user} iconBg={C.green100} iconColor={C.green800} title="Seleccionar cliente" count="1/3" countBg={C.muted} />
              <div style={{ padding: 20 }}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Icon.search}</span>
                  <input
                    type="text"
                    placeholder="Buscar por DNI o nombre…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 38 }}
                  />
                </div>
                {loadingClients && <p style={{ fontSize: 13, color: C.muted, margin: "8px 0" }}>Buscando...</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {clientResults.map((c) => (
                    <div key={c.idCliente} onClick={() => selectClient(c)} style={{
                      padding: "12px 14px", border: `0.5px solid ${C.border}`,
                      borderRadius: 8, cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: C.white, transition: "background 0.12s",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.surface}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.white}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{c.nombres} {c.apellidos}</span>
                      <span style={{ fontSize: 12, color: C.muted, background: C.surface, padding: "3px 8px", borderRadius: 5, border: `0.5px solid ${C.border}` }}>DNI: {c.dni}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button
                    onClick={() => selectClient({ idCliente: 1, nombres: "Consumidor", apellidos: "Final" })}
                    style={{ background: "none", border: "none", color: C.green700, cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "8px 0" }}
                  >
                    Omitir — usar Consumidor Final →
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* PASO 2: Ítems */}
          {step === 2 && (
            <>
              {/* Topbar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: C.white, border: `0.5px solid ${C.border}`,
                borderRadius: 10, padding: "10px 14px",
              }}>
                <button onClick={() => setStep(1)} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: C.surface, border: `0.5px solid ${C.border}`,
                  borderRadius: 7, padding: "7px 12px",
                  cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.muted,
                }}>
                  {Icon.chevronLeft}
                  <span style={{ color: C.text }}>{selectedClient?.nombres} {selectedClient?.apellidos}</span>
                  <span style={{ color: C.muted }}>· cambiar</span>
                </button>
                <button onClick={() => setIsProductModalOpen(true)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: C.green800, border: "none", color: "white",
                  borderRadius: 8, padding: "9px 18px",
                  cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}>
                  {Icon.grid} Agregar Productos
                </button>
              </div>

              {/* Grid pendientes */}
              {attendedServices.length > 0 ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: serviciosPendientes.length > 0 && (vacunasPendientes.length > 0 || medicamentosPendientes.length > 0) ? "1fr 1fr" : "1fr",
                  gap: 14,
                }}>
                  {/* Columna servicios */}
                  {serviciosPendientes.length > 0 && (
                    <PendingSection
                      titulo="Servicios atendidos"
                      icon={Icon.pulse}
                      iconBg={C.green100} iconColor={C.green800}
                      items={serviciosPendientes}
                      onAdd={addService}
                    />
                  )}

                  {/* Columna vacunas + medicamentos */}
                  {(vacunasPendientes.length > 0 || medicamentosPendientes.length > 0) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {vacunasPendientes.length > 0 && (
                        <PendingSection
                          titulo="Vacunas pendientes"
                          icon={Icon.syringe}
                          iconBg={C.amberBg} iconColor={C.amber}
                          countBg={C.amber}
                          items={vacunasPendientes}
                          onAdd={addService}
                        />
                      )}
                      {medicamentosPendientes.length > 0 && (
                        <PendingSection
                          titulo="Tratamientos"
                          icon={Icon.pill}
                          iconBg={C.purpleBg} iconColor={C.purple}
                          countBg={C.purple}
                          items={medicamentosPendientes}
                          onAdd={addService}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: C.white, border: `0.5px dashed ${C.border}`,
                  borderRadius: 10, padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 10,
                  color: C.muted, fontSize: 13,
                }}>
                  <span style={{ color: C.green800 }}>{Icon.check}</span>
                  Sin servicios, vacunas ni medicamentos pendientes de cobro
                </div>
              )}

              {/* Botón continuar */}
              <button
                disabled={items.length === 0}
                onClick={() => setStep(3)}
                style={{
                  width: "100%", padding: 14,
                  background: items.length === 0 ? C.border : C.green800,
                  color: "white", border: "none", borderRadius: 10,
                  fontWeight: 500, fontSize: 15,
                  cursor: items.length === 0 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.2s",
                }}
              >
                {Icon.card}
                {items.length === 0 ? "Agregá al menos un ítem" : `Continuar al pago · ${items.length} ítem${items.length > 1 ? "s" : ""}`}
              </button>
            </>
          )}

          {/* PASO 3: Pago */}
          {step === 3 && (
            <Card>
              <SectionHeader icon={Icon.card} iconBg={C.green100} iconColor={C.green800} title="Finalizar venta" count="3/3" countBg={C.muted} />
              <div style={{ padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Medio de pago</label>
                    <select value={idTipoPago} onChange={(e) => setIdTipoPago(e.target.value)} style={inputStyle}>
                      <option value="">Seleccione...</option>
                      {paymentTypes.map((t) => <option key={t.idTipoPago} value={t.idTipoPago}>{t.descripcion}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tipo de comprobante</label>
                    <select value={idTipoBoleta} onChange={(e) => setIdTipoBoleta(e.target.value)} style={inputStyle}>
                      <option value="">Seleccione...</option>
                      {receiptTypes.map((t) => <option key={t.idTipoBoleta} value={t.idTipoBoleta}>{t.descripcion}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setStep(2)} style={{
                    flex: 1, padding: 13, background: C.surface,
                    color: C.muted, border: `0.5px solid ${C.border}`,
                    borderRadius: 9, cursor: "pointer", fontWeight: 500, fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {Icon.back} Volver
                  </button>
                  <button onClick={handleConfirmSale} disabled={saving} style={{
                    flex: 2, padding: 13, background: saving ? C.border : C.green800,
                    color: "white", border: "none", borderRadius: 9,
                    fontWeight: 500, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {Icon.check} {saving ? "Procesando..." : "Confirmar venta"}
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ── Resumen lateral ── */}
        <div style={{ position: "sticky", top: 20, height: "fit-content" }}>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Header resumen */}
            <div style={{ background: C.green900, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                Resumen de venta
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {items.length} ítem{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Ítems */}
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  Sin ítems cargados…
                </div>
              ) : items.map((item, idx) => {
                const badge = badgeConfig[item.tipo] || { label: item.tipo, bg: C.surface, color: C.muted };
                return (
                  <div key={item.uniqueId || idx} style={{
                    padding: "11px 14px",
                    borderBottom: idx < items.length - 1 ? `0.5px solid ${C.borderLight}` : "none",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: C.text, lineHeight: 1.3 }}>{item.nombre}</div>
                      {item.mascota && (
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          {Icon.paw} {item.mascota}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                        {item.cantidad} × ${fmt(item.precio)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>${fmt(item.precio * item.cantidad)}</span>
                      <button onClick={() => removeItem(item)} style={{
                        width: 22, height: 22, borderRadius: 5,
                        border: `0.5px solid ${C.border}`,
                        background: "none", color: C.muted, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }} aria-label="Quitar ítem">{Icon.x}</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totales */}
            <div style={{ padding: "12px 16px", background: C.surface, borderTop: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["Subtotal", `$${fmt(subtotal)}`],
                ["IVA (21%)", `$${fmt(totalIva)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.muted }}>
                <span>Descuento ($)</span>
                <input
                  type="number"
                  value={descuento || ""}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  style={{
                    width: 72, background: C.white,
                    border: `0.5px solid ${C.border}`,
                    borderRadius: 5, padding: "3px 7px",
                    fontSize: 13, color: C.text, textAlign: "right", outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Total final */}
            <div style={{ background: C.green900, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", color: "rgba(255,255,255,0.55)" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 500, color: C.greenMint }}>${fmt(totalFinal)}</span>
            </div>
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddProduct={addProductToCart}
        categories={categories}
        productResults={productResults}
        loadingProducts={loadingProducts}
      />
    </div>
  );
}