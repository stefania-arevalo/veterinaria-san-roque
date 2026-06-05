import { useEffect, useState, useMemo } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const token   = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

const IVA_RATE = 0.21;
const today    = () => new Date().toLocaleDateString("en-CA");
const nowTime  = () => new Date().toTimeString().slice(0, 5);

// ── Paleta clínica ────────────────────────────────────────────────
const C = {
  white:       "#ffffff",
  green900:    "#1a3d28",
  green800:    "#1f5c38",
  green700:    "#276b42",
  green100:    "#eaf3de",
  green200:    "#c0dd97",
  greenMint:   "#7ed4a0",
  border:      "#d1ddd4",
  borderLight: "#e8eee9",
  muted:       "#6b8f76",
  text:        "#1a3d28",
  surface:     "#f8fbf9",
  bg:          "#f0f4f1",
  amber:       "#ba7517",
  amberBg:     "#faeeda",
  blue:        "#185fa5",
  blueBg:      "#e6f1fb",
  red:         "#a32d2d",
  redBg:       "#fcebeb",
  purple:      "#534ab7",
  purpleBg:    "#eeedfe",
};

// ── Estilos base ──────────────────────────────────────────────────
const inp = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 13px", borderRadius: 9,
  border: `1px solid ${C.border}`,
  fontSize: 13.5, outline: "none",
  background: C.white, color: C.text,
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: C.muted, marginBottom: 5,
  textTransform: "uppercase", letterSpacing: "0.05em",
};

// ── AlertModal ────────────────────────────────────────────────────
function AlertModal({ emoji, emojiBg, title, message, onConfirm, onCancel, confirmText, confirmBg, cancelText }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,30,20,0.55)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, padding: "36px 32px",
        maxWidth: 400, width: "100%", textAlign: "center",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", background: emojiBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 18px",
          border: `1px solid ${C.border}`,
        }}>{emoji}</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: C.text }}>{title}</h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: message }} />
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && (
            <button onClick={onCancel} style={{
              flex: 1, padding: 11, border: `1px solid ${C.border}`,
              borderRadius: 8, background: C.white, fontWeight: 600,
              fontSize: 13, cursor: "pointer", color: C.muted,
            }}>{cancelText || "Cancelar"}</button>
          )}
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, border: "none", borderRadius: 8,
            background: confirmBg, color: "white", fontWeight: 600,
            fontSize: 13, cursor: "pointer",
          }}>{confirmText || "Aceptar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, required, children, col }) {
  return (
    <div style={col ? { gridColumn: col } : {}}>
      <label style={lbl}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      {children}
    </div>
  );
}

