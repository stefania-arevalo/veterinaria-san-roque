import { useState, useEffect } from 'react';
import { enviarComprobantePago } from '../../services/emailService';
import axios from '../../api/axios';

const token = () => localStorage.getItem('accessToken');
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function EmailComprobanteModal({ venta, onClose }) {
  const esConsumidorFinal = !venta.Cliente || Number(venta.idCliente) === 1 || venta.Cliente?.nombres === 'Consumidor';
  
  const [email, setEmail] = useState('');
  const [emailOriginal, setEmailOriginal] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(!esConsumidorFinal);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Buscar el correo del cliente desde el endpoint de clientes
  useEffect(() => {
    if (esConsumidorFinal) return;
    axios.get(`/client/${venta.idCliente}`, { headers: headers() })
      .then(res => {
        console.log('Respuesta cliente completa:', res.data);
        const correo = res.data?.correo || res.data?.email || '';
        setEmail(correo);
        setEmailOriginal(correo);
      })
      .catch(() => {})
      .finally(() => setLoadingEmail(false));
  }, [venta.idCliente]);

  const fmt = (n) => parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });

  const itemsDetalle = (venta.detalles || []).map(d => {
    const nombre = d.Producto?.nombre
      || d.DetalleCita?.PrecioServicio?.Service?.descripcion
      || 'Ítem';
    return `${nombre} x${d.cantidad} = $${fmt(d.precioUnidad * d.cantidad)}`;
  }).join('\n');

  const handleEnviar = async () => {
    if (!email || !email.includes('@')) return;
    setSending(true);
    const res = await enviarComprobantePago({
      toEmail: email,
      clienteNombre: esConsumidorFinal ? 'Cliente' : `${venta.Cliente?.nombres} ${venta.Cliente?.apellidos}`,
      ventaId: venta.idVenta,
      fecha: `${new Date(venta.fecha + 'T00:00:00').toLocaleDateString('es-AR')} ${venta.hora || ''}`,
      total: fmt(venta.total),
      tipoPago: venta.FormaPago?.descripcion || '',
      itemsDetalle,
    });
    setSending(false);
    setResult(res.ok ? 'ok' : 'error');
  };

  const C = {
    green900: '#1a3d28', green800: '#1f5c38', green100: '#eaf3de',
    border: '#d1ddd4', muted: '#6b8f76', text: '#1a3d28',
    red: '#a32d2d', redBg: '#fcebeb',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,30,20,0.55)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, border: `0.5px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

        <div style={{ background: C.green900, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 500, fontSize: 15 }}>Enviar comprobante</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Venta #{venta.idVenta} · ${fmt(venta.total)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {result === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 500, color: C.green800, fontSize: 15, marginBottom: 6 }}>¡Comprobante enviado!</div>
              <div style={{ color: C.muted, fontSize: 13 }}>Se envió a <strong>{email}</strong></div>
              <button onClick={onClose} style={{ marginTop: 20, padding: '10px 24px', background: C.green800, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Cerrar</button>
            </div>
          ) : result === 'error' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
              <div style={{ fontWeight: 500, color: C.red, fontSize: 15, marginBottom: 6 }}>No se pudo enviar</div>
              <div style={{ color: C.muted, fontSize: 13 }}>Verificá las variables de entorno en Vercel o el email ingresado.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setResult(null)} style={{ flex: 1, padding: '10px', background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.muted }}>Reintentar</button>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', background: C.red, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cerrar</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 6 }}>
                  {esConsumidorFinal ? 'Ingresá el email del cliente' : 'Confirmar o editar email'}
                </label>

                {loadingEmail ? (
                  <div style={{ padding: '11px 14px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, color: C.muted }}>
                    Buscando email del cliente...
                  </div>
                ) : (
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    autoFocus
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 14, outline: 'none', color: C.text, boxSizing: 'border-box' }}
                  />
                )}

                {!esConsumidorFinal && !loadingEmail && emailOriginal && email !== emailOriginal && (
                  <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
                    Email original: <strong>{emailOriginal}</strong>
                    <button onClick={() => setEmail(emailOriginal)} style={{ marginLeft: 8, background: 'none', border: 'none', color: C.green800, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      Restaurar
                    </button>
                  </div>
                )}
                {!esConsumidorFinal && !loadingEmail && !emailOriginal && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: 6 }}>
                    ⚠️ Este cliente no tiene email registrado. Podés escribirlo manualmente.
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fbf9', border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                <div>📋 {(venta.detalles || []).length} ítem{(venta.detalles || []).length !== 1 ? 's' : ''}</div>
                <div>💳 {venta.FormaPago?.descripcion || '—'}</div>
                <div>📅 {new Date(venta.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.muted, fontSize: 13 }}>
                  Cancelar
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={sending || loadingEmail || !email || !email.includes('@')}
                  style={{ flex: 2, padding: '11px', background: (sending || loadingEmail || !email) ? '#d1ddd4' : C.green800, color: 'white', border: 'none', borderRadius: 8, cursor: (sending || !email) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  {sending ? 'Enviando...' : '📧 Enviar comprobante'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}