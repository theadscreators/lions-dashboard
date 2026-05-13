import React, { useState } from "react";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { calcStats } from "../lib/calcStats";
import { Calendar, MapPin, CheckCircle, UploadCloud, Download, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function Agenda({ t, paises = [] }) {
  const { user, profile, isAdmin, isProducer } = useAuth();
  
  const myClubId = profile?.club_ids?.[0] || null;
  const { matches, loading, addMatchEvent, addMatch } = useMatches(isAdmin || isProducer ? null : myClubId);

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

    if (current_status === 'all_confirmed' && isAdmin) {
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
          {isAdmin && !hasProdApproved && (
            <button onClick={() => handleEvent(id, 'producer_approved')} style={btnStyle(t.green, "#fff")}>
              <CheckCircle size={14} /> Aprobar (Lions Admin)
            </button>
          )}
          {(hasClubApproved || hasProdApproved) && (
            <span style={{ fontSize: 11, color: t.muted }}>Falta aprobación de {hasClubApproved ? 'Admin Lions' : 'Club'}</span>
          )}
        </div>
      );
    }

    if (current_status === 'approved' || current_status === 'delivered') {
      const publicLink = `${window.location.origin}${import.meta.env.BASE_URL}public/${id}`;
      return (
        <div style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Link Público Generado */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${t.lions}15`, padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.lions}40` }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.lions }}>LINK PÚBLICO:</span>
            <input type="text" readOnly value={publicLink} style={{ fontSize: 11, padding: 4, background: "transparent", border: "none", color: t.text, width: 180 }} onClick={e => e.target.select()} />
            <button onClick={() => { navigator.clipboard.writeText(publicLink); alert("Link copiado!"); }} style={{ ...btnStyle(t.lions, "#fff"), padding: "4px 8px" }}>Copiar</button>
          </div>

          <a href={match.playlist_url} target="_blank" rel="noreferrer" style={{ ...btnStyle(`${t.accent}15`, t.accent), textDecoration: "none" }}>
            <Download size={14} /> Bajar Playlist
          </a>
          
          {current_status === 'approved' && isAdmin && (
            <button onClick={() => handleEvent(id, 'delivered')} style={btnStyle(t.green, "#fff")}>
              <CheckCircle size={14} /> Entregar Operador
            </button>
          )}
          {current_status === 'delivered' && (
            <div style={{ fontSize: 12, fontWeight: 800, color: t.green, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={16} /> Entregado
            </div>
          )}
        </div>
      );
    }

    // Remove the separate 'delivered' block since it's merged above

    return null;
  };

  const [showAddMatch, setShowAddMatch] = useState(false);
  
  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>📅 Agenda y Playlists</h1>
          <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Gestioná la confirmación de partidos y la entrega de material por fecha.</p>
        </div>
        {(isAdmin || isProducer) && (
          <button onClick={() => setShowAddMatch(true)} style={{ padding: "10px 16px", borderRadius: 10, background: t.lions, color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12 }}>
            + Añadir Partido Manual
          </button>
        )}
      </div>

      {showAddMatch && (
        <AddMatchModal t={t} paises={paises} onClose={() => setShowAddMatch(false)} onSave={async (data) => {
          await addMatch(data.homeClubId, data.awayTeamName, data.matchDate, data.venue, data.notes);
          setShowAddMatch(false);
        }} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {matches.length === 0 && <div style={{ color: t.muted, padding: 20 }}>No hay partidos programados.</div>}
        
        {['Hoy y Mañana', 'Próximos 7 Días', 'Futuros'].map(groupName => {
          const groupMatches = matches.filter(match => {
            const matchDate = new Date(match.match_date);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const diffTime = matchDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (groupName === 'Hoy y Mañana') return diffDays <= 1;
            if (groupName === 'Próximos 7 Días') return diffDays > 1 && diffDays <= 7;
            return diffDays > 7;
          });

          if (groupMatches.length === 0) return null;

          return (
            <div key={groupName}>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: t.text, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${t.border}`, paddingBottom: 8, marginBottom: 16 }}>{groupName}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {groupMatches.map(match => {
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
        })}
      </div>
    </div>
  );
}

function AddMatchModal({ t, paises, onClose, onSave }) {
  const [homeClubId, setHomeClubId] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  const allClubs = paises.flatMap(p => p.equipos);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!homeClubId || !awayTeamName || !date || !time) return;
    onSave({
      homeClubId,
      awayTeamName,
      matchDate: `${date}T${time}:00`,
      venue,
      notes
    });
  };

  const inputStyle = { width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT, boxSizing: "border-box", marginBottom: 12 };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: t.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
        <h3 style={{ margin: "0 0 16px", color: t.text, fontSize: 18, fontWeight: 900 }}>Añadir Partido Manual</h3>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.muted, marginBottom: 4 }}>CLUB LOCAL (LIONS)</label>
          <select value={homeClubId} onChange={e => setHomeClubId(e.target.value)} style={inputStyle} required>
            <option value="">Seleccione el club local...</option>
            {allClubs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.muted, marginBottom: 4 }}>EQUIPO VISITANTE</label>
          <input type="text" value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} placeholder="Ej: Colo-Colo" style={inputStyle} required />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.muted, marginBottom: 4 }}>FECHA</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.muted, marginBottom: 4 }}>HORA (LOCAL)</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} required />
            </div>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.muted, marginBottom: 4 }}>ESTADIO (Opcional)</label>
          <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Estadio..." style={inputStyle} />

          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: t.amber, marginBottom: 4 }}>NOTAS OPERATIVAS / PREMIUM</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="KO1 COOLBET&#10;GOL EPICBET..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: t.bg, color: t.text, border: `1px solid ${t.border}`, cursor: "pointer", fontWeight: 800 }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, background: t.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}>Guardar Partido</button>
          </div>
        </form>
      </div>
    </div>
  );
}
