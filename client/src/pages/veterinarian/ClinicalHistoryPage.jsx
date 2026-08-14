import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { CarnetVacunal } from "../../components/shared/CarnetVacunal"; 

const token = () => localStorage.getItem("accessToken");
const hdrs = () => ({ Authorization: `Bearer ${token()}` });

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmt = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const C = {
  bg: "#f0f4f1", white: "#ffffff",
  green900: "#1a3d28", green800: "#1f5c38", green700: "#2d6a4f",
  green100: "#eaf3de", green200: "#c0dd97",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9",
  amber: "#ba7517", amberBg: "#faeeda", amberBorder: "#fde68a",
  purple: "#534ab7", purpleBg: "#eeedfe", purpleBorder: "#c4bfee",
  blue: "#185fa5", blueBg: "#e6f1fb", blueBorder: "#b5d4f4",
  red: "#a32d2d", redBg: "#fcebeb", redBorder: "#f7c1c1",
  teal: "#0f766e", tealBg: "#ccfbf1",
};

const Ic = {
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  back:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  calendar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  steth:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  syringe:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 2 4 4-14 14H4v-4L18 2z"/><path d="m14.5 5.5 4 4"/></svg>,
  pill:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>,
  plus:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  temp:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  weight:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.46A2 2 0 0 0 17.48 8Z"/></svg>,
  chevron:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  x:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  grid:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  package:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 4.9V17L12 22l-9-5.1V6.9L12 2z"/><line x1="12" y1="22" x2="12" y2="12"/><path d="m3.3 7 8.7 5 8.7-5"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Label legible de prod-pres: "Amoxicilina — Comprimidos 250mg — $3500" */
function getProdPresLabel(pp) {
  if (!pp) return "—";
  // Estructura que devuelve GET /prod-pres con includes
  const producto =
    pp?.Product?.nombre || pp?.Producto?.nombre ||
    pp?.nombreProducto || pp?.nombre || "Producto";
  const presentacion = pp?.Presentacion
    ? `${pp.Presentacion.tipo || ""} ${pp.Presentacion.formato || ""}`.trim()
    : pp?.presentacion || pp?.formato || pp?.descripcion || "";
  const precio = pp?.precio != null ? `$${fmt(pp.precio)}` : "";
  return [producto, presentacion, precio].filter(Boolean).join(" — ");
}

function getProdPresId(pp) {
  return pp?.idProdPres ?? pp?.idProd_Pres ?? pp?.id ?? "";
}

function getVaccineLabel(v) {
  if (!v) return "—";
  return v?.Producto?.nombre || v?.nombre || v?.enfermedadPreventiva || `Vacuna #${v?.idVacuna ?? v?.idProducto}`;
}

/** Label del medicamento dentro de un tratamiento (viene con PresentacionProducto del backend) */
function getMedLabel(m) {
  const pp = m?.PresentacionProducto;
  if (pp) {
    const prod = pp?.Product?.nombre || pp?.Producto?.nombre || "Producto";
    const pres = pp?.Presentacion
      ? `${pp.Presentacion.tipo || ""} ${pp.Presentacion.formato || ""}`.trim()
      : "";
    const precio = pp?.precio != null ? `$${fmt(pp.precio)}` : "";
    return [prod, pres, precio].filter(Boolean).join(" — ");
  }
  return getProdPresLabel(m?.ProdPres || m?.ProductoPresentacion || m);
}

// ─── Tag / Pill ───────────────────────────────────────────────────────────────

function Tag({ children, bg, color, border }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: bg, color, border: `0.5px solid ${border || color + "44"}` }}>
      {children}
    </span>
  );
}

function Pill({ children, color, bg }) {
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: bg, color, fontWeight: 500 }}>
      {children}
    </span>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, borderRadius: 12, padding: "24px 28px", width: 360, textAlign: "center", borderTop: `5px solid ${C.red}`, boxShadow: "0 16px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.text, lineHeight: 1.5 }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: C.red, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MedicationPickerModal ────────────────────────────────────────────────────
// Modal estilo inventario para elegir un producto/presentación

