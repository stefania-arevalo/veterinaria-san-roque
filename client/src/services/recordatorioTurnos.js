import axios from '../api/axios';
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

export async function verificarYEnviarRecordatorios() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Solo corre una vez por hora por sesión
    const ultimaVez = localStorage.getItem('ultima_verificacion_recordatorios');
    if (ultimaVez && Date.now() - Number(ultimaVez) < 60 * 60 * 1000) return;
    localStorage.setItem('ultima_verificacion_recordatorios', String(Date.now()));

    // Fecha de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toLocaleDateString('en-CA'); // YYYY-MM-DD

    const res = await axios.get(`/appointments?date=${fechaManana}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const citas = res.data || [];
    const enviados = getEnviados();

    for (const cita of citas) {
      // Solo cita pendientes (1) con email del cliente
      if (![1].includes(cita.idEstadoCita)) continue;
      const email = cita.Mascota?.Dueño?.correo;
      if (!email) continue;
      // Ya enviado hoy
      if (enviados[cita.idCita]) continue;

      const servicioPrincipal = cita.detalles?.[0]?.PrecioServicio?.Service?.descripcion || 'Consulta veterinaria';

      const resultado = await enviarRecordatorioTurno({
        clienteNombre: `${cita.Mascota?.Dueño?.nombres || ''} ${cita.Mascota?.Dueño?.apellidos || ''}`.trim(),
        clienteEmail:  email,
        fecha:         new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' }),
        hora:          cita.hora?.slice(0, 5) || '',
        mascotaNombre: cita.Mascota?.nombre || '',
        servicio:      servicioPrincipal,
      });

      if (resultado.ok) {
        marcarEnviado(cita.idCita);
        console.log(`✉️ Recordatorio enviado: Cita #${cita.idCita} → ${email}`);
      }

      // Esperar 1 segundo entre mails para no saturar EmailJS
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error('Error verificando recordatorios:', err);
  }
}