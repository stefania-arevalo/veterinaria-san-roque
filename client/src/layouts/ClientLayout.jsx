import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { VET_COLORS } from "../layouts/AdminLayout";

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const NAV = [
    { label: "Inicio",      path: "/cliente",           icon: "🏠" },
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
      fontFamily: "'Segoe UI', system-ui, sans-serif" 
    }}>

      {/* Navbar */}
      <header style={{
        background: VET_COLORS.headerBg,
        borderBottom: `1px solid ${VET_COLORS.border}`,
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${VET_COLORS.success}, ${VET_COLORS.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 8px rgba(46,125,50,0.2)`,
              overflow: "hidden", 
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: VET_COLORS.text, lineHeight: 1 }}>San Roque</div>
              <div style={{ fontSize: "11px", color: VET_COLORS.textMuted, lineHeight: 1, marginTop: "2px" }}>Vet Shop</div>
            </div>
          </div>

          {/* Nav links */}
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

          {/* Usuario + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: VET_COLORS.text }}>{user?.usuario}</div>
              <div style={{ fontSize: "11px", color: VET_COLORS.textMuted }}>Cliente</div>
            </div>
            <button
              onClick={() => setShowLogout(true)}
              style={{
                width: "36px", height: "36px", borderRadius: "10px",
                border: `1.5px solid ${VET_COLORS.border}`, background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "15px", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff1f1"; e.currentTarget.style.borderColor = VET_COLORS.danger; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = VET_COLORS.border; }}
            >🚪</button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main style={{ flex: 1, maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "32px 24px" }}>
        <Outlet />
      </main>

      {/* Footer Corregido con VET_COLORS */}
      <footer style={{ 
        background: VET_COLORS.headerBg, 
        borderTop: `1px solid ${VET_COLORS.border}`,
        padding: "20px 24px", 
        textAlign: "center" 
      }}>
        <p style={{ margin: 0, fontSize: "12px", color: VET_COLORS.textMuted, fontWeight: "500" }}>
          © {new Date().getFullYear()} Clínica Veterinaria San Roque · Desarrollado por @stefaniaarevalo2026
        </p>
      </footer>

      {/* Modal logout Corregido con VET_COLORS */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowLogout(false)} />
          <div style={{ position: "relative", background: "white", borderRadius: "20px", padding: "32px", width: "320px", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
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