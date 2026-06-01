import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWindowSize } from "../../hooks/useWindowSize";

const G = {
  forest:   "#0d2818",
  pine:     "#1a3d28",
  mid:      "#1f5c38",
  leaf:     "#276b42",
  sage:     "#3d7a55",
  mint:     "#eaf3de",
  foam:     "#f4faf0",
  white:    "#ffffff",
  border:   "#d1ddd4",
  muted:    "#6b8f76",
  text:     "#0d2818",
  red:      "#a32d2d",
  redBg:    "#fcebeb",
  gold:     "#c8a84b",
};

// ── Scroll Snap Container ─────────────────────────────────────────
function SnapContainer({ children }) {
  return (
    <div style={{
      height: "100dvh",
      overflowY: "scroll",
      scrollSnapType: "y mandatory",
      scrollBehavior: "smooth",
    }}>
      {children}
    </div>
  );
}

// ── Snap Section ──────────────────────────────────────────────────
function SnapSection({ id, children, bg, style = {} }) {
  return (
    <section
      id={id}
      style={{
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        height: "100dvh",
        width: "100%",
        background: bg || G.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

// ── Navbar lateral desktop / top mobile ──────────────────────────
function Navbar({ onLoginClick, isMobile, containerRef }) {
  const [active, setActive] = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { id: "inicio",    label: "Inicio",    icon: "🏠" },
    { id: "servicios", label: "Servicios", icon: "🩺" },
    { id: "portal",    label: "Portal",    icon: "🌐" },
    { id: "nosotros",  label: "Nosotros",  icon: "🏥" },
    { id: "contacto",  label: "Contacto",  icon: "📞" },
  ];

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const onScroll = () => {
      const snap = sections.find(s => {
        const sec = document.getElementById(s.id);
        if (!sec) return false;
        const top = sec.offsetTop;
        return Math.abs(el.scrollTop - top) < sec.offsetHeight / 2;
      });
      if (snap) setActive(snap.id);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      containerRef?.current?.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px",
          background: "rgba(13,40,24,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <img src="/logo.png" alt="San Roque" style={{ height: 28, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onLoginClick} style={{
              padding: "6px 14px", borderRadius: 8,
              background: G.leaf, color: "white",
              border: "none", fontSize: 12, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.03em",
            }}>
              Ingresar
            </button>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "white", width: 36, height: 36, borderRadius: 8,
              fontSize: 18, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div style={{
            position: "fixed", top: 56, left: 0, right: 0, zIndex: 199,
            background: "rgba(13,40,24,0.99)", backdropFilter: "blur(16px)",
            borderBottom: `1px solid rgba(255,255,255,0.08)`,
            padding: "8px 0",
          }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "13px 20px", background: "none",
                border: "none", color: active === s.id ? G.mint : "rgba(255,255,255,0.6)",
                fontSize: 14, fontWeight: active === s.id ? 700 : 500,
                cursor: "pointer", textAlign: "left",
                borderLeft: `3px solid ${active === s.id ? G.mint : "transparent"}`,
              }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <nav style={{
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 200,
      width: 72, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      padding: "20px 0",
      background: G.forest,
      borderRight: `1px solid rgba(255,255,255,0.05)`,
    }}>
      <img src="/logo.png" alt="San Roque" style={{ height: 34, width: 40, objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            title={s.label}
            style={{
              width: 52, height: 52, borderRadius: 12,
              background: active === s.id ? G.leaf : "transparent",
              border: active === s.id ? `1px solid rgba(255,255,255,0.12)` : "1px solid transparent",
              color: active === s.id ? "white" : "rgba(255,255,255,0.4)",
              fontSize: 18, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2, transition: "all 0.18s ease",
            }}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", color: active === s.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
              {s.label.slice(0, 4).toUpperCase()}
            </span>
          </button>
        ))}
      </div>
      <button onClick={onLoginClick} style={{
        width: 48, height: 48, borderRadius: 12,
        background: G.leaf, color: "white",
        border: "none", fontSize: 18, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(39,107,66,0.4)",
        transition: "all 0.18s ease",
      }} title="Ingresar">
        👤
      </button>
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────
function HeroSection({ onLoginClick, isMobile }) {
  const features = [
    { icon: "📝", label: "Consultas clínicas" },
    { icon: "💉", label: "Vacunación digital" },
    { icon: "✂️", label: "Grooming" },
    { icon: "💊", label: "Stock y ventas" },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
      alignItems: "center", justifyContent: "center",
      padding: isMobile ? "72px 24px 24px" : "0 48px 0 96px",
      gap: isMobile ? 32 : 64,
      background: `linear-gradient(145deg, ${G.forest} 0%, ${G.pine} 60%, #0a2010 100%)`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{
        position: "absolute", top: -80, right: isMobile ? -80 : 120,
        width: 400, height: 400, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.04)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 40, right: isMobile ? -120 : 80,
        width: 550, height: 550, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.03)",
        pointerEvents: "none",
      }} />

      {/* Left: texto */}
      <div style={{ flex: 1, maxWidth: 520, position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99, padding: "5px 14px", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: G.gold, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Punta Alta · Buenos Aires
          </span>
        </div>

        <h1 style={{
          fontSize: isMobile ? 36 : 56,
          fontWeight: 900,
          color: "white",
          margin: "0 0 20px",
          lineHeight: 1.08,
          letterSpacing: "-2px",
        }}>
          Cuidamos a<br />
          <span style={{ color: G.mint }}>tu mascota</span><br />
          con dedicación
        </h1>

        <p style={{
          fontSize: isMobile ? 14 : 16,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.7,
          margin: "0 0 36px",
          maxWidth: 420,
        }}>
          Sistema integral de gestión para la clínica veterinaria San Roque. Portal de clientes, historiales clínicos y agenda en tiempo real.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{f.label}</span>
            </div>
          ))}
        </div>

        <button onClick={onLoginClick} style={{
          padding: "14px 32px",
          background: G.leaf,
          color: "white", border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          letterSpacing: "0.02em",
          boxShadow: "0 8px 24px rgba(39,107,66,0.45)",
          transition: "all 0.2s ease",
          display: "inline-flex", alignItems: "center", gap: 10,
          alignSelf: isMobile ? "stretch" : "auto",
          width: isMobile ? "100%" : "auto",
          justifyContent: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(39,107,66,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(39,107,66,0.45)"; }}
        >
          👤 Ingresar al sistema →
        </button>
      </div>

      {/* Right: logo card */}
      {!isMobile && (
        <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 280, height: 280, borderRadius: 28,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}>
            <img src="/logocolor.png" alt="Logo" style={{ width: 200, height: 200, objectFit: "contain" }} />
          </div>
          {/* Floating cards */}
          <div style={{
            position: "absolute", bottom: -20, left: -48,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "12px 18px",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Próxima cita</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Kilu · Control</div>
            <div style={{ fontSize: 11, color: G.mint, marginTop: 2 }}>Hoy, 10:30 hs</div>
          </div>
          <div style={{
            position: "absolute", top: -20, right: -40,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "12px 18px",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Pacientes hoy</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>12</div>
            <div style={{ fontSize: 11, color: G.mint }}>↑ 3 más que ayer</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Services Section ──────────────────────────────────────────────
function ServiciosSection({ isMobile }) {
  const services = [
    { icon: "📝", title: "Consultas clínicas", desc: "Atención médica general, controles preventivos y diagnósticos personalizados.", color: G.pine },
    { icon: "💉", title: "Vacunación", desc: "Registro digital y control del calendario vacunal de cada paciente.", color: "#1a5c38" },
    { icon: "🔬", title: "Tratamientos", desc: "Prescripción, seguimiento y evolución de tratamientos activos.", color: G.pine },
    { icon: "✂️", title: "Grooming", desc: "Baño, corte y estética con turnos programados online.", color: "#1a5c38" },
    { icon: "📦", title: "Ventas y stock", desc: "Medicamentos, accesorios e inventario siempre actualizado.", color: G.pine },
    { icon: "🌐", title: "Portal de clientes", desc: "Tus mascotas, turnos e historiales desde cualquier dispositivo.", color: "#1a5c38" },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      padding: isMobile ? "72px 20px 20px" : "0 48px 0 96px",
      justifyContent: "center", overflowY: isMobile ? "auto" : "hidden",
    }}>
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: G.mint, border: `1px solid ${G.border}`,
          borderRadius: 99, padding: "4px 14px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.mid, textTransform: "uppercase", letterSpacing: "0.07em" }}>¿Qué ofrecemos?</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 900, color: G.forest, margin: "0 0 8px", letterSpacing: "-1px", lineHeight: 1.1 }}>
          Nuestros servicios
        </h2>
        <p style={{ fontSize: 14, color: G.muted, margin: 0 }}>Atención integral para el bienestar de tu mascota</p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 10 : 16,
        maxWidth: 900,
      }}>
        {services.map((s, i) => (
          <ServiceCard key={i} {...s} isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: isMobile ? "14px" : "20px",
        borderRadius: 14,
        border: `1px solid ${hov ? G.border : "#e8eee9"}`,
        background: hov ? G.white : G.foam,
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 24px rgba(13,40,24,0.08)" : "none",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: hov ? G.mint : G.white,
        border: `1px solid ${G.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, marginBottom: 12,
        transition: "background 0.2s",
      }}>{icon}</div>
      <h3 style={{ margin: "0 0 6px", fontSize: isMobile ? 12 : 14, fontWeight: 800, color: G.forest, lineHeight: 1.2 }}>{title}</h3>
      {!isMobile && <p style={{ margin: 0, fontSize: 12, color: G.muted, lineHeight: 1.6 }}>{desc}</p>}
    </div>
  );
}

// ── Portal Section ────────────────────────────────────────────────
function PortalSection({ isMobile }) {
  const steps = [
    { n: "01", icon: "📋", title: "Registrate como cliente", desc: "El personal registra tus datos y los de tu mascota al momento de la primera consulta." },
    { n: "02", icon: "🔐", title: "Recibís tus credenciales", desc: "Se te asigna usuario y contraseña para acceder desde cualquier dispositivo." },
    { n: "03", icon: "🐾", title: "Gestioná desde tu portal", desc: "Turnos, historial clínico, vacunas y datos de tus mascotas en tiempo real." },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: `linear-gradient(160deg, ${G.forest} 0%, ${G.pine} 100%)`,
      padding: isMobile ? "72px 20px 20px" : "0 48px 0 96px",
      justifyContent: "center",
    }}>
      <div style={{ marginBottom: isMobile ? 24 : 48 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 99, padding: "4px 14px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Portal de clientes</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px", lineHeight: 1.1 }}>
          ¿Cómo funciona?
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          Disponible para todos los clientes registrados en la clínica.
        </p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 12 : 20,
        maxWidth: 900,
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: isMobile ? "16px" : "24px",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: G.mint, marginBottom: 14,
              letterSpacing: "0.02em",
            }}>{s.n}</div>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "white", lineHeight: 1.3 }}>{s.title}</h3>
            {!isMobile && <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{s.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Nosotros Section ──────────────────────────────────────────────
function NosotrosSection({ isMobile }) {
  const stats = [
    { n: "5", l: "Roles de acceso" },
    { n: "∞", l: "Mascotas" },
    { n: "100%", l: "Digital" },
    { n: "24/7", l: "Portal" },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      padding: isMobile ? "72px 20px 20px" : "0 48px 0 96px",
      gap: isMobile ? 24 : 64,
      background: G.foam,
      overflowY: isMobile ? "auto" : "hidden",
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${G.forest}, ${G.mid})`,
        borderRadius: 20, padding: isMobile ? "28px 20px" : "40px 36px",
        display: "flex", flexDirection: "column", gap: 20,
        flex: isMobile ? "none" : "0 0 360px",
        width: isMobile ? "100%" : "auto",
      }}>
        <div style={{ fontSize: 40 }}>🏥</div>
        <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
          Clínica Veterinaria San Roque
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
          Ubicada en Punta Alta, Buenos Aires. Atención personalizada con veterinaria y asistente para cada paciente.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {stats.map((st, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "14px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{st.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{st.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: G.mint, border: `1px solid ${G.border}`,
          borderRadius: 99, padding: "4px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.mid, textTransform: "uppercase", letterSpacing: "0.07em" }}>Sobre nosotros</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, color: G.forest, margin: "0 0 16px", letterSpacing: "-1px", lineHeight: 1.15 }}>
          Un sistema pensado para la clínica y para vos
        </h2>
        <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, margin: "0 0 14px" }}>
          La Clínica Veterinaria San Roque digitalizó toda su gestión con un sistema web integral que unifica la administración clínica, comercial y el acceso de los clientes.
        </p>
        <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, margin: 0 }}>
          Cada rol —administrador, veterinario, asistente, vendedor y cliente— tiene acceso a lo que necesita, garantizando seguridad y eficiencia en cada proceso.
        </p>
      </div>
    </div>
  );
}

// ── Contacto Section ──────────────────────────────────────────────
function ContactoSection({ isMobile }) {
  const contacts = [
    { icon: "📍", title: "Dirección", text: "Punta Alta,\nBuenos Aires" },
    { icon: "📞", title: "Teléfono",  text: "11 1234 5678" },
    { icon: "✉️", title: "Email",     text: "info@sanroquevet.com.ar" },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: `linear-gradient(160deg, #0a1f12 0%, ${G.forest} 100%)`,
      padding: isMobile ? "72px 20px 20px" : "0 48px 0 96px",
      justifyContent: "center",
    }}>
      <div style={{ marginBottom: isMobile ? 24 : 48 }}>
        <div style={{
          display: "inline-flex",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99, padding: "4px 14px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Contacto</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px" }}>
          ¿Necesitás ayuda?
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0 }}>Comunicate con nosotros</p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 12 : 20, maxWidth: 700,
        marginBottom: 40,
      }}>
        {contacts.map((c, i) => (
          <div key={i} style={{
            padding: isMobile ? "20px 16px" : "28px 20px",
            borderRadius: 16, textAlign: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 14, color: "white", fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.5 }}>{c.text}</div>
          </div>
        ))}
      </div>
      {/* Footer inline */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Clínica Veterinaria San Roque · Desarrollado por @stefaniaarevalo2026
        </p>
      </div>
    </div>
  );
}

