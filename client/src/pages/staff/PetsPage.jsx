import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";

const token = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ── Paleta clínica unificada ──────────────────────────────────────
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
  blue:        "#185fa5",
  blueBg:      "#e6f1fb",
  teal:        "#0f766e",
  tealBg:      "#ccfbf1",
};

// ── Componentes UI ────────────────────────────────────────────────

function PageHeader({ onNew }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 24,
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>🐾 Pacientes</h2>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>
          Administrá las mascotas registradas en la clínica
        </p>
      </div>
      <button onClick={onNew} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: 12,
        background: `linear-gradient(135deg, ${C.green900}, ${C.green800})`,
        color: "white", border: "none", fontWeight: 700, fontSize: 14,
        cursor: "pointer", boxShadow: "0 4px 14px rgba(26,61,40,0.25)",
      }}>
        <span style={{ fontSize: 18 }}>+</span> Nuevo paciente
      </button>
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{
        position: "absolute", left: 13, top: "50%",
        transform: "translateY(-50%)", fontSize: 15, opacity: 0.45,
      }}>🔍</span>
      <input
        type="text"
        placeholder="Buscar por nombre del paciente o dueño…"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
          borderRadius: 10, fontSize: 13.5,
          border: `1px solid ${C.border}`,
          background: C.white, outline: "none", color: C.text,
        }}
      />
    </div>
  );
}

