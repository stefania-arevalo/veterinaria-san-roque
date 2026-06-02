import NewPatientModal from "../../components/forms/NewPatientModal";
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "../../api/axios";
import { VET_COLORS } from "../../layouts/AdminLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { verificarYEnviarRecordatorios } from '../../services/recordatorioTurnos';

const token    = () => localStorage.getItem("accessToken");
const headers  = () => ({ Authorization: `Bearer ${token()}` });

const getUserFromToken = () => {
  try {
    const t = token();
    if (!t) return null;
    const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(b64));
  } catch { return null; }
};

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ── Estados sincronizados con tu BD ──────────────────────────────
// CITA:    1 Pendiente | 2 Confirmada | 3 Cancelada | 4 Finalizada | 5 Reprogramada
// SERVICIO:1 Pendiente | 2 En curso   | 3 Realizado | 5 Finalizado | 6 Cancelado | 7 Reprogramado
const CITA_ESTADOS = {
  1: { label: "Pendiente",   color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  2: { label: "Confirmada",  color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  3: { label: "Cancelada",   color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
  4: { label: "Finalizada",  color: "#166534", bg: "#dcfce7", dot: "#16a34a" },
  5: { label: "Reprogramada",color: "#ea580c", bg: "#fff7ed", dot: "#f97316" }, 
};

const SERV_ESTADOS = {
  1: { label: "Pendiente",          color: "#b45309", bg: "#fef3c7" },
  2: { label: "En curso",           color: "#1d4ed8", bg: "#dbeafe" },
  3: { label: "Realizado/Por cobrar", color: "#7c3aed", bg: "#ede9fe" },
  5: { label: "Finalizado/Pagado",  color: "#166534", bg: "#dcfce7" },
  6: { label: "Cancelado",          color: "#dc2626", bg: "#fee2e2" },
  7: { label: "Reprogramado",       color: "#ea580c", bg: "#fff7ed" }, 
};

// Transiciones permitidas al editar la cita
// 5 (Reprogramada) queda vacía porque es un estado final. La cita "muere" ahí y se crea una nueva en el calendario.
const ESTADO_TRANSITIONS = {
  1: [2, 3],
  2: [1, 3],
  3: [],
  4: [],
  5: [], 
};

// ── COMPONENTE AGENDA VISUAL ──────────────────────────────────────────
const AgendaVisual = ({ staff, appointments, fechaSeleccionada, onEditCita }) => {
  const [horarios, setHorarios] = useState([]);
  const [horariosVet, setHorariosVet] = useState({});
  const cancelRef = useRef(false);

  const personalVisible = useMemo(() => staff.slice(0, 6), [staff]);

  useEffect(() => {
    if (!fechaSeleccionada) return;
    cancelRef.current = false;   // nueva fecha → fetch válido

    const partes   = fechaSeleccionada.split('-');
    const fecha    = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    const dias     = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    const diaSemana = dias[fecha.getDay()];

    // --- FALLBACK en caso de que el backend no tenga horarios ---
    const fallbackClinica = (dia) => {
      if (dia === 'Sabado')
        return [{ horaInicio: '10:00', horaFin: '12:00', turno: 'Mañana' }];
      if (['Lunes','Martes','Miercoles','Jueves','Viernes'].includes(dia))
        return [
          { horaInicio: '09:00', horaFin: '12:30', turno: 'Mañana' },
          { horaInicio: '17:30', horaFin: '21:00', turno: 'Tarde'  },
        ];
      return [];
    };

    // Un solo Promise.all para el horario de la clínica + el de cada persona.
    // Así todos los datos llegan juntos y no hay parpadeo.
    Promise.all([
      // Horario general de la clínica
      axios.get(`/schedules?diaSemana=${encodeURIComponent(diaSemana)}`, { headers: headers() })
        .then(r => r.data || [])
        .catch(() => fallbackClinica(diaSemana)),

      // Horario individual de cada persona visible
      // Si el backend no tiene tabla para ese personal, devuelve [] → el
      // componente usa el horario de la clínica como fallback automático.
      ...personalVisible.map(persona =>
        axios.get(
          `/vetschedules?diaSemana=${encodeURIComponent(diaSemana)}&idPersonal=${persona.idPersonal}`,
          { headers: headers() }
        )
          .then(r => ({ idPersonal: persona.idPersonal, horarios: r.data || [] }))
          .catch(() => ({ idPersonal: persona.idPersonal, horarios: [] }))
      ),
    ]).then(([horariosClinica, ...vetResults]) => {
      if (cancelRef.current) return;   // llegó un fetch de una fecha anterior — descartamos
      setHorarios(horariosClinica);
      const map = {};
      vetResults.forEach(r => { map[r.idPersonal] = r.horarios; });
      setHorariosVet(map);
    });

    return () => { cancelRef.current = true; };   // cleanup: si cambia la fecha antes de responder
  }, [fechaSeleccionada, personalVisible]);

  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.substring(0, 5).split(':').map(Number);
    return h * 60 + m;
  };
  const toHHMM = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const SLOT = 30;
  const rangoInicio = horarios.length > 0
    ? Math.min(...horarios.map(h => toMins(h.horaInicio)))
    : toMins('09:00');
  const rangoFin = horarios.length > 0
    ? Math.max(...horarios.map(h => toMins(h.horaFin)))
    : toMins('21:00');

  const slots = [];
  for (let m = rangoInicio; m < rangoFin; m += SLOT) slots.push(m);

  const esAbierto = (slotMins) =>
    horarios.some(h => slotMins >= toMins(h.horaInicio) && slotMins < toMins(h.horaFin));

  const esAbiertoParaPersona = (slotMins, idPersonal) => {
    const horariosPersona = horariosVet[idPersonal];
    if (!horariosPersona || horariosPersona.length === 0) {
      // Sin tabla propia → usamos horario general de la clínica
      return esAbierto(slotMins);
    }
    return horariosPersona.some(h => slotMins >= toMins(h.horaInicio) && slotMins < toMins(h.horaFin));
  };

  const getCitasEnSlot = (persona, slotMins) => {
    const resultado = [];
    appointments
        .filter(app => app.fecha === fechaSeleccionada)
        .forEach(app => {
            const appMins = toMins(app.hora);
 
            // La cita pertenece a este slot si su hora cae dentro del rango
            // [slotMins, slotMins + SLOT)
            if (appMins < slotMins || appMins >= slotMins + SLOT) return;
 
            const esVetDeCita  = Number(app.idVeterinario) === Number(persona.idPersonal);
            const misServicios = (app.detalles || []).filter(
                d => Number(d.idPersonalRealiza) === Number(persona.idPersonal)
            );
 
            // Mostrar si esta persona es el vet anfitrión O tiene algún servicio asignado
            if (esVetDeCita || misServicios.length > 0) {
                resultado.push({ app, misServicios });
            }
        });
    return resultado;
  };

  const TIPO_COLOR = {
    1: { border: '#378ADD', bg: '#E6F1FB', tagBg: '#B5D4F4', tagColor: '#0C447C', label: 'Control'    },
    2: { border: '#E24B4A', bg: '#FCEBEB', tagBg: '#F7C1C1', tagColor: '#791F1F', label: 'Emergencia' },
    3: { border: '#639922', bg: '#EAF3DE', tagBg: '#C0DD97', tagColor: '#3B6D11', label: 'General'    },
  };

  const AVATAR_COLOR = {
    1: { bg: '#E6F1FB', color: '#0C447C' },
    2: { bg: '#EAF3DE', color: '#3B6D11' },
    3: { bg: '#FAEEDA', color: '#854F0B' },
    4: { bg: '#EEEDFE', color: '#3C3489' },
  };
  const getAvatarColor = (p) => {
    const rol = p.User?.Role?.idRol ?? p.User?.idRol ?? 99;
    return AVATAR_COLOR[rol] || { bg: '#F1EFE8', color: '#5F5E5A' };
  };
  const getNombre = (p) =>
    `${p.nombres || p.Staff?.nombres || '?'} ${p.apellidos || p.Staff?.apellidos || ''}`.trim();
  const getInicial = (p) => (p.nombres || p.Staff?.nombres || '?')[0].toUpperCase();
  const getRol    = (p) => p.User?.Role?.descripcion || '—';

  const gridCols = `56px repeat(${personalVisible.length}, minmax(0, 1fr))`;

  const partes = fechaSeleccionada ? fechaSeleccionada.split('-') : [];
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const diaNombre = partes.length === 3
    ? diasSemana[new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2])).getDay()]
    : '';

  const cerrado = horarios.length === 0;
  const totalCitasDia = appointments.filter(a => a.fecha === fechaSeleccionada).length;

  return (
    <>
      {/* ── Leyenda y resumen ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(TIPO_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: v.border }} />
              {v.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#e2e8f0' }} />
            Clínica cerrada
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f0fdf4', border: '1.5px solid #16a34a' }} />
            Fuera del horario del profesional
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          {diaNombre} · {totalCitasDia} cita{totalCitasDia !== 1 ? 's' : ''} ·{' '}
          {horarios.length > 0
            ? horarios.map(h => `${h.turno || ''} ${h.horaInicio?.substring(0,5)}–${h.horaFin?.substring(0,5)}`).join(' / ')
            : 'Sin horario'}
        </div>
      </div>


      {cerrado ? (
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Clínica cerrada</div>
          <div style={{ fontSize: 13 }}>No hay atención programada para este día.</div>
        </div>
      ) : (
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', maxHeight: '70vh', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 0 }}>

              {/* Headers sticky */}
              <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0', padding: '10px 4px', minWidth: 56,
              }} />

              {personalVisible.map((persona, i) => {
                const av = getAvatarColor(persona);
                const tieneHorarioPropio = (horariosVet[persona.idPersonal] || []).length > 0;
                return (
                  <div key={persona.idPersonal} style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: '#f8fafc',
                    borderBottom: '1.5px solid #e2e8f0',
                    borderRight: i < personalVisible.length - 1 ? '1px solid #e2e8f0' : 'none',
                    padding: '10px 8px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: av.bg, color: av.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, margin: '0 auto 5px',
                    }}>
                      {getInicial(persona)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getNombre(persona).split(' ')[0]} {getNombre(persona).split(' ')[1] || ''}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{getRol(persona)}</div>
                    {/* Indicador de si usa horario propio o de la clínica */}
                    <div style={{
                      fontSize: 9, marginTop: 3, fontWeight: 600,
                      color: tieneHorarioPropio ? '#166534' : '#94a3b8',
                    }}>
                      {tieneHorarioPropio ? '🗓 horario propio' : '🏥 horario clínica'}
                    </div>
                  </div>
                );
              })}

              {/* Filas de slots */}
              {slots.map((slotMins) => {
                const abiertoClinica = esAbierto(slotMins);
                const horaStr  = toHHMM(slotMins);
                const esCierre = !abiertoClinica && slotMins > rangoInicio && slotMins < rangoFin;

                return (
                  <React.Fragment key={slotMins}>
                    {/* Celda hora */}
                    <div style={{
                      borderTop: '1px solid #f1f5f9',
                      borderRight: '1px solid #e2e8f0',
                      background: abiertoClinica ? 'white' : '#f8fafc',
                      padding: '6px 4px 0',
                      textAlign: 'right',
                      fontSize: 10, fontWeight: 600,
                      color: abiertoClinica ? '#64748b' : '#cbd5e1',
                      minHeight: 48,
                    }}>
                      {horaStr}
                    </div>

                    {/* Celdas de personal */}
                    {personalVisible.map((persona, i) => {
                      // La clínica define si el slot existe; el vet define si está disponible
                      const abiertoPersona = abiertoClinica && esAbiertoParaPersona(slotMins, persona.idPersonal);
                      const fueraDeHorarioPersonal = abiertoClinica && !abiertoPersona;
                      const citasSlot = abiertoPersona ? getCitasEnSlot(persona, slotMins) : [];

                      return (
                        <div key={`${slotMins}-${persona.idPersonal}`} style={{
                          borderTop: '1px solid #f1f5f9',
                          borderRight: i < personalVisible.length - 1 ? '1px solid #eff3f8' : 'none',
                          // Verde muy suave si la clínica está abierta pero el vet no trabaja en ese slot
                          background: fueraDeHorarioPersonal ? '#f0fdf4' : abiertoClinica ? 'white' : '#f8fafc',
                          padding: abiertoClinica ? '4px' : '0',
                          minHeight: 48,
                          position: 'relative',
                        }}>
                          {!abiertoClinica && esCierre && i === 0 && (
                            <div style={{
                              position: 'absolute', top: '50%', left: 4,
                              transform: 'translateY(-50%)',
                              fontSize: 9, color: '#cbd5e1', fontWeight: 600, whiteSpace: 'nowrap',
                            }}>
                              sin atención
                            </div>
                          )}
                          {fueraDeHorarioPersonal && (
                            <div style={{
                              position: 'absolute', top: '50%', left: '50%',
                              transform: 'translate(-50%,-50%)',
                              fontSize: 9, color: '#86efac', fontWeight: 600, whiteSpace: 'nowrap',
                            }}>
                              —
                            </div>
                          )}
                          {abiertoPersona && citasSlot.map(({ app, misServicios }) => {
                            const cancelada = app.idEstadoCita === 3;
                            const tc  = TIPO_COLOR[app.idTipoCita] || TIPO_COLOR[3];
                            const est = CITA_ESTADOS[app.idEstadoCita] || CITA_ESTADOS[1];
                            return (
                              <div
                                key={app.idCita}
                                onClick={() => onEditCita(app)}
                                style={{
                                  background: cancelada ? '#f9fafb' : tc.bg,
                                  borderLeft: `3px solid ${cancelada ? '#ef4444' : tc.border}`,
                                  borderRadius: 6, padding: '5px 7px', marginBottom: 3,
                                  cursor: 'pointer',
                                  opacity: cancelada ? 0.6 : 1,
                                  fontSize: 11,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                  <div style={{ fontWeight: 600, color: '#166534', lineHeight: 1.3 }}>
                                    {app.Mascota?.nombre || '—'}
                                  </div>
                                  <span style={{
                                    background: cancelada ? '#fecaca' : est.bg,
                                    color: cancelada ? '#991b1b' : est.color,
                                    fontSize: 9, fontWeight: 700,
                                    padding: '1px 5px', borderRadius: 4, marginLeft: 4, whiteSpace: 'nowrap',
                                  }}>
                                    {cancelada ? '🚫 ANULADA' : est.label}
                                  </span>
                                </div>
                                {misServicios.length > 0 ? (
                                  misServicios.map(d => (
                                    <div key={d.idDetalle} style={{ color: '#475569', fontSize: 10, lineHeight: 1.3 }}>
                                      {d.PrecioServicio?.Service?.descripcion || `Serv. #${d.idDetalle}`}
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ color: '#94a3b8', fontSize: 10, fontStyle: 'italic' }}>Responsable</div>
                                )}
                                <span style={{
                                  display: 'inline-block', marginTop: 2,
                                  background: tc.tagBg, color: tc.tagColor,
                                  fontSize: 9, fontWeight: 700,
                                  padding: '1px 5px', borderRadius: 4,
                                }}>
                                  {app.TipoCita?.descripcion || tc.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


// ── SlotPickerModal — disponibilidad por persona ──────────────────
// Muestra una grilla por fecha con todos los vets + staff.
// Cada columna es una persona, cada fila es un slot de 30min.
// Al hacer clic en un slot libre, pre-llena el AppointmentModal.
function SlotPickerModal({ fecha: fechaInicial, vets, staff, appointments, onClose, onSelect }) {
  const [fecha, setFecha] = useState(fechaInicial || new Date().toLocaleDateString("en-CA"));
  const [horarios, setHorarios] = useState([]);
  const [horariosPersonal, setHorariosPersonal] = useState({});
  const [cargando, setCargando] = useState(false);

  // Unión de vets + resto del staff sin duplicados
  const todosElPersonal = [
    ...vets,
    ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal)),
  ];

  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.toString().substring(0, 5).split(":").map(Number);
    return h * 60 + m;
  };
  const toHHMM = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const getDia = (fechaStr) => {
    const [y, mo, d] = fechaStr.split("-");
    return ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][
      new Date(+y, +mo - 1, +d).getDay()
    ];
  };

  useEffect(() => {
    if (!fecha) return;
    setCargando(true);
    const dia = getDia(fecha);

    Promise.all([
      // Horario general de la clínica
      axios.get(`/schedules?diaSemana=${encodeURIComponent(dia)}`, { headers: headers() })
        .then(r => r.data || [])
        .catch(() => []),
      // Horario individual de cada persona
      ...todosElPersonal.map(p =>
        axios.get(`/vetschedules?diaSemana=${encodeURIComponent(dia)}&idPersonal=${p.idPersonal}`, { headers: headers() })
          .then(r => ({ idPersonal: p.idPersonal, hs: r.data || [] }))
          .catch(() => ({ idPersonal: p.idPersonal, hs: [] }))
      ),
    ]).then(([horariosClinica, ...personaResults]) => {
      setHorarios(horariosClinica);
      const map = {};
      personaResults.forEach(r => { map[r.idPersonal] = r.hs; });
      setHorariosPersonal(map);
    }).finally(() => setCargando(false));
  }, [fecha]);

  const rangoInicio = horarios.length > 0
    ? Math.min(...horarios.map(h => toMins(h.horaInicio))) : toMins("09:00");
  const rangoFin = horarios.length > 0
    ? Math.max(...horarios.map(h => toMins(h.horaFin))) : toMins("21:00");

  const slots = [];
  for (let m = rangoInicio; m < rangoFin; m += 30) slots.push(m);

  // ¿Está abierta la clínica en este slot?
  const clinicaAbierta = (slotMins) =>
    horarios.some(h => slotMins >= toMins(h.horaInicio) && slotMins < toMins(h.horaFin));

  // ¿Trabaja esta persona en este slot?
  const personaDisponible = (slotMins, idPersonal) => {
    const hs = horariosPersonal[idPersonal];
    if (!hs || hs.length === 0) return clinicaAbierta(slotMins);
    return hs.some(h => slotMins >= toMins(h.horaInicio) && slotMins < toMins(h.horaFin));
  };

  // ¿Tiene algún servicio asignado en este slot? (bloqueo de agenda)
  const slotOcupado = (slotMins, idPersonal) => {
    return appointments
      .filter(a => a.fecha === fecha && ![3].includes(a.idEstadoCita))
      .some(a => {
        const aStart = toMins(a.hora);
        // Esta persona es vet anfitrión o tiene un servicio asignado
        const involucrado =
          Number(a.idVeterinario) === Number(idPersonal) ||
          (a.detalles || []).some(d => Number(d.idPersonalRealiza) === Number(idPersonal));
        if (!involucrado) return false;
        // Duración del bloque que ocupa esta persona (solo sus servicios)
        const duracion = (a.detalles || [])
          .filter(d =>
            Number(d.idPersonalRealiza) === Number(idPersonal) ||
            (Number(a.idVeterinario) === Number(idPersonal) &&
              !d.idPersonalRealiza)
          )
          .reduce((acc, d) => acc + (d.PrecioServicio?.duracionEstimada || 30), 0) || 30;
        const aEnd = aStart + duracion;
        return slotMins < aEnd && slotMins + 30 > aStart;
      });
  };

  const getNombre = (p) =>
    `${p.nombres || p.Staff?.nombres || "?"} ${p.apellidos || p.Staff?.apellidos || ""}`.trim().split(" ")[0];
  const getApellido = (p) =>
    (`${p.nombres || p.Staff?.nombres || "?"} ${p.apellidos || p.Staff?.apellidos || ""}`.trim().split(" ")[1] || "");
  const getInicial = (p) => (p.nombres || p.Staff?.nombres || "?")[0].toUpperCase();
  const getRolColor = (p) => {
    const rol = p.User?.idRol ?? 99;
    const map = { 2: { bg: "#dcfce7", color: "#166534" }, 3: { bg: "#dbeafe", color: "#1d4ed8" }, 4: { bg: "#fef3c7", color: "#b45309" }, 1: { bg: "#f3e8ff", color: "#6d28d9" } };
    return map[rol] || { bg: "#f1f5f9", color: "#475569" };
  };
  const getRolLabel = (p) => {
    const map = { 1: "Admin", 2: "Vet", 3: "Asist.", 4: "Vend." };
    return map[p.User?.idRol] || "Staff";
  };

  // Solo mostramos vets en el selector de "Veterinario anfitrión" al elegir slot
  // pero en la grilla mostramos a todos
  const cerrado = horarios.length === 0 && !cargando;
  const diasSemana = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const diaNombre = (() => {
    const [y, mo, d] = fecha.split("-");
    return diasSemana[new Date(+y, +mo - 1, +d).getDay()];
  })();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", backdropFilter: "blur(6px)", zIndex: 1500 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(96vw, 1100px)", maxHeight: "92vh",
        background: "white", borderRadius: 20,
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column",
        overflow: "hidden", zIndex: 1501,
      }}>

        {/* Header */}
        <div style={{ background: "#1a3d28", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "white" }}>📅 Elegir horario para nueva cita</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              Hacé clic en un slot libre para pre-cargar la cita
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Selector de fecha */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none" }} />
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 8,
            background: "#eaf3de", color: "#1a3d28",
            fontSize: 13, fontWeight: 700,
          }}>
            {diaNombre} · {horarios.length > 0
              ? horarios.map(h => `${h.horaInicio?.substring(0,5)}–${h.horaFin?.substring(0,5)}`).join(" / ")
              : "Sin horario cargado"}
          </div>
          <div style={{ display: "flex", gap: 12, marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#f0fdf4", border: "1.5px solid #86efac" }} /> Libre
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#fef2f2", border: "1.5px solid #fca5a5" }} /> Ocupado
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#f1f5f9" }} /> Fuera de horario
            </div>
          </div>
        </div>

        {/* Grilla */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          {cargando ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 13 }}>Cargando disponibilidad...</div>
          ) : cerrado ? (
            <div style={{ textAlign: "center", padding: 56, color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Clínica cerrada este día</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No hay horario de atención configurado.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 5 }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1.5px solid #e2e8f0", borderRight: "1px solid #e2e8f0", width: 60, color: "#94a3b8", fontWeight: 600, fontSize: 11, textAlign: "center" }}>Hora</th>
                  {todosElPersonal.map((p, i) => {
                    const rc = getRolColor(p);
                    return (
                      <th key={p.idPersonal} style={{ padding: "10px 8px", borderBottom: "1.5px solid #e2e8f0", borderRight: i < todosElPersonal.length - 1 ? "1px solid #e2e8f0" : "none", textAlign: "center", minWidth: 110 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: rc.bg, color: rc.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, margin: "0 auto 4px" }}>
                          {getInicial(p)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 11, color: "#166534" }}>{getNombre(p)}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{getApellido(p)}</div>
                        <span style={{ display: "inline-block", marginTop: 3, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: rc.bg, color: rc.color }}>
                          {getRolLabel(p)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map(slotMins => {
                  const abierto = clinicaAbierta(slotMins);
                  return (
                    <tr key={slotMins} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #e2e8f0", background: abierto ? "white" : "#f8fafc", color: abierto ? "#64748b" : "#cbd5e1", fontWeight: 600, fontSize: 11, textAlign: "right", verticalAlign: "middle" }}>
                        {toHHMM(slotMins)}
                      </td>
                      {todosElPersonal.map((p, i) => {
                        if (!abierto) {
                          return (
                            <td key={p.idPersonal} style={{ background: "#f8fafc", borderRight: i < todosElPersonal.length - 1 ? "1px solid #f1f5f9" : "none", height: 40 }} />
                          );
                        }
                        const trabaja = personaDisponible(slotMins, p.idPersonal);
                        const ocupado = trabaja && slotOcupado(slotMins, p.idPersonal);
                        const esVet = p.User?.idRol === 2;

                        if (!trabaja) {
                          return (
                            <td key={p.idPersonal} style={{ background: "#f8fafc", borderRight: i < todosElPersonal.length - 1 ? "1px solid #f1f5f9" : "none", height: 40, textAlign: "center", color: "#d1ddd4", fontSize: 10 }}>
                              —
                            </td>
                          );
                        }

                        return (
                          <td key={p.idPersonal}
                            onClick={() => {
                              if (ocupado) return;
                              // Para vets: los selecciona como anfitrión
                              // Para no-vets: elegimos el primer vet disponible como anfitrión
                              // y pre-cargamos el slot
                              const vetParaAnfitrion = esVet
                                ? p.idPersonal
                                : (vets.find(v => !slotOcupado(slotMins, v.idPersonal) && personaDisponible(slotMins, v.idPersonal))?.idPersonal || vets[0]?.idPersonal);
                              onSelect(fecha, toHHMM(slotMins), vetParaAnfitrion);
                            }}
                            style={{
                              background: ocupado ? "#fef2f2" : "#f0fdf4",
                              border: ocupado ? "none" : "none",
                              borderRight: i < todosElPersonal.length - 1 ? "1px solid #f1f5f9" : "none",
                              height: 40,
                              cursor: ocupado ? "not-allowed" : "pointer",
                              transition: "background 0.12s",
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                            onMouseEnter={e => { if (!ocupado) e.currentTarget.style.background = "#dcfce7"; }}
                            onMouseLeave={e => { if (!ocupado) e.currentTarget.style.background = "#f0fdf4"; }}
                          >
                            {ocupado ? (
                              <span style={{ fontSize: 10, color: "#fca5a5", fontWeight: 600 }}>ocupado</span>
                            ) : (
                              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ libre</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
            Hacé clic en un slot verde para pre-cargar fecha, hora y veterinario en el formulario.
          </p>
          <button onClick={() => onSelect(fecha, "", "")} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" }}>
            Cargar sin slot →
          </button>
        </div>
      </div>
    </>
  );
}

// ── Modal genérico de alerta / confirmación ───────────────────────
function AlertModal({ emoji, emojiBg, title, message, onConfirm, onCancel, confirmText, confirmBg, cancelText }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "44px 40px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.28)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: emojiBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 20px" }}>{emoji}</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 21, fontWeight: 800, color: "#166534" }}>{title}</h2>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: message }} />
        <div style={{ display: "flex", gap: 12 }}>
          {onCancel && (
            <button onClick={onCancel} style={{ flex: 1, padding: "13px", border: "2px solid #e2e8f0", borderRadius: 12, background: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#475569" }}>
              {cancelText || "Cancelar"}
            </button>
          )}
          <button onClick={onConfirm} style={{ flex: 1, padding: "13px", border: "none", borderRadius: 12, background: confirmBg, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {confirmText || "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal catálogo de servicios (filtrado por tamaño) ─────────────
function ServiceModal({ isOpen, onClose, onAddService, servicePrices, petSize, form }) {
  const [search,     setSearch]     = useState("");
  const [filterSize, setFilterSize] = useState(petSize || "all");

  useEffect(() => { setFilterSize(petSize || "all"); }, [petSize]);

  if (!isOpen) return null;

  const filtered = servicePrices.filter(sp => {
    const matchSearch = !search || sp.Service?.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchSize = filterSize === "all" || !sp.idTamaño || String(sp.idTamaño) === String(filterSize);
  
    // 1. Obtenemos el tipo de cita del formulario
    const tipoCitaSeleccionada = Number(form?.idTipoCita || 0);
  
    // 2. BUSQUEDA DEL ID DE TIPO DE SERVICIO
    // En tu controlador pusiste as: 'Service', por lo que debe estar en sp.Service.idTipoServicio
    const tipoDeEsteServicio = Number(sp.Service?.idTipoServicio || 0);
  
    let esPermitido = true;
  
    // REGLA: Si la cita es Médica (1: Control o 2: Emergencia)
    // Ocultamos servicios de Estética (ID 2)
    if ((tipoCitaSeleccionada === 1 || tipoCitaSeleccionada === 2) && tipoDeEsteServicio === 2) {
      esPermitido = false;
    }

    return matchSearch && matchSize && esPermitido;
  });

  const sizes = Array.from(new Map(
    servicePrices
      .filter(sp => sp.AnimalSize)
      .map(sp => [sp.AnimalSize.idTamaño, sp.AnimalSize])
  ).values());

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(95vw,880px)", maxHeight: "88vh", background: "white", borderRadius: 18, zIndex: 2001, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>

        <div style={{ padding: "18px 24px", background: "#166534", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Catálogo de Servicios</h3>
            {petSize && <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>Filtrado automáticamente por tamaño del paciente</p>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "2 1 220px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
            <input placeholder="Buscar servicio..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none" }} />
          </div>
        </div>

        {/* Mensaje informativo*/}
        {(Number(form?.idTipoCita) === 1 || Number(form?.idTipoCita) === 2) && (
          <div style={{ padding: "10px 20px", marginBottom: 10, background: "#fff7ed", borderLeft: "4px solid #f97316", color: "#9a3412", fontSize: 13 }}>
            <strong>Nota:</strong> Estás en modo médico. Los servicios de estética no están disponibles para este tipo de cita.
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc" }}>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Servicio", "Tipo", "Tamaño", "Duración", "Precio", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Sin resultados</td></tr>
              ) : filtered.map(sp => (
                <tr key={sp.idPrecioServicio} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#166534" }}>{sp.Service?.descripcion}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {sp.Service?.ServiceType?.descripcion || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {sp.AnimalSize
                      ? <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{sp.AnimalSize.descripcion}</span>
                      : <span style={{ color: "#94a3b8", fontSize: 12 }}>Todos</span>}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{sp.duracionEstimada} min</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#16a34a" }}>${sp.precio}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => { onAddService(sp); onClose(); }}
                      style={{ padding: "8px 16px", background: "#166534", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


// ── Modal de Selección de Vacunas (Estilo Tarjetas) ───────────────
function VaccineModal({ isOpen, onClose, onSelectVaccine, vacunasDisponibles, especieMascota }) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = vacunasDisponibles.filter(v => {
    // 1. Filtro por búsqueda de texto 
    const nombre = v.Producto?.nombre?.toLowerCase() || "";
    const enfermedad = v.enfermedadPreventiva?.toLowerCase() || "";
    const busqueda = searchTerm.toLowerCase();
    const coincideBusqueda = nombre.includes(busqueda) || enfermedad.includes(busqueda);
  
    // 2. NUEVO: Filtro por Especie
    // Si la vacuna no tiene especie (null) es universal. 
    // Si tiene, debe coincidir con la de la mascota.
    const coincideEspecie = !v.idEspecie || Number(v.idEspecie) === Number(especieMascota);
  
    return coincideBusqueda && coincideEspecie;
  });
  

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(10, 20, 40, 0.65)", backdropFilter: "blur(6px)", zIndex: 2000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(92vw, 880px)", maxHeight: "88vh", background: "#f8fafc", borderRadius: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 2001 }}>
        <div style={{ background: "#854d0e", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "12px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💉</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "white" }}>Catálogo de Vacunas</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>Seleccione la vacuna a aplicar</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "10px", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
        
        <div style={{ padding: "20px 28px", background: "white", borderBottom: "1px solid #e8edf3" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", opacity: 0.5 }}>🔍</span>
            <input 
              placeholder="Buscar por nombre o enfermedad..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              autoFocus
              style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "15px", outline: "none", background: "#f8fafc", boxSizing: "border-box" }} 
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", alignContent: "start" }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", fontSize: "16px", color: "#94a3b8" }}>Sin resultados</div>
          ) : filtered.map(v => {
            return (
              <div key={v.idProducto} style={{ background: "white", border: "1.5px solid #fef08a", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "16px", color: "#854d0e", marginBottom: "8px", lineHeight: "1.2" }}>
                    {v.Producto?.nombre || `Producto #${v.idProducto}`}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Previene: <strong>{v.enfermedadPreventiva}</strong></span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>💧 Dosis: <strong>{v.dosis}</strong></span>
                    {/* Etiqueta de especie */}
                    <span style={{ 
                      fontSize: "11px", 
                      padding: "2px 8px", 
                      borderRadius: "4px", 
                      width: "fit-content",
                      background: v.idEspecie === 1 ? "#dbeafe" : v.idEspecie === 2 ? "#dcfce7" : "#f1f5f9",
                      color: v.idEspecie === 1 ? "#1e40af" : v.idEspecie === 2 ? "#166534" : "#475569",
                      marginTop: "4px",
                      fontWeight: "bold"
                    }}>
                      {v.idEspecie === 1 ? "Felino" : v.idEspecie === 2 ? "Canino" : "🐾 Multiespecie"}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => { onSelectVaccine(v); handleClose(); }}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none", background: "#ca8a04", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
                >
                  Seleccionar Vacuna
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Modal: Atender / Finalizar servicios de una cita ─────────────
function AttendServiceModal({ cita, staff, onClose, onSave }) {
  const [detalles,     setDetalles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(null);
  const [alertMsg,     setAlertMsg]     = useState(null);   
  const [asignaciones, setAsignaciones] = useState({});
  const [allPrices, setAllPrices] = useState([]);
  const [isServiceModalOpen, setServiceModalOpen] = useState(false);  

  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [detalleVacunaActivo, setDetalleVacunaActivo] = useState(null);
  const [fichaExpandida, setFichaExpandida] = useState(false);

  const [historialActual, setHistorialActual] = useState(null);
  const [datosClinico, setDatosClinico] = useState({
    motivo: "", idEstadoMascota: "", peso: "", temperatura: "", sintomas: "", diagnostico: ""
  });
  const [estadosMascota, setEstadosMascota] = useState([]);
 
  const [vacunasDisponibles, setVacunasDisponibles] = useState([]);
  const [lotesDisponibles, setLotesDisponibles] = useState([]);
  const [datosVacuna, setDatosVacuna] = useState({}); // { [idDetalle]: { idVacuna, idLote } }

  const [tratamientos, setTratamientos] = useState([{
    descripcion: "",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: "",
    idTipoTratamiento: "",
    idEstadoTratamiento: 1,
    medicamentos: []
  }]);
  const [tiposTratamiento, setTiposTratamiento] = useState([]);
  const [estadosTratamiento, setEstadosTratamiento] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mostrarTratamiento, setMostrarTratamiento] = useState(false);
 
  const petSizeId = cita.Mascota?.idTamaño; 
  const especieMascota = Number(cita?.Mascota?.Raza?.idEspecie ?? cita?.Mascota?.idEspecie);

  const servicePrices = allPrices.filter(sp => {
    // Si el servicio no tiene restricción de tamaño, se muestra siempre
    if (!sp.idTamaño) return true;
  
    // LOG de comparación individual para ver qué falla
    const match = String(sp.idTamaño).trim() === String(petSizeId).trim();
    
    return match;
  });
 
  const fetchDetalles = () => {
    setLoading(true);
    axios.get(`/appointment-details/cita/${cita.idCita}`, { headers: headers() })
      .then(r => {
        const data = r.data || [];
        setDetalles(data);
        const pre = {};
        data.forEach(d => { if (d.idPersonalRealiza) pre[d.idDetalle] = String(d.idPersonalRealiza); });
        setAsignaciones(pre);
      })
      .catch(() => setDetalles([]))
      .finally(() => setLoading(false));
  };
 
  useEffect(() => {
    fetchDetalles();
    axios.get("/service-prices", { headers: headers() })
      .then(res => setAllPrices(res.data || []))
      .catch(err => console.error("Error precios:", err));
 
    // Cargar Historial existente (si ya se creó en esta cita)
    axios.get("/clinical-histories", { headers: headers() })
      .then(res => {
        const hExistente = (res.data || []).find(x => Number(x.idCita) === Number(cita.idCita));
        if (hExistente) {
          setHistorialActual(hExistente);
          setDatosClinico({
            motivo: hExistente.motivo || "",
            idEstadoMascota: hExistente.idEstadoMascota || "",
            peso: hExistente.peso || "",
            temperatura: hExistente.temperatura || "",
            sintomas: hExistente.sintomas || "",
            diagnostico: hExistente.diagnostico || ""
          });
        }
      }).catch(() => {});

    //Cargar Vacunas, Lotes Y Estados de Mascota
    const fetchData = async () => {
      try {
        const [resVac, resBatches, resEstadosMascota, resTiposTrat, resEstadosTrat, resProductos] = await Promise.all([
          axios.get("/vaccines", { headers: headers() }).catch(() => ({ data: [] })),
          axios.get("/batches", { headers: headers() }).catch(() => ({ data: [] })),
          axios.get("/pet-states", { headers: headers() }).catch(() => ({ data: [] })),
          axios.get("/treatment-types", { headers: headers() }).catch(() => ({ data: [] })),
          axios.get("/treatment-states", { headers: headers() }).catch(() => ({ data: [] })),
          axios.get("/products", { headers: headers() }).catch(() => ({ data: [] })),
        ]);
        setVacunasDisponibles(resVac.data || []);
        setLotesDisponibles(resBatches.data || []);
        setEstadosMascota(resEstadosMascota.data || []); 
        setTiposTratamiento(resTiposTrat.data || []);
        setEstadosTratamiento(resEstadosTrat.data || []);
        setProductosDisponibles(resProductos.data || []);
      } catch (e) {
        console.error("Error en fetchData:", e);
      }
    };
    fetchData();
  }, [cita.idCita]);
 
  const onAddExtraService = async (sp) => {
    try {
      await axios.post("/appointment-detail", {
        idCita: cita.idCita,
        idPrecioServicio: sp.idPrecioServicio,
        idPersonalRealiza: cita.idVeterinario, // Se asigna por defecto al vet de la cita
        idEstadoServicio: 1 
      }, { headers: headers() });
 
      setServiceModalOpen(false);
      setAlertMsg({ type: "success", text: "Servicio extra agregado correctamente." });
      fetchDetalles();
    } catch (e) {
      setAlertMsg({ type: "error", text: e.response?.data?.msg || "Error al agregar servicio." });
    }
  };
 
  const handleUpdateStatus = async (idDetalle, nuevoEstado) => {
      const d = detalles.find(item => item.idDetalle === idDetalle);
      const esMedico = [1, 3, 4].includes(d?.PrecioServicio?.Service?.idTipoServicio);
      const esVacuna = d?.PrecioServicio?.Service?.descripcion?.toLowerCase().includes("vacuna");
      const requiereHistorial = esMedico || esVacuna;
      const idPersonal = asignaciones[idDetalle];
      const user = getUserFromToken();
      const esVeterinarioLogueado = Number(user?.idRol) === 2;
    
      if (!idPersonal) {
        setAlertMsg({ type: "error", text: "Debés seleccionar un empleado primero." });
        return;
      }
    
      setSaving(idDetalle);
      try {
        let idHistorialGenerado = historialActual?.idHistorial || null;
    
        // ── PASO 1: Gestión del historial ──
        if (nuevoEstado === 3 && requiereHistorial && esVeterinarioLogueado) {
          
          if (!datosClinico.motivo?.trim() || !datosClinico.idEstadoMascota || !datosClinico.diagnostico?.trim()) {
            setAlertMsg({ type: "error", text: "Faltan campos obligatorios (Motivo, Estado o Diagnóstico)." });
            setSaving(null);
            return;
          }

          const payloadHistorial = {
            idCita:          cita.idCita,
            idMascota:       cita.idMascota,
            idVeterinario:   cita.idVeterinario,
            motivo:          datosClinico.motivo,
            idEstadoMascota: Number(datosClinico.idEstadoMascota),
            peso:            datosClinico.peso        || null,
            temperatura:     datosClinico.temperatura || null,
            sintomas:        datosClinico.sintomas    || null,
            diagnostico:     datosClinico.diagnostico,
          };

          if (!idHistorialGenerado) {
            // No existe → lo creamos
            const resH = await axios.post("/clinical-history", payloadHistorial, { headers: headers() });
            idHistorialGenerado = resH.data?.idHistorial || resH.data?.data?.idHistorial;
            setHistorialActual({ idHistorial: idHistorialGenerado });
          } else {
            // Ya existe → intentamos actualizar, pero si dice "sin cambios" lo ignoramos
            try {
              await axios.patch(`/clinical-history/${idHistorialGenerado}`, payloadHistorial, { headers: headers() });
            } catch (patchErr) {
              const msg = patchErr.response?.data?.msg || "";
              if (msg === "No se detectaron cambios en la ficha para actualizar.") {
                // Sin cambios reales → no es un error, simplemente continuamos
                console.log("Historial sin cambios, continuando con el flujo...");
              } else {
                // Otro error inesperado → sí lo propagamos
                throw patchErr;
              }
            }
          }
        }

        // ── PASO 2: Registrar vacuna ──
        if (nuevoEstado === 3 && esVacuna) {
          const infoV = datosVacuna[idDetalle];

          if (!infoV?.idVacuna) {
            setAlertMsg({ type: "error", text: "Debe seleccionar qué vacuna aplicó antes de finalizar." });
            setSaving(null);
            return;
          }

          if (!idHistorialGenerado) {
            setAlertMsg({ type: "error", text: "Error interno: no se pudo obtener el historial clínico." });
            setSaving(null);
            return;
          }

          const vacunaSeleccionada = vacunasDisponibles.find(
            v => String(v.idProducto) === String(infoV.idVacuna)
          );

          console.log("Enviando vacuna con idHistorial:", idHistorialGenerado);

          await axios.post("/applied-vaccine", {
            idHistorial:     idHistorialGenerado,
            idVacuna:        infoV.idVacuna,
            dosis:           vacunaSeleccionada?.dosis || "1 dosis",
            fechaAplicacion: new Date().toISOString().split('T')[0]
          }, { headers: headers() });
        }

        // ── PASO 2.5: Guardar tratamientos si los hay ──
        if (nuevoEstado === 3 && mostrarTratamiento && idHistorialGenerado) {
          for (const trat of tratamientos) {
            if (!trat.descripcion?.trim() || !trat.idTipoTratamiento) continue;
            
            const resTrat = await axios.post("/treatment", {
              idHistorial: idHistorialGenerado,
              descripcion: trat.descripcion,
              fechaInicio: trat.fechaInicio,
              fechaFin: trat.fechaFin || null,
              idTipoTratamiento: Number(trat.idTipoTratamiento),
              idEstadoTratamiento: Number(trat.idEstadoTratamiento) || 1,
            }, { headers: headers() });

            const idTratamiento = resTrat.data?.idTratamiento;

            // Guardar medicamentos del tratamiento
            for (const med of (trat.medicamentos || [])) {
              if (!med.idProd_Pres || !med.cantidad) continue;
              await axios.post("/treatment-med", {
                idTratamiento,
                idProd_Pres: Number(med.idProd_Pres),
                cantidad: Number(med.cantidad),
                instrucciones: med.instrucciones || "Según indicación",
                notas: med.notas || null,
                aplicadoEnClinica: med.aplicadoEnClinica ? 1 : 0,
                precioAplicado: parseFloat(med.precioAplicado || 0),
              }, { headers: headers() });
            }
          }
        }

        // ── PASO 3: Actualizar estado del servicio ──
        await axios.patch(`/appointment-detail/${idDetalle}/complete`, {
          idPersonalRealiza: Number(idPersonal),
          idEstadoServicio:  nuevoEstado
        }, { headers: headers() });

        setAlertMsg({ type: "success", text: nuevoEstado === 2 ? "Servicio iniciado." : "Servicio registrado correctamente." });
        fetchDetalles();

      } catch (e) {
        console.error("Error en handleUpdateStatus:", e.response?.data || e);
        console.error("Detalle errores:", JSON.stringify(e.response?.data, null, 2));
        setAlertMsg({ type: "error", text: e.response?.data?.msg || "Error al actualizar." });
      } finally {
        setSaving(null);
      }
  };
 
  // Reprogramar Servicio (Estado 7) y Cita (Estado 5)
  const handleReprogramarServicio = async (idDetalle) => {
    try {
      // 1. Marcar el servicio como Reprogramado (estado 7)
      await axios.patch(`/appointment-detail/${idDetalle}`, 
        { idEstadoServicio: 7 }, 
        { headers: headers() }
      );
  
      // 2. Verificar si todos los servicios de la cita quedaron sin hacer
      const res = await axios.get(
        `/appointment-details/cita/${cita.idCita}`,   
        { headers: headers() }
      );
      const todosSinHacer = (res.data || []).every(d => [6, 7].includes(d.idEstadoServicio));
  
      if (todosSinHacer) {
        // Si no se hizo ningún servicio, la cita entera pasa a Reprogramada (5)
        await axios.patch(
          `/appointment/${cita.idCita}`,              
          { idEstadoCita: 5 }, 
          { headers: headers() }
        );
      }
  
      setAlertMsg({ 
        type: "success", 
        text: "✅ Servicio marcado como reprogramado. Recepción debe coordinar con el cliente una nueva fecha." 
      });
      fetchDetalles();
      onSave();
    } catch (e) {
      setAlertMsg({ type: "error", text: "Error al reprogramar el servicio." });
    }
  };
 
  const updateClinical = (campo, valor) => {
    setDatosClinico(prev => ({ ...prev, [campo]: valor }));
  };

  // Función que se ejecuta cuando eligen una vacuna en el modal de tarjetas
  const handleSelectVaccine = (vacunaSeleccionada) => {
      console.log("Vacuna seleccionada:", vacunaSeleccionada); // ← para ver qué llega
      setDatosVacuna(prev => ({ 
        ...prev, 
        [detalleVacunaActivo]: { 
          idVacuna: vacunaSeleccionada.idProducto, 
          // ← múltiples fallbacks por si Producto no viene
          nombreVacuna: vacunaSeleccionada.Producto?.nombre 
                    || vacunaSeleccionada.nombre 
                    || vacunaSeleccionada.enfermedadPreventiva
                    || `Vacuna #${vacunaSeleccionada.idProducto}`
        } 
      }));
      setDetalleVacunaActivo(null);
  };
 
  const userLogueado = getUserFromToken();
  const completados = detalles.filter(d => [3, 5].includes(d.idEstadoServicio)).length;

  // Verifica si la cita tiene al menos un servicio médico/vacuna para mostrar la ficha general
  const tieneServicioMedico = detalles.some(d => {
    const t = d.PrecioServicio?.Service?.idTipoServicio;
    const desc = d.PrecioServicio?.Service?.descripcion?.toLowerCase() || "";
    return [1, 3, 4].includes(t) || desc.includes("vacuna");
  });
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(10,20,40,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 700, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
 
        {/* Cabecera del Modal */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#166534" }}>
              Atención: {cita.Mascota?.nombre || "Paciente"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {cita.TipoCita?.descripcion} · {fmtFecha(cita.fecha)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
 
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          
          {/* 📋  FICHA CLÍNICA */}
          {tieneServicioMedico && Number(userLogueado?.idRol) === 2 && (
            <div style={{ marginBottom: 24, borderRadius: 14, border: "1.5px solid #bae6fd", overflow: "hidden" }}>
              
              {/* Header clickeable */}
              <div
                onClick={() => setFichaExpandida(!fichaExpandida)}
                style={{ padding: "12px 16px", background: "#f0f9ff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0369a1", textTransform: "uppercase" }}>
                    📋 Ficha Clínica General
                  </span>
                  {datosClinico.motivo && datosClinico.diagnostico && datosClinico.idEstadoMascota ? (
                    <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>✓ Completa</span>
                  ) : (
                    <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>Pendiente</span>
                  )}
                </div>
                <span style={{ fontSize: 14, color: "#0369a1", fontWeight: 700 }}>{fichaExpandida ? "▲" : "▼"}</span>
              </div>

              {/* Contenido colapsable */}
              {fichaExpandida && (
                <div style={{ padding: 16, background: "#f0f9ff", display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="Motivo de la consulta *" value={datosClinico.motivo} onChange={e => updateClinical("motivo", e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${!datosClinico.motivo ? "#fca5a5" : "#bae6fd"}` }} />
                    <select value={datosClinico.idEstadoMascota} onChange={e => updateClinical("idEstadoMascota", e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${!datosClinico.idEstadoMascota ? "#fca5a5" : "#bae6fd"}` }}>
                      <option value="">Estado del paciente *</option>
                      {estadosMascota.map(estado => (
                        <option key={estado.idEstadoMascota} value={estado.idEstadoMascota}>{estado.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="number" placeholder="Peso (kg)" value={datosClinico.peso} onChange={e => updateClinical("peso", e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #bae6fd" }} />
                    <input type="number" placeholder="Temp (°C)" value={datosClinico.temperatura} onChange={e => updateClinical("temperatura", e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #bae6fd" }} />
                  </div>

                  <textarea placeholder="Síntomas..." value={datosClinico.sintomas} onChange={e => updateClinical("sintomas", e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #bae6fd", resize: "vertical" }} />
                  <textarea placeholder="Diagnóstico principal *" value={datosClinico.diagnostico} onChange={e => updateClinical("diagnostico", e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${!datosClinico.diagnostico ? "#fca5a5" : "#bae6fd"}`, resize: "vertical" }} />

                  {/* SECCIÓN TRATAMIENTOS */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#0369a1" }}>💊 Tratamientos</label>
                      <button type="button" onClick={() => setMostrarTratamiento(!mostrarTratamiento)}
                        style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, border: "1px solid #bae6fd", background: mostrarTratamiento ? "#0369a1" : "white", color: mostrarTratamiento ? "white" : "#0369a1", cursor: "pointer", fontWeight: 700 }}>
                        {mostrarTratamiento ? "▲ Ocultar" : "▼ Agregar tratamiento"}
                      </button>
                    </div>

                    {mostrarTratamiento && tratamientos.map((trat, tIdx) => (
                      <div key={tIdx} style={{ background: "white", border: "1.5px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <select value={trat.idTipoTratamiento} onChange={e => {
                            const copy = [...tratamientos]; copy[tIdx].idTipoTratamiento = e.target.value; setTratamientos(copy);
                          }} style={{ padding: 8, borderRadius: 8, border: "1px solid #bae6fd" }}>
                            <option value="">Tipo de tratamiento *</option>
                            {tiposTratamiento.map(t => <option key={t.idTipoTratamiento} value={t.idTipoTratamiento}>{t.nombre}</option>)}
                          </select>

                          <select value={trat.idEstadoTratamiento} onChange={e => {
                            const copy = [...tratamientos]; copy[tIdx].idEstadoTratamiento = e.target.value; setTratamientos(copy);
                          }} style={{ padding: 8, borderRadius: 8, border: "1px solid #bae6fd" }}>
                            {estadosTratamiento.map(e => <option key={e.idEstadoTratamiento} value={e.idEstadoTratamiento}>{e.descripcion}</option>)}
                          </select>

                          <input type="date" value={trat.fechaInicio} onChange={e => {
                            const copy = [...tratamientos]; copy[tIdx].fechaInicio = e.target.value; setTratamientos(copy);
                          }} style={{ padding: 8, borderRadius: 8, border: "1px solid #bae6fd" }} />

                          <input type="date" value={trat.fechaFin} placeholder="Fecha fin (opcional)" onChange={e => {
                            const copy = [...tratamientos]; copy[tIdx].fechaFin = e.target.value; setTratamientos(copy);
                          }} style={{ padding: 8, borderRadius: 8, border: "1px solid #bae6fd" }} />
                        </div>

                        <textarea placeholder="Descripción del tratamiento *" value={trat.descripcion}
                          onChange={e => { const copy = [...tratamientos]; copy[tIdx].descripcion = e.target.value; setTratamientos(copy); }}
                          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #bae6fd", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />

                        <div style={{ fontSize: 11, fontWeight: 800, color: "#0369a1", marginBottom: 6 }}>Medicamentos</div>
                        {(trat.medicamentos || []).map((med, mIdx) => (
                          <div key={mIdx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto auto", gap: 6, marginBottom: 6, alignItems: "center" }}>
                            <select value={med.idProd_Pres} onChange={e => {
                              const copy = [...tratamientos];
                              const prod = productosDisponibles.find(p => String(p.idProducto) === e.target.value);
                              copy[tIdx].medicamentos[mIdx].idProd_Pres = e.target.value;
                              copy[tIdx].medicamentos[mIdx].precioAplicado = prod?.precio || 0;
                              setTratamientos(copy);
                            }} style={{ padding: 6, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                              <option value="">Producto *</option>
                              {productosDisponibles.map(p => <option key={p.idProducto} value={p.idProducto}>{p.nombre}</option>)}
                            </select>

                            <input type="number" placeholder="Cant." min="1" value={med.cantidad}
                              onChange={e => { const copy = [...tratamientos]; copy[tIdx].medicamentos[mIdx].cantidad = e.target.value; setTratamientos(copy); }}
                              style={{ padding: 6, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />

                            <input placeholder="Instrucciones *" value={med.instrucciones}
                              onChange={e => { const copy = [...tratamientos]; copy[tIdx].medicamentos[mIdx].instrucciones = e.target.value; setTratamientos(copy); }}
                              style={{ padding: 6, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />

                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#0369a1", whiteSpace: "nowrap", cursor: "pointer" }}>
                              <input type="checkbox" checked={!!med.aplicadoEnClinica} onChange={e => {
                                const copy = [...tratamientos];
                                copy[tIdx].medicamentos[mIdx].aplicadoEnClinica = e.target.checked ? 1 : 0;
                                setTratamientos(copy);
                              }} />
                              En clínica
                            </label>

                            <button type="button" onClick={() => {
                              const copy = [...tratamientos]; copy[tIdx].medicamentos.splice(mIdx, 1); setTratamientos(copy);
                            }} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>✕</button>
                          </div>
                        ))}

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                          <button type="button" onClick={() => {
                            const copy = [...tratamientos];
                            copy[tIdx].medicamentos.push({ idProd_Pres: "", cantidad: 1, instrucciones: "", notas: "", aplicadoEnClinica: 0, precioAplicado: 0 });
                            setTratamientos(copy);
                          }} style={{ fontSize: 12, padding: "4px 10px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
                            + Medicamento
                          </button>
                          {tratamientos.length > 1 && (
                            <button type="button" onClick={() => {
                              const copy = [...tratamientos]; copy.splice(tIdx, 1); setTratamientos(copy);
                            }} style={{ fontSize: 12, padding: "4px 10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer" }}>
                              Eliminar tratamiento
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {mostrarTratamiento && (
                      <button type="button" onClick={() => setTratamientos(prev => [...prev, {
                        descripcion: "", fechaInicio: new Date().toISOString().split('T')[0],
                        fechaFin: "", idTipoTratamiento: "", idEstadoTratamiento: 1, medicamentos: []
                      }])} style={{ fontSize: 12, padding: "6px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                        + Otro tratamiento
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* LISTA DE SERVICIOS INDIVIDUALES */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Servicios en esta consulta</h3>
              <button onClick={() => setServiceModalOpen(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ➕ Agregar Servicio Extra
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>Cargando...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {detalles.map(d => {
                  const enCurso = d.idEstadoServicio === 2;
                  const finalizado = [3, 5].includes(d.idEstadoServicio);
                  const cancelado = d.idEstadoServicio === 6;
                  const reprogramado = d.idEstadoServicio === 7;
                  const esVacuna = d.PrecioServicio?.Service?.descripcion?.toLowerCase().includes("vacuna");
                  
                  const est = SERV_ESTADOS[d.idEstadoServicio] || SERV_ESTADOS[1];
                  const idLogueado = userLogueado?.idPersonal ? Number(userLogueado.idPersonal) : null;
                  const idAsignado = d.idPersonalRealiza ? Number(d.idPersonalRealiza) : null;
                  const puedeFinalizar = (idLogueado === idAsignado) || Number(userLogueado?.idRol) === 1;

                  return (
                    <div key={d.idDetalle} style={{ padding: 16, borderRadius: 14, border: "1.5px solid #e2e8f0", background: finalizado ? "#f0fdf4" : enCurso ? "#eff6ff" : "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#166534" }}>{d.PrecioServicio?.Service?.descripcion}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>Precio: ${d.PrecioServicio?.precio} · Responsable: {d.Ejecutor?.nombres || "Sin asignar"}</div>
                        </div>
                        <span style={{ background: est.bg, color: est.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{est.label}</span>
                      </div>

                      {!finalizado && !cancelado && !reprogramado && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {/* Asignación */}
                          <div style={{ display: "flex", gap: 10 }}>
                            <select value={asignaciones[d.idDetalle] || ""} disabled style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                              <option value="">Personal asignado...</option>
                              {staff.map(s => <option key={s.idPersonal} value={s.idPersonal}>{s.nombres} {s.apellidos}</option>)}
                            </select>
                            
                            {!enCurso && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <button
                                onClick={() => handleUpdateStatus(d.idDetalle, 2)}
                                disabled={saving === d.idDetalle}
                                style={{
                                  width: "100%", padding: "11px 0",
                                  background: saving === d.idDetalle
                                    ? "#e2e8f0"
                                    : "linear-gradient(135deg, #1d4ed8, #1e40af)",
                                  color: "white", borderRadius: 10, border: "none",
                                  fontWeight: 700, fontSize: 13, cursor: saving === d.idDetalle ? "not-allowed" : "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                              >
                                {saving === d.idDetalle ? "Iniciando..." : "▶ Iniciar servicio"}
                              </button>
                              <button
                                onClick={() => handleReprogramarServicio(d.idDetalle)}
                                style={{
                                  width: "100%", padding: "8px 0",
                                  background: "white", color: "#c2410c",
                                  border: "1.5px solid #f97316", borderRadius: 10,
                                  fontWeight: 600, fontSize: 12, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                              >
                                🔄 Reprogramar para otra fecha
                              </button>
                            </div>
                          )}
                          </div>

                          {/* SECCIÓN VACUNAS (Abre el modal de tarjetas) */}
                          {enCurso && esVacuna && (
                            <div style={{ padding: 12, background: "#fefce8", borderRadius: 10, border: "1.5px solid #fef08a", display: "flex", flexDirection: "column", gap: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "#854d0e" }}>💉 SELECCIÓN DE VACUNA *</div>
                              
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <div style={{ flex: 1, padding: 10, borderRadius: 8, border: "1.5px solid #facc15", background: "white", fontSize: 14, fontWeight: datosVacuna[d.idDetalle]?.idVacuna ? "700" : "400", color: datosVacuna[d.idDetalle]?.idVacuna ? "#166534" : "#94a3b8" }}>
                                  {datosVacuna[d.idDetalle]?.nombreVacuna || "Ninguna vacuna seleccionada..."}
                                </div>
                                <button 
                                  onClick={() => {
                                    setDetalleVacunaActivo(d.idDetalle);
                                    setShowVaccineModal(true);
                                  }}
                                  style={{ padding: "10px 16px", background: "#ca8a04", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                                >
                                  🔍 Buscar
                                </button>
                              </div>

                              <div style={{ fontSize: 11, color: "#a16207", background: "#fef9c3", padding: "8px 12px", borderRadius: 6, border: "1px dashed #fde047" }}>
                                ℹ️ <strong>Asignación Automática:</strong> Al finalizar, el sistema descontará el lote con vencimiento más próximo.
                              </div>
                            </div>
                          )}

                          {/* Botón Finalizar */}
                          {enCurso && (
                            puedeFinalizar ? (
                              <button onClick={() => handleUpdateStatus(d.idDetalle, 3)} disabled={saving === d.idDetalle} style={{ padding: 12, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer" }}>
                                ✓ Finalizar Servicio
                              </button>
                            ) : (
                              <div style={{ fontSize: 11, textAlign: "center", color: "#64748b" }}>ℹ️ Solo el personal asignado puede finalizar este servicio.</div>
                            )
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
 
        {/* Modal de Catálogo (Reusado) */}
        <ServiceModal 
          isOpen={isServiceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          onAddService={onAddExtraService}
          servicePrices={allPrices} 
          petSize={petSizeId}
          form={{ idTipoCita: cita.idTipoCita }}
        />

        {/* Modal de Catálogo de Vacunas */}
        <VaccineModal 
          isOpen={showVaccineModal}
          onClose={() => setShowVaccineModal(false)}
          vacunasDisponibles={vacunasDisponibles}  
          onSelectVaccine={handleSelectVaccine} 
          especieMascota={cita?.Mascota?.Raza?.idEspecie ?? cita?.Mascota?.idEspecie} 
        />
 
        {alertMsg && (
          <AlertModal 
            emoji={alertMsg.type === "success" ? "✅" : alertMsg.type === "info" ? "ℹ️" : "❌"}
            title={alertMsg.type === "success" ? "Operación Exitosa" : alertMsg.type === "info" ? "Información" : "Error"}
            message={alertMsg.text}
            confirmBg={alertMsg.type === "success" ? "#10b981" : alertMsg.type === "info" ? "#166534" : "#ef4444"}
            onConfirm={() => {
              if (alertMsg.onConfirmExtra) alertMsg.onConfirmExtra();
              setAlertMsg(null);
            }}
          />
        )}
 
 
        <div style={{ padding: "16px 28px", borderTop: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
          {/* Barra de progreso visible cuando saving !== null */}
          {saving !== null && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#0369a1", marginBottom: 4 }}>
                <span>Guardando servicio...</span>
                <span>{completados}/{detalles.length} completados</span>
              </div>
              <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                  width: detalles.length > 0 ? `${(completados / detalles.length) * 100}%` : "0%",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              {completados} de {detalles.length} servicios realizados
            </p>
            <button
              onClick={() => {
                const fichaCompleta = datosClinico.motivo && datosClinico.diagnostico && datosClinico.idEstadoMascota;
                setAlertMsg({
                  type: fichaCompleta ? "success" : "info",
                  text: fichaCompleta
                    ? "La ficha clínica y los tratamientos fueron guardados correctamente al finalizar cada servicio."
                    : tieneServicioMedico && Number(userLogueado?.idRol) === 2
                      ? "⚠️ La ficha clínica aún no está completa. Los datos se guardan automáticamente cuando finalizás cada servicio."
                      : "Consulta cerrada.",
                  onConfirmExtra: () => { onSave(); onClose(); }
                });
              }}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#166534", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 


// ── Mini picker de disponibilidad de personal ─────────────────────
// Se abre inline cuando se asigna responsable a un servicio de estética.
// Muestra qué personal está disponible en la fecha/hora de la cita.
function StaffAvailabilityPicker({ isOpen, onClose, onSelect, fecha, hora, servicioNombre, staffList, appointments }) {
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);

  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.substring(0, 5).split(":").map(Number);
    return h * 60 + m;
  };

  useEffect(() => {
    if (!isOpen || !fecha || !hora || staffList.length === 0) return;
    setLoading(true);
    const horaInicio = toMins(hora);

    // Para cada persona del staff, chequear si tiene algún servicio que se superponga
    // con el horario de esta cita en esa fecha.
    const checkDisponibilidad = (persona) => {
      // Servicios asignados a esta persona en esa fecha (citas no canceladas)
      const serviciosAsignados = appointments
        .filter(a => a.fecha === fecha && a.idEstadoCita !== 3)
        .flatMap(a =>
          (a.detalles || [])
            .filter(d => Number(d.idPersonalRealiza) === Number(persona.idPersonal))
            .map(d => ({
              inicio: toMins(a.hora),
              fin: toMins(a.hora) + (d.PrecioServicio?.duracionEstimada || 30),
            }))
        );

      const ocupado = serviciosAsignados.some(
        s => horaInicio < s.fin && horaInicio + 30 > s.inicio
      );
      return !ocupado;
    };

    const map = {};
    staffList.forEach(p => { map[p.idPersonal] = checkDisponibilidad(p); });
    setAvailabilityMap(map);
    setLoading(false);
  }, [isOpen, fecha, hora, staffList, appointments]);

  if (!isOpen) return null;

  const getNombre = (p) => p.Staff
    ? `${p.Staff.nombres} ${p.Staff.apellidos}`
    : `${p.nombres || ""} ${p.apellidos || ""}`.trim();

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(90vw, 440px)",
        background: "white", borderRadius: 16, zIndex: 3001,
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "#166534", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>✂️ Asignar responsable</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {servicioNombre} · {fecha} {hora && `a las ${hora}`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none",
            color: "white", width: 30, height: 30, borderRadius: 8,
            cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Lista de personal */}
        <div style={{ padding: "12px 16px", maxHeight: 340, overflowY: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 24 }}>Verificando disponibilidad...</p>
          ) : staffList.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 24 }}>No hay personal disponible.</p>
          ) : staffList.map(p => {
            const disponible = availabilityMap[p.idPersonal] !== false;
            return (
              <button
                key={p.idPersonal}
                onClick={() => disponible && onSelect(String(p.idPersonal))}
                disabled={!disponible}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "11px 14px", marginBottom: 6,
                  borderRadius: 10, border: `1.5px solid ${disponible ? "#d1ddd4" : "#f1f5f9"}`,
                  background: disponible ? "white" : "#f8fafc",
                  cursor: disponible ? "pointer" : "not-allowed",
                  opacity: disponible ? 1 : 0.5,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (disponible) e.currentTarget.style.background = "#f0fdf4"; }}
                onMouseLeave={e => { if (disponible) e.currentTarget.style.background = "white"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: disponible ? "#eaf3de" : "#f1f5f9",
                    color: disponible ? "#166534" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {getNombre(p).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: disponible ? "#166534" : "#94a3b8" }}>
                      {getNombre(p)}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  background: disponible ? "#dcfce7" : "#fee2e2",
                  color: disponible ? "#166534" : "#dc2626",
                }}>
                  {disponible ? "✓ Disponible" : "✗ Ocupado"}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
            ℹ️ La disponibilidad se calcula en base a los servicios ya asignados en esa fecha y hora.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Modal: Nuevo / Editar cita ────────────────────────────────────
function AppointmentModal({ mode, cita, pets, vets, staff, appointmentTypes, animalSizes, appointments = [], onClose, onSave, onPetAdded }) {
  const isEdit = mode === "edit";
  const today  = new Date().toLocaleDateString("en-CA");
  // Viene de reagendar: cita tiene _origenReprogram con el id de la cita original
  const esReprogram = !!(cita?._origenReprogram);
  

  const [servicePrices,      setServicePrices]  = useState([]);
  const [detalles,           setDetalles]       = useState([]);
  const [isServiceModalOpen, setServiceModal]   = useState(false);
  const [loading,            setLoading]        = useState(false);
  const [error,              setError]          = useState("");
  const [successMsg,         setSuccessMsg]     = useState("");
  const [pendingPet,         setPendingPet]     = useState(null);
  const [showTipoCitaError, setShowTipoCitaError] = useState(false);
  const [pendingTipoCita, setPendingTipoCita] = useState(null);
  const [showMascotaError, setShowMascotaError] = useState(false);
  const [idsOriginales, setIdsOriginales] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showNewPatient, setShowNewPatient] = useState(false);
  // Picker de disponibilidad: { idx, servicioNombre } o null
  const [staffPickerFor, setStaffPickerFor] = useState(null);

  const [form, setForm] = useState(cita ? {
    fecha:         cita.fecha || today,
    hora:          cita.hora?.slice(0, 5) || "",
    idMascota:     String(cita.idMascota || ""),
    idTipoCita:    String(cita.idTipoCita || ""),
    idEstadoCita:  cita.idEstadoCita || 1,
    idVeterinario: String(cita.idVeterinario || ""),
  } : { fecha: today, hora: "", idMascota: "", idTipoCita: "", idEstadoCita: 1, idVeterinario: "" });

  const selectedPet  = pets.find(p => String(p.idMascota) === String(form.idMascota));
  
  const petSizeId    = selectedPet?.idTamaño || null;
  const petSizeLabel = selectedPet?.AnimalSize?.descripcion || null;
  

  useEffect(() => {
    if (form.fecha && form.idVeterinario) {
      setAvailableSlots([]); // Limpiar mientras carga
      axios.get(`/appointments/availability`, { 
        params: { date: form.fecha, staffId: form.idVeterinario },
        headers: headers() 
      })
      .then(r => setAvailableSlots(r.data))
      .catch(() => setError("No se pudo cargar la disponibilidad"));
    }
  }, [form.fecha, form.idVeterinario]);
  
  useEffect(() => {
    axios.get("/service-prices", { headers: headers() })
      .then(r => setServicePrices(r.data || []));

    if (isEdit && cita) {
      axios.get(`/appointment-details/cita/${cita.idCita}`, { headers: headers() })
        .then(r => {
          const data = r.data || [];
          const mapped = data.map(d => ({
            idDetalle:        d.idDetalle,
            _esExistente:     true,
            idPrecioServicio: d.idPrecioServicio,
            idEstadoServicio: d.idEstadoServicio,
           
            idPersonalRealiza: d.idPersonalRealiza || "", 
            observaciones:    d.observaciones || "",
            _descripcion:     d.PrecioServicio?.Service?.descripcion || `Servicio #${d.idPrecioServicio}`,
            _precio:          d.PrecioServicio?.precio ?? "—",
            _tamaño:          d.PrecioServicio?.AnimalSize?.descripcion || null,
          }));
          setDetalles(mapped);
          setIdsOriginales(mapped.map(d => d.idDetalle));
        }).catch(() => {});
    }
  }, [isEdit, cita]);

  // ── Pre-carga de servicios cuando viene del botón REAGENDAR ──────
  // Se ejecuta solo cuando servicePrices ya cargó Y el modal viene de una reagenda.
  // Necesita estar separado porque servicePrices carga de forma asíncrona.
  useEffect(() => {
    if (!esReprogram) return;
    if (!servicePrices.length) return;
    if (!cita?.serviciosPreCargados?.length) return;

    const preloaded = cita.serviciosPreCargados.map(s => {
      const sp = servicePrices.find(p => p.idPrecioServicio === s.idPrecioServicio);
      return {
        idPrecioServicio:  s.idPrecioServicio,
        idEstadoServicio:  1,
        idPersonalRealiza: s.idPersonalRealiza || "",
        observaciones:     "",
        _descripcion:      sp?.Service?.descripcion || s.nombre || `Servicio #${s.idPrecioServicio}`,
        _precio:           sp?.precio ?? "—",
        _tamaño:           sp?.AnimalSize?.descripcion || null,
        _idTipoServicio:   sp?.Service?.idTipoServicio ?? null,
        _bloqueado:        true, // Viene de una reagenda — no se puede quitar
      };
    });
    setDetalles(preloaded);
  }, [servicePrices, esReprogram]);

  const handle = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(""); };

  const handleMascotaChange = (e) => {
    const val = e.target.value;
    if (detalles.length > 0 && val !== form.idMascota) { setPendingPet(val); }
    else { setForm(p => ({ ...p, idMascota: val })); }
    setError("");
  };

  const confirmPetChange = () => {
    setForm(p => ({ ...p, idMascota: pendingPet }));
    setDetalles([]);
    setPendingPet(null);
  };

  const addServiceRow = (sp) => {
    const tipoCita = Number(form.idTipoCita);
    const tipoServicio = Number(sp.Service?.idTipoServicio);
  
    // Bloqueo explícito de Estética (2) en citas Médicas (1 o 2)
    if ((tipoCita === 1 || tipoCita === 2) && tipoServicio === 2) {
      setError("No se pueden asignar servicios de estética a una cita de control o emergencia.");
      return;
    }
  
    // Lógica normal de agregar...
    if (detalles.find(d => d.idPrecioServicio === sp.idPrecioServicio)) {
      setError("Este servicio ya fue agregado.");
      return;
    }
  
    // Médico/Quirúrgico/Control (1,3,4) → vet anfitrión por defecto.
    // Estética (2) → sin asignar: el usuario debe elegir explícitamente quién
    // lo ejecuta para que esa persona tenga su agenda bloqueada correctamente.
    const ejecutorDefault = [1, 3, 4].includes(tipoServicio)
      ? (form.idVeterinario || "")
      : "";

    setDetalles(prev => [...prev, {
      idPrecioServicio:  sp.idPrecioServicio,
      idEstadoServicio:  1,
      idPersonalRealiza: ejecutorDefault,
      observaciones:     "",
      _descripcion:      sp.Service?.descripcion,
      _precio:           sp.precio,
      _tamaño:           sp.AnimalSize?.descripcion || null,
      _idTipoServicio:   tipoServicio,
    }]);
  };

  const handleEstadoBtn = (id) => setForm(p => ({ ...p, idEstadoCita: id }));

  const handleTipoCitaChange = (e) => {
    const nuevoTipo = e.target.value;
    const tipoAnterior = form.idTipoCita;
  
    // Si intenta cambiar el tipo y ya hay servicios en la lista de 'detalles'
    if (detalles.length > 0 && nuevoTipo !== tipoAnterior) {
      setPendingTipoCita(nuevoTipo); 
      setShowTipoCitaError(true); // Disparamos tu modal personalizado
    } else {
      // Si no hay servicios, cambiamos el tipo directamente
      setForm(p => ({ ...p, idTipoCita: nuevoTipo }));
    }
  };
  
  const handleServiceChange = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;
    setDetalles(newDetalles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (detalles.length === 0) { setError("Agregá al menos un servicio."); return; }

    // Validar que todos los servicios de estética tengan un responsable asignado
    const esteticaSinResponsable = detalles.find(
      d => Number(d._idTipoServicio) === 2 && !d.idPersonalRealiza
    );
    if (esteticaSinResponsable) {
      setError(`El servicio "${esteticaSinResponsable._descripcion}" es de estética y requiere que asignes un responsable.`);
      return;
    }

    setLoading(true); setError(""); setSuccessMsg("");
  
    try {
      if (isEdit) {
        // 1. Datos básicos de la Cita
        const citaPayload = {
          fecha: form.fecha,
          hora: form.hora,
          idMascota: Number(form.idMascota),
          idTipoCita: Number(form.idTipoCita),
          idEstadoCita: Number(form.idEstadoCita),
          idVeterinario: Number(form.idVeterinario),
        };
        await axios.patch(`/appointment/${cita.idCita}`, citaPayload, { headers: headers() });
  
        // 2. Borrar los servicios que quitaste de la lista
        for (const idOrig of idsOriginales) {
          if (!detalles.find(d => d.idDetalle === idOrig)) {
            await axios.delete(`/appointment-detail/${idOrig}`, { headers: headers() });
          }
        }
  
        // 3. Crear los servicios nuevos que agregaste
        const nuevos = detalles.filter(d => !d._esExistente);
        for (const d of nuevos) {
          await axios.post("/appointment-detail", {
            idCita: cita.idCita,
            idPrecioServicio: Number(d.idPrecioServicio),
            // Manejo seguro para evitar Error 400
            idPersonalRealiza: d.idPersonalRealiza ? Number(d.idPersonalRealiza) : (form.idVeterinario ? Number(form.idVeterinario) : null),
            idEstadoServicio: 1,
            observaciones: d.observaciones || null,
          }, { headers: headers() });
        }

        // 4. ACTUALIZAR LOS SERVICIOS EXISTENTES (¡Esto es lo que faltaba!)
        // Permite guardar los cambios en "Responsable" y "Observaciones"
        const existentes = detalles.filter(d => d._esExistente);
        for (const d of existentes) {
          await axios.patch(`/appointment-detail/${d.idDetalle}`, {
            idPersonalRealiza: d.idPersonalRealiza ? Number(d.idPersonalRealiza) : null,
            observaciones: d.observaciones || null
          }, { headers: headers() });
        }
  
      } else {
        // ── CREAR CITA NUEVA ──
        const payload = {
          fecha: form.fecha,
          hora: form.hora,
          idMascota: Number(form.idMascota),
          idTipoCita: Number(form.idTipoCita),
          idEstadoCita: Number(form.idEstadoCita),
          idVeterinario: Number(form.idVeterinario),
          servicios: detalles.map(d => ({
            idPrecioServicio: Number(d.idPrecioServicio),
            // Manejo seguro de nulls para que MySQL no devuelva Error 400 Bad Request
            idPersonalRealiza: d.idPersonalRealiza ? Number(d.idPersonalRealiza) : (form.idVeterinario ? Number(form.idVeterinario) : null),
            idEstadoServicio: 1,
            observaciones: d.observaciones || null,
          })),
        };
        await axios.post("/appointment", payload, { headers: headers() }).then(async (resp) => {
          // Si viene de una reagenda, vinculamos cada detalle original con la nueva cita
          if (esReprogram && cita?.idOrigenDetalles?.length > 0) {
            const idNuevaCita = resp.data?.idCita;
            if (idNuevaCita) {
              await Promise.all(
                cita.idOrigenDetalles.map(idDetalle =>
                  axios.patch(
                    `/appointment-detail/${idDetalle}/vincular-reagenda`,
                    { idCitaNueva: idNuevaCita },
                    { headers: headers() }
                  ).catch(() => {})
                )
              );
            }
          }
        });
      }
  
      setSuccessMsg("✅ Operación exitosa.");
      setTimeout(() => { onSave(); }, 1500);
    } catch (err) {
      console.error(err);
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(" · ") : (err.response?.data?.msg || "Error al guardar los cambios."));
    } finally { 
      setLoading(false); 
    }
  };
  const obtenerResponsablesPorServicio = (servicio) => {
    // Usamos el idTipoServicio guardado en el objeto, no buscamos por texto.
    // 1=Médico  3=Quirúrgico  4=Control → solo veterinarios (rol 2)
    // 2=Estética → todo el personal (vets + staff), sin clientes
    const tipoSrv = Number(servicio._idTipoServicio || 0);
    if ([1, 3, 4].includes(tipoSrv)) {
      return vets;
    }
    // Estética u otro: unión de vets + staff sin duplicados
    return [
      ...vets,
      ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal)),
    ];
  };
  
  const inp = { width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${VET_COLORS.border}`, fontSize: 14, outline: "none", color: "#1a202c" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };

  const transiciones  = isEdit ? (ESTADO_TRANSITIONS[form.idEstadoCita] || []) : [];
  const estadoActual  = CITA_ESTADOS[form.idEstadoCita] || CITA_ESTADOS[1];
  const listaResponsables = [
    ...vets,
    ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal)),
  ];
  
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)" }} onClick={onClose} />

      {/* --- ALERTA EMERGENTE: DEBE SELECCIONAR MASCOTA --- */}
      {showMascotaError && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px", maxWidth: 350, width: "90%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#166534" }}>Atención</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
              {!form.idMascota 
                ? <>Debe primero <strong>seleccionar un paciente</strong> antes de buscar servicios.</>
                : <>Debe seleccionar el <strong>Tipo de Cita</strong> antes de buscar servicios.</>
              }
            </p>
            <button onClick={() => setShowMascotaError(false)}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#166534", color: "white", cursor: "pointer", fontWeight: 700 }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* --- ALERTA EMERGENTE POR CAMBIO DE TIPO --- */}
      {showTipoCitaError && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 9999, // Un número muy alto para que esté por encima de todo
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          background: "rgba(0,0,0,0.7)", 
          backdropFilter: "blur(4px)" 
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: 20, 
            padding: "32px", 
            maxWidth: 380, 
            width: "90%", 
            textAlign: "center", 
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#166534" }}>¿Cambiar tipo de cita?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Has seleccionado servicios que podrían no ser válidos para este tipo de cita. 
              Si continúas, <strong>se borrarán los servicios actuales</strong> para evitar errores.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setShowTipoCitaError(false);
                  setPendingTipoCita(null);
                }}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  // 1. Forzamos la limpieza de la lista de detalles primero
                  setDetalles([]); 
                  
                  // 2. Limpiamos también el registro de IDs originales (si es edición)
                  setIdsOriginales([]); 

                  // 3. Actualizamos el tipo de cita en el form
                  setForm(prev => ({ 
                    ...prev, 
                    idTipoCita: pendingTipoCita 
                  }));

                  // 4. Cerramos los estados de control
                  setPendingTipoCita(null);
                  setShowTipoCitaError(false);
              
                }}
                style={{ 
                  flex: 1, padding: "12px", borderRadius: 12, border: "none", 
                  background: "#166534", color: "white", fontWeight: 600, cursor: "pointer" 
                }}
              >
                Sí, cambiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cambio de mascota */}
      {pendingPet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🔄</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#166534" }}>¿Cambiar paciente?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Los <strong>servicios seleccionados se borrarán</strong> porque el tamaño del nuevo paciente puede ser diferente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPendingPet(null)}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
              <button onClick={confirmPetChange}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#166534", color: "white", cursor: "pointer", fontWeight: 700 }}>Sí, cambiar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", background: "white", borderRadius: 24, width: "min(95vw,860px)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>

        <div style={{ padding: "20px 28px", borderBottom: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafbfc", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#166534" }}>
              {isEdit ? "Editar turno" : "📅 Nuevo turno"}
            </h3>
            {isEdit && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>Cita #{cita.idCita}</p>}
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {successMsg && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, color: "#16a34a", fontSize: 14, fontWeight: 700 }}>
              {successMsg}
            </div>
          )}

          {esReprogram && (
            <div style={{ marginBottom: 16, padding: "14px 16px", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#92400e", marginBottom: 4 }}>
                🔄 Reagendando servicios de la Cita #{cita._origenReprogram}
              </div>
              <div style={{ fontSize: 12, color: "#c2410c", lineHeight: 1.5 }}>
                Los servicios a reagendar ya están cargados abajo (marcados con 🔒). Podés agregar servicios adicionales si es necesario. Solo elegí la nueva <strong>fecha y hora</strong>.
              </div>
            </div>
          )}


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={lbl}>Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handle} required min={isEdit ? undefined : today} style={inp} />
            </div>
            <div>
              <label style={lbl}>Hora *</label>
              <input type="time" name="hora" value={form.hora} onChange={handle} required style={inp} />
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Paciente (mascota) *</label>
            
              {(isEdit || esReprogram) ? (
                // Solo lectura en edición y reagenda — sin cambios
                <div style={{
                  ...inp,
                  background: "#f8fafc", color: "#166534",
                  fontWeight: 700, display: "flex", alignItems: "center",
                  cursor: "not-allowed", border: "1.5px solid #e2e8f0",
                }}>
                  🐾 {selectedPet?.nombre || "Cargando..."} — {selectedPet?.Dueño?.nombres} {selectedPet?.Dueño?.apellidos}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            
                  {/* Select de mascota existente */}
                  <select
                    name="idMascota"
                    value={form.idMascota}
                    onChange={handleMascotaChange}
                    required
                    style={inp}
                  >
                    <option value="">Seleccionar paciente existente…</option>
                    {pets.map(p => (
                      <option key={p.idMascota} value={p.idMascota}>
                        {p.nombre} — {p.Dueño?.nombres} {p.Dueño?.apellidos}
                        {p.AnimalSize?.descripcion ? ` (${p.AnimalSize.descripcion})` : ""}
                      </option>
                    ))}
                  </select>
            
                  {/* Separador visual */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
                      o registrar nuevo
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                  </div>
            
                  {/* Dos botones de registro rápido */}
                  <div style={{ display: "flex", gap: 8 }}>
            
                    {/* Botón A: cliente nuevo + mascota nueva */}
                    <button
                      type="button"
                      onClick={() => setShowNewPatient(true)}
                      style={{
                        flex: 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        padding: "9px 10px", borderRadius: 10,
                        border: "1.5px solid #1f5c38",
                        background: "white", color: "#1f5c38",
                        fontWeight: 700, fontSize: 12.5,
                        cursor: "pointer", transition: "background 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#eaf3de"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <span style={{ fontSize: 15 }}>🧑‍⚕️</span>
                      Nuevo cliente + mascota
                    </button>
            
                    {/* Botón B: mascota nueva de dueño existente */}
                    <button
                      type="button"
                      onClick={() => setShowNewPatient(true)}
                      style={{
                        flex: 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        padding: "9px 10px", borderRadius: 10,
                        border: "1.5px solid #d1ddd4",
                        background: "white", color: "#1a3d28",
                        fontWeight: 700, fontSize: 12.5,
                        cursor: "pointer", transition: "background 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4f1"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <span style={{ fontSize: 15 }}>🐾</span>
                      Mascota nueva — dueño existe
                    </button>
            
                  </div>
                </div>
              )}
            
              {/* Chip de tamaño — sin cambios */}
              {petSizeLabel && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    background: "#eff6ff", color: "#1a6bc4",
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    📏 Tamaño: {petSizeLabel}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    — Los servicios se filtran automáticamente
                  </span>
                </div>
              )}
            </div>
 

            <div>
              <label style={lbl}>Veterinario *</label>
              <select name="idVeterinario" value={form.idVeterinario} onChange={handle} required style={inp}>
                <option value="">Seleccionar veterinario...</option>
                {vets.map(v => (
                  <option key={v.idPersonal} value={v.idPersonal}>
                    {v.Staff?.nombres || v.nombres} {v.Staff?.apellidos || v.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Tipo de cita *</label>
              {(isEdit || esReprogram) ? (
                <div style={{ ...inp, background: "#f8fafc", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", cursor: "not-allowed", border: "1.5px solid #e2e8f0" }}>
                  {appointmentTypes.find(t => String(t.idTipoCita) === String(form.idTipoCita))?.descripcion || "—"}
                </div>
              ) : (
                <select 
                  name="idTipoCita" 
                  value={form.idTipoCita} 
                  onChange={handleTipoCitaChange} 
                  required 
                  style={inp}
                >
                  <option value="">Seleccionar...</option>
                  {appointmentTypes.map(t => (
                    <option key={t.idTipoCita} value={t.idTipoCita}>{t.descripcion}</option>
                  ))}
                </select>
              )}
            </div>
            {!isEdit && (
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Estado</label>
                <div style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #fde68a", background: "#fef9c3", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#b45309" }}>Pendiente</span>
                  <span style={{ fontSize: 12, color: "#92400e", marginLeft: 4, opacity: 0.7 }}>— asignado automáticamente</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1.5px solid #e2e8f0", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Servicios {detalles.length > 0 && <span style={{ color: "#1a6bc4" }}>({detalles.length})</span>}
              </h4>
              <button type="button" 
                onClick={() => {
                  if (!form.idMascota) { setShowMascotaError(true); } 
                  if (!form.idTipoCita) { setShowMascotaError(true); } 
                  else { setServiceModal(true); }
                }}
                style={{ padding: "8px 18px", background: "#166534", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                + Buscar servicio
              </button>
            </div>

            {detalles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 13 }}>Sin servicios. Hacé clic en "+ Buscar servicio".</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
                    {["Servicio", "Tamaño", "Precio", "Responsable", "Observaciones", ""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {detalles.map((servicio, idx) => {
                  // 1. FILTRADO DE RESPONSABLES POR TIPO DE SERVICIO (no por texto)
                  // _idTipoServicio: 1=Médico 3=Quirúrgico 4=Control → solo vets
                  //                  2=Estética → vets + staff (sin clientes)
                  const tipoSrvFila = Number(servicio._idTipoServicio || 0);
                  const esServicioMedico = [1, 3, 4].includes(tipoSrvFila);

                  // 2. FILTRADO DE RESPONSABLES
                  const responsablesPermitidos = esServicioMedico
                    ? vets
                    : [...vets, ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal))];

                  // 3. FUNCIÓN PARA OBTENER NOMBRE (Manejando la herencia de Staff)
                  const obtenerNombreCompleto = (p) => {
                    // Si es un objeto de la tabla Veterinarios, Sequelize suele traer el Staff anidado
                    if (p.Staff) {
                      return `${p.Staff.nombres} ${p.Staff.apellidos}`;
                    }
                    // Si es un objeto de la tabla Staff directamente
                    return `${p.nombres || ""} ${p.apellidos || ""}`.trim();
                  };

                  // Cita ya confirmada (cliente llegó): no se puede cambiar el responsable
                  const citaConfirmada = form.idEstadoCita === 2;
                  // Servicio marcado como reprogramado: se muestra tachado, sin edición ni borrado
                  const esReprogramadoSrv = servicio.idEstadoServicio === 7;

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f8fafc", opacity: esReprogramadoSrv ? 0.6 : 1 }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: esReprogramadoSrv ? "#94a3b8" : "#166534" }}>
                        <span style={{ textDecoration: esReprogramadoSrv ? "line-through" : "none" }}>
                          {servicio._descripcion}
                        </span>
                        {esReprogramadoSrv && (
                          <span style={{ marginLeft: 8, background: "#fff7ed", color: "#c2410c", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 4, border: "1px solid #fed7aa" }}>
                            🔄 Reprogramado
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {servicio._tamaño
                          ? <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{servicio._tamaño}</span>
                          : <span style={{ color: "#94a3b8", fontSize: 12 }}>Todos</span>}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: esReprogramadoSrv ? "#94a3b8" : "#16a34a", textDecoration: esReprogramadoSrv ? "line-through" : "none" }}>
                        ${servicio._precio ?? "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {esReprogramadoSrv ? (
                          <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>—</span>
                        ) : esServicioMedico ? (
                          // Médico/quirúrgico/control → select normal solo con vets
                          <select
                            value={servicio.idPersonalRealiza || ""}
                            disabled={citaConfirmada}
                            onChange={(e) => {
                              const nd = [...detalles];
                              nd[idx].idPersonalRealiza = e.target.value;
                              setDetalles(nd);
                            }}
                            style={{
                              background: citaConfirmada ? "#f8fafc" : "white",
                              cursor: citaConfirmada ? "not-allowed" : "pointer",
                              padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                              fontSize: 13, outline: "none",
                            }}
                          >
                            <option value="">Sin asignar</option>
                            {responsablesPermitidos.map(p => (
                              <option key={p.idPersonal} value={p.idPersonal}>
                                {obtenerNombreCompleto(p)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // Estética → botón que abre el picker de disponibilidad
                          <button
                            type="button"
                            disabled={citaConfirmada || !form.fecha || !form.hora}
                            onClick={() => setStaffPickerFor({ idx, servicioNombre: servicio._descripcion })}
                            title={!form.fecha || !form.hora ? "Primero elegí fecha y hora" : "Ver disponibilidad del personal"}
                            style={{
                              padding: "7px 12px", borderRadius: 8,
                              border: servicio.idPersonalRealiza
                                ? "1.5px solid #86efac"
                                : "1.5px dashed #f97316",
                              background: servicio.idPersonalRealiza ? "#f0fdf4" : "#fff7ed",
                              color: servicio.idPersonalRealiza ? "#166534" : "#c2410c",
                              fontSize: 12, fontWeight: 700, cursor: citaConfirmada ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {servicio.idPersonalRealiza
                              ? (() => {
                                  const p = responsablesPermitidos.find(x => String(x.idPersonal) === String(servicio.idPersonalRealiza));
                                  return p ? `✓ ${obtenerNombreCompleto(p).split(" ")[0]}` : "✓ Asignado";
                                })()
                              : "⚠️ Asignar responsable"}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <input 
                          placeholder="Obs. (opcional)" 
                          value={servicio.observaciones || ""}
                          disabled={esReprogramadoSrv}
                          onChange={e => { 
                            const nd = [...detalles]; 
                            nd[idx].observaciones = e.target.value; 
                            setDetalles(nd); 
                          }}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: esReprogramadoSrv ? "#f8fafc" : "white" }} 
                        />
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {servicio._bloqueado ? (
                          <span title="Servicio de reagenda — no se puede quitar" style={{ fontSize: 16, cursor: "default" }}>🔒</span>
                        ) : !esReprogramadoSrv && (
                          <button 
                            type="button" 
                            onClick={() => setDetalles(detalles.filter((_, i) => i !== idx))}
                            style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", borderRadius: 6, width: 28, height: 28, fontSize: 14, fontWeight: 700 }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: 13, borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancelar</button>
            <button type="submit" disabled={loading}
              style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#166534,#1f5c38)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear turno"}
            </button>
          </div>
        </form>
      </div>

      {/* Picker de disponibilidad para servicios de estética */}
      {staffPickerFor !== null && (
        <StaffAvailabilityPicker
          isOpen={true}
          onClose={() => setStaffPickerFor(null)}
          onSelect={(idPersonal) => {
            const nd = [...detalles];
            nd[staffPickerFor.idx].idPersonalRealiza = idPersonal;
            setDetalles(nd);
            setStaffPickerFor(null);
          }}
          fecha={form.fecha}
          hora={form.hora}
          servicioNombre={staffPickerFor.servicioNombre}
          staffList={[
            ...vets,
            ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal)),
          ]}
          appointments={appointments}
        />
      )}

      <ServiceModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setServiceModal(false)}
        onAddService={addServiceRow} 
        servicePrices={servicePrices} 
        petSize={petSizeId}
        form={form} 
        sizes={animalSizes}
      />

      {showNewPatient && (
        <NewPatientModal
          allClients={pets.map(p => p.Dueño).filter(Boolean).reduce((acc, d) => {
            // Deduplica clientes a partir de las mascotas ya cargadas — sin fetch extra
            if (!acc.find(c => c.idCliente === d.idCliente)) acc.push(d);
            return acc;
          }, [])}
          onClose={() => setShowNewPatient(false)}
          onCreated={(pet) => {
            // Inyecta la mascota en la lista sin recargar la página
            onPetAdded?.(pet);
            setForm(p => ({ ...p, idMascota: String(pet.idMascota) }));
            setShowNewPatient(false);
          }}
        />
      )}
    </div>
  );
}

// ── Modal: Vista Rápida del Historial Clínico de una Cita ─────────
function HistorialModal({ idCita, idMascota, nombreMascota, onClose }) {
  const [historial, setHistorial] = useState(null);
  const [vacunas,   setVacunas]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resH, resV] = await Promise.all([
          axios.get("/clinical-histories", { headers: headers() }),
          axios.get("/applied-vaccines",   { headers: headers() }).catch(() => ({ data: [] }))
        ]);
        const h = (resH.data || []).find(x => Number(x.idCita) === Number(idCita));
        setHistorial(h || null);
        if (h) {
          setVacunas((resV.data || []).filter(v => Number(v.idHistorial) === Number(h.idHistorial)));
        }
      } catch (e) {
        console.error("Error cargando historial:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idCita]);

  const fmtFechaCorta = (iso) => {
    if (!iso) return "—";
    return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(10,20,40,0.75)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>

        {/* ── Header ── */}
        <div style={{ background: "#166534", color: "white", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>Historial clínico</p>
            <h3 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700 }}>{nombreMascota}</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Cargando...</div>

          ) : !historial ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>No hay ficha clínica registrada para esta cita.</p>
            </div>

          ) : (
            <>
              {/* ── Encabezado de la ficha ── */}
              <div style={{ padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Cita #{idCita} · {fmtFechaCorta(historial.Cita?.fecha)}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: "#dcfce7", color: "#166534"
                }}>
                  {historial.EstadoMascota?.descripcion || "—"}
                </span>
              </div>

              {/* ── Signos vitales ── */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Peso", value: historial.peso ? `${historial.peso} kg` : "—" },
                  { label: "Temperatura", value: historial.temperatura ? `${historial.temperatura} °C` : "—" },
                  { 
                    label: "Veterinario", 
                    value: historial.Veterinario?.Staff 
                      ? `Dr/a. ${historial.Veterinario.Staff.nombres} ${historial.Veterinario.Staff.apellidos}` 
                      : `Dr/a. #${historial.idVeterinario}`,
                    small: true 
                  }
                ].map(({ label, value, small }) => (
                  <div key={label}>
                    <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: small ? 13 : 20, fontWeight: small ? 500 : 600, color: "#166534" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* ── Motivo ── */}
              <div style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Motivo de consulta</p>
                <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>{historial.motivo}</p>
              </div>

              {/* ── Síntomas + Diagnóstico ── */}
              <div style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Síntomas</p>
                  <p style={{ margin: 0, fontSize: 14, color: historial.sintomas ? "#334155" : "#cbd5e1", fontStyle: historial.sintomas ? "normal" : "italic" }}>
                    {historial.sintomas || "No registrados"}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Diagnóstico</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#166534" }}>{historial.diagnostico}</p>
                </div>
              </div>

              {/* ── Vacunas aplicadas ── */}
              {vacunas.length > 0 && (
                <div style={{ padding: "14px 24px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Vacunas aplicadas en esta visita
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {vacunas.map(v => (
                      <div key={v.idVacunaAplicada} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fefce8", borderRadius: 10, border: "1px solid #fef08a" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#166534" }}>
                            {v.Vacuna?.Producto?.nombre || v.Vacuna?.enfermedadPreventiva || `Vacuna #${v.idVacuna}`}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#92400e" }}>
                            Previene: {v.Vacuna?.enfermedadPreventiva || "—"} · Dosis: {v.dosis}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: "#854d0e", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}>
                          {fmtFechaCorta(v.fechaAplicacion)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#166534", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Ver detalles (solo lectura + link historial) ───────────
function DetailModal({ cita, onClose }) {
  const [detalles, setDetalles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  
  const [tratamientos, setTratamientos] = useState([]);
  const [showHistorial,  setShowHistorial]  = useState(false);
  const [showTratamientos, setShowTratamientos] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/appointment-details/cita/${cita.idCita}`, { headers: headers() })
      .then(r => setDetalles(r.data || []))
      .catch(() => setDetalles([]))
      .finally(() => setLoading(false));
  
    // Cargar tratamientos: primero buscamos el historial de esta cita
    axios.get("/clinical-histories", { headers: headers() })
    .then(async res => {
      const historial = (res.data || []).find(
        h => Number(h.idCita) === Number(cita.idCita)
      );
      if (!historial) return; // esta cita no tiene historial clínico

      const resTrats = await axios.get("/treatments", { headers: headers() });
      const tratsDelHistorial = (resTrats.data || []).filter(
        t => Number(t.idHistorial) === Number(historial.idHistorial)
      );

      // Para cada tratamiento, cargar sus medicamentos
      const tratsConMeds = await Promise.all(
        tratsDelHistorial.map(async t => {
          try {
            const resMeds = await axios.get(
              `/treatment-meds/${t.idTratamiento}`, 
              { headers: headers() }
            );
            return { ...t, medicamentos: resMeds.data || [] };
          } catch {
            return { ...t, medicamentos: [] };
          }
        })
      );

      setTratamientos(tratsConMeds);
    })
    .catch(() => {});
  }, [cita.idCita]);

  const est = CITA_ESTADOS[cita.idEstadoCita] || CITA_ESTADOS[1];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(10,20,40,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>

        <div style={{ background: "#166534", color: "white", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Cita #{cita.idCita}</h3>
              <span style={{ background: est.bg, color: est.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{est.label}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
              {cita.Mascota?.nombre} · {cita.Veterinario ? `Dr/a. ${cita.Veterinario.nombres} ${cita.Veterinario.apellidos}` : "—"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${VET_COLORS.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
          {[
            ["Paciente", cita.Mascota?.nombre || "—"],
            ["Dueño",    `${cita.Mascota?.Dueño?.nombres || "—"} ${cita.Mascota?.Dueño?.apellidos || ""}`],
            ["Fecha",    fmtFecha(cita.fecha)],
            ["Hora",     (cita.hora?.slice(0, 5) || "—") + " hs"],
            ["Tipo",     cita.TipoCita?.descripcion || "—"],
            ["Vet.",     cita.Veterinario ? `${cita.Veterinario.nombres} ${cita.Veterinario.apellidos}` : "—"],
            ["Registró", cita.Registrador ? `${cita.Registrador.nombres} ${cita.Registrador.apellidos}` : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Botones de acceso rápido */}
        {cita.idMascota && cita.idEstadoCita !== 3 &&
        detalles.some(d => [1, 3, 4].includes(d.PrecioServicio?.Service?.idTipoServicio)) && (
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${VET_COLORS.border}`, background: "#f0f9ff", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowHistorial(true)}
              style={{ 
                display: "flex", alignItems: "center", gap: 8, background: "none", 
                border: "1.5px solid #bae6fd", borderRadius: 10, padding: "8px 16px",
                cursor: "pointer", color: "#0284c7", fontWeight: 700, fontSize: 13
              }}
            >
              📋 Ver ficha clínica de {cita.Mascota?.nombre}
            </button>

            {tratamientos.length > 0 && (
              <button
                onClick={() => setShowTratamientos(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, background: "none",
                  border: "1.5px solid #e9d5ff", borderRadius: 10, padding: "8px 16px",
                  cursor: "pointer", color: "#7c3aed", fontWeight: 700, fontSize: 13
                }}
              >
                💊 Tratamientos ({tratamientos.length})
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Servicios</h4>
          {loading ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Cargando...</p>
          ) : detalles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
              <p style={{ margin: 0, fontSize: 13 }}>Sin servicios registrados.</p>
            </div>
          ) : detalles.map(d => {
            const sEst = SERV_ESTADOS[d.idEstadoServicio] || SERV_ESTADOS[1];
            return (
              <div key={d.idDetalle} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>
                      {d.PrecioServicio?.Service?.descripcion || `Servicio #${d.idDetalle}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {d.Ejecutor ? `Realizado por: ${d.Ejecutor.nombres} ${d.Ejecutor.apellidos}` : "Sin personal asignado"}
                      {d.observaciones && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {d.observaciones}</span>}
                    </div>
                  </div>
                  <span style={{ background: sEst.bg, color: sEst.color, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, flexShrink: 0, marginLeft: 12 }}>{sEst.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showHistorial && (
        <HistorialModal
          idCita={cita.idCita}
          idMascota={cita.idMascota}
          nombreMascota={cita.Mascota?.nombre}
          onClose={() => setShowHistorial(false)}
        />
      )}

      {showTratamientos && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(10,20,40,0.75)", backdropFilter: "blur(8px)" }}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ background: "#5b21b6", color: "white", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Tratamientos activos</p>
                <h3 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700 }}>{cita.Mascota?.nombre}</h3>
              </div>
              <button onClick={() => setShowTratamientos(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {tratamientos.map(t => (
                <div key={t.idTratamiento} style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid #e9d5ff", background: "#faf5ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>{t.descripcion}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {t.TipoTratamiento?.nombre || "—"} · 📅 {t.fechaInicio}{t.fechaFin ? ` → ${t.fechaFin}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                      {t.EstadoTratamiento?.descripcion || "En curso"}
                    </span>
                    <select
                      defaultValue={t.idEstadoTratamiento}
                      onChange={async (e) => {
                        try {
                          await axios.patch(`/treatment/${t.idTratamiento}`, { idEstadoTratamiento: Number(e.target.value) }, { headers: headers() });
                          // Refrescar tratamientos
                          const resTrats = await axios.get("/treatments", { headers: headers() });
                          const resHist = await axios.get("/clinical-histories", { headers: headers() });
                          const historial = (resHist.data || []).find(h => Number(h.idCita) === Number(cita.idCita));
                          if (!historial) return;
                          const tratsDelHistorial = (resTrats.data || []).filter(t => Number(t.idHistorial) === Number(historial.idHistorial));
                          const tratsConMeds = await Promise.all(tratsDelHistorial.map(async t => {
                            try {
                              const resMeds = await axios.get(`/treatment-meds/${t.idTratamiento}`, { headers: headers() });
                              return { ...t, medicamentos: resMeds.data || [] };
                            } catch { return { ...t, medicamentos: [] }; }
                          }));
                          setTratamientos(tratsConMeds);
                        } catch (e) {
                          console.error("Error actualizando estado:", e);
                        }
                      }}
                      style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #e9d5ff", background: "white", cursor: "pointer", color: "#5b21b6" }}
                    >
                      <option value={1}>En curso</option>
                      <option value={5}>Pendiente</option>
                      <option value={3}>Finalizado</option>
                      <option value={4}>Suspendido</option>
                      <option value={6}>Cancelado</option>
                    </select>
                  </div>
                  </div>
                  {t.medicamentos?.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Medicamentos</div>
                      {t.medicamentos.map(m => (
                        <div key={m.idTratMed} style={{ background: "white", borderRadius: 8, padding: "8px 12px", border: "1px solid #e9d5ff", fontSize: 13 }}>
                          <div style={{ fontWeight: 600, color: "#166534" }}>
                            {m.Producto?.nombre || `Producto #${m.idProd_Pres}`}
                            <span style={{ marginLeft: 8, color: "#64748b", fontWeight: 400 }}>× {m.cantidad}</span>
                          </div>
                          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{m.instrucciones}</div>
                          {m.notas && <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>📝 {m.notas}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
              <button onClick={() => setShowTratamientos(false)} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#5b21b6", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [pets,   setPets]   = useState([]);
  const [vets,   setVets]   = useState([]);
  const [staff,  setStaff]  = useState([]);
  const [types,  setTypes]  = useState([]);
  const [states, setStates] = useState([]);
  const [animalSizes, setAnimalSizes] = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [search,      setSearch]     = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterDate,  setFilterDate]  = useState("");
  const [modal,       setModal]       = useState(null);
  const [alertModal,  setAlertModal]  = useState(null);
  const [filterPago, setFilterPago] = useState("all");
  const [vistaAgenda, setVistaAgenda] = useState(false);
  const [fechaAgenda, setFechaAgenda] = useState(new Date().toLocaleDateString("en-CA"));
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  const user  = getUserFromToken();
  const userRole     = user?.idRol      || 1;
  const userPersonal = user?.idPersonal || null;
  const location = useLocation();
  
  if (userRole === 4) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: "#ef4444", fontSize: 24 }}>Acceso denegado</h2>
        <p style={{ color: "#64748b" }}>No tenés permisos para acceder a la gestión de turnos.</p>
      </div>
    );
  }

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = filterDate ? `?date=${filterDate}` : "";
      const res = await axios.get(`/appointments${params}`, { headers: headers() });
      let data = res.data || [];
      if (userRole === 2 && userPersonal) data = data.filter(a => Number(a.idVeterinario) === Number(userPersonal));

      data.sort((a, b) => {
        const fechaA = a.fecha + "T" + (a.hora || "00:00");
        const fechaB = b.fecha + "T" + (b.hora || "00:00");
        return fechaB.localeCompare(fechaA);
      });

      // El asistente (rol 3) ve TODAS las citas — es quien maneja la agenda
      // No se filtra por idPersonalRealiza
      setAppointments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleConfirmarLlegada = (id) => {
    setAlertModal({ type: "confirmLlegada", idCita: id });
  };
  
  const execConfirmarLlegada = async () => {
    try {
      const id = alertModal.idCita;
      await axios.patch(`/appointment/${id}/confirm`, {}, { headers: headers() });
      setAlertModal({ type: "success", title: "¡Llegada confirmada!", msg: "La cita ahora está en estado Confirmada." });
      loadAppointments();
    } catch (e) {
      setAlertModal({ type: "error", msg: e.response?.data?.msg || "Error al confirmar llegada." });
    }
  };
  
  const getInfoPago = (detalles = []) => {
    const total = detalles.length;
    const realizados = detalles.filter(d => d.idEstadoServicio === 3).length; // Por cobrar
    const pagados = detalles.filter(d => d.idEstadoServicio === 5).length;
  
    if (realizados === 0 && pagados === 0) return null;

    if (pagados === total) {
      return { label: "PAGADO", color: "#16a34a", bg: "#f0fdf4" };
    }
    
    if (pagados > 0 && realizados > 0) {
      return { label: `PARCIAL ${pagados}/${total}`, color: "#2563eb", bg: "#eff6ff" };
    }

    if (realizados > 0) {
      return { label: "POR COBRAR", color: "#dc2626", bg: "#fef2f2" };
    }
    
    return null;
  };

  useEffect(() => {
    Promise.all([
      axios.get("/pets",               { headers: headers() }),
      axios.get("/veterinarians",      { headers: headers() }),
      axios.get("/staffs",              { headers: headers() }),
      axios.get("/appointment-types",  { headers: headers() }),
      axios.get("/appointment-states", { headers: headers() }),
      axios.get("/animal-sizes", { headers: headers() })
    ]).then(([p, v, s, t, st, res]) => {
      setPets(p.data || []); setVets(v.data || []); setStaff(s.data || []);
      setTypes(t.data || []); setStates(st.data || []); setAnimalSizes(res.data);
    }).catch(console.error);
    verificarYEnviarRecordatorios();
  }, []);

  useEffect(() => { loadAppointments(); }, [filterDate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pago = params.get("filterPago");
    if (pago) {
      setFilterPago(pago);
    }
  }, [location.search]);

  const handleCancelar = async () => {
    try {
      await axios.delete(`/appointment/${alertModal.idCita}`, { headers: headers() });
      setAlertModal({ type: "success", title: "Turno cancelado", msg: "El turno fue cancelado y sus servicios actualizados correctamente." });
      loadAppointments();
    } catch (e) {
      setAlertModal({ type: "error", msg: e.response?.data?.msg || "No se pudo cancelar el turno." });
    }
  };

  const handleOpenReagendar = (cita) => {
    // 1. Decidimos qué servicios se van a la nueva cita
    // Si es pendiente (1), se van TODOS. 
    // Si es finalizada (4), solo los que el vet marcó para reagendar (no realizados ni cobrados).
    const serviciosAReagendar = cita.idEstadoCita === 1
    ? (cita.detalles || [])
    : (cita.detalles || []).filter(d => !d.idCitaNueva && d.idEstadoServicio !== 3 && d.idEstadoServicio !== 5);
    
    // 2. Abrimos el modal en modo "new" (porque es una cita nueva)
    setModal({
      type: "new",
      data: {
        idMascota: cita.idMascota,
        idVeterinario: cita.idVeterinario,
        idTipoCita: cita.idTipoCita,
        _origenReprogram: cita.idCita, // El ID de la cita que estamos "dejando atrás"
        serviciosPreCargados: serviciosAReagendar.map(d => ({
          idDetalleOrigen: d.idDetalle,
          idPrecioServicio: d.idPrecioServicio,
          nombre: d.PrecioServicio?.Service?.descripcion || "Servicio",
          bloqueado: true
        }))
      }
    });
  };

  const filtered = appointments.filter(a => {
    // 1. Filtro por texto (Buscador)
    const matchSearch = search === "" ||
      a.Mascota?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      `${a.Mascota?.Dueño?.nombres} ${a.Mascota?.Dueño?.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
      `${a.Veterinario?.nombres} ${a.Veterinario?.apellidos}`.toLowerCase().includes(search.toLowerCase());

    // 2. Filtro por Estado de Cita
    const matchEstado = filterState === "all" || String(a.idEstadoCita) === filterState;

    // 3. Filtro por Estado de Pago (Nueva lógica)
    const infoPago = getInfoPago(a.detalles || []);
    const labelPago = infoPago ? infoPago.label : "NADA";

    const matchPago = filterPago === "all" || 
                     (filterPago === "POR COBRAR" && labelPago === "POR COBRAR") ||
                     (filterPago === "PAGADO" && labelPago === "PAGADO") ||
                     (filterPago === "PARCIAL" && labelPago.includes("PARCIAL"));

    return matchSearch && matchEstado && matchPago;
  });

  const canCreate = [1, 3].includes(userRole);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px" }}>
      {/* ── Modales de alerta globales ── */}
      {alertModal?.type === "confirm" && (
        <AlertModal emoji="⚠️" emojiBg="linear-gradient(135deg,#fef3c7,#fde68a)"
          title="¿Anular este turno?"
          message="Se cancelará el turno y todos sus servicios pasarán a estado <strong>Cancelado</strong>."
          confirmText="Sí, anular" confirmBg="#ef4444"
          cancelText="Cancelar" onConfirm={handleCancelar} onCancel={() => setAlertModal(null)} />
      )}
      {/* NUEVO MODAL: Confirmación de Llegada */}
      {alertModal?.type === "confirmLlegada" && (
        <AlertModal emoji="🏥" emojiBg="linear-gradient(135deg,#e0f2fe,#7dd3fc)"
          title="Confirmar Llegada"
          message="¿Ha llegado el cliente a la clínica para ser atendido?"
          confirmText="Sí, llegó" confirmBg="#166534"
          cancelText="No aún" onConfirm={execConfirmarLlegada} onCancel={() => setAlertModal(null)} />
      )}
      {alertModal?.type === "success" && (
        <AlertModal emoji="✅" emojiBg="linear-gradient(135deg,#dcfce7,#86efac)"
          title={alertModal.title || "¡Listo!"}
          message={alertModal.msg}
          confirmText="Aceptar" confirmBg="#16a34a"
          onConfirm={() => setAlertModal(null)} />
      )}
      {alertModal?.type === "error" && (
        <AlertModal emoji="❌" emojiBg="linear-gradient(135deg,#fee2e2,#fecaca)"
          title="Error" message={alertModal.msg}
          confirmText="Cerrar" confirmBg="#ef4444"
          onConfirm={() => setAlertModal(null)} />
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#166534', fontWeight: 800 }}>Gestión de Citas</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Administra los turnos de la clínica</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setVistaAgenda(!vistaAgenda)} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            background: 'white',
            color: '#166534',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {vistaAgenda ? '📋 Ver Lista' : '📅 Ver Agenda'}
        </button>

        {canCreate && (
          <button onClick={() => setShowSlotPicker(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: "linear-gradient(135deg,#166534,#1f5c38)", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            + Nueva Cita
          </button>
        )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ background: "white", borderRadius: 16, border: `1.5px solid ${VET_COLORS.border}`, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ position: "relative", flex: "2 1 220px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
          <input placeholder="Buscar por mascota, dueño o veterinario..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: `1.5px solid ${VET_COLORS.border}`, fontSize: 14, outline: "none" }} />
        </div>
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          style={{ flex: "1 1 160px", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${VET_COLORS.border}`, fontSize: 14, outline: "none", cursor: "pointer" }}>
          <option value="all">Todos los estados</option>
          {Object.entries(CITA_ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select 
          value={filterPago} 
          onChange={e => setFilterPago(e.target.value)}
          style={{ 
            flex: "1 1 160px", 
            padding: "10px 14px", 
            borderRadius: 10, 
            border: `1.5px solid ${VET_COLORS.border}`, 
            fontSize: 14, 
            outline: "none", 
            cursor: "pointer",
            backgroundColor: filterPago !== "all" ? "#fef2f2" : "white" // Se pone rojizo si hay filtro activo
          }}
        >
          <option value="all">Todos los pagos</option>
          <option value="POR COBRAR">⚠️ Por Cobrar</option>
          <option value="PARCIAL">🔵 Pago Parcial</option>
          <option value="PAGADO">✅ Pagado</option>
        </select>
        <div style={{ display: "flex", gap: 8, flex: "1 1 200px" }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${VET_COLORS.border}`, fontSize: 14, outline: "none" }} />
          {filterDate && (
            <button onClick={() => setFilterDate("")}
              style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Vista condicional: Agenda o Tabla ── */}
      {vistaAgenda ? (
        <>
          <AgendaVisual
              staff={[
                  ...vets,
                  ...staff.filter(s => !vets.find(v => v.idPersonal === s.idPersonal)),
              ]}
              appointments={filtered}
              fechaSeleccionada={filterDate || new Date().toLocaleDateString("en-CA")}
              onEditCita={(cita) => setModal({ type: "detail", data: cita })}
          />
        </>
      ) : (
        <div style={{ background: "white", borderRadius: 16, border: `1.5px solid ${VET_COLORS.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Fecha · Hora", "Paciente", "Dueño", "Veterinario", "Tipo Cita", "Estado Cita", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1.5px solid ${VET_COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Cargando turnos...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>No se encontraron turnos.
                  </td></tr>
                ) : filtered.map((a, i) => {
                  const est = CITA_ESTADOS[a.idEstadoCita] || CITA_ESTADOS[1];
                  const infoPago = getInfoPago(a.detalles || []);
                  const esDeudaUrgente = a.idEstadoCita === 4 && infoPago?.label === "POR COBRAR";
                  // Cita con algún servicio reprogramado pendiente de reagendar
                  const serviciosRepro = (a.detalles || []).filter(d => Number(d.idEstadoServicio) === 7);
                  const tieneReprogramado = serviciosRepro.length > 0;
                  const faltaReagendar = serviciosRepro.some(d => !d.idCitaNueva); // ¿Hay alguno sin nueva cita asignada?
                  const idsNuevas = [...new Set(serviciosRepro.filter(d => d.idCitaNueva).map(d => d.idCitaNueva))]; // Obtenemos las nuevas citas si las hayconst tieneReprogramado = (a.detalles || []).some(d => d.idEstadoServicio === 7);

                  // 1. EDITAR: Solo Admin (1) y Asistente (3). Solo si está en Pendiente (1).
                  const canEdit = [1, 3].includes(userRole) && a.idEstadoCita === 1;
                  // 2. LLEGÓ (Confirmar): Solo Admin (1) y Asistente (3). Solo si está en Pendiente (1).
                  const canConfirmar = [1, 3].includes(userRole) && a.idEstadoCita === 1;
                  // 3. ANULAR: Solo Admin (1) y Asistente (3). Solo si está en Pendiente (1).
                  const canDelete = [1, 3].includes(userRole) && a.idEstadoCita === 1;
                  // 4. ATENDER: 
                  // Verificamos si el usuario logueado es el responsable de algún servicio en esta cita
                  const estaAsignadoALaCita = (a.detalles || []).some(d => 
                    Number(d.idPersonalRealiza) === userPersonal
                  );
                  // - Admin (1) ve todo.
                  // - Vet (2) y Asistente (3) ven "Atender" solo si el estado es Confirmada (2) 
                  //   Y están asignados a la cita.
                  const canAttend = userRole === 1 || ([2, 3].includes(userRole) && a.idEstadoCita === 2 && estaAsignadoALaCita);

                  const mostrarBotonReagendar = [1, 3].includes(userRole) && tieneReprogramado && faltaReagendar;
                  
                  // Estilo condicional para la fila
                  const cellBgColor = esDeudaUrgente ? "#fff5f5" : tieneReprogramado ? "#fffbeb" : "transparent";
                  const opacityStyle = a.idEstadoCita === 3 ? { opacity: 0.6 } : {}; // Opacidad reducida si está anulada
                  return (
                    <tr key={a.idCita} style={{ transition: "background 0.2s ease" }}>
                      <td style={{ 
                        padding: "12px 16px", 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: "#64748b", 
                        background: cellBgColor, 
                        borderLeft: esDeudaUrgente ? "4px solid #dc2626" : "none",
                        verticalAlign: "top" // Alineamos arriba para que el ID no se mueva
                      }}>
                        {/* El número de Cita */}
                        <div>{a.idCita}</div>

                        {/* Firma de creación: Quién creó el registro */}
                        {a.Registrador && (
                          <div style={{ 
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2
                          }}>
                            <span style={{ 
                              fontSize: 9, 
                              color: "#cbd5e1", 
                              fontWeight: 800, 
                              textTransform: "uppercase",
                              letterSpacing: "0.03em" 
                            }}>
                              Creado por:
                            </span>
                            <span style={{ 
                              fontSize: 10, 
                              color: "#94a3b8", 
                              fontWeight: 500,
                              whiteSpace: "nowrap" 
                            }}>
                              {a.Registrador.nombres}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#166534", background: cellBgColor }}>
                        <div style={{ fontWeight: 700 }}>{fmtFecha(a.fecha)}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>⏱️ {a.hora}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#166534", background: cellBgColor }}> {a.Mascota?.nombre || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", background: cellBgColor }}>
                        {a.Mascota?.Dueño ? `${a.Mascota.Dueño.nombres} ${a.Mascota.Dueño.apellidos}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", background: cellBgColor }}>
                        {a.Veterinario ? `Dr. ${a.Veterinario.nombres}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", background: cellBgColor }}>
                        <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                          {a.TipoCita?.descripcion || "—"}
                        </span>
                      </td>
                      {/* COLUMNA DE ESTADO CITA */}
                      <td style={{ padding: "12px 16px", background: cellBgColor }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {/* Estado Médico */}
                          <span style={{ 
                            background: est.bg, 
                            color: est.color, 
                            padding: "4px 10px", 
                            borderRadius: 20, 
                            fontSize: 11, 
                            fontWeight: 800, 
                            textTransform: "uppercase", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: 5, 
                            width: "fit-content" 
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot }} />
                            {est.label}
                          </span>
                          
                          {/* Estado de Pago */}
                          {infoPago && (
                            <span style={{ 
                              background: infoPago.bg, 
                              color: infoPago.color, 
                              fontSize: 10, 
                              fontWeight: 800, 
                              padding: "2px 8px", 
                              borderRadius: 6,
                              border: `1px solid ${infoPago.color}40`,
                              width: "fit-content",
                              boxShadow: esDeudaUrgente ? "0 0 8px rgba(220, 38, 38, 0.25)" : "none"
                            }}>
                              💰 {infoPago.label}
                            </span>
                          )}
                          {/* MENSÁJE DE REPROGRAMACIÓN: Visible para TODOS (Admin, Asistente y Vet) */}
                          {tieneReprogramado && (
                              <div style={{ marginTop: 4 }}>
                                  {faltaReagendar ? (
                                      <span style={{ 
                                          background: "#fff7ed", color: "#c2410c", padding: "3px 8px", 
                                          borderRadius: 6, fontSize: 10, fontWeight: 800, border: "1.5px solid #f97316",
                                          display: "inline-flex", alignItems: "center", gap: 4
                                      }}>
                                          ⚠️ REPROGRAMACIÓN PENDIENTE
                                      </span>
                                  ) : (
                                      <span style={{ 
                                          background: "#dcfce7", color: "#166534", padding: "3px 8px", 
                                          borderRadius: 6, fontSize: 10, fontWeight: 800, border: "1.5px solid #22c55e",
                                          display: "inline-flex", alignItems: "center", gap: 4
                                      }}>
                                          ✅ REAGENDADA (ver cita #{idsNuevas.join(", ")})
                                      </span>
                                  )}
                              </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", background: cellBgColor }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          
                          {/* Botón Ver: Siempre disponible para todos */}
                          <button onClick={() => setModal({ type: "detail", data: a })}
                            style={{ padding: "6px 11px", borderRadius: 8, border: `1.5px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#166534" }}>
                            Ver
                          </button>

                          {/* ACCIONES PARA PENDIENTES (Estado 1) - Solo visibles para Roles 1 y 3 */}
                          {a.idEstadoCita === 1 && (
                            <>
                              {canConfirmar && (
                                <button onClick={() => handleConfirmarLlegada(a.idCita)}
                                  style={{ padding: "6px 11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#166534,#1f5c38)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                  Llegó
                                </button>
                              )}
                              
                              {canEdit && (
                                <button onClick={() => setModal({ type: "edit", data: a })}
                                  style={{ padding: "6px 11px", borderRadius: 8, border: `1.5px solid ${VET_COLORS.border}`, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#166534" }}>
                                  Editar
                                </button>
                              )}

                              {/* Botón Reagendar: Solo Admin/Asistente */}
                              {[1, 3].includes(userRole) && (
                                <button onClick={() => handleOpenReagendar(a)}
                                  style={{ padding: "6px 11px", borderRadius: 8, border: "1.5px solid #1f5c38", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1f5c38" }}>
                                  Reagendar
                                </button>
                              )}

                              {canDelete && (
                                <button onClick={() => setAlertModal({ type: "confirm", idCita: a.idCita })}
                                  style={{ padding: "6px 11px", borderRadius: 8, border: "1.5px solid #dc2626", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
                                  Anular
                                </button>
                              )}
                            </>
                          )}

                          {/* ACCIONES PARA CONFIRMADAS (Estado 2) */}
                          {/* Aquí es donde el veterinario finalmente ve el botón "Atender" */}
                          {a.idEstadoCita === 2 && canAttend && (
                            <button onClick={() => setModal({ type: "attend", data: a })}
                              style={{ padding: "6px 11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#166534,#1f5c38)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                              Atender
                            </button>
                          )}

                          {/* BOTÓN REAGENDAR: Aquí aplicamos tu lógica original pero en esta columna */}
                          {mostrarBotonReagendar && (
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      setModal({ 
                                          type: "new", 
                                          data: {
                                              idMascota: a.idMascota,
                                              idVeterinario: a.idVeterinario,
                                              idTipoCita: a.idTipoCita,
                                              _origenReprogram: a.idCita,
                                              idOrigenDetalles: serviciosRepro.filter(d => !d.idCitaNueva).map(d => d.idDetalle),
                                              serviciosPreCargados: serviciosRepro
                                                  .filter(d => !d.idCitaNueva)
                                                  .map(d => ({
                                                      idPrecioServicio: d.idPrecioServicio,
                                                      nombre: d.PrecioServicio?.Service?.descripcion,
                                                      bloqueado: true
                                                  }))
                                          }
                                      });
                                  }}
                                  style={{ 
                                      padding: "6px 11px", borderRadius: 8, border: "1.5px solid #16a34a", 
                                      background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#16a34a" 
                                  }}
                              >
                                  Reagendar con Cliente
                              </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* ── SlotPicker ── */}
      {showSlotPicker && (
        <SlotPickerModal
          fecha={filterDate || new Date().toLocaleDateString("en-CA")}
          vets={vets}
          staff={staff}
          appointments={appointments}
          onClose={() => setShowSlotPicker(false)}
          onSelect={(fecha, hora, idVeterinario) => {
            setShowSlotPicker(false);
            setModal({ type: "new", data: { fecha, hora, idVeterinario: String(idVeterinario) } });
          }}
        />
      )}

      {/* ── Modales ── */}
      {(modal?.type === "new" || modal?.type === "edit") && (
        <AppointmentModal
        mode={modal.type} 
        cita={modal.data || null}
        pets={pets} 
        vets={vets} 
        staff={staff} 
        appointmentTypes={types}
        animalSizes={animalSizes}
        appointments={appointments}
        onPetAdded={(pet) => setPets(prev => [...prev, pet])}  
        onClose={() => setModal(null)}
        onSave={() => { setModal(null); loadAppointments(); }}
      />
      )}
      {modal?.type === "detail" && <DetailModal cita={modal.data} onClose={() => setModal(null)} />}
      {modal?.type === "attend" && (
        <AttendServiceModal cita={modal.data} staff={staff}
          onClose={() => setModal(null)} onSave={() => loadAppointments()} />
      )}
    </div>
  );
}