import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Colores del sistema
const C = {
  bg: "#f0f4f1", white: "#ffffff",
  green900: "#1a3d28", green800: "#1f5c38", green700: "#2d6a4f",
  green100: "#eaf3de", green200: "#c0dd97",
  border: "#d1ddd4",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9",
  amber: "#ba7517", amberBg: "#faeeda", amberBorder: "#fde68a",
  red: "#a32d2d", redBg: "#fcebeb", redBorder: "#f7c1c1",
  teal: "#0f766e", tealBg: "#ccfbf1",
  blue: "#185fa5", blueBg: "#e6f1fb", blueBorder: "#b5d4f4",
};

// Formateador seguro de fechas para evitar "Invalid Date"
const fmtFecha = (dateInput) => {
  if (!dateInput) return "—";
  try {
    // Si ya viene como un ISO string completo o fecha de Sequelize
    const dateStr = typeof dateInput === "string" && !dateInput.includes("T") 
      ? `${dateInput}T00:00:00` 
      : dateInput;
      
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "—";
  }
};

// Agrega meses a una fecha de forma segura, devuelve Date
function addMeses(isoStr, meses) {
  const dateStr = typeof isoStr === "string" && !isoStr.includes("T") 
    ? `${isoStr}T00:00:00` 
    : isoStr;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + meses);
  return d;
}

// Estado calculado de una línea del carnet
function calcularEstado(filaCarnet) {
  const { dosisAplicadas, cantidadDosisEsquema, proximoRefuerzo } = filaCarnet;
  const hoy = new Date();
  const semanasAntes = 4; // avisar con 4 semanas de anticipación

  if (dosisAplicadas === 0) return { key: "sinIniciar", label: "Sin iniciar", color: C.muted, bg: C.surface };

  if (dosisAplicadas < cantidadDosisEsquema) {
    return { key: "incompleta", label: `Dosis ${dosisAplicadas}/${cantidadDosisEsquema}`, color: C.blue, bg: C.blueBg };
  }

  // Esquema primario completo → revisar refuerzo
  if (!proximoRefuerzo) return { key: "alDia", label: "Al día", color: C.teal, bg: C.tealBg };

  const vencida  = proximoRefuerzo < hoy;
  const proxima  = !vencida && (proximoRefuerzo - hoy) / (1000 * 60 * 60 * 24) <= semanasAntes * 7;

  if (vencida)  return { key: "vencida",    label: "Refuerzo vencido",  color: C.red,    bg: C.redBg   };
  if (proxima)  return { key: "proxima",    label: "Refuerzo próximo",  color: C.amber, bg: C.amberBg };
  return              { key: "alDia",       label: "Al día",             color: C.teal,  bg: C.tealBg  };
}

