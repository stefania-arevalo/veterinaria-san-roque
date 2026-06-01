import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWindowSize } from "../../hooks/useWindowSize";

// ── Paleta verde clínica — extraída de la imagen adjunta ─────────
const P = {
  // Verdes principales
  forest:    "#1a3d28",   // verde oscuro — fondo navbar / headers
  pine:      "#1f5c38",   // verde medio — botones principales
  leaf:      "#276b42",   // verde claro — acentos
  sage:      "#4a7c5f",   // verde suave
  mint:      "#eaf3de",   // verde muy claro — fondos suaves
  foam:      "#f4faf0",   // verde casi blanco

  // Neutros limpios
  white:     "#ffffff",
  offWhite:  "#fafbfa",
  border:    "#d1ddd4",
  borderLight:"#e8eee9",
  text:      "#1a3d28",
  muted:     "#6b8f76",
  slate:     "#475569",

  // Feedback
  red:       "#a32d2d",
  redBg:     "#fcebeb",
};

// ── Navbar Corregido para Mobile ──────────────────────────────────
function Navbar({ onLoginClick, isMobile }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = ["Inicio", "Servicios", "Nosotros", "Contacto"];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 48px", height: 64,
        background: scrolled || mobileMenuOpen ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(14px)",
        boxShadow: scrolled || mobileMenuOpen ? `0 1px 0 ${P.border}, 0 4px 20px rgba(26,61,40,0.07)` : "none",
        transition: "all 0.3s ease",
      }}>
        <img src="/logo.png" alt="San Roque" style={{ height: 36, width: "auto", objectFit: "contain" }} />

        {/* Links en Escritorio */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} style={{
                fontSize: 13.5, fontWeight: 500, color: P.slate,
                textDecoration: "none", letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.target.style.color = P.pine}
              onMouseLeave={e => e.target.style.color = P.slate}
              >{l}</a>
            ))}
          </div>
        )}

        {/* Botonera Derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <button
            onClick={onLoginClick}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "6px 12px" : "8px 20px",
              fontSize: isMobile ? 12 : 13.5, borderRadius: 10,
              border: `1.5px solid ${P.pine}`,
              background: "white", color: P.pine,
              fontWeight: 600, cursor: "pointer",
              transition: "all 0.18s ease", letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = P.pine; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = P.pine; }}
          >
            <span style={{ fontSize: 13 }}>👤</span> Ingresar
          </button>

          {/* Botón menú hamburguesa (Solo en Mobile) */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none", border: "none", fontSize: 22, color: P.forest,
                cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center"
              }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </nav>

      {/* Menú Desplegable Mobile */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0,
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${P.border}`, zIndex: 99,
          padding: "16px 0", display: "flex", flexDirection: "column",
          boxShadow: "0 10px 20px rgba(26,61,40,0.05)",
          animation: "fadeIn 0.2s ease-out"
        }}>
          {navLinks.map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(" ", "-")}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: "12px 24px", fontSize: 14, fontWeight: 600,
                color: P.text, textDecoration: "none", borderLeft: `3px solid transparent`,
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.target.style.background = P.foam; e.target.style.borderLeftColor = P.leaf; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderLeftColor = "transparent"; }}
            >
              🐾 {l}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

// ── Formulario de login ───────────────────────────────────────────
function LoginForm({ onLogin, isMobile }) {
  const [form, setForm] = useState({ usuario: "", contraseña: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const hc = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.contraseña) { setError("Completá todos los campos."); return; }
    setLoading(true);
    try {
      await onLogin(form);
    } catch (err) {
      setError(err.response?.data?.msg || "Usuario o contraseña incorrectos.");
    } finally { setLoading(false); }
  };

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "11px 14px 11px 44px",
    borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${P.border}`,
    background: P.offWhite, color: P.text,
    outline: "none", transition: "all 0.2s",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      background: P.white,
      borderRadius: 20,
      boxShadow: "0 24px 64px rgba(26,61,40,0.14), 0 4px 16px rgba(0,0,0,0.06)",
      padding: isMobile ? "26px 18px" : "36px 32px",
      width: "100%",
      maxWidth: isMobile ? "92vw" : 380,
    }}>
      {/* Ícono + título */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 56, 
          height: 56, 
          borderRadius: 16, 
          margin: "0 auto 14px",
          background: `linear-gradient(135deg, ${P.forest}, ${P.leaf})`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          boxShadow: `0 6px 20px rgba(26,61,40,0.3)`,
          overflow: "hidden", 
          padding: "8px"      
        }}>
          <img
            src="/logo.png"
            alt="Logo San Roque"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <h3 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 700, color: P.forest }}>
          Acceso al Sistema
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: P.muted }}>
          Ingresá con tus credenciales
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: P.redBg, border: "1px solid #f7c1c1",
          borderLeft: `4px solid ${P.red}`,
          borderRadius: 10, padding: "10px 14px",
          color: P.red, fontSize: 13, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Usuario */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: P.forest, marginBottom: 6, letterSpacing: "0.03em" }}>
            Usuario
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.45 }}>👤</span>
            <input
              type="text" name="usuario" value={form.usuario}
              onChange={hc} placeholder="Tu usuario"
              autoComplete="username" style={inp}
              onFocus={e => { e.target.style.borderColor = P.leaf; e.target.style.background = P.foam; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
              onBlur={e => { e.target.style.borderColor = P.border; e.target.style.background = P.offWhite; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: P.forest, marginBottom: 6, letterSpacing: "0.03em" }}>
            Contraseña
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.45 }}>🔒</span>
            <input
              type={showPass ? "text" : "password"} name="contraseña"
              value={form.contraseña} onChange={hc}
              placeholder="Tu contraseña" autoComplete="current-password"
              style={{ ...inp, paddingRight: 44 }}
              onFocus={e => { e.target.style.borderColor = P.leaf; e.target.style.background = P.foam; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
              onBlur={e => { e.target.style.borderColor = P.border; e.target.style.background = P.offWhite; e.target.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, display: "flex", alignItems: "center",
              }}
            >
              <img
                src={showPass ? "/closeeye.png" : "/openeye.png"}
                alt={showPass ? "Ocultar" : "Mostrar"}
                style={{ width: 20, height: 20, opacity: 0.6 }}
              />
            </button>
          </div>
        </div>

        {/* Botón ingresar */}
        <button
          type="submit" disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#94a3b8" : `linear-gradient(135deg, ${P.forest}, ${P.pine})`,
            color: "white", border: "none", borderRadius: 11,
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 4px 20px rgba(26,61,40,0.3)`,
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 28px rgba(26,61,40,0.4)`; }}}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : `0 4px 20px rgba(26,61,40,0.3)`; }}
        >
          {loading ? (
            <>
              <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Ingresando...
            </>
          ) : "🐾 Ingresar"}
        </button>
      </form>

      {/* Seguridad */}
      <div style={{
        marginTop: 20, padding: "10px 14px", borderRadius: 10,
        background: P.mint, border: `1px solid ${P.borderLight}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 15 }}></span>
        <p style={{ margin: 0, fontSize: 12, color: P.pine, lineHeight: 1.5 }}>
          Acceso exclusivo para personal y clientes registrados.
        </p>
      </div>
    </div>
  );
}

// ── Tarjeta de servicio ───────────────────────────────────────────
function ServiceCard({ icon, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "28px 24px", borderRadius: 16,
        border: `1px solid ${hov ? P.borderLight : P.border}`,
        background: hov ? P.white : P.offWhite,
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 8px 32px rgba(26,61,40,0.1)" : "none",
        transition: "all 0.22s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 13,
        background: hov ? P.mint : P.white,
        border: `1px solid ${P.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, marginBottom: 14,
        transition: "background 0.2s",
      }}>{icon}</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: P.forest }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

