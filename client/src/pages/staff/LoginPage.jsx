import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWindowSize } from "../../hooks/useWindowSize";

const G = {
  forest:  "#1a3d28",
  pine:    "#1f5c38",
  leaf:    "#276b42",
  mint:    "#eaf3de",
  foam:    "#f8fbf9",
  border:  "#d1ddd4",
  muted:   "#6b8f76",
  text:    "#1a3d28",
  white:   "#ffffff",
  gray50:  "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  red:     "#a32d2d",
  redBg:   "#fcebeb",
};

// ── Snap section ──────────────────────────────────────────────────
function SnapSection({ id, children, bg }) {
  return (
    <section id={id} style={{
      scrollSnapAlign: "start",
      scrollSnapStop: "always",
      height: "100dvh",
      width: "100%",
      background: bg || G.white,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {children}
    </section>
  );
}

// ── Navbar ────────────────────────────────────────────────────────
function Navbar({ onLoginClick, isMobile, containerRef }) {
  const [active, setActive] = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { id: "inicio",    label: "Inicio",    emoji: "🏠",  emojiDesktop: "🏠" },
    { id: "servicios", label: "Servicios", emoji: "🩺",  emojiDesktop: "🐾" },
    { id: "portal",    label: "Portal",    emoji: "🌐",  emojiDesktop: "🌐" },
    { id: "nosotros",  label: "Nosotros",  emoji: "🏥",  emojiDesktop: "🏥" },
    { id: "contacto",  label: "Contacto",  emoji: "📞",  emojiDesktop: "📞" },
  ];

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const onScroll = () => {
      const found = sections.find(s => {
        const sec = document.getElementById(s.id);
        if (!sec) return false;
        return Math.abs(el.scrollTop - sec.offsetTop) < sec.offsetHeight / 2;
      });
      if (found) setActive(found.id);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    let isScrolling = false;
    const onWheel = (e) => {
      e.preventDefault();
      if (isScrolling) return;
      isScrolling = true;
      const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean);
      const current = sectionEls.reduce((closest, sec) => {
        return Math.abs(sec.offsetTop - el.scrollTop) < Math.abs(closest.offsetTop - el.scrollTop)
          ? sec : closest;
      }, sectionEls[0]);
      const currentIndex = sectionEls.indexOf(current);
      const nextIndex = e.deltaY > 0
        ? Math.min(currentIndex + 1, sectionEls.length - 1)
        : Math.max(currentIndex - 1, 0);
      el.scrollTo({ top: sectionEls[nextIndex].offsetTop, behavior: "smooth" });
      setTimeout(() => { isScrolling = false; }, 800);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef]);

  const scrollTo = (id) => {
    const sec = document.getElementById(id);
    if (sec) containerRef?.current?.scrollTo({ top: sec.offsetTop, behavior: "smooth" });
    setMenuOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px",
          background: G.white, borderBottom: `1px solid ${G.border}`,
        }}>
          <img src="/logo.png" alt="San Roque" style={{ height: 30 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onLoginClick} style={{
              padding: "7px 16px", borderRadius: 8,
              background: G.forest, color: "white",
              border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Ingresar</button>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              background: G.gray100, border: "none", color: G.gray600,
              width: 36, height: 36, borderRadius: 8, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{menuOpen ? "✕" : "☰"}</button>
          </div>
        </nav>
        {menuOpen && (
          <div style={{
            position: "fixed", top: 56, left: 0, right: 0, zIndex: 199,
            background: G.white, borderBottom: `1px solid ${G.border}`,
          }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "13px 20px",
                background: active === s.id ? G.mint : "none", border: "none",
                borderLeft: `3px solid ${active === s.id ? G.leaf : "transparent"}`,
                color: active === s.id ? G.forest : G.gray600,
                fontSize: 14, fontWeight: active === s.id ? 700 : 500,
                cursor: "pointer", textAlign: "left",
              }}>
                <span>{s.emoji}</span> {s.label}
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
      width: 72, background: G.white, borderRight: `1px solid ${G.border}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between", padding: "20px 0",
    }}>
      <img src="/logo.png" alt="San Roque" style={{ width: 36, height: 36, objectFit: "contain" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {sections.map(s => {
          const isActive = active === s.id;
          return (
            <button key={s.id} onClick={() => scrollTo(s.id)} title={s.label} style={{
              width: 52, height: 52, borderRadius: 12,
              background: isActive ? G.mint : "transparent", border: "none",
              color: isActive ? G.forest : G.gray400, cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3, transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = G.gray50; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emojiDesktop}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: isActive ? G.forest : G.gray400, textTransform: "uppercase" }}>
                {s.label.slice(0, 4)}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onLoginClick} style={{
        width: 44, height: 44, borderRadius: 10, background: G.forest,
        color: "white", border: "none", fontSize: 16, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = G.pine}
      onMouseLeave={e => e.currentTarget.style.background = G.forest}
      title="Ingresar">👤</button>
    </nav>
  );
}

// ── SECCIÓN 1: Hero ───────────────────────────────────────────────
function HeroSection({ onLoginClick, isMobile }) {
  const features = [
    { icon: "📋", label: "Consultas clínicas",  desc: "Control y diagnóstico médico" },
    { icon: "💉", label: "Vacunación digital",   desc: "Calendario sanitario" },
    { icon: "✂️", label: "Grooming",             desc: "Estética con turnos" },
    { icon: "💊", label: "Ventas y stock",       desc: "Inventario actualizado" },
  ];

  return (
    <div style={{
      flex: 1, display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      justifyContent: isMobile ? "center" : "space-between",
      padding: isMobile ? "72px 28px 28px" : "0 96px",
      gap: isMobile ? 24 : 48,
      background: G.forest,
      overflow: "hidden", position: "relative", width: "100%", boxSizing: "border-box",
    }}>

      {/* Fondo decorativo: círculos sutiles */}
      {!isMobile && (
        <>
          <div style={{
            position: "absolute", right: -80, top: -80,
            width: 400, height: 400, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: -20, top: -20,
            width: 260, height: 260, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* Texto izquierdo */}
      <div style={{
        flex: isMobile ? "none" : "1", maxWidth: 540,
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.1)", borderRadius: 99,
          padding: "5px 14px", marginBottom: 22,
          border: "1px solid rgba(255,255,255,0.15)", alignSelf: "flex-start",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: G.mint, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: G.mint, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Clínica Veterinaria · Punta Alta
          </span>
        </div>

        <h1 style={{
          fontSize: isMobile ? 32 : 52, fontWeight: 900, color: "white",
          margin: "0 0 16px", lineHeight: 1.08, letterSpacing: "-1.5px",
        }}>
          Cuidamos a tu mascota con dedicación
        </h1>

        <p style={{ fontSize: isMobile ? 14 : 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 440 }}>
          Sistema integral de gestión para la clínica veterinaria San Roque. Portal de clientes, historiales clínicos y agenda en tiempo real.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onLoginClick} style={{
          padding: "13px 28px", background: G.mint, color: G.forest,
          border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
          width: isMobile ? "100%" : "auto", alignSelf: "flex-start",
          justifyContent: "center", transition: "opacity 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          👤 Ingresar al sistema →
        </button>
      </div>

      {/* Logo derecho — versión mejorada */}
      <div style={{
        flex: isMobile ? "none" : "0 0 340px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: isMobile ? "absolute" : "relative",
        inset: isMobile ? 0 : "auto",
        zIndex: isMobile ? 0 : 1,
        pointerEvents: "none", userSelect: "none",
      }}>
        {isMobile ? (
          // Mobile: logo muy sutil como marca de agua, sin filtros agresivos
          <img src="/logocolor.png" alt="" style={{
            width: "70%", maxWidth: 280, height: "auto", objectFit: "contain",
            opacity: 0.06,
          }} />
        ) : (
          // Desktop: logo limpio con halo suave
          <div style={{
            width: 300, height: 300, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/logocolor.png" alt="Veterinaria San Roque" style={{
              width: "75%", height: "auto", objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.18,
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN 2: Servicios ──────────────────────────────────────────
function ServiciosSection({ isMobile }) {
  const services = [
    { icon: "📋", title: "Consultas clínicas",  desc: "Atención médica general, controles preventivos y diagnósticos personalizados." },
    { icon: "💉", title: "Vacunación",           desc: "Registro digital y control del calendario vacunal de cada paciente." },
    { icon: "🔬", title: "Tratamientos",         desc: "Prescripción, seguimiento y evolución de tratamientos activos." },
    { icon: "✂️", title: "Grooming",             desc: "Baño, corte y estética con turnos programados." },
    { icon: "📦", title: "Ventas y stock",       desc: "Medicamentos, accesorios e inventario siempre actualizado." },
    { icon: "🌐", title: "Portal de clientes",   desc: "Mascotas, turnos e historiales desde cualquier dispositivo." },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      padding: isMobile ? "72px 20px 24px" : "0 64px 0 96px",
      justifyContent: "center", background: G.foam,
      overflowY: isMobile ? "auto" : "hidden",
    }}>
      <div style={{ marginBottom: isMobile ? 20 : 36 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: G.mint, border: `1px solid ${G.border}`,
          borderRadius: 99, padding: "4px 14px", marginBottom: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.leaf, textTransform: "uppercase", letterSpacing: "0.06em" }}>Servicios</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: G.forest, margin: "0 0 6px", letterSpacing: "-1px" }}>
          Todo lo que necesita tu mascota
        </h2>
        <p style={{ fontSize: 14, color: G.muted, margin: 0 }}>Atención integral en un solo lugar</p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 10 : 14, maxWidth: 860,
      }}>
        {services.map((s, i) => <ServiceCard key={i} {...s} isMobile={isMobile} />)}
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: isMobile ? "14px" : "20px", borderRadius: 12,
      border: `1px solid ${hov ? G.border : G.gray200}`, background: G.white,
      boxShadow: hov ? "0 4px 16px rgba(26,61,40,0.07)" : "none",
      transition: "all 0.18s", cursor: "default",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: G.mint,
        border: `1px solid ${G.border}`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18, marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: G.forest, marginBottom: isMobile ? 0 : 4 }}>{title}</div>
      {!isMobile && <div style={{ fontSize: 12, color: G.muted, lineHeight: 1.6 }}>{desc}</div>}
    </div>
  );
}

// ── SECCIÓN 3: Portal ─────────────────────────────────────────────
function PortalSection({ isMobile }) {
  const steps = [
    { n: "01", icon: "📋", title: "Registrate como cliente", desc: "El personal registra tus datos y los de tu mascota al momento de la primera consulta." },
    { n: "02", icon: "🔐", title: "Recibís tus credenciales", desc: "Se te asigna usuario y contraseña para acceder desde cualquier dispositivo." },
    { n: "03", icon: "🐾", title: "Gestioná desde tu portal", desc: "Turnos, historial clínico, vacunas y datos de tus mascotas en tiempo real." },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      padding: isMobile ? "64px 20px 16px" : "0 64px 0 96px",
      justifyContent: "center", background: G.white, overflow: "hidden",
    }}>
      <div style={{ marginBottom: isMobile ? 14 : 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: G.mint, border: `1px solid ${G.border}`,
          borderRadius: 99, padding: isMobile ? "3px 10px" : "4px 14px", marginBottom: 8,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: G.leaf, textTransform: "uppercase", letterSpacing: "0.06em" }}>Portal de clientes</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 22 : 36, fontWeight: 900, color: G.forest, margin: "0 0 4px", letterSpacing: "-1px" }}>
          ¿Cómo funciona?
        </h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: G.muted, margin: 0 }}>
          Disponible para todos los clientes registrados.
        </p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 8 : 18, maxWidth: 860, width: "100%", boxSizing: "border-box",
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            padding: isMobile ? "12px 14px" : "28px", borderRadius: 12,
            border: `1px solid ${G.border}`, background: G.foam,
            display: "flex", flexDirection: isMobile ? "row" : "column",
            alignItems: "center", gap: isMobile ? 12 : 0,
          }}>
            <div style={{
              width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: isMobile ? 7 : 9,
              background: G.forest, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isMobile ? 11 : 12, fontWeight: 900,
              marginBottom: isMobile ? 0 : 14, flexShrink: 0,
            }}>{s.n}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{ fontSize: isMobile ? 18 : 22, flexShrink: 0, marginBottom: isMobile ? 0 : 10 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: G.forest, marginBottom: isMobile ? 0 : 6, lineHeight: 1.2 }}>{s.title}</div>
            </div>
            {!isMobile && <div style={{ fontSize: 12, color: G.muted, lineHeight: 1.65 }}>{s.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SECCIÓN 4: Nosotros ───────────────────────────────────────────
function NosotrosSection({ isMobile }) {
  const stats = [
    { n: "5",    l: "Roles de acceso" },
    { n: "∞",    l: "Mascotas atendidas" },
    { n: "100%", l: "Historial digital" },
    { n: "24/7", l: "Portal disponible" },
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
      alignItems: "center", padding: isMobile ? "72px 20px 24px" : "0 64px 0 96px",
      gap: isMobile ? 24 : 64, background: G.foam,
      overflowY: isMobile ? "auto" : "hidden",
    }}>
      <div style={{
        background: G.forest, borderRadius: 18,
        padding: isMobile ? "24px 20px" : "36px 32px",
        display: "flex", flexDirection: "column", gap: 18,
        flex: "0 0 auto", width: isMobile ? "100%" : 320,
      }}>
        <div style={{ fontSize: 36 }}>🏥</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
          Clínica Veterinaria San Roque
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
          Ubicada en Punta Alta, Buenos Aires. Atención personalizada con veterinaria y asistente para cada paciente.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map((st, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "12px",
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{st.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{st.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: "inline-flex", background: G.mint,
          border: `1px solid ${G.border}`, borderRadius: 99,
          padding: "4px 14px", marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.leaf, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sobre nosotros</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, color: G.forest, margin: "0 0 14px", letterSpacing: "-1px", lineHeight: 1.15 }}>
          Un sistema pensado para la clínica y para vos
        </h2>
        <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, margin: "0 0 12px" }}>
          La Clínica Veterinaria San Roque digitalizó toda su gestión con un sistema web integral que unifica la administración clínica, comercial y el acceso de los clientes.
        </p>
        <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, margin: 0 }}>
          Cada rol —administrador, veterinario, asistente, vendedor y cliente— tiene acceso exactamente a lo que necesita, garantizando seguridad y eficiencia en cada proceso.
        </p>
      </div>
    </div>
  );
}

// ── SECCIÓN 5: Contacto ── REDISEÑADA ─────────────────────────────
function ContactoSection({ isMobile }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      padding: isMobile ? "72px 20px 24px" : "0 64px 0 96px",
      justifyContent: "center", background: G.white,
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <div style={{
          display: "inline-flex", background: G.mint,
          border: `1px solid ${G.border}`, borderRadius: 99,
          padding: "4px 14px", marginBottom: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.leaf, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contacto</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: G.forest, margin: "0 0 6px", letterSpacing: "-1px" }}>
          ¿Necesitás ayuda?
        </h2>
        <p style={{ fontSize: 14, color: G.muted, margin: 0 }}>
          Encontranos en Punta Alta o escribinos por Instagram.
        </p>
      </div>

      {/* Grid: mapa + cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 20 : 24,
        maxWidth: 860,
        alignItems: "stretch",
      }}>

        {/* Columna izquierda: mapa */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2196.692958789054!2d-62.08201031397541!3d-38.86467307790214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95ed9d6365f8a03b%3A0xae0213e78af39e51!2sVeterinaria%20San%20Roque!5e0!3m2!1ses-419!2sar!4v1780946843414!5m2!1ses-419!2sar"
            style={{
              width: "100%",
              height: isMobile ? 200 : "100%",
              minHeight: isMobile ? "auto" : 300,
              flex: 1,
              borderRadius: 14, border: `1px solid ${G.border}`, display: "block",
            }}
            allowFullScreen="" loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación Clínica Veterinaria San Roque"
          />
          <p style={{ fontSize: 12, color: G.muted, margin: "8px 0 0", textAlign: "center" }}>
            Veterinaria San Roque · Punta Alta, Buenos Aires
          </p>
        </div>

        {/* Columna derecha: cards que llenan el alto */}
        <div style={{
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", gap: 10,
        }}>
          {/* Dirección */}
          <div style={{
            flex: 1, background: G.foam, border: `1px solid ${G.border}`,
            borderRadius: 12, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: G.mint, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📍</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Dirección</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.forest }}>Punta Alta, Buenos Aires</div>
            </div>
          </div>

          {/* Teléfono */}
          <div style={{
            flex: 1, background: G.foam, border: `1px solid ${G.border}`,
            borderRadius: 12, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: G.mint, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📞</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Teléfono</div>
              <a href="tel:+542932507203" style={{ fontSize: 14, fontWeight: 700, color: G.leaf, textDecoration: "none" }}>2932 507203</a>
            </div>
          </div>

          {/* Instagram */}
          <div style={{
            flex: 1, background: G.foam, border: `1px solid ${G.border}`,
            borderRadius: 12, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: G.mint, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📸</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Instagram</div>
              <a href="https://www.instagram.com/precedojulieta/" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, fontWeight: 700, color: G.leaf, textDecoration: "none" }}>
                @precedojulieta
              </a>
            </div>
          </div>

          {/* Horario — verde oscuro, más alto */}
          <div style={{
            flex: 1.6, background: G.forest, border: `1px solid ${G.forest}`,
            borderRadius: 12, padding: "16px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⏰</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Horario</div>
              <div style={{ fontSize: 13, color: "white", lineHeight: 1.9 }}>
                <span style={{ fontWeight: 700 }}>Lun a Vie</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 400 }}> · 9:00–12:30 / 17:30–21:00</span>
                <br />
                <span style={{ fontWeight: 700 }}>Sábado</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 400 }}> · 10:00–12:00</span>
                <br />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400 }}>Dom · cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${G.border}` }}>
        <p style={{ margin: 0, fontSize: 12, color: G.muted }}>
          © {new Date().getFullYear()} Clínica Veterinaria San Roque · Desarrollado por @stefaniaarevalo2026
        </p>
      </div>
    </div>
  );
}

