import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePets } from "../../hooks/usePets";
import { useAppointments } from "../../hooks/useAppointments";

const C = {
  green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97", green50: "#f4faf0",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9",
  white: "#ffffff", amber: "#b45309", amberBg: "#fef3c7",
  blue: "#185fa5", blueBg: "#e6f1fb",
};

const ESTADO_META = {
  1: { label: "Pendiente",  bg: C.amberBg,  color: C.amber,    dot: "#f59e0b" },
  2: { label: "Confirmada", bg: C.blueBg,   color: C.blue,     dot: "#3b82f6" },
  3: { label: "Cancelada",  bg: "#fee2e2",  color: "#991b1b",  dot: "#ef4444" },
  4: { label: "Finalizada", bg: C.green100, color: C.green800, dot: C.green700 },
  5: { label: "Reprogramada", bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
};

export default function ClientDashboard() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { pets, getIcon }   = usePets();
  const { appointments }    = useAppointments();

  const hoy    = new Date(); hoy.setHours(0,0,0,0);
  const proximas = appointments
    .filter(a => new Date(a.fecha + "T00:00:00") >= hoy && a.idEstadoCita !== 3)
    .sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  const nextApp = proximas[0] || null;

  const fmtFecha = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("es-AR",
    { weekday: "long", day: "numeric", month: "long" });

  const nombre = user?.nombres || user?.usuario || "Cliente";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Bienvenida ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green900}, ${C.green700})`,
        borderRadius: 20, padding: "28px 32px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 8px 24px rgba(26,61,40,0.18)",
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Panel de inicio</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>¡Hola, {nombre}! 👋</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, opacity: 0.8 }}>
            {pets.length > 0
              ? `Tenés ${pets.length} mascota${pets.length > 1 ? "s" : ""} registrada${pets.length > 1 ? "s" : ""}.`
              : "Todavía no tenés mascotas registradas."}
          </p>
        </div>
        <div style={{ fontSize: 52, opacity: 0.25 }}>🐾</div>
      </div>

      {/* ── Grid principal ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Próximo turno */}
        <div style={{
          background: C.white, borderRadius: 16, padding: "24px",
          border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📅 Próximo turno
            </div>
            <button onClick={() => navigate("/cliente/turnos")} style={{
              fontSize: 11, fontWeight: 600, color: C.green800, background: C.green100,
              border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer",
            }}>Ver todos</button>
          </div>

          {nextApp ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: C.green100, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 22, flexShrink: 0,
                }}>
                  {getIcon(nextApp.Mascota?.Breed?.Species?.nombre)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{nextApp.Mascota?.nombre}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{nextApp.TipoCita?.descripcion || "Consulta"}</div>
                </div>
                {(() => {
                  const m = ESTADO_META[nextApp.idEstadoCita] || ESTADO_META[1];
                  return (
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: m.bg, color: m.color }}>
                      {m.label}
                    </span>
                  );
                })()}
              </div>
              <div style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Fecha</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{fmtFecha(nextApp.fecha)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Hora</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{nextApp.hora?.slice(0,5)} hs</div>
                </div>
              </div>
              {proximas.length > 1 && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: C.muted }}>
                  + {proximas.length - 1} turno{proximas.length - 1 > 1 ? "s" : ""} más programado{proximas.length - 1 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No tenés turnos pendientes.</p>
            </div>
          )}
        </div>

        {/* Mis mascotas */}
        <div style={{
          background: C.white, borderRadius: 16, padding: "24px",
          border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🐾 Mis mascotas
            </div>
            <button onClick={() => navigate("/cliente/mascotas")} style={{
              fontSize: 11, fontWeight: 600, color: C.green800, background: C.green100,
              border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer",
            }}>Ver historial</button>
          </div>

          {pets.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pets.map(pet => (
                <div
                  key={pet.idMascota}
                  onClick={() => navigate(`/cliente/mascotas?id=${pet.idMascota}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${C.borderLight}`,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.green200; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = C.borderLight; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: C.green100, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20, flexShrink: 0,
                    border: `1px solid ${C.green200}`,
                  }}>
                    {getIcon(pet.Breed?.Species?.nombre)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{pet.nombre}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{pet.Breed?.nombre || "Raza mixta"} · {pet.sexo === "M" ? "Macho" : "Hembra"}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>→</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🐶</div>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No tenés mascotas registradas.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { icon: "🐾", label: "Mis mascotas",   sub: "Fichas e historiales", path: "/cliente/mascotas", color: C.green100,  accent: C.green800 },
          { icon: "📅", label: "Mis turnos",     sub: "Próximas y pasadas",   path: "/cliente/turnos",  color: C.blueBg,   accent: C.blue },
          { icon: "👤", label: "Mi perfil",      sub: "Datos personales",     path: "/cliente/perfil",  color: C.amberBg,  accent: C.amber },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: "20px", cursor: "pointer", textAlign: "left",
              transition: "all 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = C.green200; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>
              {item.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: item.accent, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{item.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
