import { useState } from "react";
import CatalogManager from "../../components/forms/CatalogManager";

const C = {
  accent:        "#2d6a4f",
  accentLight:   "#d8f3dc",
  border:        "#e2e8f0",
  muted:         "#6b7280",
  white:         "#ffffff",
  sidebarActive: "#1b4332",
};

const SECCIONES = [

  // ── SERVICIOS ────────────────────────────────────────────────────────────
  {
    id: "servicios",
    titulo: "Servicios",
    catalogos: [
      // Modelo: idTipoServicio | descripcion
      {
        title: "Tipos de Servicio",
        endpoint: "/service-type",
        getEndpoint: "/service-types",
        idField: "idTipoServicio",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idServicio | descripcion | idTipoServicio
      // ⚠️ El GET /services falla en el backend por EagerLoadingError.
      // Fix en backend → service controller: { model: ServiceType, as: 'ServiceType' }
      {
        title: "Servicios",
        endpoint: "/service",
        getEndpoint: "/services",
        idField: "idServicio",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion",    label: "Descripción",        required: true },
          { field: "idTipoServicio", label: "ID Tipo de Servicio", required: true, type: "number", placeholder: "ej: 1" },
        ],
      },
      // Modelo: idPrecioServicio | idServicio | idTamaño | precio | duracionEstimada
      {
        title: "Precios de Servicio",
        endpoint: "/service-price",
        getEndpoint: "/service-prices",
        idField: "idPrecioServicio",
        labelField: "idPrecioServicio",
        searchField: "idServicio",
        columns: [
          { field: "idServicio",        label: "ID Servicio",            required: true, type: "number", placeholder: "ej: 1" },
          { field: "idTamaño",          label: "ID Tamaño Animal",       required: true, type: "number", placeholder: "ej: 1" },
          { field: "precio",            label: "Precio",                  required: true, type: "number", placeholder: "ej: 1500.00" },
          { field: "duracionEstimada",  label: "Duración estimada (min)",              type: "number", placeholder: "ej: 30" },
        ],
      },
      // Modelo: idTipoCita | descripcion
      {
        title: "Tipos de Cita",
        endpoint: "/appointment-type",
        getEndpoint: "/appointment-types",
        idField: "idTipoCita",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idTipoPago | descripcion
      {
        title: "Tipos de Pago",
        endpoint: "/payment-type",
        getEndpoint: "/payment-types",
        idField: "idTipoPago",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idTipoBoleta | descripcion
      {
        title: "Tipos de Boleta",
        endpoint: "/receipt-type",
        getEndpoint: "/receipt-types",
        idField: "idTipoBoleta",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idEstadoCita | descripcion
      {
        title: "Estados de Cita",
        endpoint: "/appointment-state",
        getEndpoint: "/appointment-states",
        idField: "idEstadoCita",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idEstadoServicio | descripcion
      {
        title: "Estados de Servicio en Cita",
        endpoint: "/service-appointment-state",
        getEndpoint: "/service-appointment-states",
        idField: "idEstadoServicio",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idEstadoVenta | descripcion
      {
        title: "Estados de Venta",
        endpoint: "/sale-state",
        getEndpoint: "/sale-states",
        idField: "idEstadoVenta",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
    ],
  },

  // ── EMPLEADOS ─────────────────────────────────────────────────────────────
  {
    id: "empleados",
    titulo: "Empleados",
    catalogos: [
      // Modelo: idRol | descripcion
      // ⚠️ El router de /roles tiene validateId en el GET /roles lo que es un bug
      // del backend — ese middleware no debería estar en el GET de lista.
      {
        title: "Roles de Usuario",
        endpoint: "/role",
        getEndpoint: "/roles",
        idField: "idRol",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idHorario | diaSemana | turno | horaInicio | horaFin
      {
        title: "Horarios de Atención",
        endpoint: "/schedule",
        getEndpoint: "/schedules",
        idField: "idHorario",
        labelField: "diaSemana",
        searchField: "diaSemana",
        columns: [
          {
            field: "diaSemana",
            label: "Día de la semana",
            required: true,
            type: "select",
            options: [
              { value: "Lunes",     label: "Lunes"      },
              { value: "Martes",    label: "Martes"     },
              { value: "Miercoles", label: "Miércoles"  },
              { value: "Jueves",    label: "Jueves"     },
              { value: "Viernes",   label: "Viernes"    },
              { value: "Sabado",    label: "Sábado"     },
              { value: "Domingo",   label: "Domingo"    },
            ],
          },
          {
            field: "turno",
            label: "Turno",
            required: true,
            type: "select",
            options: [
              { value: "Mañana", label: "Mañana" },
              { value: "Tarde",  label: "Tarde"  },
              { value: "Noche",  label: "Noche"  },
            ],
          },
          { field: "horaInicio", label: "Hora de inicio", type: "time", required: true },
          { field: "horaFin",    label: "Hora de fin",    type: "time", required: true },
        ],
      },
      // Modelo: idSalario | fechaLiquidacion | horasTrabajadas | tarifaHora
      // Es catálogo porque define estructuras salariales reutilizables por el staff.
      {
        title: "Salarios / Tarifas",
        endpoint: "/salary",
        getEndpoint: "/salaries",
        idField: "idSalario",
        labelField: "idSalario",
        searchField: "fechaLiquidacion",
        columns: [
          { field: "fechaLiquidacion", label: "Fecha de liquidación", required: true, type: "date" },
          { field: "horasTrabajadas",  label: "Horas trabajadas",     required: true, type: "number", placeholder: "ej: 160" },
          { field: "tarifaHora",       label: "Tarifa por hora ($)",  required: true, type: "number", placeholder: "ej: 500.00" },
        ],
      },
      // Modelo: idMatricula (PK manual) | fechaExpedicion | fechaVencimiento
      // Nota: las matrículas están aquí porque son el catálogo base;
      // se asocian al veterinario desde la página de gestión de personal.
      {
        title: "Matrículas Profesionales",
        endpoint: "/card",
        getEndpoint: "/cards",
        idField: "idMatricula",
        labelField: "idMatricula",
        searchField: "idMatricula",
        columns: [
          { field: "idMatricula",      label: "N° Matrícula",         required: true, type: "number" },
          { field: "fechaExpedicion",  label: "Fecha de expedición",  required: true, type: "date"   },
          { field: "fechaVencimiento", label: "Fecha de vencimiento", required: true, type: "date"   },
        ],
      },
    ],
  },

  // ── CONTACTOS ─────────────────────────────────────────────────────────────
  {
    id: "contactos",
    titulo: "Contactos",
    catalogos: [
      // Modelo: idLocalidad | nombre
      {
        title: "Localidades",
        endpoint: "/locality",
        getEndpoint: "/localities",
        idField: "idLocalidad",
        labelField: "nombre",
        searchField: "nombre",
        columns: [
          { field: "nombre", label: "Nombre", required: true },
        ],
      },
      // Modelo: idProveedor | razonSocial | cuit | telefono | direccion | correo | idLocalidad
      {
        title: "Proveedores",
        endpoint: "/provider",
        getEndpoint: "/providers",
        idField: "idProveedor",
        labelField: "razonSocial",
        searchField: "razonSocial",
        columns: [
          { field: "razonSocial", label: "Razón Social",  required: true },
          { field: "cuit",        label: "CUIT",           required: true, placeholder: "ej: 20-12345678-9" },
          { field: "telefono",    label: "Teléfono",       required: true, type: "tel" },
          { field: "direccion",   label: "Dirección" },
          { field: "correo",      label: "Correo",         type: "email" },
          { field: "idLocalidad", label: "ID Localidad",   required: true, type: "number", placeholder: "ej: 1" },
        ],
      },
      // Modelo: idVisitador | nombre | apellido | telefono | correo | idProveedor
      {
        title: "Visitadores Médicos",
        endpoint: "/visitor",
        getEndpoint: "/visitors",
        idField: "idVisitador",
        labelField: "nombre",
        searchField: "nombre",
        columns: [
          { field: "nombre",      label: "Nombre",       required: true },
          { field: "apellido",    label: "Apellido",     required: true },
          { field: "telefono",    label: "Teléfono",     type: "tel" },
          { field: "correo",      label: "Correo",       type: "email" },
          { field: "idProveedor", label: "ID Proveedor", required: true, type: "number", placeholder: "ej: 1" },
        ],
      },
    ],
  },

  // ── TRATAMIENTOS ──────────────────────────────────────────────────────────
  {
    id: "tratamientos",
    titulo: "Tratamientos",
    catalogos: [
      // Modelo: idTipoTratamiento | nombre | descripcion
      {
        title: "Tipos de Tratamiento",
        endpoint: "/treatment-type",
        getEndpoint: "/treatment-types",
        idField: "idTipoTratamiento",
        labelField: "nombre",
        searchField: "nombre",
        columns: [
          { field: "nombre",      label: "Nombre",      required: true },
          { field: "descripcion", label: "Descripción", required: true, type: "textarea" },
        ],
      },
      // Modelo: idEstadoTratamiento | descripcion
      {
        title: "Estados de Tratamiento",
        endpoint: "/treatment-state",
        getEndpoint: "/treatment-states",
        idField: "idEstadoTratamiento",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idTipoMedicacion | descripcion
      {
        title: "Tipos de Medicación",
        endpoint: "/medication-type",
        getEndpoint: "/medication-types",
        idField: "idTipoMedicacion",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
    ],
  },

  // ── PACIENTES / MASCOTAS ──────────────────────────────────────────────────
  {
    id: "pacientes",
    titulo: "Pacientes / Mascotas",
    catalogos: [
      // Modelo: idEspecie | nombre
      {
        title: "Especies",
        endpoint: "/species",
        getEndpoint: "/species",
        idField: "idEspecie",
        labelField: "nombre",
        searchField: "nombre",
        columns: [
          { field: "nombre", label: "Nombre", required: true },
        ],
      },
      // Modelo: idRaza | nombre | idEspecie
      {
        title: "Razas",
        endpoint: "/breed",
        getEndpoint: "/breeds",
        idField: "idRaza",
        labelField: "nombre",
        searchField: "nombre",
        columns: [
          { field: "nombre",    label: "Nombre",     required: true },
          { field: "idEspecie", label: "ID Especie", required: true, type: "number", placeholder: "ej: 1" },
        ],
      },
      // Modelo: idTamaño | descripcion  (nombre del campo con tilde, igual que en BD)
      {
        title: "Tamaños de Animal",
        endpoint: "/animal-size",
        getEndpoint: "/animal-sizes",
        idField: "idTamaño",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true, placeholder: "ej: Pequeño (0-5 kg)" },
        ],
      },
      // Modelo: idEstadoMascota | descripcion
      {
        title: "Estados de Mascota",
        endpoint: "/pet-state",
        getEndpoint: "/pet-states",
        idField: "idEstadoMascota",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
    ],
  },

  // ── PRODUCTOS / STOCK ─────────────────────────────────────────────────────
  {
    id: "productos",
    titulo: "Productos / Stock",
    catalogos: [
      // Modelo: idCategoria | descripcion
      {
        title: "Categorías de Producto",
        endpoint: "/category",
        getEndpoint: "/categories",
        idField: "idCategoria",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idMarca | descripcion
      {
        title: "Marcas",
        endpoint: "/brand",
        getEndpoint: "/brands",
        idField: "idMarca",
        labelField: "descripcion",
        searchField: "descripcion",
        columns: [
          { field: "descripcion", label: "Descripción", required: true },
        ],
      },
      // Modelo: idPresentacion | tipo | concentracion | formato | cantidad
      {
        title: "Presentaciones de Producto",
        endpoint: "/presentation",
        getEndpoint: "/presentations",
        idField: "idPresentacion",
        labelField: "tipo",
        searchField: "tipo",
        columns: [
          { field: "tipo",          label: "Tipo de envase",  required: true, placeholder: "ej: Frasco, Blíster, Caja" },
          { field: "formato",       label: "Formato",         required: true, placeholder: "ej: Comprimido, Jarabe, Inyectable" },
          { field: "concentracion", label: "Concentración",                   placeholder: "ej: 500 mg, 10 mg/ml" },
          { field: "cantidad",      label: "Cantidad",        required: true, type: "number", placeholder: "ej: 30" },
        ],
      },
    ],
  },
];

// ─── Sidebar item ─────────────────────────────────────────────────────────────
function SidebarItem({ seccion, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", padding: "10px 14px",
        border: "none",
        borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
        background: isActive ? C.accentLight : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "space-between", transition: "all 0.15s",
        borderRadius: "0 8px 8px 0", marginBottom: 2,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0fdf4"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.sidebarActive : "#374151" }}>
        {seccion.titulo}
      </span>
      <span style={{
        fontSize: 11, background: isActive ? C.accent : "#e2e8f0",
        color: isActive ? "white" : C.muted,
        borderRadius: 99, padding: "1px 7px", fontWeight: 600, flexShrink: 0,
      }}>
        {seccion.catalogos.length}
      </span>
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [activeId, setActiveId] = useState(SECCIONES[0].id);
  const seccionActiva = SECCIONES.find(s => s.id === activeId);

  return (
    <div style={{ display: "flex", gap: 20, maxWidth: 1080, margin: "0 auto" }}>

      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0, background: C.white,
        borderRadius: 14, border: `0.5px solid ${C.border}`,
        overflow: "hidden", alignSelf: "flex-start",
        position: "sticky", top: 16,
      }}>
        <div style={{ padding: "12px 14px 8px", borderBottom: `0.5px solid ${C.border}`, background: "#fafbfc" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Secciones
          </p>
        </div>
        <nav style={{ padding: "8px 6px" }}>
          {SECCIONES.map(s => (
            <SidebarItem key={s.id} seccion={s} isActive={activeId === s.id} onClick={() => setActiveId(s.id)} />
          ))}
        </nav>
        <div style={{ padding: "10px 14px", borderTop: `0.5px solid ${C.border}`, background: "#fafbfc" }}>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            Los cambios se aplican de inmediato.
          </p>
        </div>
      </aside>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1a202c" }}>
            {seccionActiva.titulo}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            {seccionActiva.catalogos.length}{" "}
            {seccionActiva.catalogos.length === 1 ? "catálogo" : "catálogos"} en esta sección
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {seccionActiva.catalogos.map(cat => (
            <CatalogManager key={cat.endpoint} {...cat} />
          ))}
        </div>
      </div>
    </div>
  );
}