// ── Login Modal ───────────────────────────────────────────────────
function LoginModal({ onLogin, onClose, isMobile }) {
  const [form, setForm] = useState({ usuario: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const hc = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.password) { setError("Completá todos los campos."); return; }
    setLoading(true);
    try { await onLogin(form); }
    catch (err) { setError(err.response?.data?.msg || "Usuario o contraseña incorrectos."); }
    finally { setLoading(false); }
  };

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "11px 14px 11px 42px", borderRadius: 9, fontSize: 14,
    border: `1px solid ${G.border}`, background: G.foam, color: G.text,
    outline: "none", fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(26,61,40,0.45)", backdropFilter: "blur(8px)", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: G.white, borderRadius: 18, border: `1px solid ${G.border}`,
        boxShadow: "0 24px 64px rgba(26,61,40,0.15)",
        padding: isMobile ? "28px 20px" : "36px 32px",
        width: "100%", maxWidth: 380, position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          width: 30, height: 30, borderRadius: 8,
          background: G.gray100, border: "none", cursor: "pointer",
          fontSize: 13, color: G.gray600,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 12px",
            background: G.forest, display: "flex", alignItems: "center",
            justifyContent: "center", overflow: "hidden", padding: 10,
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 900, color: G.forest, letterSpacing: "-0.5px" }}>
            Acceso al sistema
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: G.muted }}>Ingresá con tus credenciales</p>
        </div>

        {error && (
          <div style={{
            background: G.redBg, border: `1px solid #f7c1c1`,
            borderLeft: `4px solid ${G.red}`, borderRadius: 9,
            padding: "10px 14px", color: G.red, fontSize: 13, marginBottom: 14,
            display: "flex", alignItems: "center", gap: 8,
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.forest, marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Usuario
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>👤</span>
              <input type="text" name="usuario" value={form.usuario} onChange={hc}
                placeholder="Tu usuario" autoComplete="username" style={inp}
                onFocus={e => { e.target.style.borderColor = G.leaf; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
                onBlur={e => { e.target.style.borderColor = G.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.forest, marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔒</span>
              <input type={showPass ? "text" : "password"} name="password"
                value={form.password} onChange={hc} placeholder="Tu contraseña"
                autoComplete="current-password" style={{ ...inp, paddingRight: 42 }}
                onFocus={e => { e.target.style.borderColor = G.leaf; e.target.style.boxShadow = `0 0 0 3px rgba(39,107,66,0.1)`; }}
                onBlur={e => { e.target.style.borderColor = G.border; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center",
              }}>
                <img src={showPass ? "/closeeye.png" : "/openeye.png"} alt={showPass ? "Ocultar" : "Mostrar"} style={{ width: 18, height: 18, opacity: 0.45 }} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px",
            background: loading ? G.gray200 : G.forest,
            color: loading ? G.gray400 : "white",
            border: "none", borderRadius: 9, fontSize: 14, fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = G.pine; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = G.forest; }}
          >
            {loading ? (
              <>
                <svg style={{ animation: "spin 1s linear infinite", width: 15, height: 15 }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Ingresando...
              </>
            ) : "Ingresar →"}
          </button>
        </form>

        <div style={{
          marginTop: 16, padding: "10px 13px", borderRadius: 9,
          background: G.mint, border: `1px solid ${G.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 13 }}>🔒</span>
          <p style={{ margin: 0, fontSize: 12, color: G.muted, lineHeight: 1.5 }}>
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

      <div ref={containerRef} style={{
        height: "100dvh", overflowY: "scroll",
        scrollSnapType: "y mandatory", scrollBehavior: "smooth",
        marginLeft: isMobile ? 0 : 72,
      }}>
        <SnapSection id="inicio"    bg={G.white}><HeroSection     onLoginClick={() => setShowForm(true)} isMobile={isMobile} /></SnapSection>
        <SnapSection id="servicios" bg={G.foam}> <ServiciosSection isMobile={isMobile} /></SnapSection>
        <SnapSection id="portal"    bg={G.white}><PortalSection    isMobile={isMobile} /></SnapSection>
        <SnapSection id="nosotros"  bg={G.foam}> <NosotrosSection  isMobile={isMobile} /></SnapSection>
        <SnapSection id="contacto"  bg={G.white}><ContactoSection  isMobile={isMobile} /></SnapSection>
      </div>

      {showForm && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowForm(false)} isMobile={isMobile} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::selection { background: rgba(39,107,66,0.15); }
        ::-webkit-scrollbar { display: none; }
        body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}