export function CarnetVacunal({ mascota, vacunas = [], aplicadas = [] }) {
  const carnetRef = useRef(null);
  const [exportando, setExportando] = useState(false);

  // Especie de la mascota (para filtrar vacunas aplicables)
  const idEspecie = mascota?.Raza?.idEspecie ?? mascota?.idEspecie ?? null;

  // Vacunas que aplican a esta mascota (idEspecie null = universal)
  const vacunasAplicables = vacunas.filter(
    (v) => v.idEspecie == null || Number(v.idEspecie) === Number(idEspecie)
  );

  // Construir filas del carnet
  const filas = vacunasAplicables.map((vac) => {
    const idVac = vac.idProducto; // PK de VACUNAS es idProducto

    // Todas las aplicaciones de esta vacuna a esta mascota, ordenadas cronológicamente
    const misAplicaciones = aplicadas
      .filter((a) => Number(a.Vacuna?.idProducto ?? a.idVacuna) === Number(idVac))
      .sort((a, b) =>
        new Date(a.fechaAplicacion) - new Date(b.fechaAplicacion)
      );

    const dosisAplicadas        = misAplicaciones.length;
    const cantidadDosisEsquema  = vac.cantidadDosisEsquema  || 1;
    const intervalo             = vac.intervaloReaplicacionMeses || 12;
    const ultimaAplicacion      = misAplicaciones.at(-1) || null;

    // Próximo refuerzo: solo si esquema primario completo
    let proximoRefuerzo = null;
    if (dosisAplicadas >= cantidadDosisEsquema && ultimaAplicacion) {
      proximoRefuerzo = addMeses(ultimaAplicacion.fechaAplicacion, intervalo);
    }

    // Próxima dosis del esquema primario: si está incompleto (~1 mes entre dosis)
    let proximaDosisEsquema = null;
    if (dosisAplicadas > 0 && dosisAplicadas < cantidadDosisEsquema && ultimaAplicacion) {
      proximaDosisEsquema = addMeses(ultimaAplicacion.fechaAplicacion, 1);
    }

    return {
      vac,
      nombre: vac.Producto?.nombre || `Vacuna #${idVac}`,
      enfermedadPreventiva: vac.enfermedadPreventiva,
      volumenDosis: vac.volumenDosis,
      cantidadDosisEsquema,
      intervalo,
      dosisAplicadas,
      ultimaAplicacion,
      proximoRefuerzo,
      proximaDosisEsquema,
      misAplicaciones,
    };
  });

  // Resumen de estados
  const total     = filas.length;
  const alDia     = filas.filter((f) => calcularEstado(f).key === "alDia").length;
  const problemas = filas.filter((f) => ["vencida", "proxima", "incompleta", "sinIniciar"].includes(calcularEstado(f).key)).length;

  // Exportar PDF
  const exportarPDF = async () => {
    if (!carnetRef.current) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(carnetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      const pageH = pdf.internal.pageSize.getHeight();
      if (pdfH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      } else {
        let y = 0;
        while (y < pdfH) {
          pdf.addImage(imgData, "PNG", 0, -y, pdfW, pdfH);
          y += pageH;
          if (y < pdfH) pdf.addPage();
        }
      }

      pdf.save(`carnet_vacunal_${mascota?.nombre || "mascota"}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ── Encabezado del carnet con botón exportar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Carnet de Vacunación</div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {alDia} al día · {problemas} requieren atención · {total} vacunas en esquema
            </div>
          </div>
        </div>
        <button
          onClick={exportarPDF}
          disabled={exportando}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 8,
            border: `1px solid ${C.green700}`,
            background: exportando ? C.surface : C.green700,
            color: exportando ? C.muted : "white",
            cursor: exportando ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 13,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {exportando ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      {/* ── Contenido imprimible ── */}
      <div
        ref={carnetRef}
        style={{
          background: "white",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header del documento */}
        <div style={{
          background: C.green900, color: "white",
          padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Clínica Veterinaria San Roque
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Carnet de Vacunación</h2>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              Emitido: {fmtFecha(new Date().toISOString().slice(0, 10))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>
              {mascota?.Raza?.Especie?.nombre?.toLowerCase().includes("gato") ? "🐱"
                : mascota?.Raza?.Especie?.nombre?.toLowerCase().includes("ave") ? "🐦"
                : "🐶"}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{mascota?.nombre}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {mascota?.Raza?.Especie?.nombre || "—"} · {mascota?.Raza?.nombre || "Sin raza"}
            </div>
          </div>
        </div>

        {/* Datos del paciente actualizados con Sequelize */}
        <div style={{
          padding: "14px 24px",
          background: C.green100,
          borderBottom: `1px solid ${C.green200}`,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12,
        }}>
          {[
            ["Paciente",       mascota?.nombre],
            ["Propietario",    mascota?.Dueño ? `${mascota.Dueño.nombres} ${mascota.Dueño.apellidos}` : "—"],
            ["Especie / Raza", `${mascota?.Raza?.Especie?.nombre || "—"} / ${mascota?.Raza?.nombre || "—"}`],
            ["Nacimiento",     fmtFecha(mascota?.fechaNac)],
            ["Tamaño",         mascota?.AnimalSize?.descripcion || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Resumen visual */}
        <div style={{
          padding: "12px 24px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          {[
            { label: "Al día",            count: filas.filter(f => calcularEstado(f).key === "alDia").length,     color: C.teal,  bg: C.tealBg },
            { label: "Refuerzo próximo",    count: filas.filter(f => calcularEstado(f).key === "proxima").length,    color: C.amber, bg: C.amberBg },
            { label: "Vencidas",            count: filas.filter(f => calcularEstado(f).key === "vencida").length,    color: C.red,   bg: C.redBg },
            { label: "Incompletas",         count: filas.filter(f => calcularEstado(f).key === "incompleta").length, color: C.blue,  bg: C.blueBg },
            { label: "Sin iniciar",         count: filas.filter(f => calcularEstado(f).key === "sinIniciar").length, color: C.muted, bg: C.surface },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: bg, border: `1px solid ${color}33` }}>
              <span style={{ fontSize: 18, fontWeight: 700, color }}>{count}</span>
              <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabla de vacunas */}
        <div style={{ padding: "0 0 8px" }}>
          {filas.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
              No hay vacunas configuradas para esta especie.
            </div>
          ) : filas.map((fila, idx) => {
            const est = calcularEstado(fila);
            const hayAplicaciones = fila.misAplicaciones.length > 0;

            return (
              <div key={fila.vac.idProducto} style={{
                padding: "14px 24px",
                borderBottom: idx < filas.length - 1 ? `1px solid ${C.border}` : "none",
                background: idx % 2 === 0 ? "white" : C.surface,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>

                  {/* Indicador de estado */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: est.color, flexShrink: 0, marginTop: 5,
                  }} />

                  {/* Nombre y enfermedad */}
                  <div style={{ flex: "1 1 180px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{fila.nombre}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      Previene: {fila.enfermedadPreventiva}
                    </div>
                    {fila.volumenDosis && (
                      <div style={{ fontSize: 11, color: C.muted }}>Volumen: {fila.volumenDosis}</div>
                    )}
                  </div>

                  {/* Progreso del esquema primario */}
                  <div style={{ flex: "0 0 120px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      Esquema primario
                    </div>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      {Array.from({ length: fila.cantidadDosisEsquema }).map((_, i) => (
                        <div key={i} style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: i < fila.dosisAplicadas ? C.green700 : C.surface,
                          border: `2px solid ${i < fila.dosisAplicadas ? C.green700 : C.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: "white", fontWeight: 700,
                        }}>
                          {i < fila.dosisAplicadas ? "✓" : ""}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      {fila.dosisAplicadas}/{fila.cantidadDosisEsquema} dosis
                    </div>
                  </div>

                  {/* Última aplicación */}
                  <div style={{ flex: "0 0 110px" }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      Última dosis
                    </div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                      {fila.ultimaAplicacion ? fmtFecha(fila.ultimaAplicacion.fechaAplicacion) : "—"}
                    </div>
                  </div>

                  {/* Próximo refuerzo o próxima dosis */}
                  <div style={{ flex: "0 0 130px" }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      {fila.dosisAplicadas < fila.cantidadDosisEsquema ? "Próxima dosis" : "Próximo refuerzo"}
                    </div>
                    {fila.proximoRefuerzo ? (
                      <div style={{ fontSize: 13, fontWeight: 600, color: est.color }}>
                        {fmtFecha(fila.proximoRefuerzo)}
                      </div>
                    ) : fila.proximaDosisEsquema ? (
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>
                        ~{fmtFecha(fila.proximaDosisEsquema)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: C.muted }}>
                        {fila.dosisAplicadas === 0 ? "Pendiente" : `c/${fila.intervalo} meses`}
                      </div>
                    )}
                  </div>

                  {/* Badge de estado */}
                  <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 20, background: est.bg, color: est.color,
                      border: `1px solid ${est.color}33`,
                      whiteSpace: "nowrap",
                    }}>
                      {est.label}
                    </span>
                  </div>
                </div>

                {/* Historial detallado */}
                {hayAplicaciones && (
                  <div style={{ marginTop: 10, marginLeft: 24, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {fila.misAplicaciones.map((a, i) => (
                      <span key={a.idVacunaAplicada ?? i} style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                        background: C.green100, color: C.green800,
                        border: `0.5px solid ${C.green200}`,
                      }}>
                        #{i + 1} · {fmtFecha(a.fechaAplicacion)} · {a.dosis || "Dosis Única"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px",
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 11, color: C.muted,
        }}>
          <span>Clínica Veterinaria San Roque — Sistema de Gestión</span>
          <span>Generado el {fmtFecha(new Date().toISOString().slice(0, 10))}</span>
        </div>
      </div>
    </div>
  );
}