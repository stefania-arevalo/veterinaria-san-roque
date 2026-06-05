import { useState, useEffect, useCallback } from "react";
import axios from "../../api/axios";

const token = () => localStorage.getItem("accessToken");
const auth  = () => ({ Authorization: `Bearer ${token()}` });

const C = {
  accent:  "#2d6a4f",
  border:  "#e2e8f0",
  muted:   "#6b7280",
  danger:  "#c62828",
};

// ─── Modal confirmación eliminar ──────────────────────────────────────────
function ConfirmDeleteModal({ item, labelField, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }} onClick={onCancel} />
      <div style={{
        position:"relative", background:"white", borderRadius:12,
        padding:"28px 32px", width:360, textAlign:"center",
        borderTop:`6px solid ${C.danger}`, boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
      }}>
        <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:"#1a202c" }}>Eliminar registro</h3>
        <p style={{ margin:"0 0 24px", fontSize:13, color:C.muted, lineHeight:1.5 }}>
          Se eliminará <strong>"{item?.[labelField] || "este registro"}"</strong>. Esta acción no se puede deshacer.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"10px", borderRadius:8,
            border:`1px solid ${C.border}`, background:"white",
            cursor:"pointer", fontWeight:600, fontSize:13,
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"10px", borderRadius:8, border:"none",
            background:C.danger, color:"white", cursor:"pointer", fontWeight:600, fontSize:13,
          }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear / editar ─────────────────────────────────────────────────
