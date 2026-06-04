import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const T_TURNO     = import.meta.env.VITE_EMAILJS_TEMPLATE_TURNO;
const T_COMPROBANTE = import.meta.env.VITE_EMAILJS_TEMPLATE_COMPROBANTE;

export async function enviarRecordatorioTurno({ clienteNombre, clienteEmail, fecha, hora, mascotaNombre, servicio }) {
  if (!clienteEmail) return { ok: false, error: 'Sin email' };
  try {
    await emailjs.send(SERVICE_ID, T_TURNO, {
      to_email:             clienteEmail,
      cliente_nombre:       clienteNombre,
      mascota_nombre:       mascotaNombre,
      turno_fecha:          fecha,
      turno_hora:           hora,
      servicio_descripcion: servicio,
    }, PUBLIC_KEY);
    return { ok: true };
  } catch (err) {
    console.error('EmailJS turno:', err);
    return { ok: false, error: err };
  }
}

export async function enviarComprobantePago({ 
  toEmail, clienteNombre, ventaId, fecha, total, tipoPago, itemsDetalle, 
  esAnulada = false  
}) {
  if (!toEmail) return { ok: false, error: 'Sin email' };
  try {
    await emailjs.send(SERVICE_ID, T_COMPROBANTE, {
      to_email:       toEmail,
      cliente_nombre: clienteNombre,
      venta_id:       ventaId,
      venta_fecha:    fecha,
      venta_total:    `$${total}`,
      tipo_pago:      tipoPago,
      items_detalle:  itemsDetalle,
      estado_venta:   esAnulada ? '🚫 ANULADA' : '✅ Pagada',
      nota_anulacion: esAnulada 
        ? 'Tu comprobante de pago ha sido ANULADO. Si realizaste un pago, comunicate con nosotros para coordinar el reintegro.\n' 
        : '',
    }, PUBLIC_KEY);
    return { ok: true };
  } catch (err) {
    console.error('EmailJS comprobante:', err);
    return { ok: false, error: err };
  }
}