// ── Login Modal ───────────────────────────────────────────────────
function LoginModal({ onLogin, onClose, isMobile }) {
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
    padding: "12px 14px 12px 44px",
    borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${G.border}`,
    background: G.foam, color: G.text,
    outline: "none", fontFamily: "inherit",
    transition: "all 0.2s",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(13,40,24,0.75)",
        backdropFilter: "blur(12px)",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: G.white, borderRadius: 20,
          boxShadow: "0 32px 80px rgba(13,40,24,0.3)",
          padding: isMobile ? "28px 20px" : "40px 36px",
          width: "100%", maxWidth: 380,
          position: "relative",
          border: `1px solid ${G.border}`,
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          width: 32, height: 32, borderRadius: 8,
          background: G.foam, border: `1px solid ${G.border}`,
          cursor: "pointer", fontSize: 14, color: G.muted,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${G.forest}, ${G.leaf})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", padding: "10px",
            boxShadow: "0 8px 24px rgba(26,61,40,0.3)",
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: G.forest, letterSpacing: "-0.5px" }}>
            Acceso al sistema
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: G.muted }}>Ingresá con tus credenciales</p>
        </div>

        {error && (
          <div style={{
            background: G.redBg, border: "1px solid #f7c1c1",
            borderLeft: `4px solid ${G.red}`,
            borderRadius: 10, padding: "10px 14px",
            color: G.red, fontSize: 13, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: G.forest, marginBottom: 6, letterSpacing: "0.03em" }}>
              USUARIO
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>👤</span>
              <input
                type="text" name="usuario" value={form.usuario}
                onChange={hc} placeholder="Tu usuario"
                autoComplete="username" style={inp}
                onFocus={e => { e.target.style.borderColor = G.leaf; e.target.style.background = G.white; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
                onBlur={e => { e.target.style.borderColor = G.border; e.target.style.background = G.foam; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: G.forest, marginBottom: 6, letterSpacing: "0.03em" }}>
              CONTRASEÑA
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔒</span>
              <input
                type={showPass ? "text" : "password"} name="contraseña"
                value={form.contraseña} onChange={hc}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                style={{ ...inp, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = G.leaf; e.target.style.background = G.white; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
                onBlur={e => { e.target.style.borderColor = G.border; e.target.style.background = G.foam; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                <img src={showPass ? "/closeeye.png" : "/openeye.png"} alt={showPass ? "Ocultar" : "Mostrar"}
                  style={{ width: 20, height: 20, opacity: 0.5 }} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px",
            background: loading ? G.border : `linear-gradient(135deg, ${G.forest}, ${G.mid})`,
            color: "white", border: "none", borderRadius: 11,
            fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px rgba(26,61,40,0.3)",
            transition: "all 0.2s", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,61,40,0.4)"; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; if (!loading) e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,61,40,0.3)"; }}
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

        <div style={{
          marginTop: 18, padding: "10px 14px", borderRadius: 10,
          background: G.mint, border: `1px solid ${G.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <p style={{ margin: 0, fontSize: 12, color: G.mid, lineHeight: 1.5 }}>
            Acceso exclusivo para personal y clientes registrados.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useWindowSize();
  const containerRef = useRef(null);

  useEffect(() => {
    if (user) navigate(user.idRol === 5 ? "/cliente" : "/admin");
  }, [user, navigate]);

  const handleLogin = async (data) => {
    const decoded = await login(data);
    navigate(decoded.idRol === 5 ? "/cliente" : "/admin");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", height: "100dvh", overflow: "hidden" }}>
      <Navbar onLoginClick={() => setShowForm(true)} isMobile={isMobile} containerRef={containerRef} />
      <div
        ref={containerRef}
        style={{
          height: "100dvh",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          marginLeft: isMobile ? 0 : 72,
        }}
      >
        <SnapSection id="inicio" bg={G.forest}>
          <HeroSection onLoginClick={() => setShowForm(true)} isMobile={isMobile} />
        </SnapSection>

        <SnapSection id="servicios" bg={G.white}>
          <ServiciosSection isMobile={isMobile} />
        </SnapSection>

        <SnapSection id="portal" bg={G.pine}>
          <PortalSection isMobile={isMobile} />
        </SnapSection>

        <SnapSection id="nosotros" bg={G.foam}>
          <NosotrosSection isMobile={isMobile} />
        </SnapSection>

        <SnapSection id="contacto" bg={G.forest}>
          <ContactoSection isMobile={isMobile} />
        </SnapSection>
      </div>

      {showForm && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowForm(false)}
          isMobile={isMobile}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::selection { background: rgba(39,107,66,0.2); }
        ::-webkit-scrollbar { display: none; }
        body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}