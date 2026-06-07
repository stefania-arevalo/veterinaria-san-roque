import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { VET_COLORS } from "../layouts/AdminLayout";

const G = {
  forest:  "#1a3d28",
  pine:    "#1f5c38",
  leaf:    "#276b42",
  mint:    "#eaf3de",
  border:  "#d1ddd4",
  muted:   "#6b8f76",
  foam:    "#f8fbf9",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
};

const NAV = [
  { label: "Inicio",       path: "/cliente",          icon: "🏠" },
  { label: "Mis mascotas", path: "/cliente/mascotas", icon: "🐾" },
  { label: "Mis citas",    path: "/cliente/turnos",   icon: "📅" },
  { label: "Comprobantes",    path: "/cliente/comprobantes",  icon: "🧾" }, 
  { label: "Mi perfil",    path: "/cliente/perfil",   icon: "👤" },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile, isTablet } = useWindowSize();
  const [showLogout, setShowLogout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = (path) =>
    path === "/cliente" ? location.pathname === "/cliente" : location.pathname.startsWith(path);

  const isCompact = isMobile || isTablet;

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: VET_COLORS.pageBg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      // Espacio para bottom nav en mobile
      paddingBottom: isMobile ? 64 : 0,
    }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header style={{
        background: "white",
        borderBottom: `1px solid ${G.border}`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: isCompact ? "100%" : 1100,
          margin: "0 auto",
          padding: isCompact ? "0 14px" : "0 24px",
          height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: G.forest,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "5px", filter: "brightness(0) invert(1)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: isCompact ? 13 : 14, color: G.forest, lineHeight: 1 }}>San Roque</div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 1, letterSpacing: "0.03em" }}>Veterinaria</div>
            </div>
          </div>

          {/* Nav horizontal (tablet y desktop) */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 4 }}>
              {NAV.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 13px", borderRadius: 9, border: "none",
                  background: isActive(item.path) ? G.mint : "transparent",
                  color: isActive(item.path) ? G.forest : G.gray600,
                  fontWeight: isActive(item.path) ? 700 : 500,
                  fontSize: 13, cursor: "pointer", transition: "all 0.12s",
                  borderBottom: isActive(item.path) ? `2px solid ${G.leaf}` : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = G.foam; }}
                onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Usuario + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isMobile && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.forest }}>{user?.usuario}</div>
                <div style={{ fontSize: 11, color: G.muted }}>Cliente</div>
              </div>
            )}
            <button onClick={() => setShowLogout(true)} style={{
              width: 34, height: 34, borderRadius: 9,
              border: `1px solid ${G.border}`, background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15, transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff1f1"; e.currentTarget.style.borderColor = VET_COLORS.danger; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = G.border; }}
            title="Cerrar sesión">
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido principal ──────────────────────────────── */}
      <main style={{
        flex: 1,
        maxWidth: isCompact ? "100%" : 1100,
        width: "100%",
        margin: "0 auto",
        padding: isMobile ? "14px 12px" : isTablet ? "20px 18px" : "32px 24px",
      }}>
        <Outlet />
      </main>

      {/* ── Bottom nav (solo mobile) ─────────────────────────── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 64, background: "white",
          borderTop: `1px solid ${G.border}`,
          display: "flex", justifyContent: "space-around", alignItems: "center",
          zIndex: 100,
        }}>
          {NAV.map(item => {
            const active = isActive(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3, flex: 1, height: "100%", border: "none",
                background: "transparent",
                color: active ? G.forest : G.gray400,
                fontSize: 10, fontWeight: active ? 700 : 500,
                cursor: "pointer", position: "relative",
                transition: "color 0.12s",
              }}>
                {/* Indicador activo arriba */}
                {active && (
                  <div style={{
                    position: "absolute", top: 0, left: "25%", right: "25%",
                    height: 3, background: G.leaf,
                    borderRadius: "0 0 4px 4px",
                  }} />
                )}
                <span style={{
                  fontSize: 22,
                  transform: active ? "scale(1.1)" : "scale(1)",
                  transition: "transform 0.15s",
                }}>{item.icon}</span>
                <span style={{
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", width: "100%", textAlign: "center",
                  fontSize: 10,
                }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Footer (solo desktop) ───────────────────────────── */}
      {!isCompact && (
        <footer style={{
          background: "white",
          borderTop: `1px solid ${G.border}`,
          padding: "16px 24px",
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: G.muted }}>
            © {new Date().getFullYear()} Clínica Veterinaria San Roque · Desarrollado por @stefaniaarevalo2026
          </p>
        </footer>
      )}

      {/* ── Modal logout ─────────────────────────────────────── */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowLogout(false)} />
          <div style={{
            position: "relative", background: "white", borderRadius: 14,
            padding: "28px 24px", width: isMobile ? "88vw" : 300,
            textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            borderTop: `4px solid ${G.forest}`,
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: G.forest, margin: "0 0 8px" }}>¿Cerrar sesión?</h3>
            <p style={{ color: G.muted, fontSize: 13, margin: "0 0 22px" }}>Vas a volver a la pantalla de inicio.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={{
                flex: 1, padding: "11px", borderRadius: 9,
                border: `1px solid ${G.border}`, background: "white",
                fontWeight: 600, fontSize: 13, cursor: "pointer", color: G.muted,
              }}>Cancelar</button>
              <button onClick={handleLogout} style={{
                flex: 1, padding: "11px", borderRadius: 9, border: "none",
                background: G.forest, color: "white",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}