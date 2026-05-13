import React, { useState } from "react";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { calcStats } from "../lib/calcStats";
import { Calendar, MapPin, CheckCircle, UploadCloud, Download, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function Agenda({ t }) {
  const { auth } = useAuth(); // Wait, App.jsx does not pass auth to Agenda directly, it passes auth to MainLayout but MainLayout uses <Routes>
  // Actually, I should use the hook directly inside Agenda, or pass it from App.jsx
  // Let's use the hook directly for simplicity.
  const { user, profile, isAdmin, isProducer } = useAuth();
  
  const myClubId = profile?.club_ids?.[0] || null;
  const { matches, loading, addMatchEvent } = useMatches(isAdmin || isProducer ? null : myClubId);

  const [uploadUrl, setUploadUrl] = useState("");
  const [activeUpload, setActiveUpload] = useState(null);

  if (loading) {
    return <div style={{ color: t.muted, textAlign: "center", padding: 40, fontFamily: FONT }}>Cargando agenda...</div>;
  }

  const handleEvent = async (matchId, eventType, payload = {}) => {
    await addMatchEvent(matchId, eventType, user.id, profile.name, payload);
    if (eventType === 'playlist_uploaded') {
      setActiveUpload(null);
      setUploadUrl("");
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled': return { label: "Programado", color: t.muted, icon: <Calendar size={14} /> };
      case 'club_confirmed': return { label: "Confirmado (Club)", color: t.club, icon: <Clock size={14} /> };
      case 'producer_confirmed': return { label: "Confirmado (Productor)", color: t.lions, icon: <Clock size={14} /> };
      case 'all_confirmed': return { label: "Esperando Playlist", color: t.amber, icon: <AlertCircle size={14} /> };
      case 'playlist_ready': return { label: "Playlist Lista para Revisión", color: t.accent, icon: <CheckCircle size={14} /> };
      case 'approved': return { label: "Aprobada por todos", color: t.green, icon: <CheckCircle size={14} /> };
      case 'delivered': return { label: "Entregada ✅", color: t.green, icon: <CheckCircle size={14} /> };
      default: return { label: status, color: t.muted, icon: <Calendar size={14} /> };
    }
  };

  const renderActions = (match) => {
    const { current_status, id, events } = match;
    const isClub = profile?.role === 'club_staff';
    const isProdOrAdmin = isAdmin || isProducer;
    const isOperator = profile?.role === 'operator';

    // Helper button styles
    const btnStyle = (bg, color) => ({
      padding: "8px 16px", borderRadius: 8, border: "none", background: bg, color, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT
    });

    const hasClubConfirmed = events.some(e => e.event_type === 'club_confirmed');
    const hasProdConfirmed = events.some(e => e.event_type === 'producer_confirmed');
    const hasClubApproved = events.some(e => e.event_type === 'club_approved');
    const hasProdApproved = events.some(e => e.event_type === 'producer_approved');

    if (current_status === 'scheduled' || current_status === 'club_confirmed' || current_status === 'producer_confirmed') {
      return (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isClub && !hasClubConfirmed && (
            <button onClick={() => handleEvent(id, 'club_confirmed')} style={btnStyle(t.accent, "#fff")}>
              <CheckCircle size={14} /> Confirmar Partido
            </button>
          )}
          {isProdOrAdmin && !hasProdConfirmed && (
            <button onClick={() => handleEvent(id, 'producer_confirmed')} style={btnStyle(t.lions, "#fff")}>
              <CheckCircle size={14} /> Confirmar (Productor)
            </button>
          )}
          {(hasClubConfirmed || hasProdConfirmed) && current_status !== 'all_confirmed' && (
            <span style={{ fontSize: 11, color: t.muted }}>Esperando a la otra parte...</span>
          )}
        </div>
      );
    }

    if (current_status === 'all_confirmed' && isProdOrAdmin) {
      if (activeUpload === id) {
        return (
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <input 
              type="text" placeholder="Link de Dropbox/Drive..." value={uploadUrl} onChange={e => setUploadUrl(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT, fontSize: 12 }}
            />
            <button onClick={() => handleEvent(id, 'playlist_uploaded', { playlist_url: uploadUrl })} style={btnStyle(t.accent, "#fff")}>Guardar</button>
            <button onClick={() => setActiveUpload(null)} style={btnStyle(t.bg, t.text)}>Cancelar</button>
          </div>
        );
      }
      return (
        <button onClick={() => setActiveUpload(id)} style={btnStyle(`${t.lions}15`, t.lions)}>
          <UploadCloud size={14} /> Subir Playlist
        </button>
      );
    }

    if (current_status === 'playlist_ready') {
      return (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href={match.playlist_url} target="_blank" rel="noreferrer" style={{ ...btnStyle(t.bg, t.text), border: `1px solid ${t.border}`, textDecoration: "none" }}>
            <Download size={14} /> Ver Archivo
          </a>
          {isClub && !hasClubApproved && (
            <button onClick={() => handleEvent(id, 'club_approved')} style={btnStyle(t.green, "#fff")}>
              <CheckCircle size={14} /> Aprobar Playlist
            </button>
          )}
          {isProdOrAdmin && !hasProdApproved && (
            <button onClick={() => handleEvent(id, 'producer_approved')} style={btnStyle(t.green, "#fff")}>
              <CheckCircle size={14} /> Aprobar (Productor)
            </button>
          )}
          {(hasClubApproved || hasProdApproved) && (
            <span style={{ fontSize: 11, color: t.muted }}>Falta aprobación de {hasClubApproved ? 'Lions' : 'Club'}</span>
          )}
        </div>
      );
    }

    if (current_status === 'approved') {
      return (
        <div style={{ display: "flex", gap: 10 }}>
          <a href={match.playlist_url} target="_blank" rel="noreferrer" style={{ ...btnStyle(`${t.accent}15`, t.accent), textDecoration: "none" }}>
            <Download size={14} /> Descargar Archivo Final
          </a>
          {(isOperator || isProdOrAdmin) && (
            <button onClick={() => handleEvent(id, 'delivered')} style={btnStyle(t.green, "#fff")}>
              <CheckCircle size={14} /> Marcar como Entregado
            </button>
          )}
        </div>
      );
    }

    if (current_status === 'delivered') {
      return <div style={{ fontSize: 12, fontWeight: 800, color: t.green, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={16} /> Entregado al operador</div>;
    }

    return null;
  };

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>📅 Agenda y Playlists</h1>
        <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Gestioná la confirmación de partidos y la entrega de material por fecha.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {matches.length === 0 && <div style={{ color: t.muted, padding: 20 }}>No hay partidos programados.</div>}
        
        {matches.map(match => {
          const homeName = match.home_club?.name || "Local";
          const homeLogo = match.home_club?.logo_url || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
          const awayName = match.away_club?.name || match.away_team_name || "Visitante";
          const awayLogo = match.away_club?.logo_url || match.away_team_logo || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
          
          const statusInfo = getStatusInfo(match.current_status);
          const dateStr = format(new Date(match.match_date), "EEEE d 'de' MMMM, HH:mm'hs'", { locale: es });

          const clients = match.home_club?.clients || [];
          const stats = calcStats(clients);
          const hasAvailable = stats.disponibles > 0;

          // Ultra-simplified view for Operators
          if (profile?.role === 'operator') {
            return (
              <div key={match.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: t.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 13, textTransform: "capitalize" }}>{dateStr}</div>
                    <div style={{ color: t.muted, fontSize: 11 }}>{match.venue || "Estadio a definir"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, fontWeight: 900, color: t.text }}>
                    {homeName} <span style={{ color: t.muted, fontSize: 11 }}>VS</span> {awayName}
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: statusInfo.color }}>
                    {statusInfo.icon} {statusInfo.label}
                  </div>
                  {renderActions(match)}
                </div>
              </div>
            );
          }

          return (
            <div key={match.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
              {/* Header: Status & Round */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", borderBottom: `1px dashed ${t.border}`, paddingBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {match.round || "Amistoso"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: statusInfo.color, background: `${statusInfo.color}15`, padding: "4px 10px", borderRadius: 20 }}>
                  {statusInfo.icon} {statusInfo.label}
                </div>
              </div>

              {/* Match Info */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                
                {/* Teams */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, flex: "1 1 min-content" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: t.text, textAlign: "right" }}>{homeName}</span>
                    <img src={homeLogo} alt={homeName} style={{ width: 40, height: 40, objectFit: "contain" }} />
                  </div>
                  
                  <div style={{ fontSize: 12, fontWeight: 900, color: t.muted, background: t.bg, padding: "4px 8px", borderRadius: 6 }}>VS</div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <img src={awayLogo} alt={awayName} style={{ width: 40, height: 40, objectFit: "contain" }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{awayName}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200, borderLeft: `1px solid ${t.border}`, paddingLeft: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.text, fontSize: 13, fontWeight: 600 }}>
                    <Calendar size={14} color={t.muted} /> <span style={{textTransform: "capitalize"}}>{dateStr}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.muted, fontSize: 12 }}>
                    <MapPin size={14} /> {match.venue || "Estadio a definir"} {match.city ? `(${match.city})` : ''}
                  </div>
                </div>

                {/* Sales & Notes (New V1.1) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180, borderLeft: `1px dashed ${t.border}`, paddingLeft: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>MINUTOS LIBRES:</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: hasAvailable ? t.green : t.gray, background: hasAvailable ? `${t.green}15` : `${t.gray}20`, padding: "4px 8px", borderRadius: 6 }}>
                      {stats.disponibles > 0 ? `${stats.disponibles}' DISPONIBLES` : 'SOBREVENDIDO'}
                    </span>
                  </div>
                  
                  {match.operational_notes && (
                    <div style={{ background: `${t.amber}15`, border: `1px solid ${t.amber}40`, padding: 8, borderRadius: 8, marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: t.amber, fontSize: 10, fontWeight: 800, marginBottom: 4 }}>
                        <AlertTriangle size={12} /> NOTAS OPERATIVAS
                      </div>
                      <div style={{ fontSize: 11, color: t.text, fontWeight: 600, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                        {match.operational_notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Area */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "flex-end" }}>
                {renderActions(match)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
