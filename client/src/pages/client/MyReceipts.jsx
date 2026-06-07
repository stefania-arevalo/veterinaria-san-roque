import { useState, useEffect } from "react";
import axios from "../../api/axios";

const C = {
  green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9", white: "#ffffff",
  red: "#a32d2d", redBg: "#fcebeb",
  amber: "#b45309", amberBg: "#fef3c7",
};

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

function ComprobanteModal({ venta, onClose }) {
  const items = venta.detalles || [];

  const handlePrint = () => window.print();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,30,20,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: C.white, borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "90dvh", display: "flex", flexDirection: "column",
        border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: C.green900, color: "white",
          padding: "18px 22px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              Comprobante #{venta.idVenta}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {venta.TipoComprobante?.descripcion || "Comprobante de pago"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              {fmtFecha(venta.fecha)} · {venta.hora?.slice(0, 5)} hs
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none", color: "white",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>

          {/* Datos del comprobante */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px",
            padding: "14px 16px", background: C.surface,
            borderRadius: 10, border: `1px solid ${C.borderLight}`,
            marginBottom: 18, fontSize: 12,
          }}>
            {[
              ["Forma de pago", venta.FormaPago?.descripcion || "—"],
              ["Tipo comprobante", venta.TipoComprobante?.descripcion || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: C.muted, fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.04em", marginBottom: 2 }}>{k}</div>
                <div style={{ color: C.text, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Detalle de ítems */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Detalle
            </div>
            {items.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Sin ítems registrados.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((d, i) => {
                  const nombre =
                    d.Producto?.nombre ||
                    d.DetalleCita?.PrecioServicio?.Service?.descripcion ||
                    `Ítem #${i + 1}`;
                  const subtotal = (d.precioUnidad || 0) * (d.cantidad || 1);
                  return (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: C.white,
                      border: `1px solid ${C.borderLight}`, borderRadius: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{nombre}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {d.cantidad} × ${fmt(d.precioUnidad)}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.green800 }}>
                        ${fmt(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totales */}
          <div style={{
            padding: "14px 16px", background: C.green100,
            borderRadius: 10, border: `1px solid ${C.green200}`,
          }}>
            {[
              ["Subtotal", `$${fmt((parseFloat(venta.total || 0) - parseFloat(venta.iva || 0) + parseFloat(venta.descuento || 0)))}`],
              ["IVA (21%)", `$${fmt(venta.iva)}`],
              ...(parseFloat(venta.descuento) > 0 ? [["Descuento", `-$${fmt(venta.descuento)}`]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 6 }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingTop: 10, borderTop: `1px solid ${C.green200}`,
              fontSize: 16, fontWeight: 800, color: C.green900,
            }}>
              <span>Total</span>
              <span>${fmt(venta.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", borderTop: `1px solid ${C.borderLight}`,
          background: C.surface, display: "flex", gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 9,
            border: `1px solid ${C.border}`, background: C.white,
            color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Cerrar</button>
          <button onClick={handlePrint} style={{
            flex: 2, padding: "10px", borderRadius: 9, border: "none",
            background: C.green800, color: "white",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}>
            🖨️ Imprimir comprobante
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyReceipts() {
  const [ventas,   setVentas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    axios.get("/my-sales")
      .then(res => setVentas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("No se pudieron cargar los comprobantes."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = ventas.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(v.idVenta).includes(q) ||
      fmtFecha(v.fecha).toLowerCase().includes(q) ||
      (v.TipoComprobante?.descripcion || "").toLowerCase().includes(q) ||
      (v.FormaPago?.descripcion || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {selected && (
        <ComprobanteModal venta={selected} onClose={() => setSelected(null)} />
      )}

      {/* Encabezado */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green900}, ${C.green700})`,
        borderRadius: 16, padding: "22px 26px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Mis comprobantes
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Historial de pagos</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
            {loading ? "Cargando…" : `${ventas.length} comprobante${ventas.length !== 1 ? "s" : ""} registrado${ventas.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div style={{ fontSize: 44, opacity: 0.2 }}>🧾</div>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          fontSize: 15, opacity: 0.4,
        }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar por número, fecha o tipo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
            borderRadius: 10, border: `1px solid ${C.border}`,
            fontSize: 13.5, outline: "none", background: C.white, color: C.text,
          }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 13 }}>
          Cargando comprobantes…
        </div>
      ) : error ? (
        <div style={{
          padding: "16px 18px", background: C.redBg, borderRadius: 10,
          border: `1px solid #f7c1c1`, fontSize: 13, color: C.red,
        }}>
          ⚠️ {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>
            {search ? "Sin resultados para esa búsqueda" : "No tenés comprobantes registrados"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>
            Los comprobantes aparecen aquí cuando se registra una venta a tu nombre.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(v => {
            const cantItems = (v.detalles || []).length;
            return (
              <div
                key={v.idVenta}
                onClick={() => setSelected(v)}
                style={{
                  background: C.white, borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "16px 18px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.green200;
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,61,40,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
              >
                {/* Ícono */}
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: C.green100, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  🧾
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                      #{v.idVenta}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px",
                      borderRadius: 20, background: C.green100, color: C.green800,
                    }}>
                      {v.TipoComprobante?.descripcion || "Comprobante"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    {fmtFecha(v.fecha)}
                    {v.hora && ` · ${v.hora.slice(0, 5)} hs`}
                    {cantItems > 0 && ` · ${cantItems} ítem${cantItems !== 1 ? "s" : ""}`}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {v.FormaPago?.descripcion || "—"}
                  </div>
                </div>

                {/* Total */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.green800 }}>
                    ${fmt(v.total)}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    Ver detalle →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}