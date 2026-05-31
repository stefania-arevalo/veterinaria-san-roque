import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute }   from "./routes/ProtectedRoute";
import { PermissionRoute }  from "./routes/PermissionRoute";   // ← nuevo

import AdminLayout  from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";

// ── Páginas staff ────────────────────────────────────────────────
import LoginPage        from "./pages/staff/LoginPage";
import Dashboard        from "./pages/staff/Dashboard.jsx";
import ClientsPage      from "./pages/staff/ClientsPage.jsx";
import PetsPage         from "./pages/staff/PetsPage.jsx";
import VentasPage       from "./pages/staff/VentasPage.jsx";
import AppointmentsPage from "./pages/staff/AppointmentsPage.jsx";
import PurchasePage       from "./pages/staff/PurchasePage.jsx";
import StockPage from "./pages/staff/StockPage.jsx"

// ── Páginas admin ────────────────────────────────────────────────
import ConfiguracionPage from "./pages/admin/ConfiguracionPage";
import PermissionsPage from "./pages/admin/PermissionsPage.jsx";
import UsuariosPage    from "./pages/admin/UsersManagementPage.jsx";
import ReportsPage     from "./pages/admin/ReportsPage.jsx";

// ── Páginas vet ────────────────────────────────────────────────
import ClinicalHistoryPage  from "./pages/veterinarian/ClinicalHistoryPage.jsx";

// ── Páginas cliente ──────────────────────────────────────────────
import ClientDashboard  from "./pages/client/ClientDashboard";
import MyPets           from "./pages/client/MyPet";
import MyAppointments   from "./pages/client/MyAppoiment";
import MyProfile        from "./pages/client/MyProfile";

// ── Sin permiso ──────────────────────────────────────────────────
function SinPermiso() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", backgroundColor: "#f0fdf4", textAlign: "center",
    }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <span style={{ fontSize: "40px" }}>🚫</span>
        <p style={{ color: "#166534", fontSize: "18px", fontWeight: "600", marginTop: "16px" }}>
          No tenés permiso para ver esta página.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{ marginTop: "20px", color: "#2e7d32", textDecoration: "underline", cursor: "pointer", border: "none", background: "none" }}
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ backgroundColor: "#f0fdf4", minHeight: "100vh" }}>
        <Routes>

          {/* ── Públicas ── */}
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/sin-permiso" element={<SinPermiso />} />

          {/* ── Panel staff (roles 1-4) ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard: cualquier rol staff puede verlo */}
            <Route index element={<Dashboard />} />

            {/* 
              Cada ruta queda envuelta en PermissionRoute con la "pagina"
              que coincide con la clave usada en la BD y en AuthContext.canAccess().

              Admin (idRol 1) → pasa siempre.
              Resto           → necesita permisos[pagina] === true.
            */}

            {/* Ventas */}
            <Route
              path="ventas"
              element={
                <PermissionRoute pagina="ventas">
                  <VentasPage />
                </PermissionRoute>
              }
            />

            {/* Turnos / Citas */}
            <Route
              path="turnos"
              element={
                <PermissionRoute pagina="citas">
                  <AppointmentsPage />
                </PermissionRoute>
              }
            />

            {/* Clientes */}
            <Route
              path="clientes"
              element={
                <PermissionRoute pagina="clientes">
                  <ClientsPage />
                </PermissionRoute>
              }
            />

            {/* Pacientes */}
            <Route
              path="pacientes"
              element={
                <PermissionRoute pagina="pacientes">
                  <PetsPage />
                </PermissionRoute>
              }
            />

            {/* Compras */}
            <Route
              path="compras"
              element={
                <PermissionRoute pagina="compras">
                  <PurchasePage />
                </PermissionRoute>
              }
            />

            {/* Inventario */}
            <Route
              path="productos"
              element={
                <PermissionRoute pagina="productos">
                  <StockPage />
                </PermissionRoute>
              }
            />

            {/* Configuración */}
            <Route
              path="configuracion"
              element={
                <PermissionRoute pagina="configuracion">
                  <ConfiguracionPage />
                </PermissionRoute>
              }
            />

            {/* Reportes — Solo Admin (idRol: 1) o bajo permiso dinámico */}
            <Route 
              path="reportes" 
              element={
                <PermissionRoute pagina="reportes">
                  <ReportsPage />
                </PermissionRoute>
              } 
            />

            {/* Empleados y Usuarios */}
            <Route 
              path="empleados/permisos" 
              element={
                <PermissionRoute pagina="usuarios">
                  <PermissionsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="empleados/usuarios" 
              element={
                <PermissionRoute pagina="usuarios">
                  <UsuariosPage />
                </PermissionRoute>
              } 
            />

            {/* Historiales Clinicos Pacientes */}
            <Route
              path="mascotas/historial"
              element={
                <PermissionRoute pagina="historial_clinico">
                  <ClinicalHistoryPage />
                </PermissionRoute>
              }
            />

          </Route>

          {/* ── Panel cliente (rol 5) ── */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRoles={[5]}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index       element={<ClientDashboard />} />
            <Route path="mascotas" element={<MyPets />} />
            <Route path="turnos"   element={<MyAppointments />} />
            <Route path="perfil"   element={<MyProfile />} />
          </Route>

          {/* ── Fallbacks ── */}
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;