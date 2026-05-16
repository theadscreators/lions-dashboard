import React, { useState } from "react";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { calcStats } from "../lib/calcStats";
import { fmt } from "../lib/formatters";
import { format } from "date-fns";
import { Calendar, MapPin, CheckCircle, UploadCloud, Download, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { es } from "date-fns/locale";

export function Agenda({ t, paises = [] }) {
  const fmtArgTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      timeZone: 'America/Argentina/Buenos_Aires', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase().replace(' am', 'am').replace(' pm', 'pm') + " ARG";
  };

  const getStatusInfo = (match) => {
    const { current_status, events = [], playlist_url } = match;
    if (playlist_url || current_status === 'playlist_ready' || ['delivered', 'approved'].includes(current_status)) {
      return { label: "LISTO", color: t.green, icon: <CheckCircle size={14} /> };
    }
    const hasClubConfirmed = events.some(e => e.event_type === 'club_confirmed');
    const hasProducerConfirmed = events.some(e => e.event_type === 'producer_confirmed');
    
    if (hasClubConfirmed || hasProducerConfirmed || current_status === 'chequeo') {
      return { label: "CHEQUEO", color: t.amber, icon: <Clock size={14} /> };
    }
    return { label: "PENDIENTE", color: t.lions, icon: <AlertTriangle size={14} /> };
  };

  const { user, profile, isAdmin, isProducer } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [uploadUrl, setUploadUrl] = useState("");
  const [activeUpload, setActiveUpload] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [homeOnly, setHomeOnly] = useState(true);
  
  const myClubId = profile?.club_ids?.[0] || null;
  const { matches, loading, addMatchEvent, addMatch } = useMatches(
    isAdmin || isProducer ? null : myClubId,
    !!user
  );

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

  const getStatusInfo = (match) => {
    const { current_status, operational_notes, playlist_url } = match;
    if (playlist_url || ['delivered', 'approved', 'playlist_ready'].includes(current_status)) {
      return { label: "LISTO", color: t.green, icon: <CheckCircle size={14} /> };
    }
    if (operational_notes || ['club_confirmed', 'producer_confirmed', 'all_confirmed'].includes(current_status)) {
      return { label: "CHEQUEO", color: t.amber, icon: <AlertTriangle size={14} /> };
    }
    return { label: "PENDIENTE", color: t.lions, icon: <Clock size={14} /> };
  };

  const fmtArgTime = (dateStr) => {
    const d = new Date(dateStr);
    // Format to "09:00 pm ARG"
    return d.toLocaleTimeString('en-US', { 
      timeZone: 'America/Argentina/Buenos_Aires', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase().replace(' am', 'am').replace(' pm', 'pm') + " ARG";
  };

  const renderActions = (match) => {
    const { current_status, id, events } = match;
    const isProdOrAdmin = isAdmin || isProducer;

    const btnStyle = (bg, color) => ({
      padding: "6px 12px", borderRadius: 8, border: "none", background: bg, color, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT
    });

    const hasProdConfirmed = events.some(e => e.event_type === 'producer_confirmed');

    // Admin/Producer can confirm
    if (!hasProdConfirmed && isProdOrAdmin) {
      return <button onClick={() => handleEvent(id, 'producer_confirmed')} style={btnStyle(t.lions, "#fff")}>Confirmar (Productor)</button>;
    }

    // After producer confirms (even if club hasn't), allow Admin to upload material
    if (hasProdConfirmed && isAdmin && !match.playlist_url) {
      if (activeUpload === id) {
        return (
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" placeholder="Link Dropbox..." value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: 11 }} />
            <button onClick={() => handleEvent(id, 'playlist_uploaded', { playlist_url: uploadUrl })} style={btnStyle(t.accent, "#fff")}>Ok</button>
            <button onClick={() => setActiveUpload(null)} style={btnStyle(t.bg, t.text)}>x</button>
          </div>
        );
      }
      return <button onClick={() => setActiveUpload(id)} style={btnStyle(`${t.lions}15`, t.lions)}><UploadCloud size={14} /> Subir Material</button>;
    }

    return null;
  };

  // Logic: Grouping and Filtering
  const filteredMatches = matches.filter(m => {
    const countryCode = m.home_club?.leagues?.countries?.code?.toLowerCase();
    if (selectedCountry !== "all" && countryCode !== selectedCountry.toLowerCase()) return false;
    if (homeOnly && !m.home_club_id) return false;
    return true;
  });

  const getGroup = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "HOY";
    if (diff === 1) return "MAÑANA";
    return "PRÓXIMOS";
  };

  const groups = { "HOY": [], "MAÑANA": [], "PRÓXIMOS": [] };
  filteredMatches.forEach(m => groups[getGroup(m.match_date)].push(m));

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s" }}>
      {/* Header with Filters */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: t.text, margin: "0 0 4px" }}>📅 Agenda Operativa</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[
              { id: 'all', label: 'TODAS', flag: '🌍' },
              { id: 'cl', label: 'CHILE', flag: '🇨🇱' },
              { id: 'ec', label: 'ECUADOR', flag: '🇪🇨' },
              { id: 'pe', label: 'PERÚ', flag: '🇵🇪' }
            ].map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedCountry(selectedCountry === c.id ? 'all' : c.id)}
                style={{ 
                  padding: "8px 16px", borderRadius: 12, border: `1px solid ${selectedCountry === c.id ? t.accent : t.border}`,
                  background: selectedCountry === c.id ? `${t.accent}15` : t.card,
                  color: selectedCountry === c.id ? t.accent : t.muted,
                  cursor: "pointer", fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
                }}
              >
                <span>{c.flag}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setHomeOnly(!homeOnly)} style={{ padding: "10px 16px", borderRadius: 10, background: homeOnly ? `${t.accent}15` : t.card, color: homeOnly ? t.accent : t.muted, border: `1px solid ${homeOnly ? t.accent : t.border}`, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>
            {homeOnly ? "SOLO LOCAL" : "TODOS"}
          </button>
          <button onClick={() => setShowAddMatch(true)} style={{ padding: "10px 16px", borderRadius: 10, background: t.lions, color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12 }}>+ Añadir</button>
        </div>
      </div>

      {showAddMatch && (
        <AddMatchModal t={t} paises={paises} onClose={() => setShowAddMatch(false)} onSave={async (data) => {
          await addMatch(data.homeClubId, data.awayTeamName, data.matchDate, data.venue, data.notes);
          setShowAddMatch(false);
        }} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {Object.entries(groups).map(([name, mlist]) => {
          if (mlist.length === 0) return null;
          return (
            <div key={name}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ height: 2, flex: 1, background: `linear-gradient(to right, ${t.border}, transparent)` }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: t.muted, letterSpacing: 2 }}>{name}</span>
                <div style={{ height: 2, flex: 1, background: `linear-gradient(to left, ${t.border}, transparent)` }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mlist.map(m => {
                  const status = getStatusInfo(m);
                  const flag = m.country_flag || "⚽";
                  const leagueLabel = m.league_name || "";
                  const stats = calcStats(m.home_club?.clients || []);
                  
                  return (
                    <div key={m.id} style={{ 
                      background: `${t.bg}80`, borderRadius: 16, padding: 16, border: `1px solid ${t.border}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: t.text }}>{format(new Date(m.match_date), 'HH:mm')}hs</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: t.accent }}>{fmtArgTime(m.match_date)}</div>
                        </div>
                        <div style={{ width: 1, height: 30, background: t.border }} />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{flag}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: t.text }}>
                              <span>{m.display_home_name}</span>
                              <span style={{ fontSize: 10, color: t.muted }}>VS</span>
                              <span style={{ color: t.muted }}>{m.away_club?.name || m.away_team_name}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 9, color: t.muted, fontWeight: 600, marginTop: 2, marginLeft: 26 }}>
                            {leagueLabel.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Stats & Notes */}
                      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: t.muted }}>ESPACIO LIBRE</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: stats.disponibles > 0 ? t.green : t.lions }}>{stats.disponibles}'</div>
                        </div>
                        {m.operational_notes && <div title={m.operational_notes} style={{ background: `${t.amber}15`, color: t.amber, padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, border: `1px solid ${t.amber}30` }}>NOTAS 📝</div>}
                      </div>

                      {/* Right: Status & Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260, justifyContent: "flex-end", borderLeft: `1px solid ${t.border}`, paddingLeft: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, color: status.color, background: `${status.color}15`, padding: "4px 10px", borderRadius: 6 }}>
                          {status.icon} {status.label}
                        </div>
                        {renderActions(m)}
                        {m.playlist_url && <a href={m.playlist_url} target="_blank" rel="noreferrer" style={{ background: t.green, color: "#fff", padding: "6px 10px", borderRadius: 6, textDecoration: "none", fontSize: 11, fontWeight: 800 }}>BAJAR</a>}
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
