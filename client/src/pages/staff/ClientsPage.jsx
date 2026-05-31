import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { createAndLinkUser, linkExistingUser, unlinkUser, authHeaders } from "../../hooks/userLinkHelpers";

const token = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ── Paleta clínica unificada ──────────────────────────────────────
const C = {
  white:       "#ffffff",
  green900:    "#1a3d28",
  green800:    "#1f5c38",
  green700:    "#276b42",
  green100:    "#eaf3de",
  green200:    "#c0dd97",
  border:      "#d1ddd4",
  borderLight: "#e8eee9",
  muted:       "#6b8f76",
  text:        "#1a3d28",
  surface:     "#f8fbf9",
  bg:          "#f0f4f1",
  red:         "#a32d2d",
  redBg:       "#fcebeb",
  blue:        "#185fa5",
  blueBg:      "#e6f1fb",
};

// ── Componentes UI ────────────────────────────────────────────────

function PageHeader({ title, icon, onNew, isAdmin, onGoUsers }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{icon} {title}</h2>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Administrá los clientes de la clínica</p>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {isAdmin && (
          <button
            onClick={onGoUsers}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10,
              border: "1.5px solid #d1ddd4",
              background: "white", color: "#1a3d28",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            👥 Ver usuarios
          </button>
        )}
        <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: `linear-gradient(135deg, #1a3d28, #1f5c38)`, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,61,40,0.25)" }}>
          <span style={{ fontSize: 18 }}>+</span> Nuevo cliente
        </button>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.45 }}>🔍</span>
      <input type="text" placeholder="Buscar por nombre, apellido o DNI…" value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 10, fontSize: 13.5, border: `1px solid ${C.border}`, background: C.white, outline: "none", color: C.text }} />
    </div>
  );
}

function SexBadge({ sexo }) {
  const map = {
    M: { label: "Masculino", bg: "#e6f1fb", color: "#185fa5" },
    F: { label: "Femenino",  bg: "#fce7f3", color: "#9d174d" },
    N: { label: "No espec.", bg: C.surface,  color: C.muted  },
  };
  const s = map[sexo] || map.N;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
}

