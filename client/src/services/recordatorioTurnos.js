import { enviarRecordatorioTurno } from './emailService';

const STORAGE_KEY = 'recordatorios_enviados';

function getEnviados() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function marcarEnviado(idCita) {
  const enviados = getEnviados();
  enviados[idCita] = new Date().toISOString();
  // Limpiar los de más de 7 días para no llenar el storage
  const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
  Object.keys(enviados).forEach(k => {
    if (new Date(enviados[k]).getTime() < hace7dias) delete enviados[k];
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enviados));
}

export function estaRecordatorioEnviado(idCita) {
  return !!getEnviados()[idCita];
}

export async function enviarRecordatorioManual(cita, emailOverride) {
  const email = emailOverride?.trim() || cita.Mascota?.Dueño?.correo;
  if (!email) {
    return { ok: false, error: 'Ingresá un email para enviar el recordatorio.' };
  }

  const servicioPrincipal =
    cita.detalles?.[0]?.PrecioServicio?.Service?.descripcion || 'Consulta veterinaria';

  const resultado = await enviarRecordatorioTurno({
    clienteNombre: `${cita.Mascota?.Dueño?.nombres || ''} ${cita.Mascota?.Dueño?.apellidos || ''}`.trim(),
    clienteEmail:  email,
    fecha:         new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' }),
    hora:          cita.hora?.slice(0, 5) || '',
    mascotaNombre: cita.Mascota?.nombre || '',
    servicio:      servicioPrincipal,
  });

  if (resultado.ok) marcarEnviado(cita.idCita);
  return resultado;
}