function FormModal({ title, columns, initialData, onSave, onCancel, saving, serverErrors }) {
  const [form, setForm]     = useState(() => {
    const base = {};
    columns.forEach(c => { base[c.field] = initialData?.[c.field] ?? ""; });
    return base;
  });
  const [errors, setErrors] = useState({});

  // Cuando llegan errores del servidor, mapearlos a los campos
  useEffect(() => {
    if (!serverErrors?.length) return;
    const mapped = {};
    serverErrors.forEach(msg => {
      // Busca qué campo del formulario corresponde al mensaje
      const col = columns.find(c =>
        msg.toLowerCase().includes(c.label.toLowerCase()) ||
        msg.toLowerCase().includes(c.field.toLowerCase())
      );
      if (col) mapped[col.field] = msg;
      else mapped["__general"] = msg; // errores sin campo claro van al pie
    });
    setErrors(prev => ({ ...prev, ...mapped }));
  }, [serverErrors]);

  const validate = () => {
    const errs = {};
    columns.forEach(c => {
      if (c.required && !String(form[c.field] ?? "").trim()) errs[c.field] = `${c.label} es obligatorio`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const inputStyle = (field) => ({
    width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13,
    border:`1px solid ${errors[field] ? C.danger : C.border}`,
    outline:"none", boxSizing:"border-box", background:"white",
  });

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }} onClick={onCancel} />
      <div style={{
        position:"relative", background:"white", borderRadius:14,
        padding:"28px 32px", width:440, maxWidth:"90vw",
        borderTop:`6px solid ${C.accent}`, boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
        maxHeight:"85vh", overflowY:"auto",
      }}>
        <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:"#1a202c" }}>{title}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {columns.map(col => (
            <div key={col.field}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:5 }}>
                {col.label}{col.required && <span style={{ color:C.danger }}> *</span>}
              </label>
              {col.type === "select" ? (
                <select
                  value={form[col.field]}
                  onChange={e => { setForm(p => ({ ...p, [col.field]:e.target.value })); setErrors(p => ({ ...p, [col.field]: undefined })); }}
                  style={{ ...inputStyle(col.field), cursor:"pointer" }}
                >
                  <option value="">— Seleccionar —</option>
                  {col.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : col.type === "textarea" ? (
                <textarea
                  value={form[col.field]}
                  onChange={e => { setForm(p => ({ ...p, [col.field]:e.target.value })); setErrors(p => ({ ...p, [col.field]: undefined })); }}
                  rows={3} placeholder={col.placeholder || ""}
                  style={{ ...inputStyle(col.field), resize:"vertical" }}
                />
              ) : (
                <input
                  type={col.type || "text"}
                  value={form[col.field]}
                  onChange={e => { setForm(p => ({ ...p, [col.field]:e.target.value })); setErrors(p => ({ ...p, [col.field]: undefined })); }}
                  placeholder={col.placeholder || ""}
                  style={inputStyle(col.field)}
                />
              )}
              {errors[col.field] && (
                <p style={{ margin:"4px 0 0", fontSize:11, color:C.danger }}>{errors[col.field]}</p>
              )}
            </div>
          ))}

          {/* Errores generales que no mapearon a ningún campo */}
          {errors.__general && (
            <div style={{
              padding:"10px 14px", borderRadius:8, fontSize:12,
              background:"#fff5f5", border:`1px solid #fecaca`, color:C.danger,
            }}>
              {errors.__general}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:24 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"10px", borderRadius:8,
            border:`1px solid ${C.border}`, background:"white",
            cursor:"pointer", fontWeight:600, fontSize:13,
          }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form); }} disabled={saving} style={{
            flex:1, padding:"10px", borderRadius:8, border:"none",
            background: saving ? "#94a3b8" : C.accent,
            color:"white", cursor: saving ? "not-allowed" : "pointer",
            fontWeight:600, fontSize:13,
          }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
/**
 * CatalogManager — CRUD genérico para catálogos.
 *
 * Props:
 *  title        {string}   Nombre visible
 *  endpoint     {string}   Base para POST /endpoint, PATCH /endpoint/:id, DELETE /endpoint/:id
 *  getEndpoint  {string}   Ruta GET (plural). Si no se pasa, usa endpoint.
 *  idField      {string}   Campo PK
 *  labelField   {string}   Campo principal (para el modal de eliminar)
 *  columns      {Array}    { field, label, required, type, options, placeholder, render, hideInForm, hideInTable }
 *  searchField  {string}   Campo del buscador
 *  canCreate    {boolean}  default true
 *  canEdit      {boolean}  default true
 *  canDelete    {boolean}  default true
 *
 * IMPORTANTE: usa PATCH (no PUT) para editar, acorde a los routers del backend.
 */
export default function CatalogManager({
  title, endpoint, getEndpoint,
  idField, labelField, columns, searchField,
  canCreate = true, canEdit = true, canDelete = true,
}) {
  const fetchUrl = getEndpoint || endpoint;

  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [serverErrors, setServerErrors] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(fetchUrl, { headers: auth() });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("No se pudo cargar el catálogo. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (formData) => {
    setSaving(true);
    setServerErrors(null);
    try {
      if (editTarget) {
        await axios.patch(`${endpoint}/${editTarget[idField]}`, formData, { headers: auth() });
        showToast("Registro actualizado correctamente.");
      } else {
        await axios.post(endpoint, formData, { headers: auth() });
        showToast("Registro creado correctamente.");
      }
      setShowForm(false); setEditTarget(null);
      fetchData();
    } catch (e) {
      const backendErrors = e?.response?.data?.errors;
      if (backendErrors?.length > 0) {
        setServerErrors(backendErrors.map(err => err.msg ?? err));
        // toast solo para errores sin campo específico
      } else {
        const msg = e?.response?.data?.msg || e?.response?.data?.message || "Ocurrió un error al guardar.";
        showToast(msg, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${endpoint}/${deleteTarget[idField]}`, { headers: auth() });
      showToast("Registro eliminado.");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo eliminar. Puede tener registros asociados.", "error");
      setDeleteTarget(null);
    }
  };

  const visibleRows  = rows.filter(row =>
    !search || !searchField ? true
      : String(row[searchField] ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const formCols  = columns.filter(c => !c.hideInForm);
  const tableCols = columns.filter(c => !c.hideInTable);

  return (
    <div style={{ background:"white", borderRadius:14, border:`0.5px solid ${C.border}`, overflow:"hidden" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:2000,
          padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:600,
          background: toast.type === "error" ? C.danger : C.accent,
          color:"white", boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <FormModal
          title={editTarget ? `Editar — ${title}` : `Nuevo — ${title}`}
          columns={formCols} initialData={editTarget}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
          saving={saving}
          serverErrors={serverErrors}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          item={deleteTarget} labelField={labelField}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px", borderBottom:`0.5px solid ${C.border}`, background:"#fafbfc",
      }}>
        <div>
          <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a202c" }}>{title}</h3>
          {!loading && (
            <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>
              {visibleRows.length} {visibleRows.length === 1 ? "registro" : "registros"}
              {search ? " encontrados" : " en total"}
            </p>
          )}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {searchField && (
            <input
              placeholder="Buscar..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                padding:"7px 12px", borderRadius:8, fontSize:13,
                border:`1px solid ${C.border}`, outline:"none", width:160, background:"white",
              }}
            />
          )}
          {canCreate && (
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              style={{
                padding:"7px 16px", borderRadius:8, border:"none",
                background:C.accent, color:"white", cursor:"pointer", fontWeight:600, fontSize:13,
              }}
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      {loading ? (
        <div style={{ padding:48, textAlign:"center", color:C.muted, fontSize:14 }}>Cargando...</div>
      ) : error ? (
        <div style={{ padding:48, textAlign:"center" }}>
          <p style={{ color:C.danger, fontSize:14, margin:"0 0 12px" }}>{error}</p>
          <button onClick={fetchData} style={{
            padding:"8px 16px", borderRadius:8,
            border:`1px solid ${C.border}`, background:"white", cursor:"pointer", fontSize:13,
          }}>Reintentar</button>
        </div>
      ) : visibleRows.length === 0 ? (
        <div style={{ padding:48, textAlign:"center", color:C.muted, fontSize:14 }}>
          {search ? "No se encontraron resultados." : "No hay registros todavía."}
        </div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {tableCols.map(col => (
                  <th key={col.field} style={{
                    padding:"10px 16px", textAlign:"left", fontWeight:700,
                    color:"#475569", fontSize:11, textTransform:"uppercase",
                    letterSpacing:"0.04em", borderBottom:`0.5px solid ${C.border}`,
                  }}>
                    {col.label}
                  </th>
                ))}
                {(canEdit || canDelete) && (
                  <th style={{
                    padding:"10px 16px", textAlign:"right", fontWeight:700,
                    color:"#475569", fontSize:11, textTransform:"uppercase",
                    letterSpacing:"0.04em", borderBottom:`0.5px solid ${C.border}`,
                  }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr
                  key={row[idField] ?? idx}
                  style={{ borderBottom: idx < visibleRows.length - 1 ? `0.5px solid ${C.border}` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background  = "white"}
                >
                  {tableCols.map(col => (
                    <td key={col.field} style={{ padding:"11px 16px", color:"#1a202c", verticalAlign:"middle" }}>
                      {col.render
                        ? col.render(row[col.field], row)
                        : (row[col.field] ?? <span style={{ color:"#94a3b8" }}>—</span>)
                      }
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td style={{ padding:"11px 16px", textAlign:"right", verticalAlign:"middle" }}>
                      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                        {canEdit && (
                          <button
                            onClick={() => { setEditTarget(row); setShowForm(true); }}
                            style={{
                              padding:"5px 12px", borderRadius:6, fontSize:12,
                              border:`1px solid ${C.border}`, background:"white",
                              cursor:"pointer", fontWeight:600, color:"#475569",
                            }}
                          >
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(row)}
                            style={{
                              padding:"5px 12px", borderRadius:6, fontSize:12,
                              border:"1px solid #fecaca", background:"#fff5f5",
                              cursor:"pointer", fontWeight:600, color:C.danger,
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}