function SexBadge({ sexo }) {
  const s = sexo === "M"
    ? { label: "Macho",  bg: C.blueBg, color: C.blue }
    : { label: "Hembra", bg: "#fce7f3", color: "#9d174d" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ── Modal confirmación ────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)",
    }}>
      <div style={{
        background: C.white, borderRadius: 20, padding: "32px 28px",
        width: "100%", maxWidth: 360, textAlign: "center",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
          background: C.redBg, border: `1px solid #f7c1c1`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>⚠️</div>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.white,
            color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: 12, borderRadius: 10, border: "none",
            background: C.red, color: "white", fontWeight: 700,
            fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Eliminando…" : "Sí, borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal mascota ─────────────────────────────────────────────────
function PetModal({ pet, clients, breeds, species, sizes, onClose, onSave, mode }) {
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 9, fontSize: 13.5,
    border: `1px solid ${C.border}`,
    background: isView ? C.surface : C.white,
    color: C.text, outline: "none",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: C.muted, marginBottom: 5,
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const [form, setForm] = useState(pet ? {
    nombre:    pet.nombre    || "",
    sexo:      pet.sexo      || "M",
    fechaNac:  (pet.fechaNac || "").split("T")[0],
    colores:   pet.colores   || "",
    idCliente: pet.idCliente || pet.Dueño?.idCliente || "",
    idEspecie: pet.Raza?.idEspecie || pet.Breed?.idEspecie || "",
    idRaza:    pet.idRaza    || pet.Raza?.idRaza || pet.Breed?.idRaza || "",
    idTamaño:  pet.idTamaño  || pet.AnimalSize?.idTamaño || "",
  } : {
    nombre: "", sexo: "M", fechaNac: "", colores: "",
    idCliente: "", idEspecie: "", idRaza: "", idTamaño: "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const hc = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    setLoading(true); setError("");
    try {
      const payload = {
        nombre:    form.nombre,
        sexo:      form.sexo,
        fechaNac:  form.fechaNac || null,
        colores:   form.colores  || null,
        idCliente: Number(form.idCliente),
        idRaza:    Number(form.idRaza),
        idTamaño:  Number(form.idTamaño),
      };
      if (isEdit) await axios.patch(`/pet/${pet.idMascota}`, payload, { headers: headers() });
      else        await axios.post("/pet", payload, { headers: headers() });
      onSave();
    } catch (err) {
      setError(err.response?.data?.msg || "Error al guardar.");
    } finally { setLoading(false); }
  };

  const razasFiltradas = breeds.filter(b =>
    !form.idEspecie || String(b.idEspecie) === String(form.idEspecie)
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)",
    }}>
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />
      <div style={{
        position: "relative", background: C.white, borderRadius: 18,
        width: "100%", maxWidth: 620, maxHeight: "92vh",
        display: "flex", flexDirection: "column", margin: "0 16px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: C.green900, color: "white",
          padding: "18px 24px", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {isView ? "Solo lectura" : isEdit ? `Paciente #${pet.idMascota}` : "Registro nuevo"}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {isView ? "Ver paciente" : isEdit ? "Editar paciente" : "Nuevo paciente"}
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none", color: "white",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Nombre de la mascota *</label>
                <input name="nombre" value={form.nombre} onChange={hc} readOnly={isView}
                  required style={inp} placeholder="Ej: Max" autoFocus={!isView} />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Dueño *</label>
                <select name="idCliente" value={form.idCliente} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccionar dueño…</option>
                  {clients.map(c => (
                    <option key={c.idCliente} value={c.idCliente}>
                      {c.nombres} {c.apellidos} — DNI {c.dni}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Especie *</label>
                <select
                  name="idEspecie"
                  value={form.idEspecie}
                  onChange={e => setForm(p => ({ ...p, idEspecie: e.target.value, idRaza: "" }))}
                  disabled={isView} required style={{ ...inp, cursor: "pointer" }}
                >
                  <option value="">Seleccionar…</option>
                  {species.map(s => (
                    <option key={s.idEspecie} value={s.idEspecie}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Raza *</label>
                <select name="idRaza" value={form.idRaza} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccionar…</option>
                  {razasFiltradas.map(b => (
                    <option key={b.idRaza} value={b.idRaza}>{b.nombre || b.descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Tamaño *</label>
                <select name="idTamaño" value={form.idTamaño} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Seleccionar…</option>
                  {sizes.map(s => (
                    <option key={s.idTamaño} value={s.idTamaño}>{s.descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Sexo *</label>
                <select name="sexo" value={form.sexo} onChange={hc} disabled={isView} style={{ ...inp, cursor: "pointer" }}>
                  <option value="M">Macho</option>
                  <option value="H">Hembra</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Colores / Pelaje</label>
                <input name="colores" value={form.colores} onChange={hc} readOnly={isView}
                  style={inp} placeholder="Ej: Negro con blanco" />
              </div>

              <div>
                <label style={lbl}>Fecha de nacimiento</label>
                <input type="date" name="fechaNac" value={form.fechaNac} onChange={hc}
                  readOnly={isView} style={inp} />
              </div>

            </div>

            {error && (
              <div style={{
                marginTop: 14, padding: "10px 14px",
                background: C.redBg, border: "1px solid #f7c1c1",
                borderRadius: 9, fontSize: 13, color: C.red,
              }}>
                ⚠️ {error}
              </div>
            )}

            {!isView && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={onClose} style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.white,
                  color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}>Cancelar</button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, padding: 12, borderRadius: 10, border: "none",
                  background: loading ? C.muted : C.green800,
                  color: "white", fontWeight: 700, fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                  {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear paciente"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function PetsPage() {
  const [pets,    setPets]    = useState([]);
  const [clients, setClients] = useState([]);
  const [breeds,  setBreeds]  = useState([]);
  const [species, setSpecies] = useState([]);
  const [sizes,   setSizes]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [deleting,setDeleting]= useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes, sRes, szRes] = await Promise.all([
        axios.get("/pets",         { headers: headers() }),
        axios.get("/clients",      { headers: headers() }),
        axios.get("/breeds",       { headers: headers() }),
        axios.get("/species",      { headers: headers() }),
        axios.get("/animal-sizes", { headers: headers() }),
      ]);
      setPets(pRes.data);
      setClients(cRes.data);
      setBreeds(bRes.data);
      setSpecies(sRes.data);
      setSizes(szRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/pet/${modal.data.idMascota}`, { headers: headers() });
      setModal(null); loadData();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  // Navegar al historial clínico preseleccionando esta mascota
  const goToHistorial = (pet) => {
    navigate("/admin/mascotas/historial", { state: { mascota: pet } });
  };

  const filtered = pets.filter(p =>
    `${p.nombre} ${p.Dueño?.nombres} ${p.Dueño?.apellidos}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>
      <PageHeader onNew={() => setModal({ type: "new" })} />

      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>
        {/* Filtros */}
        <div style={{
          padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`,
          background: C.surface, display: "flex", gap: 12,
          alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ flex: "2 1 240px" }}>
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
            {loading ? "Cargando…" : `${filtered.length} paciente${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {["#", "Nombre", "Dueño", "Especie", "Raza", "Tamaño", "Sexo", "Acciones"].map((h, i) => (
                  <th key={h} style={{
                    padding: "11px 16px",
                    fontSize: 10, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    textAlign: i === 7 ? "right" : "left",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
                  Cargando pacientes…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
                  No se encontraron pacientes.
                </td></tr>
              ) : filtered.map((p, i) => (
                <tr
                  key={p.idMascota}
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = C.white}
                >
                  <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{p.idMascota}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text }}>{p.nombre}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                    {p.Dueño ? `${p.Dueño.nombres} ${p.Dueño.apellidos}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                    {p.Breed?.Especie?.nombre || p.Raza?.Especie?.nombre || p.Breed?.Species?.nombre || p.Raza?.Species?.nombre || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                    {p.Breed?.nombre || p.Raza?.descripcion || p.Raza?.nombre || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.AnimalSize?.descripcion
                      ? <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 9px",
                          borderRadius: 20, background: C.green100, color: C.green800,
                        }}>{p.AnimalSize.descripcion}</span>
                      : <span style={{ fontSize: 12, color: C.muted }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "12px 16px" }}><SexBadge sexo={p.sexo} /></td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>

                      {/* ── Acceso directo al historial clínico ── */}
                      <button
                        onClick={() => goToHistorial(p)}
                        title="Ver historial clínico"
                        style={{
                          padding: "6px 12px", borderRadius: 8,
                          border: `1.5px solid ${C.teal}`,
                          background: C.tealBg,
                          color: C.teal, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.tealBg; e.currentTarget.style.color = C.teal; }}
                      >
                        📋 Historial
                      </button>

                      <button onClick={() => setModal({ type: "view", data: p })} style={{
                        padding: "6px 12px", borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.white,
                        color: C.text, fontSize: 12, cursor: "pointer",
                      }}>Ver</button>
                      <button onClick={() => setModal({ type: "edit", data: p })} style={{
                        padding: "6px 12px", borderRadius: 8,
                        border: `1.5px solid ${C.green700}`, background: C.white,
                        color: C.green700, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>Editar</button>
                      <button onClick={() => setModal({ type: "delete", data: p })} style={{
                        padding: "6px 12px", borderRadius: 8,
                        border: `1.5px solid ${C.red}`, background: C.white,
                        color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal?.type === "new" || modal?.type === "edit" || modal?.type === "view") && (
        <PetModal
          mode={modal.type}
          pet={modal.type === "new" ? null : modal.data}
          clients={clients}
          breeds={breeds}
          species={species}
          sizes={sizes}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadData(); }}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="¿Eliminar paciente?"
          message={`Estás por borrar a ${modal.data.nombre} de forma permanente. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}