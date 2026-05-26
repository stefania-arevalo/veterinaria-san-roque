import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize"; 
import { VET_COLORS } from "../layouts/AdminLayout";

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isMobile } = useWindowSize(); 

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { 
    logout(); 
    navigate("/login"); 
  };

  const NAV = [
    { label: "Inicio",       path: "/cliente",          icon: "🏠" },
    { label: "Mis mascotas", path: "/cliente/mascotas", icon: "🐾" },
    { label: "Mis citas",    path: "/cliente/turnos",    icon: "📅" },
    { label: "Mi perfil",    path: "/cliente/perfil",   icon: "👤" },
  ];

  const isActive = (path) =>
    path === "/cliente" ? location.pathname === "/cliente" : location.pathname.startsWith(path);

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      background: VET_COLORS.pageBg, 
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      paddingBottom: isMobile ? "64px" : "0px"
    }}>

      {/* Navbar Superior */}
      <header style={{
        background: VET_COLORS.headerBg,
        borderBottom: `1px solid ${VET_COLORS.border}`,
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ 
          maxWidth: "1100px", 
          margin: "0 auto", 
          padding: isMobile ? "0 16px" : "0 24px", 
          height: "64px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}>
          
          {/* Logo e Identidad */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${VET_COLORS.success}, ${VET_COLORS.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(46,125,50,0.2)",
              overflow: "hidden", 
              flexShrink: 0
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: isMobile ? "14px" : "15px", color: VET_COLORS.text, lineHeight: 1 }}>San Roque</div>
              <div style={{ fontSize: "11px", color: VET_COLORS.textMuted, lineHeight: 1, marginTop: "2px" }}>Vet Shop</div>
            </div>
          </div>

          {/* Menú de Navegación Tradicional (Solo en Escritorio/Tablet) */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: "4px" }}>
              {NAV.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 14px", borderRadius: "10px", border: "none",
                    background: isActive(item.path) ? VET_COLORS.accentLight : "transparent",
                    color: isActive(item.path) ? VET_COLORS.sidebarHover : VET_COLORS.text,
                    fontWeight: isActive(item.path) ? "700" : "500",
                    fontSize: "13px", cursor: "pointer", transition: "all 0.15s",
                    borderBottom: isActive(item.path) ? `2px solid ${VET_COLORS.sidebarActive}` : "2px solid transparent",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Bloque de Usuario + Botón de Salida (Adaptado para Mobile) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Ocultamos el bloque de texto en celulares para evitar desbordes en el header */}
            {!isMobile && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: VET_COLORS.text }}>{user?.usuario}</div>
                <div style={{ fontSize: "11px", color: VET_COLORS.textMuted }}>Cliente</div>
              </div>
            )}
            
            <button
              onClick={() => setShowLogout(true)}
              style={{
                width: "36px", height: "36px", borderRadius: "10px",
                border: `1.5px solid ${VET_COLORS.border}`, background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "15px", transition: "all 0.15s",
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff1f1"; e.currentTarget.style.borderColor = VET_COLORS.danger; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = VET_COLORS.border; }}
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ 
        flex: 1, 
        maxWidth: "1100px", 
        width: "100%", 
        margin: "0 auto", 
        padding: isMobile ? "16px 12px" : "32px 24px" 
      }}>
        <Outlet />
      </main>

      {/* Menú Móvil Inferior (Bottom Navigation Bar) */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: "60px", background: VET_COLORS.headerBg,
          borderTop: `1px solid ${VET_COLORS.border}`,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          display: "flex", justifyContent: "space-around", alignItems: "center",
          zIndex: 100, padding: "0 8px"
        }}>
          {NAV.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "3px", width: "22%", height: "100%", border: "none", background: "transparent",
                color: isActive(item.path) ? VET_COLORS.sidebarHover : VET_COLORS.textMuted,
                fontWeight: isActive(item.path) ? "700" : "500",
                fontSize: "10px", cursor: "pointer", transition: "all 0.1s ease",
                position: "relative"
              }}
            >
              {/* Indicador superior flotante para el botón activo */}
              {isActive(item.path) && (
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%",
                  height: "3px", background: VET_COLORS.sidebarActive,
                  borderRadius: "0 0 4px 4px"
                }} />
              )}
              <span style={{ 
                fontSize: "20px",
                transform: isActive(item.path) ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.15s ease"
              }}>
                {item.icon}
              </span>
              <span style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Footer */}
      <footer style={{ 
        background: VET_COLORS.headerBg, 
        borderTop: `1px solid ${VET_COLORS.border}`,
        padding: "20px 24px", 
        textAlign: "center",
        display: isMobile ? "none" : "block"
      }}>
        <p style={{ margin: 0, fontSize: "12px", color: VET_COLORS.textMuted, fontWeight: "500" }}>
          © {new Date().getFullYear()} Clínica Veterinaria San Roque · Desarrollado por @stefaniaarevalo2026
        </p>
      </footer>

      {/* Modal de confirmación para Cerrar Sesión */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowLogout(false)} />
          <div style={{ 
            position: "relative", background: "white", borderRadius: "20px", 
            padding: "32px", width: isMobile ? "90vw" : "320px", 
            textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" 
          }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>👋</div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: VET_COLORS.text, margin: "0 0 8px" }}>¿Cerrar sesión?</h3>
            <p style={{ color: VET_COLORS.textMuted, fontSize: "14px", margin: "0 0 24px" }}>Vas a volver a la pantalla de inicio.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowLogout(false)} 
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1.5px solid ${VET_COLORS.border}`, background: "white", fontWeight: "600", fontSize: "14px", cursor: "pointer", color: VET_COLORS.text }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout} 
                style={{ 
                  flex: 1, padding: "12px", borderRadius: "12px", border: "none", 
                  background: `linear-gradient(135deg, ${VET_COLORS.success}, ${VET_COLORS.accent})`, 
                  color: "white", fontWeight: "600", fontSize: "14px", cursor: "pointer" 
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}