function MedicationPickerModal({ isOpen, prodPres, onSelect, onClose }) {
  const [search, setSearch]   = useState("");
  const [qty, setQty]         = useState({});

  useEffect(() => { if (isOpen) { setSearch(""); setQty({}); } }, [isOpen]);

  if (!isOpen) return null;

  // Solo mostramos prodPres cuyo producto tiene Medicamento asociado
  const soloMedicamentos = prodPres.filter((pp) => {
    const prod = pp?.Product || pp?.Producto;
    return prod?.Medicamento != null;
  });

  const filtered = soloMedicamentos.filter((pp) => {
    const label = getProdPresLabel(pp).toLowerCase();
    return !search || label.includes(search.toLowerCase());
  });

  const getQty = (id) => qty[id] || 1;

  const handleDelta = (id, delta, stock) => {
    setQty((prev) => {
      const cur = prev[id] || 1;
      const next = cur + delta;
      if (next < 1) return prev;
      if (stock != null && next > stock) return prev;
      return { ...prev, [id]: next };
    });
  };

  const handleQtyInput = (id, val, stock) => {
    if (val === "") { setQty((p) => ({ ...p, [id]: "" })); return; }
    let n = parseInt(val);
    if (isNaN(n)) return;
    n = Math.max(1, stock != null ? Math.min(n, stock) : n);
    setQty((p) => ({ ...p, [id]: n }));
  };

  const handleSelect = (pp) => {
    const id = getProdPresId(pp);
    onSelect({ ...pp, _qty: getQty(id) });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,0.55)", backdropFilter: "blur(6px)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(94vw, 900px)", maxHeight: "88vh",
        background: C.bg, borderRadius: 14, border: `0.5px solid ${C.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 2001,
      }}>
        {/* Header */}
        <div style={{ background: C.green900, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              {Ic.package}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "white" }}>Seleccionar Medicamento</h2>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{filtered.length} productos disponibles</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 34, height: 34, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Ic.x}
          </button>
        </div>

        {/* Búsqueda */}
        <div style={{ padding: "14px 24px", background: C.white, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>{Ic.search}</span>
            <input
              autoFocus
              placeholder="Buscar por nombre, presentación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, outline: "none", background: C.surface, boxSizing: "border-box" }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>{Ic.x}</button>
            )}
          </div>
        </div>

        {/* Grid de productos */}
        <div style={{ overflowY: "auto", padding: 20, flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, alignContent: "start" }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 13, color: C.muted }}>Sin resultados</div>
          ) : filtered.map((pp) => {
            const id     = getProdPresId(pp);
            const prod   = pp?.Product?.nombre || pp?.Producto?.nombre || pp?.nombre || "Producto";
            const pres   = pp?.Presentacion
              ? `${pp.Presentacion.tipo || ""} ${pp.Presentacion.formato || ""}`.trim()
              : pp?.presentacion || pp?.formato || "";
            const precio = parseFloat(pp?.precio || 0);
            const stock = (() => {
              const lotes = pp?.Product?.Lotes || pp?.Producto?.Lotes || [];
              if (lotes.length > 0) {
                const hoy = new Date();
                return lotes
                  .filter(l => Number(l.cantidadDisponible) > 0 && 
                               (!l.fechaVencimiento || new Date(l.fechaVencimiento) > hoy))
                  .reduce((sum, l) => sum + Number(l.cantidadDisponible), 0);
              }
              return pp?._stockCalculado ?? null;
            })();
            const sinStock = stock != null && stock <= 0;
            const q = getQty(id);

            return (
              <div key={id} style={{
                background: C.white, border: `0.5px solid ${sinStock ? C.redBorder : C.purpleBorder}`,
                borderRadius: 10, padding: "14px 16px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: 160, opacity: sinStock ? 0.6 : 1,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{prod}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {pres && <span style={{ background: C.purpleBg, color: C.purple, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid ${C.purpleBorder}` }}>{pres}</span>}
                    {stock != null && (
                      <span style={{ background: sinStock ? C.redBg : C.green100, color: sinStock ? C.red : C.green800, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid ${sinStock ? C.redBorder : C.green200}` }}>
                        {sinStock ? "Sin stock" : `Stock: ${stock}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>${fmt(precio)}</div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {!sinStock && (
                    <div style={{ display: "flex", alignItems: "center", background: C.surface, borderRadius: 7, border: `0.5px solid ${C.border}`, overflow: "hidden" }}>
                      <button type="button" onClick={() => handleDelta(id, -1, stock)} style={{ border: "none", background: "none", width: 30, height: 34, cursor: "pointer", fontSize: 18, color: C.text }}>−</button>
                      <input
                        type="text" value={q}
                        onChange={(e) => handleQtyInput(id, e.target.value, stock)}
                        onBlur={() => { if (q === "") setQty((p) => ({ ...p, [id]: 1 })); }}
                        style={{ width: 32, border: "none", background: "transparent", textAlign: "center", fontSize: 13, fontWeight: 600, color: C.text, outline: "none", padding: 0 }}
                      />
                      <button type="button" onClick={() => handleDelta(id, 1, stock)} style={{ border: "none", background: "none", width: 30, height: 34, cursor: "pointer", fontSize: 18, color: C.text }}>+</button>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={sinStock}
                    onClick={() => handleSelect(pp)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 7, border: "none",
                      background: sinStock ? C.border : C.purple,
                      color: "white", fontWeight: 600, fontSize: 13,
                      cursor: sinStock ? "not-allowed" : "pointer",
                    }}
                  >
                    {sinStock ? "Sin stock" : `Seleccionar (${q || 1})`}
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

// ─── VaccinePickerModal ───────────────────────────────────────────────────────
function VaccinePickerModal({ isOpen, vaccines, aplicadas = [], onSelect, onClose, idEspecie }) {
  const [search, setSearch] = useState("");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  useEffect(() => { if (isOpen) setSearch(""); }, [isOpen]);

  if (!isOpen) return null;

  // Función que decide si una vacuna es "necesaria" para esta mascota
  function esNecesaria(v) {
    const idVac = v.idProducto;
    const cantEsquema = v.cantidadDosisEsquema || 1;
    const intervalo = v.intervaloReaplicacionMeses || 12;

    const misAplicaciones = aplicadas
      .filter((a) => Number(a.Vacuna?.idProducto ?? a.idVacuna) === Number(idVac))
      .sort((a, b) => new Date(a.fechaAplicacion) - new Date(b.fechaAplicacion));

    const dosisAplicadas = misAplicaciones.length;

    // Esquema primario incompleto → necesaria
    if (dosisAplicadas < cantEsquema) return true;

    // Esquema completo → revisar refuerzo
    const ultima = misAplicaciones.at(-1);
    if (!ultima) return true;

    const fechaRefuerzo = new Date(`${ultima.fechaAplicacion}T00:00:00`);
    fechaRefuerzo.setMonth(fechaRefuerzo.getMonth() + intervalo);

    const diasHastaRefuerzo = (fechaRefuerzo - new Date()) / (1000 * 60 * 60 * 24);

    // Vencida o próxima (dentro de 30 días) → mostrar
    return diasHastaRefuerzo <= 30;
  }

  const filtered = vaccines.filter((v) => {
    const mEspecie = idEspecie ? Number(idEspecie) : null;
    const coincideEspecie = !v.idEspecie || !mEspecie || Number(v.idEspecie) === mEspecie;
    if (!coincideEspecie) return false;
    const label = getVaccineLabel(v).toLowerCase();
    const enf   = (v?.enfermedadPreventiva || "").toLowerCase();
    const q     = search.toLowerCase();
    const coincideBusqueda = !q || label.includes(q) || enf.includes(q);
    return coincideBusqueda && (mostrarTodas || esNecesaria(v));
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,0.55)", backdropFilter: "blur(6px)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(94vw, 860px)", maxHeight: "88vh",
        background: C.bg, borderRadius: 14, border: `0.5px solid ${C.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 2001,
      }}>
        {/* Header */}
        <div style={{ background: C.green900, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              {Ic.syringe}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "white" }}>Seleccionar Vacuna</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{filtered.length} vacunas disponibles</p>
                <button
                  type="button"
                  onClick={() => setMostrarTodas(p => !p)}
                  style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: mostrarTodas ? "rgba(255,255,255,0.2)" : "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontWeight: 600 }}
                >
                  {mostrarTodas ? "Solo pendientes" : "Ver todas"}
                </button>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 34, height: 34, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Ic.x}
          </button>
        </div>

        {/* Búsqueda */}
        <div style={{ padding: "14px 24px", background: C.white, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>{Ic.search}</span>
            <input
              autoFocus
              placeholder="Buscar por nombre o enfermedad que previene..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, outline: "none", background: C.surface, boxSizing: "border-box" }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>{Ic.x}</button>
            )}
          </div>
        </div>

        {/* Grid de vacunas */}
        <div style={{ overflowY: "auto", padding: 20, flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, alignContent: "start" }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 13, color: C.muted }}>Sin resultados</div>
          ) : filtered.map((v) => {
            const vid    = v.idVacuna ?? v.idProducto;
            const nombre = getVaccineLabel(v);
            const enf    = v?.enfermedadPreventiva || "";
            // ── ACTUALIZADO: usando volumenDosis de tu BD ──
            const volumen = v?.volumenDosis || ""; 

            return (
              <div key={vid} style={{
                background: C.white, border: `0.5px solid ${C.amberBorder}`,
                borderRadius: 10, padding: "14px 16px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: 140,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ color: C.amber }}>{Ic.syringe}</span>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{nombre}</div>
                  </div>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                    {enf && (
                      <span style={{ background: C.amberBg, color: C.amber, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid ${C.amberBorder}` }}>
                        Previene: {enf}
                      </span>
                    )}
                    
                    {/* Badge de Volumen Dosis */}
                    {volumen && (
                      <span style={{ background: C.green100, color: C.green800, borderRadius: 5, padding: "2px 7px", fontSize: 11, border: `0.5px solid ${C.green200}`, fontWeight: 500 }}>
                        {volumen}
                      </span>
                    )}

                    {/* ── 🎯 AGREGADO AQUÍ: Badge de Especie Canino / Felino ── */}
                    {v.idEspecie && (
                      <span style={{
                        background: Number(v.idEspecie) === 1 ? "#dbeafe" : "#dcfce7",
                        color: Number(v.idEspecie) === 1 ? "#1e40af" : "#166534",
                        borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 500,
                        border: `0.5px solid ${Number(v.idEspecie) === 1 ? "#93c5fd" : C.green200}`
                      }}>
                        {Number(v.idEspecie) === 1 ? "🐱 Felino" : "🐶 Canino"}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => { onSelect(v); onClose(); }}
                  style={{
                    marginTop: 10, padding: "9px 0", borderRadius: 7, border: "none",
                    background: C.amber, color: "white", fontWeight: 600, fontSize: 13,
                    cursor: "pointer", width: "100%",
                  }}
                >
                  Seleccionar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── PatientList ──────────────────────────────────────────────────────────────
function PatientList({ onSelect }) {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [err, setErr]           = useState("");
  const [modo, setModo] = useState("nombre"); // "nombre" | "lote"
  const [loteQuery, setLoteQuery] = useState("");
  const [resultadosLote, setResultadosLote] = useState(null);
  const [buscandoLote, setBuscandoLote] = useState(false);

  useEffect(() => {
    axios.get("/pets", { headers: hdrs() })
      .then((r) => setMascotas(r.data || []))
      .catch((e) => setErr(e?.response?.data?.msg || "Error al cargar pacientes."))
      .finally(() => setLoading(false));
  }, []);

  const buscarPorLote = async () => {
    if (!loteQuery.trim()) return;
    setBuscandoLote(true);
    try {
      const resLotes = await axios.get("/batches", { headers: hdrs() });
      const lote = (resLotes.data || []).find(
        l => l.codigoLote?.toLowerCase() === loteQuery.trim().toLowerCase()
      );
      if (!lote) { setResultadosLote([]); setBuscandoLote(false); return; }
  
      const res = await axios.get(`/applied-vaccines/por-lote/${lote.idLote}`, { headers: hdrs() });
      setResultadosLote(res.data || []);
    } catch (e) {
      console.error(e);
      setResultadosLote([]);
    }
    setBuscandoLote(false);
  };

  const filtered = mascotas.filter((m) => {
    const t = search.toLowerCase();
    return !t
      || m.nombre?.toLowerCase().includes(t)
      || m.Dueño?.nombres?.toLowerCase().includes(t)
      || m.Dueño?.apellidos?.toLowerCase().includes(t)
      || m.Raza?.nombre?.toLowerCase().includes(t)
      || m.Raza?.Especie?.nombre?.toLowerCase().includes(t);
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: C.text }}>Historiales Clínicos</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Seleccioná un paciente para ver su historial completo</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setModo("nombre")}
          style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${modo === "nombre" ? C.green700 : C.border}`, background: modo === "nombre" ? C.green700 : "white", color: modo === "nombre" ? "white" : C.text, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
          🔍 Buscar paciente
        </button>
        <button type="button" onClick={() => setModo("lote")}
          style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${modo === "lote" ? C.amber : C.border}`, background: modo === "lote" ? C.amber : "white", color: modo === "lote" ? "white" : C.text, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
          💉 Buscar lotes aplicados
        </button>
      </div>

      {modo === "nombre" ? (
        <div style={{ position: "relative", marginBottom: 16, maxWidth: 480 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>{Ic.search}</span>
          <input
            placeholder="Buscar por nombre, dueño, raza o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, fontSize: 13, border: `1px solid ${C.border}`, outline: "none", background: C.white, boxSizing: "border-box" }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>{Ic.x}</button>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 480, marginBottom: 12 }}>
            <input
              placeholder="Código de lote (ej: LOTE-3)"
              value={loteQuery}
              onChange={(e) => setLoteQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarPorLote()}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1px solid ${C.amberBorder}`, outline: "none" }}
            />
            <button type="button" onClick={buscarPorLote} disabled={buscandoLote}
              style={{ padding: "10px 18px", background: C.amber, color: "white", border: "none", borderRadius: 10, cursor: buscandoLote ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {buscandoLote ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {resultadosLote !== null && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted, fontWeight: 600 }}>
                {resultadosLote.length} paciente{resultadosLote.length !== 1 ? "s" : ""} recibieron este lote
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resultadosLote.map((r) => {
                  const mascota = r.Historial?.Mascota;
                  const dueño = mascota?.Dueño;
                  return (
                    <div key={r.idVacunaAplicada} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{mascota?.nombre || "—"}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {dueño ? `${dueño.nombres} ${dueño.apellidos}` : "Sin dueño"}
                          {" · "}{r.Vacuna?.Producto?.nombre || "—"}
                          {" · Dosis: "}{r.dosis}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: C.amber, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtFecha(r.fechaAplicacion)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {modo === "nombre" && (loading ? (
        <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Cargando pacientes...</div>
      ) : err ? (
        <div style={{ padding: 40, textAlign: "center", color: C.red, background: C.redBg, borderRadius: 10, border: `1px solid ${C.redBorder}` }}>{err}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
          {search ? "No se encontraron pacientes con esa búsqueda." : "No hay pacientes registrados."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {filtered.map((m) => (
            <button
              type="button"
              key={m.idMascota}
              onClick={() => onSelect(m)}
              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.green700; e.currentTarget.style.boxShadow = "0 4px 16px rgba(31,92,56,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: C.green100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {m.Raza?.Especie?.nombre?.toLowerCase().includes("gato") ? "🐱" : m.Raza?.Especie?.nombre?.toLowerCase().includes("ave") ? "🐦" : m.Raza?.Especie?.nombre?.toLowerCase().includes("cone") ? "🐰" : "🐶"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{m.nombre}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.Raza?.Especie?.nombre || "—"} · {m.Raza?.nombre || "Sin raza"}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <span>👤</span>
                <span>{m.Dueño ? `${m.Dueño.nombres} ${m.Dueño.apellidos}` : "Sin dueño registrado"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {m.Estado?.nombre && <Tag bg={C.green100} color={C.green800} border={C.green200}>{m.Estado.nombre}</Tag>}
                {m.Tamanio?.nombre && <Tag bg={C.surface} color={C.muted}>{m.Tamanio.nombre}</Tag>}
                {m.fechaNacimiento && <Tag bg={C.blueBg} color={C.blue}>{fmtFecha(m.fechaNacimiento)}</Tag>}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── TreatmentForm ────────────────────────────────────────────────────────────

function TreatmentForm({ initial, idHistorial, tiposTrat, estadosTrat, onSave, onCancel }) {
  const [form, setForm] = useState({ idHistorial, descripcion: "", fechaInicio: "", fechaFin: "", idTipoTratamiento: "", idEstadoTratamiento: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const inp = { padding: "8px 10px", borderRadius: 7, fontSize: 13, border: `1px solid ${C.purpleBorder}`, outline: "none", background: "white", width: "100%", boxSizing: "border-box" };

  useEffect(() => {
    setErr("");
    setForm({
      idHistorial,
      descripcion:         initial?.descripcion || "",
      fechaInicio:         initial?.fechaInicio?.slice(0, 10) || "",
      fechaFin:            initial?.fechaFin?.slice(0, 10) || "",
      idTipoTratamiento:   initial?.idTipoTratamiento != null ? String(initial.idTipoTratamiento) : "",
      idEstadoTratamiento: initial?.idEstadoTratamiento != null ? String(initial.idEstadoTratamiento) : "",
    });
  }, [idHistorial, initial]);

  const submit = async () => {
    if (!form.descripcion || !form.fechaInicio || !form.idTipoTratamiento || !form.idEstadoTratamiento) {
      setErr("Descripción, fecha inicio, tipo y estado son obligatorios.");
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        ...form,
        idHistorial:         Number(form.idHistorial),
        idTipoTratamiento:   Number(form.idTipoTratamiento),
        idEstadoTratamiento: Number(form.idEstadoTratamiento),
        fechaFin: form.fechaFin || null,
      }, initial?.idTratamiento);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.msg || "Error al guardar.");
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f3f1fd", border: `1px solid ${C.purpleBorder}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: C.purple }}>{initial ? "✏️ Editar tratamiento" : "➕ Nuevo tratamiento"}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del tratamiento *" rows={2} style={{ ...inp, resize: "vertical" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Fecha inicio *</label>
          <input type="date" value={form.fechaInicio} onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Fecha fin (opcional)</label>
          <input type="date" value={form.fechaFin} onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))} style={inp} />
        </div>
        <select value={form.idTipoTratamiento} onChange={(e) => setForm((p) => ({ ...p, idTipoTratamiento: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
          <option value="">— Tipo de tratamiento *</option>
          {tiposTrat.map((t) => <option key={t.idTipoTratamiento} value={String(t.idTipoTratamiento)}>{t.nombre}</option>)}
        </select>
        <select value={form.idEstadoTratamiento} onChange={(e) => setForm((p) => ({ ...p, idEstadoTratamiento: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
          <option value="">— Estado *</option>
          {estadosTrat.map((e) => <option key={e.idEstadoTratamiento} value={String(e.idEstadoTratamiento)}>{e.descripcion}</option>)}
        </select>
      </div>
      {err && <p style={{ margin: "0 0 8px", fontSize: 11, color: C.red }}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
        <button type="button" onClick={submit} disabled={saving} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: saving ? "#94a3b8" : C.purple, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>{saving ? "Guardando…" : "Guardar tratamiento"}</button>
      </div>
    </div>
  );
}

// ─── VaccineForm ──────────────────────────────────────────────────────────────
function VaccineForm({ initial, idHistorial, vaccines, onSave, onCancel, idEspecie, aplicadas = []  }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVac, setSelectedVac] = useState(null);
  const [form, setForm] = useState({ idHistorial, idVacuna: "", dosis: "", fechaAplicacion: "", precioAplicado: "", cobrada: "0" });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const inp = { padding: "8px 10px", borderRadius: 7, fontSize: 13, border: `1px solid ${C.amberBorder}`, outline: "none", background: "white", width: "100%", boxSizing: "border-box" };

  useEffect(() => {
    setErr("");
    if (initial) {
      const vid = initial?.idVacuna != null ? String(initial.idVacuna) : "";
      // Intentamos recuperar la vacuna del array para mostrar el label
      const found = vaccines.find((v) => String(v.idVacuna ?? v.idProducto) === vid);
      setSelectedVac(found || null);
      setForm({
        idHistorial,
        idVacuna:        vid,
        dosis:           initial?.dosis || "",
        fechaAplicacion: initial?.fechaAplicacion?.slice(0, 10) || "",
        precioAplicado:  initial?.precioAplicado != null ? String(initial.precioAplicado) : "",
        cobrada:         initial?.cobrada ? "1" : "0",
      });
    } else {
      setSelectedVac(null);
      setForm({ idHistorial, idVacuna: "", dosis: "", fechaAplicacion: "", precioAplicado: "", cobrada: "0" });
    }
  }, [idHistorial, initial]);

  const handlePickVaccine = (v) => {
    const vid = v.idVacuna ?? v.idProducto;
    setSelectedVac(v);
    setForm((p) => ({ ...p, idVacuna: String(vid), dosis: v.dosis || p.dosis }));
  };

  const submit = async () => {
    if (!form.idVacuna || !form.dosis || !form.fechaAplicacion) {
      setErr("Seleccioná la vacuna, completá la dosis y la fecha.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        idHistorial:    Number(form.idHistorial),
        idVacuna:       Number(form.idVacuna),
        dosis:          form.dosis,
        fechaAplicacion: form.fechaAplicacion,
        precioAplicado: form.precioAplicado !== "" ? Number(form.precioAplicado) : null,
        cobrada:        form.cobrada === "1",
      }, initial?.idVacunaAplicada);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.msg || "Error al guardar.");
      setSaving(false);
    }
  };

  const vacLabel = selectedVac ? getVaccineLabel(selectedVac) : (initial?.idVacuna ? `Vacuna #${initial.idVacuna}` : null);

  return (
    <>
      <VaccinePickerModal
        isOpen={pickerOpen}
        vaccines={vaccines}
        aplicadas={aplicadas} 
        onSelect={handlePickVaccine}
        onClose={() => setPickerOpen(false)}
        idEspecie={idEspecie}
      />

      <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: C.amber }}>{initial ? "✏️ Editar vacuna aplicada" : "💉 Registrar vacuna aplicada"}</p>

        {/* Selector de vacuna — botón que abre el modal */}
        <div style={{ marginBottom: 10, gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Vacuna *</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${form.idVacuna ? C.amber : C.amberBorder}`,
              background: form.idVacuna ? C.amberBg : "white",
              color: form.idVacuna ? C.amber : C.muted,
              cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: form.idVacuna ? 600 : 400,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}
          >
            <span>{vacLabel || "Hacer clic para elegir una vacuna..."}</span>
            <span style={{ flexShrink: 0, opacity: 0.6 }}>{Ic.grid}</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input type="text"   value={form.dosis}           onChange={(e) => setForm((p) => ({ ...p, dosis: e.target.value }))}           placeholder="Dosis * (ej: 1 ml)"         style={inp} />
          <input type="date"   value={form.fechaAplicacion} onChange={(e) => setForm((p) => ({ ...p, fechaAplicacion: e.target.value }))} style={inp} />
          <input type="number" value={form.precioAplicado}  onChange={(e) => setForm((p) => ({ ...p, precioAplicado: e.target.value }))}  placeholder="Precio aplicado ($)" style={inp} step="0.01" />
          <select value={form.cobrada} onChange={(e) => setForm((p) => ({ ...p, cobrada: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
            <option value="0">Pendiente de cobro</option>
            <option value="1">Cobrada</option>
          </select>
        </div>
        {err && <p style={{ margin: "0 0 8px", fontSize: 11, color: C.red }}>{err}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
          <button type="button" onClick={submit} disabled={saving} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: saving ? "#94a3b8" : C.amber, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>{saving ? "Guardando…" : "Guardar vacuna"}</button>
        </div>
      </div>
    </>
  );
}

// ─── TreatmentMedicationForm ──────────────────────────────────────────────────
// Abre el MedicationPickerModal para elegir el producto, luego completa detalles

function TreatmentMedicationForm({ initial, idTratamiento, prodPres, onSave, onCancel }) {
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [selectedPP, setSelectedPP]   = useState(null); // prod-pres elegido
  const [form, setForm] = useState({
    idTratamiento,
    idProd_Pres: "",
    cantidad: 1,
    precioAplicado: "",
    notas: "",
    instrucciones: "",
    aplicadoEnClinica: "0",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const inp = { padding: "8px 10px", borderRadius: 7, fontSize: 13, border: `1px solid ${C.purpleBorder}`, outline: "none", background: "white", width: "100%", boxSizing: "border-box" };

  // Precarga al editar
  useEffect(() => {
    setErr("");
    if (initial) {
      // Intentamos reconstruir el PP desde los datos del medicamento guardado
      const pp = initial?.PresentacionProducto || null;
      setSelectedPP(pp);
      setForm({
        idTratamiento,
        idProd_Pres:       initial?.idProd_Pres != null ? String(initial.idProd_Pres) : (pp ? String(getProdPresId(pp)) : ""),
        cantidad:          initial?.cantidad || 1,
        precioAplicado:    initial?.precioAplicado != null ? String(initial.precioAplicado) : "",
        notas:             initial?.notas || "",
        instrucciones:     initial?.instrucciones || "",
        aplicadoEnClinica: initial?.aplicadoEnClinica ? "1" : "0",
      });
    } else {
      setSelectedPP(null);
      setForm({ idTratamiento, idProd_Pres: "", cantidad: 1, precioAplicado: "", notas: "", instrucciones: "", aplicadoEnClinica: "0" });
    }
  }, [idTratamiento, initial]);

  const handlePickProduct = (pp) => {
    const id    = getProdPresId(pp);
    const qty   = pp._qty || 1;
    const price = pp?.precio != null ? String(pp.precio) : "";
    setSelectedPP(pp);
    setForm((p) => ({ ...p, idProd_Pres: String(id), cantidad: qty, precioAplicado: price }));
  };

  const submit = async () => {
    if (!form.idProd_Pres || !form.cantidad || !form.instrucciones) {
      setErr("Seleccioná un medicamento, indicá la cantidad e instrucciones.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        idTratamiento:     Number(form.idTratamiento),
        idProd_Pres:       Number(form.idProd_Pres),
        cantidad:          Number(form.cantidad),
        precioAplicado:    form.precioAplicado !== "" ? Number(form.precioAplicado) : null,
        notas:             form.notas || null,
        instrucciones:     form.instrucciones,
        aplicadoEnClinica: Number(form.aplicadoEnClinica),
      }, initial?.idTratMed);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.msg || "Error al guardar.");
      setSaving(false);
    }
  };

  const ppLabel = selectedPP ? getProdPresLabel(selectedPP) : (initial ? getMedLabel(initial) : null);

  return (
    <>
      <MedicationPickerModal
        isOpen={pickerOpen}
        prodPres={prodPres}
        onSelect={handlePickProduct}
        onClose={() => setPickerOpen(false)}
      />

      <div style={{ background: "#f7f6ff", border: `1px solid ${C.purpleBorder}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: C.purple }}>{initial ? "✏️ Editar medicamento" : "💊 Agregar medicamento"}</p>

        {/* Selector de producto — botón que abre el modal */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Producto / Presentación *</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${form.idProd_Pres ? C.purple : C.purpleBorder}`,
              background: form.idProd_Pres ? C.purpleBg : "white",
              color: form.idProd_Pres ? C.purple : C.muted,
              cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: form.idProd_Pres ? 600 : 400,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}
          >
            <span>{ppLabel || "Hacer clic para elegir un medicamento..."}</span>
            <span style={{ flexShrink: 0, opacity: 0.6 }}>{Ic.grid}</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Cantidad *</label>
            <input type="number" min="1" value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Precio aplicado ($)</label>
            <input type="number" step="0.01" value={form.precioAplicado} onChange={(e) => setForm((p) => ({ ...p, precioAplicado: e.target.value }))} placeholder="Opcional" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Modalidad</label>
            <select value={form.aplicadoEnClinica} onChange={(e) => setForm((p) => ({ ...p, aplicadoEnClinica: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
              <option value="0">Para llevar</option>
              <option value="1">Aplicado en clínica</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Notas (opcional)</label>
            <input type="text" value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Observaciones..." style={inp} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 3 }}>Instrucciones de administración *</label>
            <textarea value={form.instrucciones} onChange={(e) => setForm((p) => ({ ...p, instrucciones: e.target.value }))} placeholder="Ej: Suministrar 1 comprimido cada 12 horas durante 7 días..." rows={2} style={{ ...inp, resize: "vertical" }} />
          </div>
        </div>

        {err && <p style={{ margin: "0 0 8px", fontSize: 11, color: C.red }}>{err}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
          <button type="button" onClick={submit} disabled={saving} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: saving ? "#94a3b8" : C.purple, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>{saving ? "Guardando…" : "Guardar medicamento"}</button>
        </div>
      </div>
    </>
  );
}

function HistorialForm({ initial, estadosMascota, onSave, onCancel }) {
  const [form, setForm] = useState({
    motivo:          initial?.motivo || "",
    idEstadoMascota: initial?.idEstadoMascota != null ? String(initial.idEstadoMascota) : "",
    peso:            initial?.peso || "",
    temperatura:     initial?.temperatura || "",
    sintomas:        initial?.sintomas || "",
    diagnostico:     initial?.diagnostico || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const inp = { padding: "8px 10px", borderRadius: 7, fontSize: 13, border: `1px solid ${C.border}`, outline: "none", background: "white", width: "100%", boxSizing: "border-box" };

  const submit = async () => {
    if (!form.motivo || !form.diagnostico || !form.idEstadoMascota) {
      setErr("Motivo, diagnóstico y estado del paciente son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        motivo:          form.motivo,
        idEstadoMascota: Number(form.idEstadoMascota),
        peso:            form.peso || null,
        temperatura:     form.temperatura || null,
        sintomas:        form.sintomas || null,
        diagnostico:     form.diagnostico,
      });
    } catch (e) {
      setErr(e?.response?.data?.msg || "Error al guardar.");
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f0fdf4", border: `1px solid ${C.green200}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: C.green800 }}>✏️ Editar ficha clínica</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <input value={form.motivo} onChange={e => setForm(p => ({...p, motivo: e.target.value}))} placeholder="Motivo de consulta *" style={inp} />
        </div>
        <select value={form.idEstadoMascota} onChange={e => setForm(p => ({...p, idEstadoMascota: e.target.value}))} style={{ ...inp, cursor: "pointer" }}>
          <option value="">— Estado del paciente *</option>
          {estadosMascota.map(e => <option key={e.idEstadoMascota} value={e.idEstadoMascota}>{e.descripcion}</option>)}
        </select>
        <input type="number" step="0.1" value={form.peso} onChange={e => setForm(p => ({...p, peso: e.target.value}))} placeholder="Peso (kg)" style={inp} />
        <input type="number" step="0.1" value={form.temperatura} onChange={e => setForm(p => ({...p, temperatura: e.target.value}))} placeholder="Temperatura (°C)" style={inp} />
        <div style={{ gridColumn: "1/-1" }}>
          <textarea value={form.sintomas} onChange={e => setForm(p => ({...p, sintomas: e.target.value}))} placeholder="Síntomas..." rows={2} style={{ ...inp, resize: "vertical" }} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <textarea value={form.diagnostico} onChange={e => setForm(p => ({...p, diagnostico: e.target.value}))} placeholder="Diagnóstico *" rows={2} style={{ ...inp, resize: "vertical" }} />
        </div>
      </div>
      {err && <p style={{ margin: "6px 0 0", fontSize: 11, color: C.red }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 9, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
        <button type="button" onClick={submit} disabled={saving} style={{ flex: 1, padding: 9, borderRadius: 7, border: "none", background: saving ? "#94a3b8" : C.green700, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </div>
  );
}

// ─── PatientHistory ───────────────────────────────────────────────────────────
function PatientHistory({ mascota, onBack }) {
  const [historiales, setHistoriales]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedTab, setSelectedTab]     = useState("fichas");
  const [expandedId, setExpandedId]       = useState(null);
  const [detailData, setDetailData]       = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);

  const [showTratForm, setShowTratForm] = useState(null);
  const [editTrat, setEditTrat]         = useState(null);
  const [showVacForm, setShowVacForm]   = useState(null);
  const [editVac, setEditVac]           = useState(null);
  const [showMedForm, setShowMedForm]   = useState(null);
  const [editMed, setEditMed]           = useState(null);

  const [confirmDel, setConfirmDel] = useState(null);

  const [tiposTrat, setTiposTrat]   = useState([]);
  const [estadosTrat, setEstadosTrat] = useState([]);
  const [vaccines, setVaccines]     = useState([]);
  const [prodPres, setProdPres]     = useState([]);

  const [filterDate, setFilterDate]     = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [tratHistoryPicker, setTratHistoryPicker] = useState("");
  const [vacHistoryPicker, setVacHistoryPicker]   = useState("");

  const [showHistorialForm, setShowHistorialForm] = useState(null); 
  const [editHistorial, setEditHistorial]         = useState(null); 

  const [estadosMascota, setEstadosMascota] = useState([])

  // Carga detalle de un historial
  const fetchHistorialDetail = useCallback(async (idHistorial) => {
    const [resVac, resTrats] = await Promise.allSettled([
      axios.get("/applied-vaccines", { headers: hdrs() }),
      axios.get("/treatments", { headers: hdrs() }),
    ]);

    const vacunas = resVac.status === "fulfilled"
      ? (resVac.value.data || []).filter((v) => Number(v.idHistorial) === Number(idHistorial))
      : [];

    let tratamientos = [];
    if (resTrats.status === "fulfilled") {
      const lista = (resTrats.value.data || []).filter((t) => Number(t.idHistorial) === Number(idHistorial));
      tratamientos = await Promise.all(lista.map(async (t) => {
        try {
          const r = await axios.get(`/treatment-meds/${t.idTratamiento}`, { headers: hdrs() });
          return { ...t, medicamentos: r.data || [] };
        } catch {
          return { ...t, medicamentos: [] };
        }
      }));
    }
    return { vacunas, tratamientos };
  }, []);
  
  const mascotaId = mascota.idMascota; 
  const reloadPatientData = useCallback(async () => {
    setLoading(true);
    try {
      const [resHist, resTipos, resEstados, resVacunes, resProdPres, resPetStates] = await Promise.all([
        axios.get("/clinical-histories", { headers: hdrs() }),
        axios.get("/treatment-types",    { headers: hdrs() }),
        axios.get("/treatment-states",   { headers: hdrs() }),
        axios.get("/vaccines",           { headers: hdrs() }),
        axios.get("/prod-pres",          { headers: hdrs() }),
        axios.get("/pet-states", { headers: hdrs() }),
      ]);

      const resProds = await axios.get("/products", { headers: hdrs() });
      const stockMap = {};
      (resProds.data || []).forEach(p => { 
        stockMap[p.idProducto] = p.stock ?? 0; 
      });

      const prodPresConStock = (resProdPres.data || []).map(pp => ({
        ...pp,
        _stockCalculado: stockMap[
          pp.idProducto ?? 
          pp.Product?.idProducto ?? 
          pp.Producto?.idProducto
        ] ?? null,
      }));
      setProdPres(prodPresConStock);


      const all   = resHist.data || [];
      const suyos = all.filter((h) =>
        Number(h.Cita?.Mascota?.idMascota) === Number(mascota.idMascota) ||
        Number(h.Mascota?.idMascota)       === Number(mascota.idMascota)
      ).sort((a, b) =>
        new Date(`${b.Cita?.fecha || ""}T00:00:00`).getTime() -
        new Date(`${a.Cita?.fecha || ""}T00:00:00`).getTime()
      );

      setHistoriales(suyos);
      setTiposTrat(resTipos.data   || []);
      setEstadosTrat(resEstados.data || []);
      setVaccines(resVacunes.data  || []);
      setProdPres(resProdPres.data || []);
      setEstadosMascota(resPetStates.data || []);

      const entries = await Promise.all(
        suyos.map(async (h) => [h.idHistorial, await fetchHistorialDetail(h.idHistorial)])
      );
      setDetailData(Object.fromEntries(entries));

      if (suyos.length) {
        setTratHistoryPicker(String(suyos[0].idHistorial));
        setVacHistoryPicker(String(suyos[0].idHistorial));
      } else {
        setTratHistoryPicker(""); setVacHistoryPicker("");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [fetchHistorialDetail, mascotaId]);

  useEffect(() => { reloadPatientData(); }, [reloadPatientData]);

  const ensureDetail = useCallback(async (idHistorial) => {
    if (detailData[idHistorial]) return detailData[idHistorial];
    setLoadingDetail(idHistorial);
    try {
      const detail = await fetchHistorialDetail(idHistorial);
      setDetailData((prev) => ({ ...prev, [idHistorial]: detail }));
      return detail;
    } finally { setLoadingDetail(null); }
  }, [detailData, fetchHistorialDetail]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await ensureDetail(id);
  };

  const handleSaveHistorial = async (data) => {
    await axios.patch(`/clinical-history/${editHistorial.idHistorial}`, data, { headers: hdrs() });
    await reloadPatientData();
    setShowHistorialForm(null);
    setEditHistorial(null);
  };

  // CRUD
  const handleSaveTrat = async (data, idEx) => {
    if (idEx) await axios.patch(`/treatment/${idEx}`, data, { headers: hdrs() });
    else      await axios.post("/treatment",          data, { headers: hdrs() });
    await reloadPatientData();
    setShowTratForm(null); setEditTrat(null);
  };
  const handleDelTrat = async (id) => {
    await axios.delete(`/treatment/${id}`, { headers: hdrs() });
    await reloadPatientData(); setConfirmDel(null);
  };
  const handleSaveVac = async (data, idEx) => {
    if (idEx) await axios.patch(`/applied-vaccine/${idEx}`, data, { headers: hdrs() });
    else      await axios.post("/applied-vaccine",          data, { headers: hdrs() });
    await reloadPatientData();
    setShowVacForm(null); setEditVac(null);
  };
  const handleDelVac = async (id) => {
    await axios.delete(`/applied-vaccine/${id}`, { headers: hdrs() });
    await reloadPatientData(); setConfirmDel(null);
  };
  const handleSaveMed = async (data, idEx) => {
    if (idEx) await axios.patch(`/treatment-med/${idEx}`, data, { headers: hdrs() });
    else      await axios.post("/treatment-med",          data, { headers: hdrs() });
    await reloadPatientData();
    setShowMedForm(null); setEditMed(null);
  };
  const handleDelMed = async (id) => {
    await axios.delete(`/treatment-med/${id}`, { headers: hdrs() });
    await reloadPatientData(); setConfirmDel(null);
  };

  // Apertura de formularios
  const openTratForm = (idHist) => { setEditTrat(null); setShowTratForm(idHist); setTratHistoryPicker(String(idHist)); setSelectedTab("tratamientos"); };
  const openVacForm  = (idHist) => { setEditVac(null);  setShowVacForm(idHist);  setVacHistoryPicker(String(idHist));  setSelectedTab("vacunas"); };
  const openMedForm  = (idTrat) => { setEditMed(null);  setShowMedForm(idTrat); };

  // Datos derivados
  const histMap = Object.fromEntries(historiales.map((h) => [Number(h.idHistorial), h]));

  const historialesFiltrados = historiales.filter((h) =>
    filterDate ? h.Cita?.fecha?.startsWith(filterDate) : true
  );

  const tratamientosPlenos = historiales.flatMap((h) =>
    (detailData[h.idHistorial]?.tratamientos || []).map((t) => ({ ...t, _historial: h }))
  ).sort((a, b) => new Date(`${b.fechaInicio || ""}T00:00:00`).getTime() - new Date(`${a.fechaInicio || ""}T00:00:00`).getTime());

  const vacunasPlenas = historiales.flatMap((h) =>
    (detailData[h.idHistorial]?.vacunas || []).map((v) => ({ ...v, _historial: h }))
  ).sort((a, b) => new Date(`${b.fechaAplicacion || ""}T00:00:00`).getTime() - new Date(`${a.fechaAplicacion || ""}T00:00:00`).getTime());

  const tratsFiltrados = filterEstado === "todos"
    ? tratamientosPlenos
    : tratamientosPlenos.filter((t) => Number(t.idEstadoTratamiento) === Number(filterEstado));

  const tabBtn = (active) => ({
    padding: "9px 16px", borderRadius: 10,
    border: `1px solid ${active ? C.green700 : C.border}`,
    background: active ? C.green700 : C.white,
    color: active ? "white" : C.text,
    cursor: "pointer", fontSize: 13, fontWeight: 700,
  });

  // Render lista de medicamentos de un tratamiento
  const renderMedications = (t) => {
    const meds = t.medicamentos || [];
    if (!meds.length) return (
      <div style={{ padding: "10px 14px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.muted, textAlign: "center" }}>
        Sin medicamentos registrados
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {meds.map((m) => (
          <div key={m.idTratMed} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "white", border: `0.5px solid ${C.purpleBorder}`, borderRadius: 8, padding: "10px 12px" }}>
            <span style={{ color: C.purple, flexShrink: 0, marginTop: 2 }}>{Ic.pill}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{getMedLabel(m)}</div>
              <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                <span>Cantidad: {m.cantidad}</span>
                {m.precioAplicado != null && m.precioAplicado !== "" && <span>Precio: ${fmt(m.precioAplicado)}</span>}
                <span style={{ background: m.aplicadoEnClinica ? C.tealBg : C.surface, color: m.aplicadoEnClinica ? C.teal : C.muted, padding: "0 6px", borderRadius: 4, fontWeight: 600 }}>
                  {m.aplicadoEnClinica ? "Aplicado en clínica" : "Para llevar"}
                </span>
                {m.notas && <span>· {m.notas}</span>}
              </div>
              {m.instrucciones && <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontStyle: "italic" }}>📋 {m.instrucciones}</div>}
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <button type="button" onClick={() => { setEditMed(m); setShowMedForm(t.idTratamiento); }} style={{ background: "white", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.muted, display: "flex" }}>{Ic.edit}</button>
              <button type="button" onClick={() => setConfirmDel({ type: "med", id: m.idTratMed, msg: "¿Eliminar este medicamento del tratamiento?" })} style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.red, display: "flex" }}>{Ic.trash}</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render de un bloque de tratamiento (fichas + tab global)
  const renderTratamiento = (t, h) => (
    <div key={t.idTratamiento} style={{ background: C.purpleBg, border: `0.5px solid ${C.purpleBorder}`, borderRadius: 9, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>{t.descripcion}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {t.TipoTratamiento?.nombre          && <Tag bg="white" color={C.purple} border={C.purpleBorder}>{t.TipoTratamiento.nombre}</Tag>}
            {t.EstadoTratamiento?.descripcion   && <Tag bg="white" color={C.muted}  border={C.border}>{t.EstadoTratamiento.descripcion}</Tag>}
            <Tag bg="white" color={C.muted} border={C.border}>{fmtFecha(t.fechaInicio)}{t.fechaFin ? ` → ${fmtFecha(t.fechaFin)}` : ""}</Tag>
          </div>

          {/* Medicamentos */}
          <div style={{ padding: 10, background: "#f7f6ff", borderRadius: 8, border: `1px solid ${C.purpleBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.purple }}>{Ic.pill}</span>
                <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>Medicamentos</span>
                <span style={{ fontSize: 11, background: C.purple, color: "white", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{t.medicamentos?.length || 0}</span>
              </div>
              <button
                type="button"
                onClick={() => openMedForm(t.idTratamiento)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.purple}`, background: "white", color: C.purple, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >{Ic.plus} Agregar medicamento</button>
            </div>

            {showMedForm === t.idTratamiento && (
              <TreatmentMedicationForm
                initial={editMed}
                idTratamiento={t.idTratamiento}
                prodPres={prodPres}
                onSave={handleSaveMed}
                onCancel={() => { setShowMedForm(null); setEditMed(null); }}
              />
            )}

            {renderMedications(t)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { setEditTrat(t); setShowTratForm(h?.idHistorial || t.idHistorial); setTratHistoryPicker(String(h?.idHistorial || t.idHistorial)); }}
            style={{ background: "white", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: C.muted, display: "flex" }}
          >{Ic.edit}</button>
          <button
            type="button"
            onClick={() => setConfirmDel({ type: "trat", id: t.idTratamiento, msg: `¿Eliminar tratamiento "${t.descripcion}"?` })}
            style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: C.red, display: "flex" }}
          >{Ic.trash}</button>
        </div>
      </div>
    </div>
  );

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <div>
      {confirmDel && (
        <ConfirmModal
          msg={confirmDel.msg}
          onConfirm={async () => {
            if (confirmDel.type === "trat") await handleDelTrat(confirmDel.id);
            if (confirmDel.type === "vac")  await handleDelVac(confirmDel.id);
            if (confirmDel.type === "med")  await handleDelMed(confirmDel.id);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* Header paciente */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.muted, flexShrink: 0 }}>
          {Ic.back} Volver
        </button>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.green100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {mascota.Raza?.Especie?.nombre?.toLowerCase().includes("gato") ? "🐱" : mascota.Raza?.Especie?.nombre?.toLowerCase().includes("ave") ? "🐦" : "🐶"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{mascota.nombre}</h2>
              {mascota.Estado?.nombre && <Tag bg={C.green100} color={C.green800} border={C.green200}>{mascota.Estado.nombre}</Tag>}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>🐾 {mascota.Raza?.Especie?.nombre || "—"} · {mascota.Raza?.nombre || "Sin raza"}</span>
              <span>👤 {mascota.Dueño ? `${mascota.Dueño.nombres} ${mascota.Dueño.apellidos}` : "—"}</span>
              {mascota.fechaNacimiento && <span>🎂 {fmtFecha(mascota.fechaNacimiento)}</span>}
              {mascota.Tamanio?.nombre && <span>📏 {mascota.Tamanio.nombre}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.green700 }}>{historiales.length}</div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>consulta{historiales.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setSelectedTab("fichas")}       style={tabBtn(selectedTab === "fichas")}>📋 Fichas ({historiales.length})</button>
        <button type="button" onClick={() => setSelectedTab("tratamientos")} style={tabBtn(selectedTab === "tratamientos")}>💊 Tratamientos ({tratamientosPlenos.length})</button>
        <button type="button" onClick={() => setSelectedTab("vacunas")}      style={tabBtn(selectedTab === "vacunas")}>💉 Vacunas ({vacunasPlenas.length})</button>
      </div>

      {/* ══════════ FICHAS ══════════ */}
      {selectedTab === "fichas" && (
        <>
          <div style={{ display: "flex", gap: 10, margin: "0 0 16px", padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}` }} title="Filtrar por fecha" />
            <button type="button" onClick={() => setFilterDate("")} style={{ padding: "8px 12px", background: C.green100, border: "none", borderRadius: 6, cursor: "pointer" }}>Limpiar</button>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Cargando historiales...</div>
          ) : historialesFiltrados.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>No se encontraron fichas para este filtro.</p>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: C.green200, borderRadius: 2 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {historialesFiltrados.map((h) => {
                  const isOpen        = expandedId === h.idHistorial;
                  const isLoadingThis = loadingDetail === h.idHistorial;
                  const det           = detailData[h.idHistorial];
                  const vet           = h.Veterinario?.Staff
                    ? `${h.Veterinario.Staff.nombres} ${h.Veterinario.Staff.apellidos}`
                    : h.Veterinario?.nombre || "Veterinario";

                  return (
                    <div key={h.idHistorial} style={{ display: "flex", gap: 14 }}>
                      {/* Dot timeline */}
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: isOpen ? C.green700 : C.white, border: `2px solid ${isOpen ? C.green700 : C.green200}`, display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? "white" : C.green700, zIndex: 1, flexShrink: 0, transition: "all 0.2s" }}>
                          {Ic.steth}
                        </div>
                      </div>

                      {/* Card */}
                      <div style={{ flex: 1, background: C.white, border: `1px solid ${isOpen ? C.green200 : C.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s", boxShadow: isOpen ? "0 4px 20px rgba(31,92,56,0.08)" : "none" }}>
                        <button type="button"  onClick={() => toggleExpand(h.idHistorial)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{Ic.calendar} {fmtFecha(h.Cita?.fecha)}</span>
                              <Tag bg={C.green100} color={C.green800} border={C.green200}>Dr/a. {vet}</Tag>
                              {h.EstadoMascota && <Tag bg={C.blueBg} color={C.blue} border={C.blueBorder}>{h.EstadoMascota.descripcion}</Tag>}
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 500 }}>
                              {h.diagnostico || <span style={{ color: C.muted, fontStyle: "italic" }}>Sin diagnóstico registrado</span>}
                            </p>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                              {h.peso        && <Pill bg={C.green100} color={C.green800}>{Ic.weight} {h.peso} kg</Pill>}
                              {h.temperatura && <Pill bg={C.amberBg}  color={C.amber}>{Ic.temp} {h.temperatura}°C</Pill>}
                            </div>
                          </div>
                          <div style={{ color: C.muted, transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>{Ic.chevron}</div>
                        </button>

                        {isOpen && (
                          <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
                            {isLoadingThis ? (
                              <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Cargando detalles...</div>
                            ) : (
                              <div style={{ padding: "16px" }}>
                                {(() => {
                                  const fechaCita = new Date(`${h.Cita?.fecha || ""}T00:00:00`);
                                  const horasDesde = (Date.now() - fechaCita.getTime()) / 36e5;
                                  const puedeEditar = horasDesde <= 48; // true si pasaron 48hs o menos

                                  return (
                                    <>
                                      {puedeEditar && (
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                                          <button
                                            type="button"
                                            onClick={() => { setEditHistorial(h); setShowHistorialForm(h.idHistorial); }}
                                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "white", color: C.muted, cursor: "pointer", fontWeight: 600, fontSize: 12 }}
                                          >
                                            {Ic.edit} Editar ficha
                                          </button>
                                        </div>
                                      )}

                                      {showHistorialForm === h.idHistorial && (
                                        <HistorialForm
                                          initial={editHistorial}
                                          estadosMascota={estadosMascota}
                                          onSave={handleSaveHistorial}
                                          onCancel={() => { setShowHistorialForm(null); setEditHistorial(null); }}
                                        />
                                      )}
                                    </>
                                  );
                                })()}
                                {/* Motivo / síntomas */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                  {[["Motivo", h.motivo], ["Síntomas", h.sintomas]].map(([k, v]) => v && (
                                    <div key={k} style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", border: `0.5px solid ${C.border}` }}>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k}</div>
                                      <div style={{ fontSize: 13, color: C.text }}>{v}</div>
                                    </div>
                                  ))}
                                </div>

                                {h.diagnostico && (
                                  <div style={{ background: C.green100, border: `1px solid ${C.green200}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: C.green800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Diagnóstico</div>
                                    <div style={{ fontSize: 14, color: C.green900, fontWeight: 500 }}>{h.diagnostico}</div>
                                  </div>
                                )}

                                {/* Tratamientos de esta ficha */}
                                <div style={{ marginBottom: 14 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: C.purple }}>{Ic.pill}</span>
                                      <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Tratamientos</span>
                                      <span style={{ fontSize: 11, background: C.purpleBg, color: C.purple, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{det?.tratamientos?.length || 0}</span>
                                    </div>
                                    <button type="button" onClick={() => openTratForm(h.idHistorial)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "none", background: C.purpleBg, color: C.purple, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                      {Ic.plus} Agregar
                                    </button>
                                  </div>

                                  {showTratForm === h.idHistorial && (
                                    <TreatmentForm
                                      initial={editTrat}
                                      idHistorial={h.idHistorial}
                                      tiposTrat={tiposTrat}
                                      estadosTrat={estadosTrat}
                                      onSave={handleSaveTrat}
                                      onCancel={() => { setShowTratForm(null); setEditTrat(null); }}
                                    />
                                  )}

                                  {(() => {
                                    const tratsDelHistorial = det?.tratamientos || [];
                                    if (!tratsDelHistorial.length) return (
                                      <div style={{ padding: "10px 14px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.muted, textAlign: "center" }}>Sin tratamientos registrados</div>
                                    );
                                    return (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {tratsDelHistorial.map((t) => renderTratamiento(t, h))}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Vacunas de esta ficha */}
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: C.amber }}>{Ic.syringe}</span>
                                      <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Vacunas aplicadas</span>
                                      <span style={{ fontSize: 11, background: C.amberBg, color: C.amber, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{det?.vacunas?.length || 0}</span>
                                    </div>
                                    <button type="button" onClick={() => openVacForm(h.idHistorial)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "none", background: C.amberBg, color: C.amber, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                      {Ic.plus} Registrar
                                    </button>
                                  </div>

                                  {showVacForm === h.idHistorial && (
                                    <VaccineForm
                                      initial={editVac}
                                      idHistorial={h.idHistorial}
                                      vaccines={vaccines}
                                      aplicadas={vacunasPlenas} 
                                      onSave={handleSaveVac}
                                      onCancel={() => { setShowVacForm(null); setEditVac(null); }}
                                      idEspecie={mascota?.Raza?.idEspecie ?? mascota?.idEspecie}
                                    />
                                  )}

                                  {!det?.vacunas?.length ? (
                                    <div style={{ padding: "10px 14px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.muted, textAlign: "center" }}>Sin vacunas registradas</div>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                      {det.vacunas.map((v) => (
                                        <div key={v.idVacunaAplicada} style={{ display: "flex", alignItems: "center", gap: 12, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, borderRadius: 8, padding: "10px 14px" }}>
                                          <span style={{ color: C.amber, flexShrink: 0 }}>{Ic.syringe}</span>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13, color: C.text }}>{getVaccineLabel(v.Vacuna)}</div>
                                            <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                                              {v.Vacuna?.enfermedadPreventiva && <span>Previene: {v.Vacuna.enfermedadPreventiva}</span>}
                                              <span>Dosis: {v.dosis}</span>
                                              {v.precioAplicado != null && <span>${fmt(v.precioAplicado)}</span>}
                                              <span style={{ background: v.cobrada ? C.tealBg : C.redBg, color: v.cobrada ? C.teal : C.red, padding: "0 6px", borderRadius: 4, fontWeight: 600 }}>{v.cobrada ? "Cobrada" : "Pendiente"}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: C.amber, marginTop: 2 }}>
                                              Lote: {v.Lote?.codigoLote || "—"} · Vence: {v.Lote?.fechaVencimiento ? fmtFecha(v.Lote.fechaVencimiento) : "—"}
                                            </div>
                                          </div>
                                          <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                                            <span style={{ fontSize: 11, color: C.amber, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtFecha(v.fechaAplicacion)}</span>
                                            <button type="button" disabled={v.cobrada}
                                              onClick={() => { setEditVac(v); setShowVacForm(v.idHistorial); setVacHistoryPicker(String(v.idHistorial)); }}
                                              title={v.cobrada ? "No se puede editar: vacuna ya cobrada" : "Editar"}
                                              style={{ background: v.cobrada ? "#f1f5f9" : "white", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", cursor: v.cobrada ? "not-allowed" : "pointer", color: v.cobrada ? "#cbd5e1" : C.muted, display: "flex", opacity: v.cobrada ? 0.6 : 1 }}>{Ic.edit}</button>
                                            <button type="button" disabled={v.cobrada}
                                              onClick={() => setConfirmDel({ type: "vac", id: v.idVacunaAplicada, msg: `¿Eliminar vacuna aplicada el ${fmtFecha(v.fechaAplicacion)}?` })}
                                              title={v.cobrada ? "No se puede eliminar: vacuna ya cobrada" : "Eliminar"}
                                              style={{ background: v.cobrada ? "#f1f5f9" : C.redBg, border: `0.5px solid ${v.cobrada ? C.border : C.redBorder}`, borderRadius: 6, padding: "4px 8px", cursor: v.cobrada ? "not-allowed" : "pointer", color: v.cobrada ? "#cbd5e1" : C.red, display: "flex", opacity: v.cobrada ? 0.6 : 1 }}>{Ic.trash}</button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ TRATAMIENTOS (vista global) ══════════ */}
      {selectedTab === "tratamientos" && (
        <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <select value={tratHistoryPicker} onChange={(e) => setTratHistoryPicker(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, minWidth: 260 }}>
              <option value="">— Elegí una consulta para agregar —</option>
              {historiales.map((h) => (
                <option key={h.idHistorial} value={h.idHistorial}>{fmtFecha(h.Cita?.fecha)} · {h.diagnostico || "Sin diagnóstico"}</option>
              ))}
            </select>
            <button 
              type="button"
              onClick={() => tratHistoryPicker && openTratForm(Number(tratHistoryPicker))}
              disabled={!tratHistoryPicker}
              style={{ padding: "8px 14px", background: C.purple, color: "white", border: "none", borderRadius: 6, cursor: tratHistoryPicker ? "pointer" : "not-allowed", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: tratHistoryPicker ? 1 : 0.5 }}
            >{Ic.plus} Agregar tratamiento</button>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, minWidth: 200 }}>
              <option value="todos">Todos los estados</option>
              {estadosTrat.map((e) => <option key={e.idEstadoTratamiento} value={e.idEstadoTratamiento}>{e.descripcion}</option>)}
            </select>
            {filterEstado !== "todos" && (
              <button type="button" onClick={() => setFilterEstado("todos")} style={{ padding: "8px 12px", background: C.green100, border: "none", borderRadius: 6, cursor: "pointer" }}>Limpiar filtro</button>
            )}
          </div>

          {/* Formulario nuevo tratamiento en tab global */}
          {showTratForm && !editTrat && (
            <TreatmentForm
              initial={null}
              idHistorial={Number(showTratForm)}
              tiposTrat={tiposTrat}
              estadosTrat={estadosTrat}
              onSave={handleSaveTrat}
              onCancel={() => { setShowTratForm(null); setEditTrat(null); }}
            />
          )}

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Cargando tratamientos...</div>
          ) : tratsFiltrados.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>No hay tratamientos para mostrar.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tratsFiltrados.map((t) => {
                const h = histMap[Number(t.idHistorial)] || t._historial;
                return (
                  <div key={t.idTratamiento} style={{ background: C.white, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 12px rgba(83,74,183,0.05)" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <Tag bg={C.purpleBg} color={C.purple} border={C.purpleBorder}>Tratamiento</Tag>
                      {h?.Cita?.fecha    && <Tag bg={C.blueBg}   color={C.blue}   border={C.blueBorder}>{fmtFecha(h.Cita.fecha)}</Tag>}
                      {h?.diagnostico    && <Tag bg={C.green100} color={C.green800} border={C.green200}>{h.diagnostico}</Tag>}
                    </div>
                    {/* Formulario de edición inline */}
                    {showTratForm === (h?.idHistorial || t.idHistorial) && editTrat?.idTratamiento === t.idTratamiento && (
                      <TreatmentForm
                        initial={editTrat}
                        idHistorial={h?.idHistorial || t.idHistorial}
                        tiposTrat={tiposTrat}
                        estadosTrat={estadosTrat}
                        onSave={handleSaveTrat}
                        onCancel={() => { setShowTratForm(null); setEditTrat(null); }}
                      />
                    )}
                    {renderTratamiento(t, h)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ VACUNAS (vista global) ══════════ */}
      {selectedTab === "vacunas" && (
        <div>
          {/* ── CARNET VACUNAL ── */}
          <CarnetVacunal
            mascota={mascota}
            vacunas={vaccines}
            aplicadas={vacunasPlenas}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <select value={vacHistoryPicker} onChange={(e) => setVacHistoryPicker(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, minWidth: 260 }}>
              <option value="">— Elegí una consulta para agregar —</option>
              {historiales.map((h) => (
                <option key={h.idHistorial} value={h.idHistorial}>{fmtFecha(h.Cita?.fecha)} · {h.diagnostico || "Sin diagnóstico"}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => vacHistoryPicker && openVacForm(Number(vacHistoryPicker))}
              disabled={!vacHistoryPicker}
              style={{ padding: "8px 14px", background: C.amber, color: "white", border: "none", borderRadius: 6, cursor: vacHistoryPicker ? "pointer" : "not-allowed", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: vacHistoryPicker ? 1 : 0.5 }}
            >{Ic.plus} Registrar vacuna</button>
          </div>

          {showVacForm && !editVac && (
            <VaccineForm
              initial={null}
              idHistorial={Number(showVacForm)}
              vaccines={vaccines}
              onSave={handleSaveVac}
              onCancel={() => { setShowVacForm(null); setEditVac(null); }}
              idEspecie={mascota?.Raza?.idEspecie ?? mascota?.idEspecie}
              aplicadas={vacunasPlenas} 
            />
          )}

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Cargando vacunas...</div>
          ) : vacunasPlenas.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💉</div>
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>No hay vacunas registradas para este paciente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {vacunasPlenas.map((v) => {
                const h = histMap[Number(v.idHistorial)] || v._historial;
                const isEditing = showVacForm === v.idHistorial && editVac?.idVacunaAplicada === v.idVacunaAplicada;
                const venceLote = v.Lote?.fechaVencimiento ? new Date(v.Lote.fechaVencimiento) : null;
                const loteVencido = venceLote && venceLote < new Date();
                return (
                  <div key={v.idVacunaAplicada} style={{ background: C.white, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 12px rgba(186,117,23,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <Tag bg={C.amberBg} color={C.amber} border={C.amberBorder}>Vacuna</Tag>
                          {h?.Cita?.fecha  && <Tag bg={C.blueBg}   color={C.blue}   border={C.blueBorder}>{fmtFecha(h.Cita.fecha)}</Tag>}
                          {h?.diagnostico  && <Tag bg={C.green100} color={C.green800} border={C.green200}>{h.diagnostico}</Tag>}
                          <Tag bg={v.cobrada ? C.tealBg : C.redBg} color={v.cobrada ? C.teal : C.red} border={v.cobrada ? C.tealBg : C.redBorder}>{v.cobrada ? "Cobrada" : "Pendiente"}</Tag>
                        </div>

                        {venceLote && (
                          <span style={{
                            background: loteVencido ? C.redBg : C.green100,
                            color: loteVencido ? C.red : C.green800,
                            padding: "0 6px", borderRadius: 4, fontSize: 11, fontWeight: 600
                          }}>
                            {loteVencido
                              ? `⚠️ Lote ${v.Lote?.codigoLote || "—"} vencido ${fmtFecha(v.Lote.fechaVencimiento)}`
                              : `Lote ${v.Lote?.codigoLote || "—"} vence ${fmtFecha(v.Lote.fechaVencimiento)}`}
                          </span>
                        )}

                        {isEditing && (
                          <VaccineForm
                            initial={editVac}
                            idHistorial={Number(v.idHistorial)}
                            vaccines={vaccines}
                            onSave={handleSaveVac}
                            onCancel={() => { setShowVacForm(null); setEditVac(null); }}
                            idEspecie={mascota?.Raza?.idEspecie ?? mascota?.idEspecie}
                          />
                        )}

                        {!isEditing && (
                          <>
                            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{getVaccineLabel(v.Vacuna)}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: C.muted }}>
                              {v.Vacuna?.enfermedadPreventiva && <span>Previene: {v.Vacuna.enfermedadPreventiva}</span>}
                              <span>Dosis: {v.dosis}</span>
                              {v.precioAplicado != null && <span>Precio: ${fmt(v.precioAplicado)}</span>}
                              <span>{fmtFecha(v.fechaAplicacion)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button type="button" onClick={() => { setEditVac(v); setShowVacForm(v.idHistorial); setVacHistoryPicker(String(v.idHistorial)); }} style={{ background: "white", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.muted, display: "flex" }}>{Ic.edit}</button>
                        <button type="button" onClick={() => setConfirmDel({ type: "vac", id: v.idVacunaAplicada, msg: `¿Eliminar vacuna aplicada el ${fmtFecha(v.fechaAplicacion)}?` })} style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.red, display: "flex" }}>{Ic.trash}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ClinicalHistoryPage() {
  const location = useLocation();
  // Si se llegó desde PetsPage con navigate(..., { state: { mascota } }),
  // arrancamos directamente en el historial de esa mascota.
  const [selectedPet, setSelectedPet] = useState(location.state?.mascota || null);

  return (
    <div style={{ background: C.bg, minHeight: "calc(100vh - 60px)", padding: "20px 24px" }}>
      {selectedPet
        ? <PatientHistory mascota={selectedPet} onBack={() => setSelectedPet(null)} />
        : <PatientList onSelect={setSelectedPet} />
      }
    </div>
  );
}