function PresentationSelector({ product, onSelect }) {
  const [pres, setPres] = useState(null); 
  const [open, setOpen] = useState(false);

  const cargar = async () => {
    const r = await axios.get(`/prod-pres/product/${product.idProducto}`, { headers: headers() });
    const data = r.data || [];
    if (data.length <= 1) {
      onSelect({ 
        ...product, 
        idProdPres: data[0]?.idProdPres || null, 
        idPresentacion: data[0]?.idPresentacion || null, // 👈 Se quitó el fallback tóxico
        presentacion: data[0]?.descripcion || null,
        precio: data[0]?.precio || 0 
      });
    } else {
      setPres(data);
      setOpen(true);
    }
  };

  if (open && pres) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>¿Qué presentación compraste?</div>
      {pres.map(pp => (
        <button key={pp.idProdPres} onClick={() => onSelect({ 
            ...product, 
            idProdPres: pp.idProdPres, 
            idPresentacion: pp.idPresentacion || null, // 👈 Se quitó el fallback tóxico
            presentacion: pp.descripcion, 
            precio: pp.precio 
          })}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12.5, cursor: "pointer", textAlign: "left", color: C.text }}>
          {pp.descripcion}
          {parseFloat(pp.precio) > 0 && <span style={{ float: "right", color: C.muted }}>${fmt(pp.precio)}</span>}
        </button>
      ))}
      <button onClick={() => setOpen(false)} style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>← Cancelar</button>
    </div>
  );

  return (
    <button onClick={cargar} style={{ marginTop: 4, padding: "8px", borderRadius: 8, border: "none", background: C.green800, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
      + Agregar al remito
    </button>
  );
}

// ── Modal selector de producto ────────────────────────────────────
function ProductPickerModal({ isOpen, onClose, onSelect, categories }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    axios.get(`/products?search=${search}&category=${catFilter}`, { headers: headers() })
      .then(r => setProducts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, search, catFilter]);

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(94vw, 860px)", maxHeight: "86vh",
        background: C.bg, borderRadius: 14,
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1001,
      }}>
        {/* Header */}
        <div style={{ background: C.green900, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              Seleccionar producto
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "white" }}>Catálogo de Productos</h3>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none", color: "white",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Filtros */}
        <div style={{ padding: "14px 20px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "2 1 200px" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontSize: 15 }}>🔍</span>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              style={{ ...inp, paddingLeft: 34 }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ ...inp, flex: "1 1 160px", cursor: "pointer" }}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.idCategoria} value={c.idCategoria}>{c.descripcion || c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 18,
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12, alignContent: "start",
        }}>
          {loading ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Cargando…</div>
          ) : products.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.muted }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                No se encontraron productos
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                Si es un producto nuevo, primero debés darlo de alta en el catálogo.
              </div>
              <a href="/admin/productos" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: C.green100, color: C.green800,
                border: `1px solid ${C.green200}`,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                → Ir a gestión de productos
              </a>
            </div>
          ) : products.map(p => (
            <div key={p.idProducto} style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{p.nombre}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.presentacion && (
                      <span style={{ fontSize: 11, background: C.blueBg, color: C.blue, padding: "2px 7px", borderRadius: 5 }}>
                          {p.presentacion}
                      </span>
                  )}
                  <span style={{ fontSize: 11, background: C.green100, color: C.green800, padding: "2px 7px", borderRadius: 5 }}>
                      Stock: {p.stock ?? 0}
                  </span>
                  {(p.Categoria?.descripcion || p.categoria) && (
                      <span style={{ fontSize: 11, background: C.surface, color: C.muted, padding: "2px 7px", borderRadius: 5, border: `1px solid ${C.border}` }}>
                          {p.Categoria?.descripcion || p.categoria}
                      </span>
                  )}
                  {(p.Marca?.descripcion || p.Brand?.descripcion) && (
                      <span style={{ fontSize: 11, background: "#eeedfe", color: "#534ab7", padding: "2px 7px", borderRadius: 5 }}>
                          {p.Marca?.descripcion || p.Brand?.descripcion}
                      </span>
                  )}
              </div>
              <PresentationSelector
                product={p}
                onSelect={(prodConPres) => { onSelect(prodConPres); onClose(); }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── HistorialCompras ──────────────────────────────────────────────
function HistorialCompras({ onBack, canEliminar }) {
  const [compras,  setCompras]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [detalle,  setDetalle]  = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [msgOk,    setMsgOk]    = useState("");
  const [msgErr,   setMsgErr]   = useState("");

  // ── Filtros ──
  const [filtFechaDesde, setFiltFechaDesde] = useState("");
  const [filtFechaHasta, setFiltFechaHasta] = useState("");
  const [filtProveedor,  setFiltProveedor]  = useState("");
  const [filtVisitador,  setFiltVisitador]  = useState("");

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const r = await axios.get("/purchases", { headers: headers() });
      setCompras(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompras(); }, []);

  // Listas derivadas para los selects de filtro
  const proveedoresUnicos = useMemo(() => {
    const seen = new Set();
    return compras
      .filter(c => c.Proveedor?.idProveedor && !seen.has(c.Proveedor.idProveedor) && seen.add(c.Proveedor.idProveedor))
      .map(c => ({ id: c.Proveedor.idProveedor, label: c.Proveedor.razonSocial }));
  }, [compras]);

  const visitadoresUnicos = useMemo(() => {
    const seen = new Set();
    return compras
      .filter(c => c.Visitador?.idVisitador && !seen.has(c.Visitador.idVisitador) && seen.add(c.Visitador.idVisitador))
      .map(c => ({ id: c.Visitador.idVisitador, label: `${c.Visitador.nombre} ${c.Visitador.apellido}` }));
  }, [compras]);

  // Compras filtradas
  const comprasFiltradas = useMemo(() => {
    return compras.filter((c) => {
      if (filtFechaDesde && c.fecha < filtFechaDesde) return false;
      if (filtFechaHasta && c.fecha > filtFechaHasta) return false;
      if (filtProveedor.trim()) {
        const q = filtProveedor.toLowerCase();
        const razon = (c.Proveedor?.razonSocial || "").toLowerCase();
        if (!razon.includes(q)) return false;
      }
      if (filtVisitador.trim()) {
        const q = filtVisitador.toLowerCase();
        const nombre = `${c.Visitador?.nombre || ""} ${c.Visitador?.apellido || ""}`.toLowerCase();
        if (!nombre.includes(q)) return false;
      }
      return true;
    });
  }, [compras, filtFechaDesde, filtFechaHasta, filtProveedor, filtVisitador]);

  const hayFiltros = filtFechaDesde || filtFechaHasta || filtProveedor || filtVisitador;

  const limpiarFiltros = () => {
    setFiltFechaDesde(""); setFiltFechaHasta("");
    setFiltProveedor(""); setFiltVisitador("");
  };

  const eliminar = async () => {
    try {
      await axios.delete(`/purchase/${confirm}`, { headers: headers() });
      setConfirm(null);
      setMsgOk("La compra fue anulada y el stock fue restaurado correctamente.");
      fetchCompras();
    } catch {
      setConfirm(null);
      setMsgErr("No se pudo eliminar la compra.");
    }
  };

  const filtInp = {
    padding: "8px 11px", borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 13, outline: "none",
    background: C.white, color: C.text,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>
      {confirm && (
        <AlertModal emoji="⚠️" emojiBg={C.amberBg}
          title="¿Eliminar esta compra?"
          message="Esta acción <strong>no se puede deshacer</strong>. El stock ingresado será revertido."
          confirmText="Sí, eliminar" confirmBg={C.red} cancelText="Cancelar"
          onConfirm={eliminar} onCancel={() => setConfirm(null)} />
      )}
      {msgOk && (
        <AlertModal emoji="✅" emojiBg={C.green100} title="Operación exitosa" message={msgOk}
          confirmText="Aceptar" confirmBg={C.green800} onConfirm={() => setMsgOk("")} />
      )}
      {msgErr && (
        <AlertModal emoji="❌" emojiBg={C.redBg} title="Error" message={msgErr}
          confirmText="Cerrar" confirmBg={C.red} onConfirm={() => setMsgErr("")} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>📦 Historial de Compras</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Registro de todos los ingresos de stock</p>
        </div>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 7,
          background: C.white, border: `1px solid ${C.border}`,
          padding: "9px 16px", borderRadius: 9, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: C.muted,
        }}>← Volver a Nueva Compra</button>
      </div>

      {/* ── Barra de filtros ── */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "14px 16px",
        marginBottom: 16,
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end",
      }}>

        {/* Fecha desde */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Desde</span>
          <input type="date" value={filtFechaDesde}
            onChange={e => setFiltFechaDesde(e.target.value)}
            style={{ ...filtInp, cursor: "text" }} />
        </div>

        {/* Fecha hasta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hasta</span>
          <input type="date" value={filtFechaHasta}
            onChange={e => setFiltFechaHasta(e.target.value)}
            style={{ ...filtInp, cursor: "text" }} />
        </div>

        {/* Proveedor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Proveedor</span>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={filtProveedor}
              onChange={e => setFiltProveedor(e.target.value)}
              style={{ ...filtInp, paddingLeft: 30, cursor: "text" }}
            />
          </div>
        </div>

        {/* Visitador */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Visitador</span>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar visitador..."
              value={filtVisitador}
              onChange={e => setFiltVisitador(e.target.value)}
              style={{ ...filtInp, paddingLeft: 30, cursor: "text" }}
            />
          </div>
        </div>

        {/* Contador + limpiar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <span style={{
            fontSize: 12, color: C.muted, whiteSpace: "nowrap",
            background: C.surface, padding: "6px 10px",
            borderRadius: 7, border: `1px solid ${C.border}`,
          }}>
            {comprasFiltradas.length} de {compras.length} compras
          </span>
          {hayFiltros && (
            <button onClick={limpiarFiltros} style={{
              background: C.redBg, color: C.red,
              border: `1px solid #f7c1c1`,
              padding: "7px 12px", borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {["#", "Fecha · Hora", "Proveedor", "Visitador", "Forma de pago", "IVA", "Total", "Acciones"].map((h, i) => (
                <th key={h} style={{
                  padding: "11px 16px", fontSize: 10, fontWeight: 700,
                  color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em",
                  textAlign: i === 7 ? "right" : "left",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>Cargando compras…</td></tr>
            ) : comprasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {hayFiltros ? "Sin resultados para los filtros aplicados." : "No hay compras registradas."}
                </td>
              </tr>
            ) : comprasFiltradas.map((compra, idx) => (
              <tr key={compra.idCompra}
                style={{ borderBottom: idx < comprasFiltradas.length - 1 ? `1px solid ${C.borderLight}` : "none", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface}
                onMouseLeave={e => e.currentTarget.style.background = C.white}
              >
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>#{compra.idCompra}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.text }}>
                  <div style={{ fontWeight: 600 }}>{new Date(compra.fecha + "T00:00:00").toLocaleDateString("es-AR")}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{compra.hora}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.text }}>{compra.Proveedor?.razonSocial || "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                  {compra.Visitador ? `${compra.Visitador.nombre} ${compra.Visitador.apellido}` : <span style={{ color: C.border }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, background: C.green100, color: C.green800, padding: "3px 8px", borderRadius: 6 }}>
                    {compra.FormaPago?.descripcion || "—"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>${fmt(compra.iva)}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.green800 }}>
                  ${fmt(parseFloat(compra.iva || 0) + (compra.detalles || []).reduce((acc, d) => acc + parseFloat(d.precioUnidad || 0) * (d.cantidad || 1), 0) - parseFloat(compra.descuento || 0))}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => setDetalle(compra)} style={{
                      padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                      background: C.blueBg, color: C.blue, border: `1px solid #b5d4f4`, cursor: "pointer",
                    }}>Ver detalle</button>
                    {canEliminar && (
                      <button onClick={() => setConfirm(compra.idCompra)} style={{
                        padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: C.redBg, color: C.red, border: `1px solid #f7c1c1`, cursor: "pointer",
                      }}>Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalle — sin cambios */}
      {detalle && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(10,30,20,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ background: C.green900, padding: "16px 20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Compra</div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>#{detalle.idCompra} · {detalle.Proveedor?.razonSocial}</h3>
              </div>
              <button onClick={() => setDetalle(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: C.surface, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                {[
                  ["Fecha", new Date(detalle.fecha + "T00:00:00").toLocaleDateString("es-AR")],
                  ["Hora", detalle.hora],
                  ["Proveedor", detalle.Proveedor?.razonSocial || "—"],
                  ["Visitador", detalle.Visitador ? `${detalle.Visitador.nombre} ${detalle.Visitador.apellido}` : "—"],
                  ["Forma de pago", detalle.FormaPago?.descripcion || "—"],
                  ["Comprobante", detalle.TipoComprobante?.descripcion || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 2 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10, borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 8 }}>Productos recibidos</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(detalle.detalles || []).map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: `1px solid ${C.borderLight}`, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{d.Producto?.nombre || `Producto #${d.idProducto}`}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        Lote: {d.Lote?.codigoLote || `#${d.idLote}`} · Venc: {d.Lote?.fechaVencimiento || "—"} · {d.cantidad} un. × ${fmt(d.precioUnidad)}
                      </div>
                    </div>
                    <strong style={{ fontSize: 13, color: C.text }}>${fmt(d.precioUnidad * d.cantidad)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "14px 20px", background: C.surface, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              {[["IVA (21%)", `$${fmt(detalle.iva)}`], ["Descuento", `-$${fmt(detalle.descuento || 0)}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 6 }}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 600, color: C.green800 }}>
                  ${fmt(parseFloat(detalle.iva || 0) + (detalle.detalles || []).reduce((acc, d) => acc + parseFloat(d.precioUnidad || 0) * (d.cantidad || 1), 0) - parseFloat(detalle.descuento || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function ComprasPage() {
  const { user } = useAuth();
  const canEliminar = [1].includes(user?.idRol);  // Admin, asistente y vendedor pueden eliminar compras
  const [showHistory, setShowHistory] = useState(false);

  // Listas lookup
  const [providers, setProviders] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loteAlert, setLoteAlert] = useState(null);
  // ── Estados para mini modales de nuevo proveedor/visitador ────────
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [showNewVisitor, setShowNewVisitor]   = useState(false);
  const [newProvForm, setNewProvForm] = useState({ 
    razonSocial: "", cuit: "", telefono: "", 
    direccion: "", correo: "", idLocalidad: "" 
  });
  const [newVisForm, setNewVisForm]   = useState({ nombre: "", apellido: "", telefono: "", correo: "" });
  const [localities, setLocalities]   = useState([]);
  const [savingNew, setSavingNew]     = useState(false);
  const [newError, setNewError]       = useState("");

  // Cabecera del remito
  const [form, setForm] = useState({
    fecha:        today(),
    hora:         nowTime(),
    idProveedor:  "",
    idVisitador:  "",
    idTipoPago:   "",
    idTipoBoleta: "",
    descuento:    0,
  });

  // Líneas del remito
  const [lineas, setLineas] = useState([]);

  // Buscador / modal de producto
  const [pickerOpen, setPickerOpen] = useState(false);

  // Estado UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.allSettled([
      axios.get("/providers", { headers: headers() }),
      axios.get("/visitors", { headers: headers() }),
      axios.get("/payment-types", { headers: headers() }),
      axios.get("/receipt-types", { headers: headers() }),
      axios.get("/categories", { headers: headers() }),
      axios.get("/localities",    { headers: headers() }),
    ]).then(([prov, vis, pt, rt, cat, loc]) => {
      if (prov.status === "fulfilled") setProviders(prov.value.data || []);
      if (vis.status === "fulfilled") setVisitors(vis.value.data || []);
      if (pt.status === "fulfilled") setPaymentTypes(pt.value.data || []);
      if (rt.status === "fulfilled") setReceiptTypes(rt.value.data || []);
      if (cat.status === "fulfilled") setCategories(cat.value.data || []);
      if (loc.status === "fulfilled")  setLocalities(loc.value.data   || []);
    }).finally(() => setLoadingLists(false));
  }, []);

  // Evaluamos en tiempo real si falta completar datos de las líneas de la tabla
  const camposIncompletos = useMemo(() => {
    return lineas.some(l => 
      !l.precioUnidad || parseFloat(l.precioUnidad) <= 0 || 
      !l.precioVentaPublico || parseFloat(l.precioVentaPublico) <= 0 ||
      !l.cantidad || parseInt(l.cantidad) <= 0 ||
      !l.codigoLote || l.codigoLote.trim() === "" || 
      !l.fechaVencimiento
    );
  }, [lineas]);

  // Visitadores filtrados por proveedor seleccionado
  const visitadoresFiltrados = useMemo(() =>
    form.idProveedor ? visitors.filter(v => String(v.idProveedor) === String(form.idProveedor)) : visitors,
    [visitors, form.idProveedor]
  );

  const hf = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === "idProveedor") setForm(p => ({ ...p, idProveedor: value, idVisitador: "" }));
    setError("");
  };

  // ── Agregar producto desde el picker ─────────────────────────────
  const agregarProducto = (prod) => {
    const existingIdx = lineas.findIndex(
      (l) => l.idProducto === prod.idProducto
    );
   
    if (existingIdx !== -1) {
      setLoteAlert({ prod, existingIdx });
      return;
    }
   
    _pushLinea(prod);
  };
   
  // Función interna que hace el push real:
  const _pushLinea = (prod) => {
    setLineas((prev) => [
      ...prev,
      {
        uniqueId:               `${prod.idProducto}-${Date.now()}`,
        idProducto:             prod.idProducto,
        nombreProducto:         prod.nombre,
        presentacion:           prod.presentacion || null,
        idProductoPresentacion: prod.idProdPres || null,
        idPresentacion:         prod.idPresentacion || null, // 👈 Se quitó el fallback
        codigoLote:             "",
        fechaVencimiento:       "",
        cantidad:               1,
        precioUnidad:           "", 
        precioVentaActual:      parseFloat(prod.precio || 0), 
        precioVentaPublico:     parseFloat(prod.precio || 0), 
      },
    ]);
  };
  // ── Actualizar campo de una línea ─────────────────────────────────
  const updateLinea = (uniqueId, field, value) => {
    setLineas(prev => prev.map(item => item.uniqueId === uniqueId ? { ...item, [field]: value } : item ));
  };

  // ── Eliminar línea ────────────────────────────────────────────────
  const removeLinea = (uniqueId) => {
    setLineas(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  // ── Totales ─────────────────
  const subtotal = useMemo(() => {
    return lineas.reduce((acc, item) => acc + parseFloat(item.precioUnidad || 0) * parseInt(item.cantidad || 1), 0);
  }, [lineas]);

  const totalIva = useMemo(() => subtotal * IVA_RATE, [subtotal]);
  
  const totalFinal = useMemo(() => {
    return subtotal + totalIva - parseFloat(form.descuento || 0);
  }, [subtotal, totalIva, form.descuento]);

  // ── Guardar nuevo proveedor ───────────────────────────────────────
  const handleSaveProvider = async () => {
    setNewError("");
    if (!newProvForm.razonSocial || !newProvForm.cuit || !newProvForm.telefono || !newProvForm.idLocalidad) {
      setNewError("Completá todos los campos obligatorios.");
      return;
    }
    setSavingNew(true);
    try {
      const res = await axios.post("/provider", newProvForm, { headers: headers() });
      const created = res.data;
      setProviders(prev => [...prev, created]);
      setForm(p => ({ ...p, idProveedor: String(created.idProveedor), idVisitador: "" }));
      setNewProvForm({ razonSocial: "", cuit: "", telefono: "", idLocalidad: "" });
      setShowNewProvider(false);
    } catch (e) {
      setNewError(e.response?.data?.msg || "Error al crear el proveedor.");
    } finally {
      setSavingNew(false);
    }
  };

  // ── Guardar nuevo visitador ───────────────────────────────────────
  const handleSaveVisitor = async () => {
    setNewError("");
    if (!newVisForm.nombre || !newVisForm.apellido) {
      setNewError("Nombre y apellido son obligatorios.");
      return;
    }
    if (!form.idProveedor) {
      setNewError("Seleccioná un proveedor antes de crear un visitador.");
      return;
    }
    setSavingNew(true);
    try {
      const payload = { ...newVisForm, idProveedor: Number(form.idProveedor) };
      const res = await axios.post("/visitor", payload, { headers: headers() });
      const created = res.data;
      setVisitors(prev => [...prev, created]);
      setForm(p => ({ ...p, idVisitador: String(created.idVisitador) }));
      setNewVisForm({ nombre: "", apellido: "", telefono: "", correo: "" });
      setShowNewVisitor(false);
    } catch (e) {
      setNewError(e.response?.data?.msg || "Error al crear el visitador.");
    } finally {
      setSavingNew(false);
    }
  };
  // ── Validación y envío ────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!form.idProveedor || !form.idTipoPago || !form.idTipoBoleta) {
      setError("Completá proveedor, medio de pago y tipo de comprobante.");
      return;
    }
    if (lineas.length === 0) {
      setError("Agregá al menos un producto al remito.");
      return;
    }
    for (const l of lineas) {
      if (!l.fechaVencimiento || !l.codigoLote || !l.cantidad || !l.precioUnidad || !l.precioVentaPublico) {
        setError(`Completá todos los datos obligatorios (*) para "${l.nombreProducto}".`);
        return;
      }
    }

    const itemsPayload = lineas.map(l => {
      return {
        idProducto:             Number(l.idProducto),
        // Si hay ID lo convertimos a número, si no, enviamos explícitamente null
        idProductoPresentacion: l.idProductoPresentacion ? Number(l.idProductoPresentacion) : null, 
        idPresentacion:         l.idPresentacion ? Number(l.idPresentacion) : null, 
        codigoLote:             l.codigoLote.trim(),
        fechaVencimiento:       l.fechaVencimiento,
        cantidad:               parseInt(l.cantidad, 10),
        precioUnidad:           parseFloat(parseFloat(l.precioUnidad).toFixed(2)),
        precioVentaPublico:     parseFloat(parseFloat(l.precioVentaPublico).toFixed(2)), 
      };
    });
    
    setSaving(true);
    try {
      await axios.post("/purchase", {
        fecha:        form.fecha,
        hora:         form.hora,
        idPersonal:   user?.idPersonal,
        idProveedor:  Number(form.idProveedor),
        idVisitador:  form.idVisitador ? Number(form.idVisitador) : null,
        idTipoPago:   Number(form.idTipoPago),
        idTipoBoleta: Number(form.idTipoBoleta),
        descuento:    parseFloat(form.descuento || 0),
        iva:          parseFloat(totalIva.toFixed(2)),
        items:        itemsPayload,
      }, { headers: headers() });

      setSuccess("La compra fue registrada y el stock fue actualizado correctamente.");
      setLineas([]);
      setForm({ fecha: today(), hora: nowTime(), idProveedor: "", idVisitador: "", idTipoPago: "", idTipoBoleta: "", descuento: 0 });
    } catch (e) {
      console.error("❌ [Frontend] El backend rechazó la petición. Detalles:", e.response?.data);
      const msg = e.response?.data?.msg || e.response?.data?.message || JSON.stringify(e.response?.data) || "Error al registrar la compra.";
      setError(msg);
    } finally { setSaving(false); }
  };

  if (showHistory) {
    return (
      <HistorialCompras 
        onBack={() => setShowHistory(false)} 
        canEliminar={canEliminar} 
      />
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px", background: C.bg, minHeight: "100vh" }}>
      {success && (
        <AlertModal emoji="✅" emojiBg={C.green100} title="Operación exitosa" message={success}
          confirmText="Aceptar" confirmBg={C.green800} onConfirm={() => setSuccess("")} />
      )}

      {/* ── Mini modal: Nuevo Proveedor ── */}
      {showNewProvider && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(10,30,20,0.55)", backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.white, borderRadius:16, padding:"28px 26px", maxWidth:460, width:"100%", border:`1px solid ${C.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>Nuevo Proveedor</h3>
              <button onClick={() => { setShowNewProvider(false); setNewError(""); }} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.muted }}>✕</button>
            </div>
            {newError && <div style={{ background:C.redBg, color:C.red, padding:"8px 12px", borderRadius:8, fontSize:13, marginBottom:14, border:`1px solid #f7c1c1` }}>{newError}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <div>
                <label style={lbl}>Razón Social <span style={{ color:C.red }}>*</span></label>
                <input value={newProvForm.razonSocial} onChange={e => setNewProvForm(p => ({ ...p, razonSocial: e.target.value }))} placeholder="Nombre o razón social" style={inp} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>CUIT <span style={{ color:C.red }}>*</span></label>
                  <input value={newProvForm.cuit} onChange={e => setNewProvForm(p => ({ ...p, cuit: e.target.value }))} placeholder="20-12345678-9" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Teléfono <span style={{ color:C.red }}>*</span></label>
                  <input value={newProvForm.telefono} onChange={e => setNewProvForm(p => ({ ...p, telefono: e.target.value }))} placeholder="2991234567" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Correo</label>
                  <input type="email" value={newProvForm.correo} onChange={e => setNewProvForm(p => ({ ...p, correo: e.target.value }))} placeholder="proveedor@ejemplo.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Dirección</label>
                <input value={newProvForm.direccion} onChange={e => setNewProvForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Av. San Martín 1234" style={inp} />
              </div>
              <div>
                <label style={lbl}>Localidad <span style={{ color:C.red }}>*</span></label>
                <select value={newProvForm.idLocalidad} onChange={e => setNewProvForm(p => ({ ...p, idLocalidad: e.target.value }))} style={{ ...inp, cursor:"pointer" }}>
                  <option value="">Seleccione...</option>
                  {localities.map(l => <option key={l.idLocalidad} value={l.idLocalidad}>{l.nombre || l.descripcion}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button onClick={() => { setShowNewProvider(false); setNewError(""); }} style={{ flex:1, padding:11, border:`1px solid ${C.border}`, borderRadius:8, background:C.white, fontWeight:600, fontSize:13, cursor:"pointer", color:C.muted }}>Cancelar</button>
                <button onClick={handleSaveProvider} disabled={savingNew} style={{ flex:1, padding:11, border:"none", borderRadius:8, background:C.green800, color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  {savingNew ? "Guardando..." : "Guardar Proveedor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mini modal: Nuevo Visitador ── */}
      {showNewVisitor && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(10,30,20,0.55)", backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.white, borderRadius:16, padding:"28px 26px", maxWidth:460, width:"100%", border:`1px solid ${C.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>Nuevo Visitador</h3>
              <button onClick={() => { setShowNewVisitor(false); setNewError(""); }} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.muted }}>✕</button>
            </div>
            {form.idProveedor && (
              <div style={{ fontSize:12, color:C.muted, marginBottom:16, padding:"6px 10px", background:C.green100, borderRadius:7, border:`1px solid ${C.green200}` }}>
                Proveedor: <strong>{providers.find(p => String(p.idProveedor) === String(form.idProveedor))?.razonSocial}</strong>
              </div>
            )}
            {newError && <div style={{ background:C.redBg, color:C.red, padding:"8px 12px", borderRadius:8, fontSize:13, marginBottom:14, border:`1px solid #f7c1c1` }}>{newError}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>Nombre <span style={{ color:C.red }}>*</span></label>
                  <input value={newVisForm.nombre} onChange={e => setNewVisForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Juan" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Apellido <span style={{ color:C.red }}>*</span></label>
                  <input value={newVisForm.apellido} onChange={e => setNewVisForm(p => ({ ...p, apellido: e.target.value }))} placeholder="García" style={inp} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>Teléfono</label>
                  <input value={newVisForm.telefono} onChange={e => setNewVisForm(p => ({ ...p, telefono: e.target.value }))} placeholder="2991234567" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Correo</label>
                  <input value={newVisForm.correo} onChange={e => setNewVisForm(p => ({ ...p, correo: e.target.value }))} placeholder="juan@ejemplo.com" style={inp} />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button onClick={() => { setShowNewVisitor(false); setNewError(""); }} style={{ flex:1, padding:11, border:`1px solid ${C.border}`, borderRadius:8, background:C.white, fontWeight:600, fontSize:13, cursor:"pointer", color:C.muted }}>Cancelar</button>
                <button onClick={handleSaveVisitor} disabled={savingNew} style={{ flex:1, padding:11, border:"none", borderRadius:8, background:C.green800, color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  {savingNew ? "Guardando..." : "Guardar Visitador"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loteAlert && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: C.white, borderRadius: 16,
            width: "100%", maxWidth: 420, padding: "32px 28px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: C.amberBg, border: `1px solid ${C.amberBorder ?? "#f0d080"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, margin: "0 auto 16px",
            }}>📦</div>
      
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: C.text }}>
              Producto ya en el remito
            </h3>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: C.text, fontWeight: 600 }}>
              {loteAlert.prod.nombre}
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Este producto ya tiene una fila en el remito.
              Si es <strong>el mismo lote</strong>, incrementá la cantidad desde la grilla.
              Si es un <strong>lote nuevo</strong> (distinto vencimiento o precio), podés agregarlo como fila separada.
            </p>
      
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => {
                  setLineas((prev) =>
                    prev.map((l, idx) =>
                      idx === loteAlert.existingIdx
                        ? { ...l, cantidad: parseInt(l.cantidad || 1) + 1 }
                        : l
                    )
                  );
                  setLoteAlert(null);
                }}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  background: C.green800, color: "white",
                  border: "none", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                }}
              >
                + Incrementar cantidad (mismo lote)
              </button>
      
              <button
                onClick={() => {
                  _pushLinea(loteAlert.prod);
                  setLoteAlert(null);
                }}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  background: C.white, color: C.green800,
                  border: `1.5px solid ${C.green700}`,
                  fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                }}
              >
                Agregar como lote nuevo (distinto vencimiento)
              </button>
      
              <button
                onClick={() => setLoteAlert(null)}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10,
                  background: C.white, color: C.muted,
                  border: `1px solid ${C.border}`,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header principal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Nueva Compra de Stock</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Registrar ingreso de productos y actualización de lotes</p>
        </div>
        <button onClick={() => setShowHistory(true)} style={{
          display: "flex", alignItems: "center", gap: 7,
          background: C.white, border: `1px solid ${C.border}`,
          padding: "9px 16px", borderRadius: 9, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: C.muted,
        }}>📦 Ver Historial de Compras</button>
      </div>

      {/* Grid Principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* SECCIÓN 1: DATOS GENERALES */}
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.green800, textTransform: "uppercase", letterSpacing: "0.05em" }}>1. Datos del Comprobante</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14 }}>
              <Field label="Fecha" required col="span 3">
                <input type="date" name="fecha" value={form.fecha} onChange={hf} style={inp} />
              </Field>
              <Field label="Hora" required col="span 2">
                <input type="time" name="hora" value={form.hora} onChange={hf} style={inp} />
              </Field>
              <Field label="Tipo Comprobante" required col="span 4">
                <select name="idTipoBoleta" value={form.idTipoBoleta} onChange={hf} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccione...</option>
                  {receiptTypes.map(t => <option key={t.idTipoBoleta} value={t.idTipoBoleta}>{t.descripcion}</option>)}
                </select>
              </Field>
              <Field label="Forma de Pago" required col="span 3">
                <select name="idTipoPago" value={form.idTipoPago} onChange={hf} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccione...</option>
                  {paymentTypes.map(t => <option key={t.idTipoPago} value={t.idTipoPago}>{t.descripcion}</option>)}
                </select>
              </Field>

              <Field label="Proveedor" required col="span 6">
                <div style={{ display:"flex", gap:8 }}>
                  <select name="idProveedor" value={form.idProveedor} onChange={hf} style={{ ...inp, cursor:"pointer", flex:1 }}>
                    <option value="">Seleccione un proveedor...</option>
                    {providers.map(p => <option key={p.idProveedor} value={p.idProveedor}>{p.razonSocial}</option>)}
                  </select>
                  <button type="button" onClick={() => { setNewError(""); setShowNewProvider(true); }}
                    style={{ padding:"0 12px", borderRadius:9, border:`1px solid ${C.green200}`, background:C.green100, color:C.green800, fontWeight:700, fontSize:18, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
                    title="Crear nuevo proveedor">+</button>
                </div>
              </Field>
              <Field label="Visitador / Agente" col="span 6">
                <div style={{ display:"flex", gap:8 }}>
                  <select name="idVisitador" value={form.idVisitador} onChange={hf}
                    disabled={!form.idProveedor}
                    style={{ ...inp, cursor: form.idProveedor ? "pointer" : "not-allowed", opacity: form.idProveedor ? 1 : 0.6, flex:1 }}>
                    <option value="">{form.idProveedor ? "Seleccione un visitador (Opcional)..." : "Seleccione primero un proveedor"}</option>
                    {visitadoresFiltrados.map(v => <option key={v.idVisitador} value={v.idVisitador}>{v.nombre} {v.apellido}</option>)}
                  </select>
                  <button type="button"
                    onClick={() => { setNewError(""); setShowNewVisitor(true); }}
                    disabled={!form.idProveedor}
                    style={{ padding:"0 12px", borderRadius:9, border:`1px solid ${C.green200}`, background: form.idProveedor ? C.green100 : C.border, color: form.idProveedor ? C.green800 : C.muted, fontWeight:700, fontSize:18, cursor: form.idProveedor ? "pointer" : "not-allowed", flexShrink:0 }}
                    title={form.idProveedor ? "Crear nuevo visitador" : "Seleccioná primero un proveedor"}>+</button>
                </div>
              </Field>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLE DE ARTÍCULOS */}
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, minHeight: 260, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.green800, textTransform: "uppercase", letterSpacing: "0.05em" }}>2. Artículos en el Remito</h3>
              <button type="button" onClick={() => setPickerOpen(true)} style={{
                background: C.green800, color: "white", border: "none", padding: "8px 14px",
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}>+ Buscar Producto</button>
            </div>

            {error && (
              <div style={{ background: C.redBg, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, border: `1px solid #f7c1c1` }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ flex: 1, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
                    {["Producto", "Lote *", "Vencimiento *", "Cant *", "Precio Unit *","Precio Venta *",  "Subtotal", ""].map((h, idx) => (
                      <th key={idx} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: idx === 5 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineas.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 13.5 }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                        No hay productos agregados al remito aún. Use el botón de arriba para buscar.
                      </td>
                    </tr>
                  ) : (
                    lineas.map((linea) => {
                      const rowSubtotal = parseFloat(linea.precioUnidad || 0) * parseInt(linea.cantidad || 1);
                      return (
                        <tr key={linea.uniqueId} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                          <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>{linea.nombreProducto}</div>
                            {linea.presentacion && <span style={{ fontSize: 11, color: C.blue, background: C.blueBg, padding: "1px 5px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>{linea.presentacion}</span>}
                          </td>
                          <td style={{ padding: "10px 4px" }}>
                            <input type="text" placeholder="ABC1234" value={linea.codigoLote} onChange={e => updateLinea(linea.uniqueId, "codigoLote", e.target.value)} style={{ ...inp, padding: "6px 10px" }} />
                          </td>
                          <td style={{ padding: "10px 4px" }}>
                            <input type="date" value={linea.fechaVencimiento} onChange={e => updateLinea(linea.uniqueId, "fechaVencimiento", e.target.value)} style={{ ...inp, padding: "5px 8px" }} />
                          </td>
                          <td style={{ padding: "10px 4px", width: 75 }}>
                            <input type="number" min="1" value={linea.cantidad} onChange={e => updateLinea(linea.uniqueId, "cantidad", parseInt(e.target.value) || "")} style={{ ...inp, padding: "6px 8px", textAlign: "center" }} />
                          </td>
                          <td style={{ padding: "10px 4px", width: 105 }}>
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted }}>$</span>
                              <input type="number" step="0.01" min="0" placeholder="Costo" value={linea.precioUnidad} onChange={e => updateLinea(linea.uniqueId, "precioUnidad", e.target.value)} style={{ ...inp, padding: "6px 8px 6px 18px" }} />
                            </div>
                          </td>
                          <td style={{ padding: "10px 4px", width: 105 }}>
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.green700 }}>$</span>
                              <input 
                                type="number" 
                                step="0.01" 
                                placeholder="Venta" 
                                value={linea.precioVentaPublico || ""} 
                                onChange={e => updateLinea(linea.uniqueId, "precioVentaPublico", e.target.value)} 
                                style={{ ...inp, padding: "6px 8px 6px 18px", borderColor: C.greenMint }} 
                              />
                              {linea.precioVentaActual > 0 && (
                                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>
                                  <span>Venta actual: </span>${fmt(linea.precioVentaActual)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13.5, fontWeight: 600, color: C.text }}>
                            ${fmt(rowSubtotal)}
                          </td>
                          <td style={{ padding: "10px 6px", textAlign: "center" }}>
                            <button type="button" onClick={() => removeLinea(linea.uniqueId)} style={{ background: "none", border: "none", color: C.red, fontSize: 16, cursor: "pointer", padding: "4px 8px" }}>✕</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RESUMEN LATERAL */}
        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ background: C.surface, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen de Totales</h3>
            </div>
            
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text }}>
                <span>Subtotal Neto</span>
                <span style={{ fontWeight: 600 }}>${fmt(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}>
                <span>IVA Percibido (21%)</span>
                <span>${fmt(totalIva)}</span>
              </div>
              
              <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 10 }}>
                <Field label="Descuento General ($)">
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted }}>$</span>
                    <input type="number" name="descuento" min="0" value={form.descuento} onChange={hf} style={{ ...inp, padding: "7px 10px 7px 22px" }} />
                  </div>
                </Field>
              </div>
            </div>

            <div style={{ background: C.green900, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.55)" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: C.greenMint }}>${fmt(totalFinal)}</span>
            </div>

            {/* CONTROL DEL BOTÓN: Oculto si faltan campos o no hay productos, se renderiza impecable al completarse todo */}
            {lineas.length > 0 && !camposIncompletos && (
              <div style={{ padding: "14px 16px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 10, border: "none",
                    background: saving ? C.border : C.green800,
                    color: "white", fontWeight: 700, fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {saving ? "Registrando…" : "✓ Confirmar compra"}
                </button>
              </div>
            )}

            {/* Cartel alternativo de aviso si hay ítems pero la tabla está incompleta */}
            {lineas.length > 0 && camposIncompletos && (
              <div style={{ padding: "16px 18px", textAlign: "center", fontSize: 12.5, color: C.red, fontWeight: 600, background: C.redBg, borderTop: `1px solid #f7c1c1` }}>
                ⚠️ Complete todos los campos marcados con (*) en la grilla para confirmar la compra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal selector de producto */}
      <ProductPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={agregarProducto}
        categories={categories}
      />
    </div>
  );
}