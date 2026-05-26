import axios from "../api/axios";
 
const token = () => localStorage.getItem("accessToken");
export const authHeaders = () => ({ Authorization: `Bearer ${token()}` });
const apiUrl = (path) => `/api/v1${path}`;
 
// ── Endpoints por entidad ────────────────────────────────────────────────────
const entityEndpoint = (entityType, entityId) => {
  if (entityType === "staff")  return apiUrl(`/staff/${entityId}`);
  if (entityType === "client") return apiUrl(`/client/${entityId}`);
  throw new Error(`entityType desconocido: ${entityType}`);
};
 
// ── Crear un usuario nuevo y vincularlo a una entidad ────────────────────────
// Retorna { idUsuario } o lanza error.
export async function createAndLinkUser({ usuario, contraseña, idRol, entityType, entityId }) {
  // 1. Crear el usuario
  const uRes = await axios.post(
    apiUrl("/user"),
    {
      usuario:    usuario.trim().toLowerCase(),
      contraseña,
      idRol,
      estado:     true,
    },
    { headers: authHeaders() }
  );
  const idUsuario = uRes.data.idUsuario;
 
  // 2. Vincular al staff / cliente
  await axios.patch(
    entityEndpoint(entityType, entityId),
    { idUsuario },
    { headers: authHeaders() }
  );
 
  return { idUsuario };
}
 
// ── Vincular un usuario existente a una entidad ──────────────────────────────
export async function linkExistingUser({ idUsuario, entityType, entityId }) {
  await axios.patch(
    entityEndpoint(entityType, entityId),
    { idUsuario: parseInt(idUsuario) },
    { headers: authHeaders() }
  );
}
 
// ── Desvincular usuario de una entidad (idUsuario = null) ────────────────────
export async function unlinkUser({ entityType, entityId }) {
  await axios.patch(
    entityEndpoint(entityType, entityId),
    { idUsuario: null },
    { headers: authHeaders() }
  );
}
 