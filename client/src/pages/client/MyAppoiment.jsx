import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "../../api/axios";

const C = {
  green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9", white: "#ffffff",
  amber: "#b45309", amberBg: "#fef3c7",
  blue: "#185fa5", blueBg: "#e6f1fb",
  red: "#a32d2d", redBg: "#fcebeb",
  purple: "#6d28d9", purpleBg: "#ede9fe",
};

const ESTADO_META = {
  1: { label: "Pendiente",    bg: C.amberBg,   color: C.amber,    dot: "#f59e0b" },
  2: { label: "Confirmada",   bg: C.blueBg,    color: C.blue,     dot: "#3b82f6" },
  3: { label: "Cancelada",    bg: C.redBg,     color: C.red,      dot: "#ef4444" },
  4: { label: "Finalizada",   bg: C.green100,  color: C.green800, dot: C.green700 },
  5: { label: "Reprogramada", bg: C.purpleBg,  color: C.purple,   dot: "#8b5cf6" },
};

const fmtFecha = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

function EstadoBadge({ idEstado }) {
  const m = ESTADO_META[idEstado] || { label: "—", bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: m.bg, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot }} />
      {m.label}
    </span>
  );
}

function CitaCard({ cita }) {
  const [open, setOpen] = useState(false);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const esPasada = new Date(cita.fecha + "T00:00:00") < hoy;
  const isFinalizada = cita.idEstadoCita === 4;

  const detalle = cita.detalles?.[0];
  const servicio = detalle?.PrecioServicio?.Service?.descripcion || cita.TipoCita?.descripcion || "Consulta";
  const vet = cita.Veterinario;
  const ejecutor = detalle?.Ejecutor;
  const nombreProfesional = isFinalizada && ejecutor?.nombre
    ? `${ejecutor.nombre} ${ejecutor.apellido || ""}`.trim()
    : vet ? `${vet.nombres} ${vet.apellidos}` : "Por asignar";

  return (
    <div style={{
      background: C.white, borderRadius: 14,
      border: `1px solid ${open ? C.green200 : C.borderLight}`,
      overflow: "hidden", transition: "border-color 0.15s",
      opacity: cita.idEstadoCita === 3 ? 0.65 : 1,
    }}>
      {/* Cabecera */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left", padding: "16px 18px",
          border: "none", background: open ? "#f4faf0" : C.white,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
          transition: "background 0.15s",
        }}
      >
        {/* Franja de color izquierda */}
        <div style={{
          width: 4, height: 48, borderRadius: 4, flexShrink: 0,
          background: esPasada ? "#cbd5e1" : C.green700,
        }} />

        {/* Mascota + servicio */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cita.Mascota?.nombre || "Mascota"}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: C.surface, color: C.muted, border: `1px solid ${C.borderLight}` }}>
              {servicio}
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            📅 {fmtFecha(cita.fecha)} &nbsp;·&nbsp; 🕒 {cita.hora?.slice(0,5)} hs
          </div>
        </div>

        <EstadoBadge idEstado={cita.idEstadoCita} />
        <span style={{
          fontSize: 11, color: C.muted, marginLeft: 6,
          display: "inline-block", transition: "transform 0.2s",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}>▶</span>
      </button>

      {/* Detalle expandido */}
      {open && (
        <div style={{ padding: "0 18px 18px 36px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div style={{ background: C.surface, borderRadius: 9, padding: "10px 12px", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                {isFinalizada ? "Atendido por" : "Veterinario asignado"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{nombreProfesional}</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 9, padding: "10px 12px", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Tipo de cita</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cita.TipoCita?.descripcion || "—"}</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 9, padding: "10px 12px", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Servicio</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{servicio}</div>
            </div>
          </div>
          {isFinalizada && detalle?.observaciones && (
            <div style={{ background: C.amberBg, border: "1px solid #fde68a", borderRadius: 9, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Nota del profesional</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>{detalle.observaciones}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [allPets,      setAllPets]      = useState([]);
  const [allServices,  setAllServices]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroMascota,  setFiltroMascota]  = useState("todas");
  const [filtroEstado,   setFiltroEstado]   = useState("todos");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      axios.get("/appointments"),
      axios.get("/pets"),
      axios.get("/services"),
    ]).then(([resCitas, resMascotas, resServicios]) => {
      setAppointments(resCitas.data    || []);
      setAllPets(resMascotas.data      || []);
      setAllServices(resServicios.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const hoy = new Date(); hoy.setHours(0,0,0,0);

  const filtered = appointments.filter(c => {
    const okMascota = filtroMascota === "todas" || c.Mascota?.nombre === filtroMascota;
    const okEstado  = filtroEstado  === "todos" || String(c.idEstadoCita) === filtroEstado;
    return okMascota && okEstado;
  });

  const proximas   = filtered.filter(c => new Date(c.fecha + "T00:00:00") >= hoy);
  const anteriores = filtered.filter(c => new Date(c.fecha + "T00:00:00") < hoy);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <p style={{ color: C.muted, fontSize: 14 }}>Cargando tus turnos...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Mis turnos</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
          {appointments.length} turno{appointments.length !== 1 ? "s" : ""} en total
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        background: C.white, borderRadius: 14, padding: "16px 20px",
        border: `1px solid ${C.border}`, display: "flex", gap: 14, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Mascota</label>
          <select value={filtroMascota} onChange={e => setFiltroMascota(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", color: C.text, background: C.white }}>
            <option value="todas">Todas</option>
            {allPets.map(p => <option key={p.idMascota} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", color: C.text, background: C.white }}>
            <option value="todos">Todos</option>
            {Object.entries(ESTADO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {(filtroMascota !== "todas" || filtroEstado !== "todos") && (
          <button onClick={() => { setFiltroMascota("todas"); setFiltroEstado("todos"); }}
            style={{ alignSelf: "flex-end", padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, fontWeight: 600, color: C.muted, cursor: "pointer" }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Próximas */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Próximas visitas</h3>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: C.green100, color: C.green800 }}>
            {proximas.length}
          </span>
        </div>
        {proximas.length > 0
          ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proximas.map(c => <CitaCard key={c.idCita} cita={c} />)}
            </div>
          : <div style={{ background: C.white, borderRadius: 14, padding: "32px 20px", textAlign: "center", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>No tenés turnos programados.</p>
            </div>
        }
      </section>

      {/* Anteriores */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Historial de visitas</h3>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: C.surface, color: C.muted, border: `1px solid ${C.borderLight}` }}>
            {anteriores.length}
          </span>
        </div>
        {anteriores.length > 0
          ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {anteriores.map(c => <CitaCard key={c.idCita} cita={c} />)}
            </div>
          : <div style={{ background: C.white, borderRadius: 14, padding: "32px 20px", textAlign: "center", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>No hay registros de visitas anteriores.</p>
            </div>
        }
      </section>
    </div>
  );
}
