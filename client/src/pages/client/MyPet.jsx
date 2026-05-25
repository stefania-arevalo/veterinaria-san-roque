import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePets } from "../../hooks/usePets";
import { useClinicalHistory } from "../../hooks/useClinicalHistory";

const C = {
  green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97", green50: "#f4faf0",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9", white: "#ffffff",
  red: "#a32d2d", redBg: "#fcebeb",
};

const fmtFecha = (d) => {
  if (!d) return "—";
  
  // Si la fecha ya incluye la "T" (formato ISO), la usamos tal cual. 
  // Si no la incluye (ej: "2024-12-31"), se la agregamos.
  const safeDate = d.includes("T") ? d : `${d}T00:00:00`;
  const dateObj = new Date(safeDate);
  
  // Validamos que la fecha generada sea matemáticamente correcta
  if (isNaN(dateObj.getTime())) return "—";
  
  return dateObj.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
};

function InfoChip({ label, value }) {
  return (
    <div style={{ background: C.surface, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.borderLight}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value || "—"}</div>
    </div>
  );
}

export default function MyPets() {
  const [searchParams]  = useSearchParams();
  const petIdFromUrl    = searchParams.get("id");
  const { pets, getIcon } = usePets();
  const { history, loadHistory } = useClinicalHistory();
  const [selectedPet,  setSelectedPet]  = useState(null);
  const [filterDate,   setFilterDate]   = useState("");
  const [expandedId,   setExpandedId]   = useState(null);

  useEffect(() => {
    if (pets.length === 0) return;
    const target = petIdFromUrl
      ? pets.find(p => Number(p.idMascota) === Number(petIdFromUrl))
      : pets[0];
    if (target) { setSelectedPet(target); loadHistory(target); }
  }, [pets, petIdFromUrl]);

  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    loadHistory(pet);
    setFilterDate("");
    setExpandedId(null);
  };

  const filteredHistory = history.filter(h => {
    if (!filterDate) return true;
    return (h.Cita?.fecha || h.fecha || "") === filterDate;
  });

  const icon = selectedPet ? getIcon(selectedPet.Breed?.Species?.nombre) : "🐾";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, alignItems: "start" }}>

      {/* ── Panel izquierdo: lista ── */}
      <div style={{
        background: C.white, borderRadius: 16, overflow: "hidden",
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Mis mascotas</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{pets.length} registrada{pets.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ padding: "10px" }}>
          {pets.length === 0 ? (
            <div style={{ padding: "24px 10px", textAlign: "center", color: C.muted, fontSize: 13 }}>Sin mascotas registradas.</div>
          ) : pets.map(p => {
            const active = selectedPet?.idMascota === p.idMascota;
            return (
              <button
                key={p.idMascota}
                onClick={() => handleSelectPet(p)}
                style={{
                  width: "100%", textAlign: "left", padding: "12px",
                  borderRadius: 10, border: `1.5px solid ${active ? C.green200 : "transparent"}`,
                  background: active ? C.green100 : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  marginBottom: 4, transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surface; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: active ? C.white : C.surface,
                  border: `1px solid ${active ? C.green200 : C.borderLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {getIcon(p.Breed?.Species?.nombre)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.Breed?.nombre || "Raza mixta"}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel derecho ── */}
      {selectedPet ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Ficha de la mascota */}
          <div style={{
            background: C.white, borderRadius: 16, overflow: "hidden",
            border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.green900}, ${C.green700})`,
              padding: "20px 24px", color: "white",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
              }}>{icon}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedPet.nombre}</h2>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                  {selectedPet.Breed?.Species?.nombre || "Especie"} · {selectedPet.Breed?.nombre || "Raza mixta"}
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <InfoChip label="Nacimiento" value={fmtFecha(selectedPet.fechaNac)} />
              <InfoChip label="Sexo"       value={selectedPet.sexo === "M" ? "Macho" : "Hembra"} />
              <InfoChip label="Tamaño"     value={selectedPet.AnimalSize?.descripcion} />
              <InfoChip label="Colores"    value={selectedPet.colores} />
            </div>
          </div>

          {/* Historial clínico */}
          <div style={{
            background: C.white, borderRadius: 16, overflow: "hidden",
            border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: `1px solid ${C.borderLight}`,
              background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>📋 Historial médico</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                  {filteredHistory.length} registro{filteredHistory.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  style={{
                    padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                    fontSize: 12, outline: "none", color: C.text, background: C.white,
                  }}
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    style={{
                      padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.white, fontSize: 12, color: C.muted, cursor: "pointer", fontWeight: 600,
                    }}
                  >Limpiar</button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
                  {filterDate ? "No hay registros para esa fecha." : "No hay registros médicos todavía."}
                </p>
              </div>
            ) : (
              <div style={{ padding: "12px" }}>
                {filteredHistory.map((h, i) => {
                  const isOpen = expandedId === h.idHistorial;
                  const fecha  = h.Cita?.fecha || h.fecha || h.createdAt;
                  return (
                    <div
                      key={h.idHistorial}
                      style={{
                        border: `1px solid ${isOpen ? C.green200 : C.borderLight}`,
                        borderRadius: 12, marginBottom: 8, overflow: "hidden",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {/* Cabecera del registro */}
                      <button
                        onClick={() => setExpandedId(isOpen ? null : h.idHistorial)}
                        style={{
                          width: "100%", textAlign: "left", padding: "14px 18px",
                          border: "none", background: isOpen ? C.green50 : C.white,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{
                          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                          background: isOpen ? C.green100 : C.surface,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, border: `1px solid ${isOpen ? C.green200 : C.borderLight}`,
                        }}>🩺</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                            {h.diagnostico || "Sin diagnóstico registrado"}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                            {fmtFecha(fecha)}
                            {h.Cita?.Veterinario && ` · Dr/a. ${h.Cita.Veterinario.nombres} ${h.Cita.Veterinario.apellidos}`}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 12, color: C.muted, transition: "transform 0.2s",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block",
                        }}>▶</span>
                      </button>

                      {/* Cuerpo expandido */}
                      {isOpen && (
                        <div style={{ padding: "0 18px 18px", background: C.white, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <InfoChip label="Síntomas"    value={h.sintomas} />
                          <InfoChip label="Motivo"      value={h.motivo} />
                          <InfoChip label="Diagnóstico" value={h.diagnostico} />
                          {h.observaciones && (
                            <div style={{ gridColumn: "1 / -1", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Observaciones</div>
                              <div style={{ fontSize: 13, color: "#78350f" }}>{h.observaciones}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: C.white, borderRadius: 16, padding: "60px 40px",
          border: `1px solid ${C.border}`, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🐾</div>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Seleccioná una mascota para ver su ficha.</p>
        </div>
      )}
    </div>
  );
}