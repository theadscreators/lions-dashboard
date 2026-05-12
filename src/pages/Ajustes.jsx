import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { useWorkLog } from "../hooks/useWorkLog";
import { UsersManagement } from "../components/users/UsersManagement";
import { PlusCircle, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";

export function Ajustes({ t }) {
  const { auth, profile, isAdmin, isProducer } = useAuth();
  const { requests, loading, createRequest, updateRequestStatus, addComment } = useRequests();
  const { addEntry } = useWorkLog();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [newReq, setNewReq] = useState({
    title: "",
    type: "update_arte",
    description: "",
    priority: "normal",
    club_id: profile?.club_ids?.[0] || ""
  });

  // Open modal automatically if coming from "?new=true"
  useEffect(() => {
    if (location.search.includes("new=true")) {
      setShowModal(true);
    }
  }, [location.search]);

  const handleApprove = async (req) => {
    const success = await updateRequestStatus(req.id, 'aprobada');
    if (success.success) {
      // Auto-generate work log entry draft for certain types
      const autoEntryTypes = ['update_arte', 'sumar_lions', 'baja_lions', 'mod_lions', 'sumar_club', 'baja_club', 'mod_club'];
      if (autoEntryTypes.includes(req.type)) {
        await addEntry({
          request_id: req.id,
          club_id: req.club_id,
          description: `Aprobado: ${req.title}`,
          task_type: req.type,
          status: 'draft',
          billing_type: req.type.includes('lions') ? 'extra_lions' : req.type.includes('club') ? 'extra_club' : 'incluido'
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRequest(newReq);
    setShowModal(false);
    setNewReq({ title: "", type: "update_arte", description: "", priority: "normal", club_id: profile?.club_ids?.[0] || "" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'abierta': return t.amber;
      case 'en_proceso': return t.lions;
      case 'aprobada': return t.green;
      case 'rechazada': return t.muted;
      default: return t.text;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sumar_lions': return "Sumar cliente LIONS";
      case 'baja_lions': return "Baja cliente LIONS";
      case 'mod_lions': return "Modificar minutos LIONS";
      case 'sumar_club': return "Sumar cliente CLUB";
      case 'baja_club': return "Baja cliente CLUB";
      case 'mod_club': return "Modificar minutos CLUB";
      case 'update_arte': return "Actualización de Arte";
      default: return type;
    }
  };

  const [activeTab, setActiveTab] = useState("solicitudes");

  const btnStyle = (bg, color) => ({
    padding: "8px 16px", borderRadius: 8, border: "none", background: bg, color, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT
  });

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s", paddingBottom: 40 }}>
      {isAdmin && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: `1px solid ${t.border}`, paddingBottom: 16 }}>
          <button onClick={() => setActiveTab("solicitudes")} style={{ ...btnStyle(activeTab === "solicitudes" ? `${t.accent}15` : "transparent", activeTab === "solicitudes" ? t.accent : t.muted), fontSize: 14 }}>
            Solicitudes
          </button>
          <button onClick={() => setActiveTab("usuarios")} style={{ ...btnStyle(activeTab === "usuarios" ? `${t.accent}15` : "transparent", activeTab === "usuarios" ? t.accent : t.muted), fontSize: 14 }}>
            Usuarios y Roles
          </button>
        </div>
      )}

      {activeTab === "solicitudes" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>📥 Centro de Solicitudes</h1>
          <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Gestioná los cambios comerciales y actualizaciones de arte.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={btnStyle(t.accent, "#fff")}>
          <PlusCircle size={16} /> Nueva Solicitud
        </button>
      </div>

      {loading ? (
        <div style={{ color: t.muted, textAlign: "center", padding: 40 }}>Cargando solicitudes...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {requests.length === 0 && <div style={{ color: t.muted, padding: 20 }}>No hay solicitudes abiertas.</div>}

          {requests.map(req => (
            <div key={req.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                {/* Status Indicator */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 80 }}>
                  <div style={{ color: getStatusColor(req.status) }}>
                    {req.status === 'abierta' ? <AlertTriangle size={24} /> : 
                     req.status === 'en_proceso' ? <Clock size={24} /> : 
                     req.status === 'aprobada' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: getStatusColor(req.status), textTransform: "uppercase" }}>
                    {req.status.replace("_", " ")}
                  </div>
                </div>

                {/* Content */}
                <div style={{ borderLeft: `1px solid ${t.border}`, paddingLeft: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: req.priority === 'urgente' ? t.accent : req.priority === 'alta' ? t.amber : t.muted, padding: "2px 8px", borderRadius: 10 }}>
                      {req.priority.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.lions }}>{getTypeLabel(req.type)}</div>
                    {req.club && <div style={{ fontSize: 11, color: t.muted }}>· {req.club.name}</div>}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: t.text, margin: "0 0 6px" }}>{req.title}</h3>
                  <p style={{ color: t.muted, fontSize: 13, margin: 0, maxWidth: 600 }}>{req.description}</p>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 10 }}>Creado por: {req.creator?.name}</div>
                </div>
              </div>

              {/* Actions for Admin */}
              {isAdmin && req.status === 'abierta' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => updateRequestStatus(req.id, 'en_proceso')} style={btnStyle(`${t.lions}15`, t.lions)}>Marcar En Proceso</button>
                  <button onClick={() => handleApprove(req)} style={btnStyle(`${t.green}15`, t.green)}>Aprobar</button>
                  <button onClick={() => updateRequestStatus(req.id, 'rechazada')} style={btnStyle(`${t.muted}15`, t.text)}>Rechazar</button>
                </div>
              )}
            </div>
            
            {/* Comments Section */}
            <div style={{ marginTop: -16, marginLeft: 20, marginRight: 20, marginBottom: 16, background: t.bg, borderRadius: "0 0 16px 16px", border: `1px solid ${t.border}`, borderTop: "none", padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {req.comments && req.comments.length > 0 ? (
                  req.comments.map(comment => (
                    <div key={comment.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: t.lions }}>{comment.author?.name} <span style={{ color: t.muted, fontWeight: 400 }}>({comment.author?.role})</span></span>
                        <span style={{ fontSize: 10, color: t.muted }}>{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: t.text, background: t.card, padding: "8px 12px", borderRadius: "0 12px 12px 12px", border: `1px solid ${t.border}` }}>{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic" }}>Sin comentarios aún.</div>
                )}
                
                {/* Add Comment Form */}
                <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                  <input 
                    type="text" 
                    placeholder="Escribir un comentario..." 
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const content = e.target.value;
                        e.target.value = "";
                        await addComment(req.id, content);
                      }
                    }}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontFamily: FONT, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    )}

      {/* New Request Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: t.card, padding: 32, borderRadius: 24, width: "100%", maxWidth: 500, border: `1px solid ${t.border}`, boxShadow: t.shadowHover }}>
            <h2 style={{ margin: "0 0 20px", color: t.text, fontSize: 20 }}>Crear Solicitud</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>TÍTULO</label>
                <input required type="text" value={newReq.title} onChange={e => setNewReq({...newReq, title: e.target.value})} style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT }} />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>TIPO DE CAMBIO</label>
                  <select value={newReq.type} onChange={e => setNewReq({...newReq, type: e.target.value})} style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT }}>
                    {isAdmin || isProducer ? (
                      <>
                        <option value="sumar_lions">Sumar cliente LIONS</option>
                        <option value="baja_lions">Baja cliente LIONS</option>
                        <option value="mod_lions">Modificar min. LIONS</option>
                      </>
                    ) : null}
                    <option value="sumar_club">Sumar cliente CLUB</option>
                    <option value="baja_club">Baja cliente CLUB</option>
                    <option value="mod_club">Modificar min. CLUB</option>
                    <option value="update_arte">Actualización de Arte</option>
                  </select>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>PRIORIDAD</label>
                  <select value={newReq.priority} onChange={e => setNewReq({...newReq, priority: e.target.value})} style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT }}>
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>DESCRIPCIÓN</label>
                <textarea required rows={4} value={newReq.description} onChange={e => setNewReq({...newReq, description: e.target.value})} style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnStyle(t.bg, t.text)}>Cancelar</button>
                <button type="submit" style={btnStyle(t.accent, "#fff")}>Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === "usuarios" && isAdmin && (
        <UsersManagement t={t} />
      )}
    </div>
  );
}