function UserStateBadge({ estado }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: estado ? C.green100 : C.redBg, color: estado ? C.green800 : C.red, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: estado ? C.green700 : C.red, display: "inline-block" }} />
      {estado ? "Activo" : "Inactivo"}
    </span>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, loading, danger }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)" }}>
      <div style={{ background: C.white, borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 360, textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: danger ? C.redBg : C.green100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
          {danger ? "⚠️" : "✅"}
        </div>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: danger ? C.red : C.green800, color: "white", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel lateral de mascotas ─────────────────────────────────────
function PetsDrawer({ client, allPets, onClose }) {
  const pets = allPets.filter(p => p.idCliente === client.idCliente);

  const speciesIcon = (nombre) => {
    if (!nombre) return "🐾";
    const n = nombre.toLowerCase();
    if (n.includes("can") || n.includes("perr")) return "🐕";
    if (n.includes("gat") || n.includes("fel")) return "🐈";
    if (n.includes("ave") || n.includes("paj")) return "🦜";
    if (n.includes("cone")) return "🐇";
    if (n.includes("hamst") || n.includes("roedor")) return "🐹";
    return "🐾";
  };

  const formatDate = (d) => {
    if (!d) return "Sin dato";
    const date = new Date(d);
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 150,
          background: "rgba(10,30,20,0.35)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel lateral */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 160,
        width: "100%", maxWidth: 400,
        background: C.white,
        borderLeft: `1px solid ${C.border}`,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.22s ease",
      }}>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Cabecera del panel */}
        <div style={{
          background: C.green900, color: "white",
          padding: "18px 20px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
              Mascotas del cliente
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              {client.nombres} {client.apellidos}
            </h3>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              DNI {client.dni}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none", color: "white",
              width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 17,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Resumen */}
        <div style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${C.borderLight}`,
          background: C.surface,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            background: C.green100, color: C.green800,
            fontWeight: 700, fontSize: 13,
            padding: "4px 12px", borderRadius: 20,
          }}>
            🐾 {pets.length} mascota{pets.length !== 1 ? "s" : ""} registrada{pets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista de mascotas */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {pets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🐾</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Sin mascotas registradas</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>
                Este cliente aún no tiene pacientes en el sistema.
              </p>
            </div>
          ) : pets.map((pet) => {
            const especieNombre =
              pet.Raza?.Especie?.nombre ||
              pet.Breed?.Especie?.nombre ||
              pet.Breed?.Species?.nombre ||
              null;
            const razaNombre =
              pet.Raza?.descripcion ||
              pet.Raza?.nombre ||
              pet.Breed?.nombre ||
              null;

            return (
              <div
                key={pet.idMascota}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,61,40,0.1)";
                  e.currentTarget.style.borderColor = C.green200;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                {/* Fila superior: ícono + nombre + sexo */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: C.green100,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {speciesIcon(especieNombre)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{pet.nombre}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                      {especieNombre || "Especie no especificada"}
                      {razaNombre ? ` · ${razaNombre}` : ""}
                    </div>
                  </div>
                  {/* Badge sexo */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                    background: pet.sexo === "M" ? "#e6f1fb" : "#fce7f3",
                    color: pet.sexo === "M" ? C.blue : "#9d174d",
                  }}>
                    {pet.sexo === "M" ? "Macho" : "Hembra"}
                  </span>
                </div>

                {/* Grilla de detalles */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                  padding: "10px 12px",
                  background: C.surface,
                  borderRadius: 9,
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Tamaño</div>
                    <div style={{ color: C.text, fontWeight: 600 }}>{pet.AnimalSize?.descripcion || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Colores</div>
                    <div style={{ color: C.text, fontWeight: 600 }}>{pet.colores || "—"}</div>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Fecha de nacimiento</div>
                    <div style={{ color: C.text, fontWeight: 600 }}>{formatDate(pet.fechaNac)}</div>
                  </div>
                </div>

                {/* ID badge */}
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Paciente #{pet.idMascota}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Modal cliente ─────────────────────────────────────────────────
function ClientModal({ client, localities, onClose, onSave, mode }) {
  const { user } = useAuth();
  const isAdmin = user?.idRol === 1;
  const isEdit  = mode === "edit";
  const isView  = mode === "view";
  const hasUser = !!client?.User;

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 9, fontSize: 13.5,
    border: `1px solid ${C.border}`,
    background: isView ? C.surface : C.white,
    color: C.text, outline: "none",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: C.muted, marginBottom: 5,
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const [form, setForm] = useState({
    nombres:     client?.nombres     || "",
    apellidos:   client?.apellidos   || "",
    dni:         client?.dni         || "",
    sexo:        client?.sexo        || "M",
    telefono:    client?.telefono    || "",
    direccion:   client?.direccion   || "",
    correo:      client?.correo      || "",
    idLocalidad: client?.idLocalidad || "",
    usuario:     "",
    password:    "",
    estado:      client?.User?.estado ?? true,
  });

  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [showPassword,      setShowPassword]       = useState(false);
  const [accessMode,        setAccessMode]        = useState("none");
  const [existingUsers,     setExistingUsers]     = useState([]);
  const [loadingUsers,      setLoadingUsers]      = useState(false);
  const [selectedUserId,    setSelectedUserId]    = useState("");
  const [confirmUnlink,     setConfirmUnlink]     = useState(false);
  const [unlinking,         setUnlinking]         = useState(false);

  useEffect(() => {
    if (!hasUser && !isView && (isEdit || mode === "new")) {
      setLoadingUsers(true);
      axios.get("/users", { headers: authHeaders() })
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setExistingUsers(data.filter(u => u.idRol === 5 && !u.Client && !u.Staff));
        })
        .catch(() => setExistingUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [hasUser, isView, isEdit, mode]);

  const hc = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (error) setError("");
  };

  const validate = () => {
    const { nombres, apellidos, dni, telefono, direccion, idLocalidad } = form;
    if (!nombres || !apellidos || !dni || !telefono || !direccion || !idLocalidad)
      return "Completá todos los campos obligatorios.";
    if (!hasUser && accessMode === "create") {
      if (!form.usuario || form.usuario.length < 3) return "El usuario debe tener al menos 3 caracteres.";
      if (!form.password || form.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (!hasUser && accessMode === "existing" && !selectedUserId)
      return "Seleccioná un usuario para asociar.";
    if (hasUser && form.estado && form.password && form.password.length < 6)
      return "La nueva contraseña debe tener al menos 6 caracteres.";
    return null;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const payload = {
        nombres: form.nombres, apellidos: form.apellidos,
        dni: form.dni, sexo: form.sexo,
        telefono: form.telefono, direccion: form.direccion,
        idLocalidad: Number(form.idLocalidad),
        correo: form.correo?.trim() || null,
      };

      let clienteId = client?.idCliente;
      if (isEdit) {
        await axios.patch(`/client/${client.idCliente}`, payload, { headers: headers() });
      } else {
        const res = await axios.post("/client", payload, { headers: headers() });
        clienteId = res.data.idCliente;
      }

      if (!hasUser && accessMode === "create" && form.usuario && form.password) {
        await createAndLinkUser({
          usuario:    form.usuario,
          contraseña: form.password,
          idRol:      5,
          entityType: "client",
          entityId:   clienteId,
        });
      }

      if (!hasUser && accessMode === "existing" && selectedUserId) {
        await linkExistingUser({
          idUsuario:  selectedUserId,
          entityType: "client",
          entityId:   clienteId,
        });
      }

      if (hasUser && isAdmin) {
        const ud = { estado: form.estado };
        if (form.estado && form.password) ud.contraseña = form.password;
        await axios.patch(`/user/${client.User.idUsuario}`, ud, { headers: headers() });
      }

      onSave();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || "Error al procesar.";
      setError(msg);
      setShowConfirm(false);
    } finally { setLoading(false); }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkUser({ entityType: "client", entityId: client.idCliente });
      setConfirmUnlink(false);
      onSave();
    } catch (err) {
      setError(err?.response?.data?.msg || "Error al desvincular usuario.");
      setConfirmUnlink(false);
    } finally { setUnlinking(false); }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          title="Confirmar acción"
          message={`¿Confirmar ${isEdit ? "los cambios en" : "la creación de"} este cliente?`}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={loading}
        />
      )}

      {confirmUnlink && (
        <ConfirmModal
          danger
          title="¿Desvincular usuario?"
          message={`La cuenta "@${client.User.usuario}" quedará libre. El cliente no tendrá acceso hasta que se le asigne otra cuenta.`}
          onConfirm={handleUnlink}
          onCancel={() => setConfirmUnlink(false)}
          loading={unlinking}
        />
      )}

      <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,30,20,0.5)", backdropFilter: "blur(5px)" }}>
        <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

        <div style={{ position: "relative", background: C.white, borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "92vh", display: "flex", flexDirection: "column", margin: "0 16px", border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: C.green900, color: "white", padding: "18px 24px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                {isView ? "Solo lectura" : isEdit ? "Modificar datos" : "Registro nuevo"}
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {isView ? "Ver cliente" : isEdit ? "Editar cliente" : "Nuevo cliente"}
              </h3>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          {/* Cuerpo */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
            <form onSubmit={handlePreSubmit}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={lbl}>Nombres *</label><input name="nombres" value={form.nombres} onChange={hc} readOnly={isView} required style={inp} placeholder="Juan" /></div>
                <div><label style={lbl}>Apellidos *</label><input name="apellidos" value={form.apellidos} onChange={hc} readOnly={isView} required style={inp} placeholder="Pérez" /></div>
                <div><label style={lbl}>DNI *</label><input name="dni" value={form.dni} onChange={hc} readOnly={isView} required style={inp} placeholder="30123456" /></div>
                <div>
                  <label style={lbl}>Sexo *</label>
                  <select name="sexo" value={form.sexo} onChange={hc} disabled={isView} style={{ ...inp, cursor: "pointer" }}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="N">No especificado</option>
                  </select>
                </div>
                <div><label style={lbl}>Teléfono *</label><input name="telefono" value={form.telefono} onChange={hc} readOnly={isView} required style={inp} placeholder="2932 000000" /></div>
                <div><label style={lbl}>Correo electrónico</label><input name="correo" type="email" value={form.correo} onChange={hc} readOnly={isView} style={inp} placeholder="juan@mail.com" /></div>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Dirección *</label><input name="direccion" value={form.direccion} onChange={hc} readOnly={isView} required style={inp} placeholder="Av. San Martín 123" /></div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={lbl}>Localidad *</label>
                  <select name="idLocalidad" value={form.idLocalidad} onChange={hc} disabled={isView} required style={{ ...inp, cursor: "pointer" }}>
                    <option value="">Seleccionar localidad…</option>
                    {localities.map(l => <option key={l.idLocalidad} value={l.idLocalidad}>{l.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Sección acceso al sistema */}
              <div style={{ marginTop: 18, padding: "16px 18px", background: C.surface, borderRadius: 12, border: `1px solid ${C.borderLight}` }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  🔐 Acceso al sistema
                </h4>

                {hasUser ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.green100, borderRadius: 9, border: `1px solid ${C.green200}` }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted }}>Usuario</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>@{client.User.usuario}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>ID: {client.User.idUsuario}</div>
                      </div>
                      <UserStateBadge estado={form.estado} />
                    </div>

                    {isAdmin && !isView && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.text }}>
                          <input type="checkbox" name="estado" checked={form.estado} onChange={hc} style={{ width: 16, height: 16, accentColor: C.green700 }} />
                          {form.estado ? "Cuenta activa" : "Cuenta inactiva"}
                        </label>
                        {form.estado && (
                          <div style={{ position: "relative" }}>
                            <input type={showPassword ? "text" : "password"} name="password" onChange={hc} placeholder="Nueva contraseña (opcional)" style={{ ...inp, paddingRight: 40 }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              <img src={showPassword ? "/openeye.png" : "/closeeye.png"} alt="ver" style={{ width: 20, display: "block" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isAdmin && !isView && (
                      <div style={{ padding: "12px 14px", background: C.redBg, border: `1px solid #f7c1c1`, borderRadius: 9 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6 }}>⚠️ Zona peligrosa</div>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                          Desvincular elimina la asociación. El usuario <strong>no se elimina</strong>, solo queda libre.
                        </p>
                        <button type="button" onClick={() => setConfirmUnlink(true)} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: `1.5px solid ${C.red}`, background: "white", color: C.red, cursor: "pointer" }}>
                          🔓 Desvincular usuario
                        </button>
                      </div>
                    )}
                  </div>

                ) : !isView ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { key: "none",     icon: "⏭️", label: "Sin acceso",         desc: "Solo datos personales" },
                        { key: "create",   icon: "➕", label: "Crear usuario nuevo", desc: "Generar credenciales" },
                        // 🌟 Solo se incluye si es Administrador
                        ...(isAdmin ? [{ key: "existing", icon: "🔗", label: "Asociar existente", desc: "Vincular cuenta libre" }] : []),
                      ].map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => { setAccessMode(opt.key); setSelectedUserId(""); setError(""); }}
                          style={{
                            padding: "10px 8px", borderRadius: 9, textAlign: "center",
                            border: `2px solid ${accessMode === opt.key ? C.green700 : C.border}`,
                            background: accessMode === opt.key ? C.green100 : C.white,
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: accessMode === opt.key ? C.green800 : C.text }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {accessMode === "create" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "14px", background: C.white, borderRadius: 9, border: `1px solid ${C.border}` }}>
                        <div>
                          <label style={lbl}>Usuario</label>
                          <input name="usuario" value={form.usuario} onChange={hc} placeholder="3–50 caracteres" style={inp} autoComplete="off" />
                        </div>
                        <div>
                          <label style={lbl}>Contraseña</label>
                          <div style={{ position: "relative" }}>
                            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={hc} placeholder="Mínimo 6 caracteres" style={{ ...inp, paddingRight: 40 }} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              <img src={showPassword ? "/openeye.png" : "/closeeye.png"} alt="ver" style={{ width: 20, display: "block" }} />
                            </button>
                          </div>
                        </div>
                        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fce7f3", borderRadius: 8 }}>
                          <span style={{ fontSize: 16 }}>🐾</span>
                          <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Rol asignado automáticamente</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#be185d" }}>Cliente</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {accessMode === "existing" && (
                      <div style={{ padding: "14px", background: C.white, borderRadius: 9, border: `1px solid ${C.border}` }}>
                        {loadingUsers ? (
                          <p style={{ margin: 0, fontSize: 13, color: C.muted, textAlign: "center", padding: "8px 0" }}>Cargando usuarios disponibles...</p>
                        ) : existingUsers.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "12px 0" }}>
                            <div style={{ fontSize: 26, marginBottom: 6 }}>😔</div>
                            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No hay usuarios con rol <strong>Cliente</strong> disponibles para asociar.</p>
                            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Solo se muestran cuentas sin cliente vinculado.</p>
                          </div>
                        ) : (
                          <div>
                            <label style={lbl}>Seleccionar usuario</label>
                            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                              <option value="">— Elegir usuario —</option>
                              {existingUsers.map(u => (
                                <option key={u.idUsuario} value={u.idUsuario}>
                                  @{u.usuario} {u.estado ? "✅" : "❌"}
                                </option>
                              ))}
                            </select>
                            <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>Solo usuarios con rol 🐾 Cliente sin persona asignada.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {accessMode === "none" && (
                      <div style={{ padding: "14px", textAlign: "center", background: C.surface, borderRadius: 9, border: `1px dashed ${C.border}` }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
                        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                          El cliente se creará <strong>sin cuenta de acceso</strong>.<br />
                          Podés vincular un usuario más tarde desde esta pantalla.
                        </p>
                      </div>
                    )}
                  </div>

                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Sin usuario registrado.</p>
                )}
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: C.redBg, border: "1px solid #f7c1c1", borderRadius: 9, fontSize: 13, color: C.red }}>
                  ⚠️ {error}
                </div>
              )}

              {!isView && (
                <button type="submit" style={{ width: "100%", marginTop: 18, padding: 12, border: "none", borderRadius: 10, background: C.green800, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {isEdit ? "Guardar cambios" : "Crear cliente"}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function ClientsPage() {
  const [clients,     setClients]     = useState([]);
  const [localities,  setLocalities]  = useState([]);
  const [allPets,     setAllPets]     = useState([]);   // ← nuevo
  const [search,      setSearch]      = useState("");
  const [modal,       setModal]       = useState(null);
  const [petsDrawer,  setPetsDrawer]  = useState(null); // ← nuevo: cliente seleccionado para ver mascotas
  const [deleting,    setDeleting]    = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [cRes, lRes, pRes] = await Promise.all([
        axios.get("/clients",    { headers: headers() }),
        axios.get("/localities", { headers: headers() }),
        axios.get("/pets",       { headers: headers() }), // ← nuevo
      ]);
      setClients(cRes.data);
      setLocalities(lRes.data);
      setAllPets(pRes.data);                              // ← nuevo
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/client/${modal.data.idCliente}`, { headers: headers() });
      setModal(null); loadData();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const filtered = clients.filter(c =>
    `${c.nombres} ${c.apellidos} ${c.dni}`.toLowerCase().includes(search.toLowerCase())
  );

  // Contar mascotas por cliente con los datos ya cargados
  const petCountFor = (idCliente) =>
    allPets.filter(p => p.idCliente === idCliente).length;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px" }}>
      <PageHeader
        title="Clientes"
        icon="👤"
        onNew={() => setModal({ type: "new" })}
        isAdmin={user?.idRol === 1}
        onGoUsers={() => navigate("/admin/empleados/usuarios")}
      />

      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 240px" }}><SearchBar value={search} onChange={setSearch} /></div>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
            {loadingData ? "Cargando…" : `${filtered.length} cliente${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {["#", "Nombre", "DNI", "Sexo", "Teléfono", "Mascotas", "Usuario", "Estado cuenta", "Acciones"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: i === 8 ? "right" : "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>Cargando clientes…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>No se encontraron clientes.</td></tr>
              ) : filtered.map((c, i) => {
                const count = petCountFor(c.idCliente);
                return (
                  <tr
                    key={c.idCliente}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                    onMouseLeave={e => e.currentTarget.style.background = C.white}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{c.idCliente}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text }}>{c.nombres} {c.apellidos}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{c.dni}</td>
                    <td style={{ padding: "12px 16px" }}><SexBadge sexo={c.sexo} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{c.telefono}</td>

                    {/* ── Columna mascotas ── */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setPetsDrawer(c)}
                        title={`Ver mascotas de ${c.nombres}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 11px", borderRadius: 20,
                          border: `1.5px solid ${count > 0 ? C.green200 : C.border}`,
                          background: count > 0 ? C.green100 : C.surface,
                          color: count > 0 ? C.green800 : C.muted,
                          fontWeight: 700, fontSize: 12, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = count > 0 ? C.green200 : "#e8eee9";
                          e.currentTarget.style.borderColor = count > 0 ? C.green700 : C.muted;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = count > 0 ? C.green100 : C.surface;
                          e.currentTarget.style.borderColor = count > 0 ? C.green200 : C.border;
                        }}
                      >
                        🐾 {count}
                      </button>
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{c.User?.usuario || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>{c.User ? <UserStateBadge estado={c.User.estado} /> : <span style={{ fontSize: 11, color: C.muted }}>Sin acceso</span>}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => setModal({ type: "view", data: c })} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: 12, cursor: "pointer" }}>Ver</button>
                        <button onClick={() => setModal({ type: "edit", data: c })} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.green700}`, background: C.white, color: C.green700, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => setModal({ type: "delete", data: c })} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.red}`, background: C.white, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel lateral mascotas */}
      {petsDrawer && (
        <PetsDrawer
          client={petsDrawer}
          allPets={allPets}
          onClose={() => setPetsDrawer(null)}
        />
      )}

      {(modal?.type === "new" || modal?.type === "edit" || modal?.type === "view") && (
        <ClientModal mode={modal.type} client={modal.data} localities={localities} onClose={() => setModal(null)} onSave={() => { setModal(null); loadData(); }} />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal danger title="¿Eliminar cliente?" message={`Estás por borrar a ${modal.data.nombres} ${modal.data.apellidos}. Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setModal(null)} loading={deleting} />
      )}
    </div>
  );
}