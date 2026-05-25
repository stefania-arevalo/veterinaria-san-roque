import { useState, useEffect, useMemo } from "react";
import axios from "../../api/axios";

const token   = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ── Paleta clínica ────────────────────────────────────────────────
const C = {
  white:       "#ffffff",
  green900:    "#1a3d28",
  green800:    "#1f5c38",
  green700:    "#276b42",
  green100:    "#eaf3de",
  green200:    "#c0dd97",
  border:      "#d1ddd4",
  borderLight: "#e8eee9",
  muted:       "#6b8f76",
  text:        "#1a3d28",
  surface:     "#f8fbf9",
  red:         "#a32d2d",
  redBg:       "#fcebeb",
  amber:       "#7a4f00",
  amberBg:     "#fef9ec",
  amberBorder: "#f0d080",
};

const baseInp = {
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

function Field({ label, required, children }) {
  return (
    <div>
      <label style={lbl}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Stepper({ steps, current }) {
  return (
    <div style={{
      display: "flex", background: C.surface,
      borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0,
    }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = current === n;
        const done   = current > n;
        return (
          <div key={label} style={{
            flex: 1, padding: "10px 16px", textAlign: "center",
            fontSize: 12, fontWeight: 700,
            color: (active || done) ? C.green800 : C.muted,
            borderBottom: active ? `2px solid ${C.green800}` : "2px solid transparent",
            background: active ? C.green100 : "transparent",
          }}>
            {done && "✓ "}{label}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────
export default function NewPatientModal({ onClose, onCreated, allClients = [] }) {
  // "selector" → pantalla de elección
  // "both"     → flujo A: cliente + mascota (dos pasos)
  // "pet-only" → flujo B: buscar dueño existente + crear mascota
  const [mode, setMode] = useState("selector");
  const [step, setStep] = useState(1);          // solo relevante en modo "both"

  // Listas lookup
  const [localidades,  setLocalidades]  = useState([]);
  const [razas,        setRazas]        = useState([]);
  const [tamaños,      setTamaños]      = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Form cliente (flujo A)
  const [cliente, setCliente] = useState({
    nombres: "", apellidos: "", dni: "", sexo: "",
    telefono: "", correo: "", direccion: "", idLocalidad: "",
  });

  // Form mascota (ambos flujos)
  const [mascota, setMascota] = useState({
    nombre: "", sexo: "", fechaNac: "", colores: "", idRaza: "", idTamaño: "",
  });

  // Flujo B
  const [busqueda,     setBusqueda]     = useState("");
  const [duenoBSelect, setDuenoBSelect] = useState(null);

  // Estado general
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [clienteCreado, setClienteCreado] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      axios.get("/localities",   { headers: headers() }),
      axios.get("/breeds",       { headers: headers() }),
      axios.get("/animal-sizes", { headers: headers() }),
    ]).then(([loc, raz, tam]) => {
      if (loc.status === "fulfilled") setLocalidades(loc.value.data || []);
      if (raz.status === "fulfilled") setRazas(raz.value.data || []);
      if (tam.status === "fulfilled") setTamaños(tam.value.data || []);
    }).finally(() => setLoadingLists(false));
  }, []);

  // Filtrado en memoria de clientes para flujo B
  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return allClients.filter(c =>
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
      String(c.dni).includes(q) ||
      (c.telefono || "").includes(q)
    ).slice(0, 8);
  }, [busqueda, allClients]);

  const hc = (e) => setCliente(p => ({ ...p, [e.target.name]: e.target.value }));
  const hm = (e) => setMascota(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Crear cliente (flujo A, paso 1) ──────────────────────────────
  const crearCliente = async () => {
    setError("");
    const { nombres, apellidos, dni, sexo, telefono, direccion, idLocalidad } = cliente;
    if (!nombres || !apellidos || !dni || !sexo || !telefono || !direccion || !idLocalidad) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post("/client", {
        ...cliente, idLocalidad: Number(cliente.idLocalidad),
      }, { headers: headers() });
      setClienteCreado(res.data);
      setStep(2);
      setError("");
    } catch (e) {
      setError(e.response?.data?.msg || e.response?.data?.message || "Error al crear el cliente.");
    } finally { setSaving(false); }
  };

  // ── Crear mascota (ambos flujos) ──────────────────────────────────
  const crearMascota = async () => {
    setError("");
    const { nombre, sexo, idRaza, idTamaño } = mascota;
    if (!nombre || !sexo || !idRaza || !idTamaño) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    const dueno = mode === "pet-only" ? duenoBSelect : clienteCreado;
    if (!dueno?.idCliente) { setError("No se determinó el cliente asociado."); return; }

    setSaving(true);
    try {
      const res = await axios.post("/pet", {
        ...mascota,
        idCliente: dueno.idCliente,
        idRaza:    Number(mascota.idRaza),
        idTamaño:  Number(mascota.idTamaño),
        fechaNac:  mascota.fechaNac || null,
      }, { headers: headers() });

      onCreated({
        ...res.data,
        Dueño:      dueno,
        Raza:       razas.find(r => r.idRaza === Number(mascota.idRaza)),
        AnimalSize: tamaños.find(t => t.idTamaño === Number(mascota.idTamaño)),
      });
    } catch (e) {
      setError(e.response?.data?.msg || e.response?.data?.message || "Error al crear la mascota.");
    } finally { setSaving(false); }
  };

  // ── Derivados de navegación ───────────────────────────────────────
  const dueno        = mode === "pet-only" ? duenoBSelect : clienteCreado;
  const enFormMascota = (mode === "both" && step === 2) || (mode === "pet-only" && !!duenoBSelect);
  const enBusqueda    = mode === "pet-only" && !duenoBSelect;
  const enFormCliente = mode === "both" && step === 1;

  const titulo = () => {
    if (mode === "selector")            return "Registro rápido";
    if (mode === "both" && step === 1)  return "Datos del cliente";
    if (mode === "both" && step === 2)  return `Mascota de ${clienteCreado?.nombres}`;
    if (enBusqueda)                     return "Buscar cliente";
    if (mode === "pet-only")            return `Mascota de ${duenoBSelect?.nombres}`;
    return "";
  };

  const subtitulo = () => {
    if (mode === "selector") return "Seleccioná el flujo de ingreso";
    if (mode === "both")     return `Paso ${step} de 2 — cliente + primera mascota`;
    if (mode === "pet-only") return "Dueño ya registrado en el sistema";
    return "";
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,30,20,0.55)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.white, borderRadius: 16,
        width: "100%", maxWidth: 520,
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
        maxHeight: "94vh", overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: C.green900, color: "white",
          padding: "18px 22px", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{
              fontSize: 10.5, color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3,
            }}>
              {subtitulo()}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{titulo()}</h3>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none", color: "white",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* ── Stepper (solo flujo A) ── */}
        {mode === "both" && (
          <Stepper steps={["1. Cliente", "2. Mascota"]} current={step} />
        )}

        {/* ── Cuerpo ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>

          {loadingLists ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>
              Cargando datos…
            </div>

          ) : mode === "selector" ? (
            /* ── Pantalla de elección de flujo ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
                ¿Qué necesitás registrar?
              </p>
              {[
                {
                  id:    "both",
                  icon:  "🧑‍⚕️",
                  title: "Cliente nuevo + su mascota",
                  desc:  "El dueño no existe aún. Se crean los dos en dos pasos rápidos.",
                },
                {
                  id:    "pet-only",
                  icon:  "🐾",
                  title: "Mascota nueva — dueño ya existe",
                  desc:  "El cliente ya está registrado pero trae una mascota nueva a la clínica.",
                },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setMode(opt.id); setError(""); }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "17px 18px", borderRadius: 12, width: "100%",
                    border: `1.5px solid ${C.border}`,
                    background: C.white, cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.green700;
                    e.currentTarget.style.background  = C.green100;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background  = C.white;
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: C.green100, fontSize: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

          ) : enBusqueda ? (
            /* ── Flujo B: buscar dueño en memoria ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Buscar por nombre, apellido o DNI" required>
                <input
                  autoFocus
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Ej: García, 30123456…"
                  style={baseInp}
                />
              </Field>

              {clientesFiltrados.length > 0 && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {clientesFiltrados.map((c, i) => (
                    <button
                      key={c.idCliente}
                      type="button"
                      onClick={() => { setDuenoBSelect(c); setBusqueda(""); setError(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        width: "100%", padding: "12px 16px",
                        background: C.white, border: "none",
                        borderBottom: i < clientesFiltrados.length - 1
                          ? `1px solid ${C.borderLight}` : "none",
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surface}
                      onMouseLeave={e => e.currentTarget.style.background = C.white}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: C.green100, color: C.green800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(c.nombres?.[0] || "?").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>
                          {c.nombres} {c.apellidos}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.muted }}>
                          DNI {c.dni} · {c.telefono}
                        </div>
                      </div>
                      <span style={{ fontSize: 11.5, color: C.green700, fontWeight: 700 }}>
                        Elegir →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {busqueda.length >= 2 && clientesFiltrados.length === 0 && (
                <div style={{
                  padding: "14px 18px", borderRadius: 10,
                  background: C.amberBg, border: `1px solid ${C.amberBorder}`,
                  fontSize: 13, color: C.amber,
                }}>
                  No se encontraron clientes con ese criterio.
                </div>
              )}
            </div>

          ) : enFormMascota ? (
            /* ── Formulario mascota (ambos flujos) ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Banner dueño confirmado */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10,
                background: C.green100, border: `1px solid ${C.green200}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: C.green200, color: C.green800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {(dueno?.nombres?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>
                    {mode === "both" ? "✓ Cliente registrado" : "✓ Dueño seleccionado"}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.green800 }}>
                    {dueno?.nombres} {dueno?.apellidos}
                    <span style={{ fontWeight: 400, color: C.muted }}> · DNI {dueno?.dni}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nombre de la mascota" required>
                  <input name="nombre" value={mascota.nombre} onChange={hm}
                    style={baseInp} placeholder="Max" autoFocus />
                </Field>
                <Field label="Sexo" required>
                  <select name="sexo" value={mascota.sexo} onChange={hm}
                    style={{ ...baseInp, cursor: "pointer" }}>
                    <option value="">Seleccionar…</option>
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Raza" required>
                  <select name="idRaza" value={mascota.idRaza} onChange={hm}
                    style={{ ...baseInp, cursor: "pointer" }}>
                    <option value="">Seleccionar…</option>
                    {razas.map(r => (
                      <option key={r.idRaza} value={r.idRaza}>{r.descripcion || r.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tamaño" required>
                  <select name="idTamaño" value={mascota.idTamaño} onChange={hm}
                    style={{ ...baseInp, cursor: "pointer" }}>
                    <option value="">Seleccionar…</option>
                    {tamaños.map(t => (
                      <option key={t.idTamaño} value={t.idTamaño}>{t.descripcion}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Fecha de nacimiento">
                  <input name="fechaNac" value={mascota.fechaNac} onChange={hm}
                    style={baseInp} type="date" />
                </Field>
                <Field label="Colores / Pelaje">
                  <input name="colores" value={mascota.colores} onChange={hm}
                    style={baseInp} placeholder="Negro con blanco" />
                </Field>
              </div>
            </div>

          ) : enFormCliente ? (
            /* ── Formulario cliente (flujo A, paso 1) ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nombres" required>
                  <input name="nombres" value={cliente.nombres} onChange={hc}
                    style={baseInp} placeholder="Juan" autoFocus />
                </Field>
                <Field label="Apellidos" required>
                  <input name="apellidos" value={cliente.apellidos} onChange={hc}
                    style={baseInp} placeholder="Pérez" />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="DNI" required>
                  <input name="dni" value={cliente.dni} onChange={hc}
                    style={baseInp} placeholder="30123456" />
                </Field>
                <Field label="Sexo" required>
                  <select name="sexo" value={cliente.sexo} onChange={hc}
                    style={{ ...baseInp, cursor: "pointer" }}>
                    <option value="">Seleccionar…</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Teléfono" required>
                  <input name="telefono" value={cliente.telefono} onChange={hc}
                    style={baseInp} placeholder="2932 000000" />
                </Field>
                <Field label="Correo electrónico">
                  <input name="correo" value={cliente.correo} onChange={hc}
                    style={baseInp} placeholder="juan@mail.com" type="email" />
                </Field>
              </div>
              <Field label="Dirección" required>
                <input name="direccion" value={cliente.direccion} onChange={hc}
                  style={baseInp} placeholder="Av. San Martín 123" />
              </Field>
              <Field label="Localidad" required>
                <select name="idLocalidad" value={cliente.idLocalidad} onChange={hc}
                  style={{ ...baseInp, cursor: "pointer" }}>
                  <option value="">Seleccionar…</option>
                  {localidades.map(l => (
                    <option key={l.idLocalidad} value={l.idLocalidad}>
                      {l.nombre || l.descripcion}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          {/* Error global */}
          {error && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: C.redBg, border: "1px solid #f7c1c1",
              borderRadius: 9, fontSize: 13, color: C.red,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px", background: C.surface,
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex", gap: 10, flexShrink: 0,
        }}>

          {/* Botón izquierdo contextual */}
          {(mode === "selector" || enBusqueda) && (
            <button onClick={onClose} style={{
              flex: 1, padding: "10px", borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Cancelar</button>
          )}

          {mode === "both" && step === 2 && (
            <button onClick={() => { setStep(1); setError(""); }} style={{
              padding: "10px 18px", borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>← Volver</button>
          )}

          {mode === "pet-only" && !!duenoBSelect && (
            <button onClick={() => { setDuenoBSelect(null); setError(""); }} style={{
              padding: "10px 18px", borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>← Cambiar dueño</button>
          )}

          {enFormCliente && (
            <button onClick={onClose} style={{
              padding: "10px 18px", borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Cancelar</button>
          )}

          {/* Botón principal */}
          {enFormCliente && (
            <button onClick={crearCliente} disabled={saving} style={{
              flex: 2, padding: "10px", borderRadius: 9,
              background: saving ? C.muted : C.green800,
              color: "white", border: "none", fontWeight: 600, fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Guardando…" : "Guardar cliente →"}
            </button>
          )}

          {enFormMascota && (
            <button onClick={crearMascota} disabled={saving} style={{
              flex: 2, padding: "10px", borderRadius: 9,
              background: saving ? C.muted : C.green800,
              color: "white", border: "none", fontWeight: 600, fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Guardando…" : "✓ Registrar y seleccionar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}