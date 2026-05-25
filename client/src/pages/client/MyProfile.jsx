import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "../../api/axios";

const C = {
  green900: "#1a3d28", green800: "#1f5c38", green700: "#276b42",
  green100: "#eaf3de", green200: "#c0dd97",
  border: "#d1ddd4", borderLight: "#e8eee9",
  muted: "#6b8f76", text: "#1a3d28", surface: "#f8fbf9", white: "#ffffff",
  red: "#a32d2d", redBg: "#fcebeb",
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "13px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: type === "error" ? C.red : C.green800,
      color: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

function Field({ label, name, value, onChange, disabled, type = "text", readOnly = false }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label} {readOnly && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(solo lectura)</span>}
      </label>
      <input
        name={name} type={type} value={value || ""}
        onChange={onChange}
        disabled={disabled || readOnly}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14,
          border: `1.5px solid ${!disabled && !readOnly ? C.green200 : C.borderLight}`,
          background: disabled || readOnly ? C.surface : C.white,
          color: disabled || readOnly ? C.muted : C.text,
          outline: "none", boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

export default function MyProfile() {
  const { user }       = useAuth();
  const [clientData, setClientData] = useState(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [original,   setOriginal]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); };

  useEffect(() => {
    if (user?.idCliente) {
      axios.get(`/client/${user.idCliente}`)
        .then(res => { setClientData(res.data); setOriginal(res.data); })
        .catch(() => showToast("Error al cargar el perfil.", "error"));
    }
  }, [user]);

  const handleChange = e => setClientData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCancel = () => { setClientData(original); setIsEditing(false); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombres: clientData.nombres, apellidos: clientData.apellidos,
        correo: clientData.correo, telefono: clientData.telefono,
        direccion: clientData.direccion, dni: clientData.dni,
        sexo: clientData.sexo, idLocalidad: clientData.idLocalidad,
      };
      await axios.patch(`/client/${user.idCliente}`, payload);
      setOriginal(clientData);
      setIsEditing(false);
      showToast("Perfil actualizado correctamente.");
    } catch {
      showToast("Error al guardar los cambios.", "error");
    } finally { setSaving(false); }
  };

  if (!clientData) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <p style={{ color: C.muted, fontSize: 14 }}>Cargando tu perfil...</p>
    </div>
  );

  const nombreCompleto = `${clientData.nombres} ${clientData.apellidos}`;
  const inicial = clientData.nombres?.[0]?.toUpperCase() || "?";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header de perfil */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green900}, ${C.green700})`,
        borderRadius: 18, padding: "28px 32px", color: "white",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: "0 8px 24px rgba(26,61,40,0.18)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.2)",
        }}>
          {inicial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Mi perfil</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{nombreCompleto}</h2>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 3 }}>
            🔐 @{clientData.User?.usuario || user?.usuario || "—"}
            {clientData.Locality && ` · 📍 ${clientData.Locality.nombre}`}
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "none",
              background: "rgba(255,255,255,0.15)", color: "white",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            ✏️ Editar
          </button>
        ) : (
          <button
            onClick={handleCancel}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.3)",
              background: "transparent", color: "white",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Formulario */}
      <div style={{
        background: C.white, borderRadius: 16, overflow: "hidden",
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ padding: "14px 24px", background: C.surface, borderBottom: `1px solid ${C.borderLight}` }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Datos personales</h3>
          {isEditing && <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>Los campos habilitados pueden modificarse.</p>}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Nombres"    name="nombres"    value={clientData.nombres}    onChange={handleChange} disabled={!isEditing} />
          <Field label="Apellidos"  name="apellidos"  value={clientData.apellidos}  onChange={handleChange} disabled={!isEditing} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Correo electrónico" name="correo" type="email" value={clientData.correo} onChange={handleChange} disabled={!isEditing} />
          </div>
          <Field label="Teléfono"   name="telefono"   value={clientData.telefono}   onChange={handleChange} disabled={!isEditing} />
          <Field label="Dirección"  name="direccion"  value={clientData.direccion}  onChange={handleChange} disabled={!isEditing} />

          {/* Separador */}
          <div style={{ gridColumn: "1 / -1", height: 1, background: C.borderLight, margin: "4px 0" }} />

          <Field label="DNI"  name="dni"  value={clientData.dni}  readOnly />
          <Field label="Sexo" name="sexo" value={clientData.sexo === "M" ? "Masculino" : clientData.sexo === "F" ? "Femenino" : "Otro"} readOnly />

          {isEditing && (
            <button
              type="submit"
              disabled={saving}
              style={{
                gridColumn: "1 / -1", padding: "12px",
                borderRadius: 10, border: "none",
                background: saving ? "#94a3b8" : C.green800,
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
        </form>
      </div>

      {/* Info de cuenta (solo lectura) */}
      <div style={{
        background: C.white, borderRadius: 16, padding: "20px 24px",
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: C.text }}>Cuenta del sistema</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.surface, borderRadius: 9, padding: "10px 14px", border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Usuario</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>@{clientData.User?.usuario || user?.usuario || "—"}</div>
          </div>
          <div style={{ background: C.surface, borderRadius: 9, padding: "10px 14px", border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Estado</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: clientData.User?.estado !== false ? C.green700 : C.red }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                {clientData.User?.estado !== false ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: C.muted }}>
          Para cambiar tu contraseña, contactá a la clínica.
        </p>
      </div>
    </div>
  );
}