// ── Sección "Cómo funciona el portal" ────────────────────────────
function HowItWorks({ isMobile }) {
  const steps = [
    { n: "01", icon: "📋", title: "Registrate como cliente", desc: "El personal de la clínica registra tus datos y los de tu mascota al momento de la primera consulta." },
    { n: "02", icon: "🔐", title: "Recibís tus credenciales", desc: "Se te asigna un usuario y contraseña para acceder al portal desde cualquier dispositivo." },
    { n: "03", icon: "🐾", title: "Gestioná desde tu portal", desc: "Consultá turnos, historial clínico, vacunas y los datos de tus mascotas en tiempo real." },
  ];
  return (
    <section style={{ padding: "80px 0", background: P.foam }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", fontSize: 12, fontWeight: 700,
            color: P.pine, background: P.mint,
            border: `1px solid ${P.borderLight}`,
            padding: "5px 16px", borderRadius: 99, marginBottom: 14,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>Portal de clientes</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 30, fontWeight: 800, color: P.forest, letterSpacing: "-0.5px" }}>
            ¿Cómo funciona?
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: P.muted, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            El portal está disponible para todos los clientes registrados en la clínica.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 16 : 32 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: "relative" }}>
              {!isMobile && i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 24, left: "calc(100% - 16px)",
                  width: 32, height: 2, background: P.border, zIndex: 0,
                }} />
              )}
              <div style={{
                background: P.white, borderRadius: 16, padding: "28px 24px",
                border: `1px solid ${P.border}`,
                boxShadow: "0 2px 12px rgba(26,61,40,0.05)",
                position: "relative", zIndex: 1,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: P.forest, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, marginBottom: 16,
                  letterSpacing: "0.02em",
                }}>{s.n}</div>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: P.forest }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function Footer({ isMobile }) {
  return (
    <footer style={{ background: P.forest, color: "rgba(255,255,255,0.75)", padding: isMobile ? "40px 18px 22px" : "52px 0 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0" : "0 48px"}}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 24 : 48, marginBottom: 48 }}>

          {/* Marca */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img
                src="/logo.png" alt="San Roque"
                style={{ height: 32, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.9 }}
                onError={e => e.target.style.display = "none"}
              />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", maxWidth: 280 }}>
              Sistema integral de gestión para la clínica veterinaria. Administración de turnos, historiales clínicos, stock y portal de clientes.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {["Punta Alta", "Buenos Aires"].map((tag, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)",
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "white", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Navegación</h4>
            {["Inicio", "Servicios", "Nosotros", "Contacto"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)",
                textDecoration: "none", marginBottom: 9, transition: "color 0.15s",
              }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.9)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
              >{l}</a>
            ))}
          </div>

          {/* Horarios */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "white", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Horarios</h4>
            {[
              { d: "Lun – Vie", h: "9:00 – 12:30 / 17:30 – 21:00" },
              { d: "Sábados",   h: "10:00 – 12:00" },
              { d: "Domingos",  h: "Cerrado" },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 1 }}>{r.d}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{r.h}</div>
              </div>
            ))}
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "white", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Contacto</h4>
            {[
              { icon: "📍", t: "Punta Alta, Buenos Aires." },
              { icon: "📞", t: "11 1234 5678" },
              { icon: "✉️", t: "info@sanroquevet.com.ar" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{c.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 0, textAlign: isMobile ? "center" : "left",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Clínica Veterinaria San Roque. Todos los derechos reservados.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Desarrollado por @stefaniaarevalo2026
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { isMobile, isTablet } = useWindowSize();

  useEffect(() => {
    if (user) navigate(user.idRol === 5 ? "/cliente" : "/admin");
  }, [user, navigate]);

  const handleLogin = async (data) => {
    const decoded = await login(data);
    navigate(decoded.idRol === 5 ? "/cliente" : "/admin");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "calc(100vh - 64px)", background: P.white }}>
      <Navbar onLoginClick={() => setShowForm(true)} isMobile={isMobile} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section id="inicio" style={{
        minHeight: isMobile ? "auto" : "calc(100vh - 64px)", // ✨ Resta el alto exacto del navbar
        paddingTop: isMobile ? "100px" : "64px",             // ✨ Separa el navbar sin romper dimensiones
        boxSizing: "border-box",                             // ✨ Asegura cálculo nativo estricto
        display: "flex", 
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(155deg, ${P.foam} 0%, ${P.white} 55%, ${P.mint} 100%)`,
        position: "relative", 
        overflow: "hidden",
      }}>
        {/* Círculos decorativos de fondo */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 420, height: 420, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(39,107,66,0.07), transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 360, height: 360, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(26,61,40,0.05), transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: isMobile ? "40px 20px" : "60px 48px",
          display: "flex", alignItems: "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 40 : 80, width: "100%",
        }}>
          
          {/* Texto izquierda */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? 26 : isTablet ? 38 : 50, fontWeight: 900, color: P.forest,
              textAlign: isMobile ? "center" : "left",
              margin: "0 0 22px", lineHeight: 1.08, letterSpacing: "-1.5px",
            }}>
              Cuidamos a<br />
              <span style={{ color: P.leaf }}>tu mascota</span><br />
              con dedicación
            </h1>

            <p style={{
              fontSize: isMobile ? 14 : 16.5,
              textAlign: isMobile ? "center" : "left",
              color: P.muted, lineHeight: 1.75,
              margin: "0 0 40px", maxWidth: 520,
            }}>
              Consultas veterinarias, vacunación, tratamientos, grooming y portal de clientes. Todo centralizado para brindarte la mejor atención en Punta Alta.
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 44 }}>
              {[
                { icon: "📝", l: "Atención clínica profesional",    d: "Consultas, diagnósticos y seguimiento médico." },
                { icon: "💉", l: "Vacunación y tratamientos",       d: "Control sanitario y cuidado preventivo." },
                { icon: "✂️", l: "Grooming y estética",             d: "Baño, corte y limpieza especializada." },
                { icon: "💊", l: "Productos veterinarios",          d: "Medicamentos, alimentos y accesorios." },
              ].map((f, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: "flex", 
                    flexDirection: isMobile ? "column" : "row", 
                    alignItems: "center", 
                    textAlign: isMobile ? "center" : "left",  
                    gap: 14 
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                    background: P.white, border: `1px solid ${P.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 19, boxShadow: "0 2px 8px rgba(26,61,40,0.06)",
                  }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: P.forest }}>{f.l}</div>
                    <div style={{ fontSize: 12.5, color: P.muted }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: isMobile ? "center" : "flex-start", 
                  gap: 9,
                  width: isMobile ? "100%" : "auto",
                  padding: isMobile ? "14px 18px" : "14px 30px",
                  fontSize: isMobile ? 14 : 15.5, 
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${P.forest}, ${P.pine})`,
                  color: "white", 
                  border: "none",
                  fontWeight: 700, 
                  cursor: "pointer",
                  boxShadow: `0 6px 24px rgba(26,61,40,0.3)`,
                  transition: "all 0.2s ease", 
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 32px rgba(26,61,40,0.4)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 24px rgba(26,61,40,0.3)`; }}
              >
                👤 Ingresar al sistema →
              </button>
            )}
          </div>

          {/* ─── CONTENEDOR DERECHO (Tag + Logo) ─── */}
          <div style={{
            display: isMobile ? "none" : "flex",
            flexDirection: "column",
            alignItems: "center", 
            flexShrink: 0,
          }}>

            {/* Tag */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: P.mint, border: `1px solid ${P.borderLight}`,
              borderRadius: 99, padding: "5px 16px", 
              marginBottom: 16, 
            }}>
              <span style={{ fontSize: 13 }}>🐾</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: P.pine, letterSpacing: "0.04em" }}>
                Clínica Veterinaria San Roque
              </span>
            </div>

            {/* Imagen derecha ajustada proporcionalmente */}
            <div style={{
              width: 340,   // ✨ Reducido levemente para ajustarse a resoluciones comunes de notebooks
              height: 340,  // ✨ Manteniendo aspecto 1:1 perfecto
              display: "flex",
              borderRadius: 24, overflow: "hidden",
              background: `linear-gradient(135deg, ${P.mint}, rgba(234,243,222,0.5))`,
              alignItems: "center", justifyContent: "center",
              boxShadow: `0 24px 64px rgba(26,61,40,0.12), 0 4px 16px rgba(26,61,40,0.06)`,
              border: `1px solid ${P.borderLight}`,
              padding: 24,
            }}>
              <img
                src="/logocolor.png"
                alt="Clínica Veterinaria San Roque"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>

        </div>

        {/* Modal de login */}
        {showForm && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(26,61,40,0.5)", backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowForm(false)}
          >
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  position: "absolute", top: -14, right: -14, zIndex: 10,
                  width: 32, height: 32, borderRadius: "50%",
                  background: "white", border: "none", cursor: "pointer",
                  fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)", color: P.slate,
                }}
              >×</button>
              <LoginForm onLogin={handleLogin} isMobile={isMobile} />
            </div>
          </div>
        )}
      </section>

      {/* ── SERVICIOS ────────────────────────────────────────────── */}
      <section id="servicios" style={{ padding: "88px 0", background: P.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "22px 18px" : "28px 24px", width: "100%", }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{
              display: "inline-block", fontSize: 12, fontWeight: 700,
              color: P.pine, background: P.mint, border: `1px solid ${P.borderLight}`,
              padding: "5px 16px", borderRadius: 99, marginBottom: 14,
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>¿Qué ofrecemos?</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 30, fontWeight: 800, color: P.forest, letterSpacing: "-0.5px" }}>
              Nuestros servicios
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: P.muted }}>
              Atención integral para el bienestar de tu mascota
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 22 }}>
            {[
              { icon: "📝", title: "Consultas clínicas",    desc: "Atención médica general, controles preventivos y diagnósticos clínicos personalizados." },
              { icon: "💉", title: "Vacunación",            desc: "Registro digital y control del calendario vacunal de cada paciente." },
              { icon: "🔬", title: "Tratamientos",          desc: "Prescripción, seguimiento y control de evolución de tratamientos activos." },
              { icon: "✂️", title: "Grooming",              desc: "Baño, corte, peinado y limpieza estética con turnos programados." },
              { icon: "📦", title: "Ventas y stock",        desc: "Productos, medicamentos y control de inventario siempre actualizado." },
              { icon: "🌐", title: "Portal de clientes",    desc: "Accedé a tus datos, mascotas y turnos desde cualquier dispositivo." },
            ].map((s, i) => <ServiceCard key={i} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────────────────────── */}
      <HowItWorks isMobile={isMobile} />

      {/* ── SOBRE NOSOTROS ────────────────────────────────────────── */}
      <section id="nosotros" style={{ padding: "88px 0", background: P.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 72,
            alignItems: "center",
          }}>
            {/* Visual */}
            <div style={{
              background: `linear-gradient(135deg, ${P.forest}, ${P.pine})`,
              borderRadius: 24, padding: "48px 40px",
              display: "flex", flexDirection: "column", gap: 24,
            }}>
              <div style={{ fontSize: 48 }}>🏥</div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>
                Clínica Veterinaria San Roque
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.75 }}>
                Ubicada en Punta Alta, Buenos Aires. Contamos con veterinaria, asistente y atención personalizada para cada paciente.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
                {[
                  { n: "5", l: "Roles de acceso" },
                  { n: "∞", l: "Mascotas atendidas" },
                  { n: "100%", l: "Historial digital" },
                  { n: "24/7", l: "Portal disponible" },
                ].map((st, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.1)", borderRadius: 12,
                    padding: "14px 16px", border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{st.n}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{st.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Texto */}
            <div>
              <div style={{
                display: "inline-block", fontSize: 12, fontWeight: 700,
                color: P.pine, background: P.mint, border: `1px solid ${P.borderLight}`,
                padding: "5px 16px", borderRadius: 99, marginBottom: 20,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>Sobre nosotros</div>
              <h2 style={{ margin: "0 0 18px", fontSize: 30, fontWeight: 800, color: P.forest, letterSpacing: "-0.5px" }}>
                Un sistema pensado para la clínica y para vos
              </h2>
              <p style={{ fontSize: 14.5, color: P.muted, lineHeight: 1.8, margin: "0 0 16px" }}>
                La Clínica Veterinaria San Roque digitalizó toda su gestión con un sistema web integral que unifica la administración clínica, comercial y el acceso de los clientes.
              </p>
              <p style={{ fontSize: 14.5, color: P.muted, lineHeight: 1.8, margin: 0 }}>
                Cada rol —administrador, veterinario, asistente, vendedor y cliente— tiene acceso a exactamente lo que necesita, garantizando seguridad y eficiencia en cada proceso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACTO ──────────────────────────────────────────────── */}
      <section id="contacto" style={{ padding: "88px 0", background: P.foam }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              display: "inline-block", fontSize: 12, fontWeight: 700,
              color: P.pine, background: P.mint, border: `1px solid ${P.borderLight}`,
              padding: "5px 16px", borderRadius: 99, marginBottom: 14,
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>Contacto</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 30, fontWeight: 800, color: P.forest, letterSpacing: "-0.5px" }}>
              ¿Necesitás ayuda?
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: P.muted }}>Comunicate con nosotros</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 22 }}>
            {[
              { icon: "📍", title: "Dirección",  text: "Punta Alta,\nBuenos Aires." },
              { icon: "📞", title: "Teléfono",   text: "11 1234 5678" },
              { icon: "✉️", title: "Email",      text: "info@sanroquevet.com.ar" },
            ].map((c, i) => (
              <div key={i} style={{
                padding: "32px 24px", borderRadius: 16, textAlign: "center",
                background: P.white, border: `1px solid ${P.border}`,
                boxShadow: "0 2px 12px rgba(26,61,40,0.04)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: P.mint, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 24, margin: "0 auto 16px",
                  border: `1px solid ${P.borderLight}`,
                }}>{c.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 14, color: P.forest, fontWeight: 600, whiteSpace: "pre-line", lineHeight: 1.5 }}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer isMobile={isMobile} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(39,107,66,0.2); }
      `}</style>
    </div>
  );
}