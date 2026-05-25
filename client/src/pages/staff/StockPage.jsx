import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "../../api/axios";

const token   = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const getUserFromToken = () => {
  try {
    const t = token();
    if (!t) return null;
    const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(b64));
  } catch { return null; }
};

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ── Paleta ────────────────────────────────────────────────────────
const C = {
  white: "#ffffff", green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97", border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9", bg: "#f0f4f1",
  red: "#a32d2d", redBg: "#fcebeb", blue: "#185fa5", blueBg: "#e6f1fb",
  amber: "#7a4f00", amberBg: "#fef9ec", amberBorder: "#f0d080",
  purple: "#534ab7", purpleBg: "#eeedfe",
};

const inp = {
  width: "100%", boxSizing: "border-box", padding: "10px 13px", borderRadius: 9,
  border: `1px solid ${C.border}`, fontSize: 13.5, outline: "none", background: C.white, color: C.text,
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
};

// ── Helpers ───────────────────────────────────────────────────────
function Field({ label, required, children, col }) {
  return (
    <div style={col ? { gridColumn: col } : {}}>
      <label style={lbl}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      {children}
    </div>
  );
}

function AlertModal({ emoji, emojiBg, title, message, onConfirm, onCancel, confirmText, confirmBg, cancelText }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,30,20,0.55)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "36px 32px", maxWidth: 400, width: "100%", textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: emojiBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 18px" }}>{emoji}</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: C.text }}>{title}</h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: message }} />
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && <button onClick={onCancel} style={{ flex: 1, padding: 11, border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, fontWeight: 600, fontSize: 13, cursor: "pointer", color: C.muted }}>{cancelText || "Cancelar"}</button>}
          <button onClick={onConfirm} style={{ flex: 1, padding: 11, border: "none", borderRadius: 8, background: confirmBg, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{confirmText || "Aceptar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar lote ─────────────────────────────────────────────
function LoteModal({ lote, onClose, onSave }) {
  const [form, setForm] = useState({
    codigoLote:        lote.codigoLote        || "",
    fechaVencimiento:  lote.fechaVencimiento  || "",
    cantidadDisponible: lote.cantidadDisponible ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");
  const [confirmAnular, setConfirmAnular] = useState(false);

  const hc = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setError("");
  };

  const handleSave = async () => {
    if (form.cantidadDisponible === "" || isNaN(Number(form.cantidadDisponible)) || Number(form.cantidadDisponible) < 0) {
      setError("La cantidad disponible debe ser un número mayor o igual a 0.");
      return;
    }
    setSaving(true); setError("");
    try {
      await axios.patch(`/batches/${lote.idLote}`, {
        codigoLote:        form.codigoLote        || null,
        fechaVencimiento:  form.fechaVencimiento  || null,
        cantidadDisponible: Number(form.cantidadDisponible),
      }, { headers: headers() });
      onSave();
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || "Error al guardar el lote.");
    } finally { setSaving(false); }
  };

  const handleAnular = async () => {
    setSaving(true); setError("");
    try {
      await axios.patch(`/batches/${lote.idLote}`, { cantidadDisponible: 0 }, { headers: headers() });
      onSave();
    } catch (err) {
      setError(err.response?.data?.msg || "Error al anular el lote.");
    } finally { setSaving(false); setConfirmAnular(false); }
  };

  const yaAnulado = lote.cantidadDisponible === 0;

  return (
    <>
      {confirmAnular && (
        <AlertModal
          emoji="⚠️" emojiBg={C.amberBg}
          title="¿Anular lote?"
          message={`Esto pondrá la cantidad disponible del lote <strong>#${lote.codigoLote || lote.idLote}</strong> en <strong>0</strong>. Podrás restaurarlo después editando la cantidad.`}
          confirmText="Sí, anular" confirmBg={C.red} cancelText="Cancelar"
          onConfirm={handleAnular} onCancel={() => setConfirmAnular(false)}
        />
      )}
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)" }}>
        <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />
        <div style={{ position: "relative", background: C.white, borderRadius: 18, width: "100%", maxWidth: 460, margin: "0 16px", border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: C.green900, color: "white", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                Lote #{lote.idLote}
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Editar lote</h3>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Código de lote">
              <input name="codigoLote" value={form.codigoLote} onChange={hc} style={inp} placeholder="Ej: L-2024-001" autoFocus />
            </Field>
            <Field label="Fecha de vencimiento">
              <input name="fechaVencimiento" type="date" value={form.fechaVencimiento} onChange={hc} style={inp} />
            </Field>
            <Field label="Cantidad disponible" required>
              <input name="cantidadDisponible" type="number" min="0" step="1" value={form.cantidadDisponible} onChange={hc} style={inp} placeholder="0" />
            </Field>

            {error && (
              <div style={{ padding: "10px 14px", background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 9, fontSize: 13, color: C.red }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {!yaAnulado && (
                <button
                  onClick={() => setConfirmAnular(true)}
                  disabled={saving}
                  style={{ padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.red}`, background: C.redBg, color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
                >
                  Anular lote
                </button>
              )}
              <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: saving ? C.muted : C.green800, color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Acordeón de lotes + presentaciones ───────────────────────────
function ProductoAcordeon({ idProducto, canEdit }) {
  const [open,              setOpen]              = useState(false);
  const [lotes,             setLotes]             = useState([]);
  const [presentaciones,    setPresentaciones]    = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [loaded,            setLoaded]            = useState(false);
  const [editingLote,       setEditingLote]       = useState(null);   // lote objeto
  const [editingPresId,     setEditingPresId]     = useState(null);   // idProdPres
  const [editingPrecio,     setEditingPrecio]     = useState("");
  const [savingPres,        setSavingPres]        = useState(false);
  const [presError,         setPresError]         = useState("");

  const cargar = async (force = false) => {
    if (loaded && !force) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const [lotesRes, presRes] = await Promise.all([
        axios.get(`/batches/product/${idProducto}`,  { headers: headers() }),
        axios.get(`/prod-pres/product/${idProducto}`, { headers: headers() }),
      ]);
      setLotes(lotesRes.data || []);
      setPresentaciones(presRes.data || []);
      setLoaded(true);
      setOpen(true);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  const recargar = () => cargar(true);

  const startEditPres = (p) => {
    setEditingPresId(p.idProdPres);
    setEditingPrecio(String(p.precio));
    setPresError("");
  };

  const cancelEditPres = () => {
    setEditingPresId(null);
    setEditingPrecio("");
    setPresError("");
  };

  const saveEditPres = async (idProdPres) => {
    if (editingPrecio === "" || isNaN(Number(editingPrecio)) || Number(editingPrecio) < 0) {
      setPresError("Ingresá un precio válido.");
      return;
    }
    setSavingPres(true); setPresError("");
    try {
      await axios.patch(`/prod-pres/${idProdPres}`, { precio: parseFloat(editingPrecio) }, { headers: headers() });
      setPresentaciones(prev =>
        prev.map(p => p.idProdPres === idProdPres ? { ...p, precio: parseFloat(editingPrecio) } : p)
      );
      cancelEditPres();
    } catch (err) {
      setPresError(err.response?.data?.msg || "Error al actualizar el precio.");
    } finally { setSavingPres(false); }
  };

  return (
    <div style={{ marginTop: 4 }}>
      {editingLote && (
        <LoteModal
          lote={editingLote}
          onClose={() => setEditingLote(null)}
          onSave={() => { setEditingLote(null); recargar(); }}
        />
      )}

      <button
        onClick={() => cargar()}
        style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: C.green700, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "3px 0" }}
      >
        {loading ? "Cargando…" : open ? "▲ Ocultar detalle" : "▼ Ver lotes y precios"}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ── Presentaciones ───────────────────────────────── */}
          {presentaciones.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Presentaciones y precios de venta
              </div>

              {presError && (
                <div style={{ marginBottom: 6, padding: "6px 10px", background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 7, fontSize: 12, color: C.red }}>
                  ⚠️ {presError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {presentaciones.map(p => (
                  <div key={p.idProdPres} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.surface, borderRadius: 7, border: `1px solid ${C.borderLight}`, fontSize: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
                      {p.Presentacion ? `${p.Presentacion.tipo} - ${p.Presentacion.formato}` : `#${p.idPresentacion}`}
                    </span>

                    {editingPresId === p.idProdPres ? (
                      /* Edición inline de precio */
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>$</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={editingPrecio}
                            onChange={e => { setEditingPrecio(e.target.value); setPresError(""); }}
                            onKeyDown={e => { if (e.key === "Enter") saveEditPres(p.idProdPres); if (e.key === "Escape") cancelEditPres(); }}
                            autoFocus
                            style={{ ...inp, width: 100, padding: "5px 8px 5px 20px", fontSize: 12 }}
                          />
                        </div>
                        <button onClick={() => saveEditPres(p.idProdPres)} disabled={savingPres}
                          style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: C.green800, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          {savingPres ? "…" : "✓"}
                        </button>
                        <button onClick={cancelEditPres}
                          style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      /* Vista normal */
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: C.green800, fontWeight: 700 }}>${fmt(p.precio)}</span>
                        {canEdit && (
                          <button onClick={() => startEditPres(p)}
                            style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                            ✏️ Editar precio
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Lotes ─────────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Lotes en stock
            </div>
            {lotes.length === 0 ? (
              <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Sin lotes registrados.</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {lotes.map(l => {
                  const vencido    = new Date(l.fechaVencimiento) < new Date();
                  const proxVencer = !vencido && (new Date(l.fechaVencimiento) - new Date()) < 30 * 24 * 60 * 60 * 1000;
                  const anulado    = l.cantidadDisponible === 0 && !vencido;
                  return (
                    <div key={l.idLote} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "6px 12px", borderRadius: 7, fontSize: 12,
                      background: vencido ? C.redBg : proxVencer ? C.amberBg : C.surface,
                      border: `1px solid ${vencido ? "#f7c1c1" : proxVencer ? C.amberBorder : C.borderLight}`,
                    }}>
                      {l.codigoLote && <span style={{ fontWeight: 600, color: C.text }}>#{l.codigoLote}</span>}
                      <span style={{ color: C.muted }}>Vence: {fmtFecha(l.fechaVencimiento)}</span>
                      <span style={{ fontWeight: 700, color: vencido ? C.red : C.green800, marginLeft: "auto" }}>
                        {l.cantidadDisponible} un.
                      </span>
                      {vencido    && <span style={{ fontSize: 10, fontWeight: 700, color: C.red,   background: C.redBg,   padding: "1px 6px", borderRadius: 4 }}>VENCIDO</span>}
                      {proxVencer && <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, background: C.amberBg, padding: "1px 6px", borderRadius: 4 }}>PRÓXIMO A VENCER</span>}
                      {anulado    && <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.surface, padding: "1px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>ANULADO</span>}
                      {canEdit && (
                        <button onClick={() => setEditingLote(l)}
                          style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal producto (crear / editar / ver) ─────────────────────────
function ProductoModal({ producto, categorias, marcas, presentaciones, onClose, onSave, mode }) {
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [form, setForm] = useState({
    nombre:       producto?.nombre       || "",
    descripcion:  producto?.descripcion  || "",
    idCategoria:  producto?.idCategoria  || "",
    idMarca:      producto?.idMarca      || "",
    esUsoInterno: producto?.esUsoInterno ?? false,
  });

  // Presentaciones del producto
  const [presas,         setPresas]         = useState([]);
  const [loadingP,       setLoadingP]       = useState(false);
  const [newPres,        setNewPres]        = useState({ idPresentacion: "", precio: "" });
  const [editingPresId,  setEditingPresId]  = useState(null);
  const [editingPrecio,  setEditingPrecio]  = useState("");
  const [savingPres,     setSavingPres]     = useState(false);

  // Datos extra: medicamento o vacuna
  const [esMedicamento, setEsMedicamento] = useState(false);
  const [esVacuna,      setEsVacuna]      = useState(false);
  const [medForm, setMedForm] = useState({ idTipoMedicacion: "", ventaLibre: false });
  const [vacForm, setVacForm] = useState({ dosis: "", enfermedadPreventiva: "", idEspecie: "" });

  const [tiposMed, setTiposMed] = useState([]);
  const [especies, setEspecies] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    Promise.allSettled([
      axios.get("/medication-types", { headers: headers() }),
      axios.get("/species",          { headers: headers() }),
    ]).then(([mt, sp]) => {
      if (mt.status === "fulfilled") setTiposMed(mt.value.data || []);
      if (sp.status === "fulfilled") setEspecies(sp.value.data || []);
    });

    if (producto?.idProducto) {
      setLoadingP(true);
      Promise.allSettled([
        axios.get(`/prod-pres/product/${producto.idProducto}`, { headers: headers() }),
        axios.get(`/medication/${producto.idProducto}`,        { headers: headers() }),
        axios.get(`/vaccine/product/${producto.idProducto}`,   { headers: headers() }),
      ]).then(([presR, medR, vacR]) => {
        if (presR.status === "fulfilled") setPresas(presR.value.data || []);
        if (medR.status === "fulfilled" && medR.value.data?.idProducto) {
          setEsMedicamento(true);
          setMedForm({ idTipoMedicacion: medR.value.data.idTipoMedicacion, ventaLibre: medR.value.data.ventaLibre });
        }
        if (vacR.status === "fulfilled" && vacR.value.data?.idProducto) {
          setEsVacuna(true);
          setVacForm({ dosis: vacR.value.data.dosis, enfermedadPreventiva: vacR.value.data.enfermedadPreventiva, idEspecie: vacR.value.data.idEspecie || "" });
        }
      }).finally(() => setLoadingP(false));
    }
  }, [producto]);

  const hc = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.idCategoria || !form.idMarca) { setError("Nombre, categoría y marca son obligatorios."); return; }
    if (esMedicamento && !medForm.idTipoMedicacion) { setError("Si es medicamento, el tipo de medicación es obligatorio."); return; }
    if (esVacuna && (!vacForm.dosis || !vacForm.enfermedadPreventiva)) { setError("Si es vacuna, dosis y enfermedad preventiva son obligatorios."); return; }

    setSaving(true); setError("");
    try {
      const payload = {
        nombre:       form.nombre,
        descripcion:  form.descripcion || null,
        idCategoria:  Number(form.idCategoria),
        idMarca:      Number(form.idMarca),
        esUsoInterno: form.esUsoInterno,
      };
      let idProd = producto?.idProducto;
      if (isEdit) {
        await axios.patch(`/product/${idProd}`, payload, { headers: headers() });
      } else {
        const res = await axios.post("/product", payload, { headers: headers() });
        idProd = res.data?.idProducto;
      }

      if (esMedicamento) {
        const medPayload = { idTipoMedicacion: Number(medForm.idTipoMedicacion), ventaLibre: medForm.ventaLibre };
        if (isEdit) await axios.patch(`/medication/${idProd}`, medPayload, { headers: headers() }).catch(() => axios.post("/medication", { idProducto: idProd, ...medPayload }, { headers: headers() }));
        else await axios.post("/medication", { idProducto: idProd, ...medPayload }, { headers: headers() });
      }

      if (esVacuna) {
        const vacPayload = { dosis: vacForm.dosis, enfermedadPreventiva: vacForm.enfermedadPreventiva, idEspecie: vacForm.idEspecie ? Number(vacForm.idEspecie) : null };
        if (isEdit) await axios.patch(`/vaccine/${idProd}`, vacPayload, { headers: headers() }).catch(() => axios.post("/vaccine", { idProducto: idProd, ...vacPayload }, { headers: headers() }));
        else await axios.post("/vaccine", { idProducto: idProd, ...vacPayload }, { headers: headers() });
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || "Error al guardar.");
    } finally { setSaving(false); }
  };

  // ── Presentaciones: agregar ───────────────────────────────────
  const addPresentacion = async () => {
    if (!newPres.idPresentacion || newPres.precio === "") { setError("Seleccioná presentación e ingresá el precio."); return; }
    setSaving(true); setError("");
    try {
      await axios.post("/prod-pres", {
        idProducto:     producto.idProducto,
        idPresentacion: Number(newPres.idPresentacion),
        precio:         parseFloat(newPres.precio),
      }, { headers: headers() });
      setNewPres({ idPresentacion: "", precio: "" });
      const r = await axios.get(`/prod-pres/product/${producto.idProducto}`, { headers: headers() });
      setPresas(r.data || []);
    } catch (err) { setError(err.response?.data?.msg || "Error al agregar presentación."); }
    finally { setSaving(false); }
  };

  // ── Presentaciones: eliminar ──────────────────────────────────
  const deletePresentacion = async (idProdPres) => {
    if (!window.confirm("¿Desactivar esta presentación? El historial queda preservado.")) return;
    try {
      await axios.patch(`/prod-pres/${idProdPres}`, { activo: false }, { headers: headers() });
      setPresas(p => p.filter(x => x.idProdPres !== idProdPres));
    } catch (err) { setError(err.response?.data?.msg || "Error al eliminar."); }
  };

  // ── Presentaciones: editar precio ─────────────────────────────
  const startEditPres = (p) => {
    setEditingPresId(p.idProdPres);
    setEditingPrecio(String(p.precio));
    setError("");
  };
  const cancelEditPres = () => { setEditingPresId(null); setEditingPrecio(""); };
  const saveEditPres = async (idProdPres) => {
    if (editingPrecio === "" || isNaN(Number(editingPrecio)) || Number(editingPrecio) < 0) {
      setError("Ingresá un precio válido."); return;
    }
    setSavingPres(true); setError("");
    try {
      await axios.patch(`/prod-pres/${idProdPres}`, { precio: parseFloat(editingPrecio) }, { headers: headers() });
      setPresas(prev => prev.map(p => p.idProdPres === idProdPres ? { ...p, precio: parseFloat(editingPrecio) } : p));
      cancelEditPres();
    } catch (err) { setError(err.response?.data?.msg || "Error al actualizar el precio."); }
    finally { setSavingPres(false); }
  };

  const presUsadas = new Set(presas.map(p => p.idPresentacion));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)" }}>
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />
      <div style={{ position: "relative", background: C.white, borderRadius: 18, width: "100%", maxWidth: 660, maxHeight: "94vh", display: "flex", flexDirection: "column", margin: "0 16px", border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: C.green900, color: "white", padding: "18px 24px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {isView ? "Solo lectura" : isEdit ? `Producto #${producto?.idProducto}` : "Registro nuevo"}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {isView ? "Ver producto" : isEdit ? "Editar producto" : "Nuevo producto"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
          <form onSubmit={handleSubmit}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <Field label="Nombre del producto" required col="1 / -1">
                <input name="nombre" value={form.nombre} onChange={hc} readOnly={isView} required style={inp} placeholder="Ej: Frontline Plus" autoFocus={!isView} />
              </Field>
              <Field label="Categoría" required>
                <select name="idCategoria" value={form.idCategoria} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccionar…</option>
                  {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.descripcion || c.nombre}</option>)}
                </select>
              </Field>
              <Field label="Marca" required>
                <select name="idMarca" value={form.idMarca} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccionar…</option>
                  {marcas.map(m => <option key={m.idMarca} value={m.idMarca}>{m.nombre || m.descripcion}</option>)}
                </select>
              </Field>
              <Field label="Descripción" col="1 / -1">
                <textarea name="descripcion" value={form.descripcion} onChange={hc} readOnly={isView} rows={2}
                  style={{ ...inp, resize: "vertical" }} placeholder="Descripción opcional…" />
              </Field>
              <Field label="Uso interno" col="1 / -1">
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.text, cursor: isView ? "default" : "pointer" }}>
                  <input type="checkbox" name="esUsoInterno" checked={form.esUsoInterno} onChange={hc} disabled={isView} style={{ width: 16, height: 16, accentColor: C.green700 }} />
                  <span>Este producto es de uso interno (no se vende al público)</span>
                </label>
              </Field>
            </div>

            {!isView && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={esMedicamento} onChange={e => { setEsMedicamento(e.target.checked); if (e.target.checked) setEsVacuna(false); }} style={{ width: 16, height: 16, accentColor: C.purple }} />
                  <span>💊 Es un medicamento</span>
                </label>
                {esMedicamento && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "14px 16px", background: C.purpleBg, borderRadius: 10, border: "1px solid #c4bfee" }}>
                    <Field label="Tipo de medicación" required>
                      <select value={medForm.idTipoMedicacion} onChange={e => setMedForm(p => ({ ...p, idTipoMedicacion: e.target.value }))} required style={{ ...inp, cursor: "pointer" }}>
                        <option value="">Seleccionar…</option>
                        {tiposMed.map(t => <option key={t.idTipoMedicacion} value={t.idTipoMedicacion}>{t.nombre || t.descripcion}</option>)}
                      </select>
                    </Field>
                    <Field label="Venta libre">
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.text, cursor: "pointer", paddingTop: 6 }}>
                        <input type="checkbox" checked={medForm.ventaLibre} onChange={e => setMedForm(p => ({ ...p, ventaLibre: e.target.checked }))} style={{ width: 16, height: 16, accentColor: C.purple }} />
                        <span>Sin receta</span>
                      </label>
                    </Field>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={esVacuna} onChange={e => { setEsVacuna(e.target.checked); if (e.target.checked) setEsMedicamento(false); }} style={{ width: 16, height: 16, accentColor: C.amber }} />
                  <span>💉 Es una vacuna</span>
                </label>
                {esVacuna && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "14px 16px", background: C.amberBg, borderRadius: 10, border: `1px solid ${C.amberBorder}` }}>
                    <Field label="Dosis" required>
                      <input value={vacForm.dosis} onChange={e => setVacForm(p => ({ ...p, dosis: e.target.value }))} style={inp} placeholder="Ej: 0.5 ml" />
                    </Field>
                    <Field label="Enfermedad preventiva" required>
                      <input value={vacForm.enfermedadPreventiva} onChange={e => setVacForm(p => ({ ...p, enfermedadPreventiva: e.target.value }))} style={inp} placeholder="Ej: Parvovirus" />
                    </Field>
                    <Field label="Especie">
                      <select value={vacForm.idEspecie} onChange={e => setVacForm(p => ({ ...p, idEspecie: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                        <option value="">Todas</option>
                        {especies.map(e => <option key={e.idEspecie} value={e.idEspecie}>{e.nombre}</option>)}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {isView && (esMedicamento || esVacuna) && (
              <div style={{ marginBottom: 18, padding: "12px 16px", background: esMedicamento ? C.purpleBg : C.amberBg, borderRadius: 10, border: `1px solid ${esMedicamento ? "#c4bfee" : C.amberBorder}`, fontSize: 13, color: C.text }}>
                {esMedicamento && <div><strong>💊 Medicamento</strong> · {tiposMed.find(t => t.idTipoMedicacion === medForm.idTipoMedicacion)?.nombre || "—"} · {medForm.ventaLibre ? "Venta libre" : "Requiere receta"}</div>}
                {esVacuna      && <div><strong>💉 Vacuna</strong> · Previene: {vacForm.enfermedadPreventiva} · Dosis: {vacForm.dosis}</div>}
              </div>
            )}

            {error && <div style={{ marginTop: 14, padding: "10px 14px", background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 9, fontSize: 13, color: C.red }}>⚠️ {error}</div>}

            {!isView && (
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: saving ? C.muted : C.green800, color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            )}
          </form>

          {/* ── Presentaciones (editar / ver) ─────────────────── */}
          {(isEdit || isView) && producto?.idProducto && (
            <div style={{ marginTop: 24, borderTop: `1px solid ${C.borderLight}`, paddingTop: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Presentaciones y precios de venta
              </h4>
              {loadingP ? (
                <div style={{ fontSize: 13, color: C.muted }}>Cargando…</div>
              ) : (
                <>
                  {presas.length === 0
                    ? <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", marginBottom: 12 }}>Sin presentaciones registradas.</div>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {presas.map(p => (
                          <div key={p.idProdPres} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: C.surface, borderRadius: 9, border: `1px solid ${C.borderLight}` }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                              {p.Presentacion?.tipo || `#${p.idPresentacion}`}
                              {p.Presentacion?.formato && <span style={{ fontWeight: 400, color: C.muted }}> — {p.Presentacion.formato}</span>}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {editingPresId === p.idProdPres ? (
                                /* Edición inline */
                                <>
                                  <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>$</span>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={editingPrecio}
                                      onChange={e => { setEditingPrecio(e.target.value); setError(""); }}
                                      onKeyDown={e => { if (e.key === "Enter") saveEditPres(p.idProdPres); if (e.key === "Escape") cancelEditPres(); }}
                                      autoFocus
                                      style={{ ...inp, width: 110, padding: "6px 8px 6px 20px", fontSize: 13 }}
                                    />
                                  </div>
                                  <button onClick={() => saveEditPres(p.idProdPres)} disabled={savingPres}
                                    style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: C.green800, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                    {savingPres ? "…" : "✓ Guardar"}
                                  </button>
                                  <button onClick={cancelEditPres}
                                    style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                    ✕
                                  </button>
                                </>
                              ) : (
                                /* Vista normal */
                                <>
                                  <span style={{ fontSize: 13, color: C.green800, fontWeight: 700 }}>${fmt(p.precio)}</span>
                                  {isEdit && (
                                    <>
                                      <button onClick={() => startEditPres(p)}
                                        style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                        ✏️ Precio
                                      </button>
                                      <button onClick={() => deletePresentacion(p.idProdPres)}
                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #f7c1c1", background: C.redBg, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                        Eliminar
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  {/* Agregar nueva presentación */}
                  {isEdit && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 2 }}>
                        <label style={lbl}>Nueva presentación</label>
                        <select value={newPres.idPresentacion} onChange={e => setNewPres(p => ({ ...p, idPresentacion: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                          <option value="">Seleccionar…</option>
                          {presentaciones.filter(p => !presUsadas.has(p.idPresentacion)).map(p => (
                            <option key={p.idPresentacion} value={p.idPresentacion}>{p.tipo}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={lbl}>Precio venta ($)</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted }}>$</span>
                          <input type="number" min="0" step="0.01" value={newPres.precio} onChange={e => setNewPres(p => ({ ...p, precio: e.target.value }))} style={{ ...inp, paddingLeft: 22 }} placeholder="0.00" />
                        </div>
                      </div>
                      <button onClick={addPresentacion} disabled={saving} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: C.green800, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                        + Agregar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function InventarioPage() {
  const userLogueado = getUserFromToken();
  const idRol = userLogueado?.idRol || 0;
  const canCreate = [1, 3, 4].includes(idRol);
  const canDelete = idRol === 1;

  const TABS = [
    { key: "todos",        label: "Todos los productos" },
    { key: "medicamentos", label: "💊 Medicamentos" },
    { key: "vacunas",      label: "💉 Vacunas" },
  ];

  const [tab,            setTab]            = useState("todos");
  const [productos,      setProductos]      = useState([]);
  const [categorias,     setCategorias]     = useState([]);
  const [marcas,         setMarcas]         = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [filterCat,      setFilterCat]      = useState("all");
  const [modal,          setModal]          = useState(null);
  const [confirm,        setConfirm]        = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [msgOk,          setMsgOk]          = useState("");
  const [msgErr,         setMsgErr]         = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, mRes, presRes] = await Promise.all([
        axios.get("/products",      { headers: headers() }),
        axios.get("/categories",    { headers: headers() }),
        axios.get("/brands",        { headers: headers() }),
        axios.get("/presentations", { headers: headers() }),
      ]);
      setProductos(pRes.data || []);
      setCategorias(cRes.data || []);
      setMarcas(mRes.data || []);
      setPresentaciones(presRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.patch(`/product/${confirm}`, { activo: false }, { headers: headers() });
      setConfirm(null); setMsgOk("Producto desactivado. El historial queda preservado."); loadData();
    } catch (err) {
      setConfirm(null); setMsgErr(err.response?.data?.msg || "No se pudo eliminar el producto.");
    } finally { setDeleting(false); }
  };

  const stockTotal = useCallback((p) =>
    (p.Batches || p.Lotes || []).reduce((s, l) => s + (l.cantidadDisponible || 0), 0), []
  );

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchS   = !search   || p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || String(p.idCategoria) === filterCat;
      const matchTab =
        tab === "todos"        ? true :
        tab === "medicamentos" ? !!p.Medication || !!p.Medicamento :
        tab === "vacunas"      ? !!p.Vaccine || !!p.Vacuna : true;
      return matchS && matchCat && matchTab;
    });
  }, [productos, search, filterCat, tab]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>

      {msgOk  && <AlertModal emoji="✅" emojiBg={C.green100} title="¡Listo!" message={msgOk} confirmText="Aceptar" confirmBg={C.green800} onConfirm={() => setMsgOk("")} />}
      {msgErr && <AlertModal emoji="❌" emojiBg={C.redBg}   title="Error"  message={msgErr} confirmText="Cerrar"  confirmBg={C.red}      onConfirm={() => setMsgErr("")} />}
      {confirm && (
        <AlertModal emoji="⚠️" emojiBg={C.amberBg} title="¿Eliminar producto?"
          message="Esta acción eliminará el producto y sus presentaciones. <strong>No se puede deshacer.</strong>"
          confirmText="Sí, eliminar" confirmBg={C.red} cancelText="Cancelar"
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>📦 Inventario de Productos</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Catálogo completo · presentaciones · lotes y stock</p>
        </div>
        {canCreate && (
          <button onClick={() => setModal({ type: "new" })} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: `linear-gradient(135deg, ${C.green900}, ${C.green800})`, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,61,40,0.25)" }}>
            <span style={{ fontSize: 18 }}>+</span> Nuevo producto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "11px 14px", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: tab === t.key ? C.green100 : C.white,
            color: tab === t.key ? C.green800 : C.muted,
            borderBottom: tab === t.key ? `2px solid ${C.green800}` : "2px solid transparent",
            transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "2 1 220px" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
          <input placeholder="Buscar por nombre…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, paddingLeft: 34 }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inp, flex: "1 1 160px", cursor: "pointer" }}>
          <option value="all">Todas las categorías</option>
          {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.descripcion || c.nombre}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {["#", "Nombre y tipo", "Categoría", "Marca", "Stock total", "Uso", "Acciones"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i === 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>Cargando inventario…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                  No se encontraron productos.{" "}
                  {canCreate && <button onClick={() => setModal({ type: "new" })} style={{ background: "none", border: "none", color: C.green700, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Crear nuevo</button>}
                </td></tr>
              ) : filtered.map((p, i) => {
                const stock = stockTotal(p);
                const esMed = !!(p.Medication || p.Medicamento);
                const esVac = !!(p.Vaccine || p.Vacuna);
                return (
                  <tr key={p.idProducto} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{p.idProducto}</td>
                    <td style={{ padding: "12px 16px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>{p.nombre}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                        {esMed && <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "1px 6px", borderRadius: 4 }}>💊 Med</span>}
                        {esVac && <span style={{ fontSize: 10, fontWeight: 700, background: C.amberBg, color: C.amber, padding: "1px 6px", borderRadius: 4 }}>💉 Vac</span>}
                      </div>
                      {/* Acordeón inline — con edición si el usuario puede */}
                      <ProductoAcordeon idProducto={p.idProducto} canEdit={canCreate} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, background: C.blueBg, color: C.blue, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {p.Category?.descripcion || p.Categoria?.descripcion || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{p.Brand?.descripcion || p.Marca?.descripcion || `#${p.idMarca}`}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: stock > 0 ? C.green100 : C.redBg, color: stock > 0 ? C.green800 : C.red }}>
                        {stock} un.
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.esUsoInterno
                        ? <span style={{ fontSize: 11, background: C.amberBg, color: C.amber, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Interno</span>
                        : <span style={{ fontSize: 11, background: C.green100, color: C.green800, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Venta</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => setModal({ type: "view", data: p })} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: 12, cursor: "pointer" }}>Ver</button>
                        {canCreate && <button onClick={() => setModal({ type: "edit", data: p })} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.green700}`, background: C.white, color: C.green700, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Editar</button>}
                        {canDelete && <button onClick={() => setConfirm(p.idProducto)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.red}`, background: C.white, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(modal?.type === "new" || modal?.type === "edit" || modal?.type === "view") && (
        <ProductoModal
          mode={modal.type}
          producto={modal.data || null}
          categorias={categorias}
          marcas={marcas}
          presentaciones={presentaciones}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadData(); }}
        />
      )}
    </div>
  );
}