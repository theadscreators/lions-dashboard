import React, { useState } from "react";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { calcStats } from "../lib/calcStats";
import { format } from "date-fns";
import { MapPin, CheckCircle, UploadCloud, Clock, AlertTriangle } from "lucide-react";
import { es } from "date-fns/locale";
import { MinuteEditorModal } from "../components/MinuteEditorModal";

const BASE = import.meta.env.BASE_URL || '/';
const FLAG_IMGS = {
  cl: `${BASE}flags/cl.svg`,
  ec: `${BASE}flags/ec.svg`,
  pe: `${BASE}flags/pe.svg`,
  py: `${BASE}flags/py.svg`,
};

function FlagWithTooltip({ code, tooltipLines = [] }) {
  const [hover, setHover] = useState(false);
  const src = FLAG_IMGS[code?.toLowerCase()];
  return (
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        position:"relative",
        flexShrink:0,
        cursor:"default",
        lineHeight:0,
        opacity: hover ? 1.0 : 0.2,
        transition: "opacity 0.2s ease"
      }}
    >
      {src
        ? <img src={src} alt={code} style={{width:18,height:13,objectFit:"cover",borderRadius:2,border:"1px solid #333",display:"block"}}/>
        : <span style={{fontSize:12,lineHeight:1}}>⚽</span>
      }
      {hover && tooltipLines.length > 0 && (
        <div style={{
          position:"absolute", top:"50%", left:"calc(100% + 8px)", transform:"translateY(-50%)",
          background:"#1a1a1a", color:"#ddd", padding:"15px 15px", borderRadius:7,
          fontSize:10, fontWeight:700, whiteSpace:"nowrap", zIndex:100,
          boxShadow:"0 4px 16px rgba(0,0,0,0.5)", pointerEvents:"none",
          display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2
        }}>
          {tooltipLines.map((l,i)=><span key={i}>{l}</span>)}
          <div style={{position:"absolute",top:"50%",right:"100%",transform:"translateY(-50%)",width:0,height:0,borderTop:"5px solid transparent",borderBottom:"5px solid transparent",borderRight:"5px solid #1a1a1a"}}/>
        </div>
      )}
    </div>
  );
}

export function Agenda({ t, paises = [] }) {
  const { user, profile, isAdmin, isProducer } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [uploadUrl, setUploadUrl] = useState("");
  const [activeUpload, setActiveUpload] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [homeOnly, setHomeOnly] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeMinuteEditor, setActiveMinuteEditor] = useState(null);

  // Operators with assigned clubs see only their clubs; operators without assignments see everything
  // Guests (no user) also see all matches in read-only mode via public RLS policies
  const myClubIds = profile?.club_ids || [];
  const filterClubId = (isAdmin || isProducer) ? null : (myClubIds.length > 0 ? myClubIds[0] : null);
  const { matches, loading, addMatchEvent, addMatch, updateMatch, updateClubClients } = useMatches(
    filterClubId, true
  );

  if (loading) return <div style={{ color: t.muted, textAlign: "center", padding: 40, fontFamily: FONT }}>Cargando agenda...</div>;

  const TZ = { cl:'America/Santiago', ec:'America/Guayaquil', pe:'America/Lima', py:'America/Asuncion' };

  const getStadiumTime = (ds, cc) => {
    const tz = TZ[cc?.toLowerCase()] || 'America/Argentina/Buenos_Aires';
    return new Date(ds).toLocaleTimeString('es-AR', { timeZone: tz, hour:'2-digit', minute:'2-digit', hour12:false });
  };

  const getWeekBounds = (offset) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // Base Thursday of the actual current calendar week
    const diffToThursday = (day - 4 + 7) % 7;
    const baseThursday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToThursday);
    baseThursday.setHours(0,0,0,0);
    
    // Standard end Wednesday of actual current calendar week
    const baseWednesday = new Date(baseThursday);
    baseWednesday.setDate(baseThursday.getDate() + 6);
    
    // If entering (offset 0) and it is Mon, Tue, or Wed, we extend baseWednesday by 7 days
    const enteringEndWednesday = new Date(baseWednesday);
    if (day === 1 || day === 2 || day === 3) {
      enteringEndWednesday.setDate(baseWednesday.getDate() + 7);
    }
    
    let start, end;
    if (offset === 0) {
      start = baseThursday;
      end = enteringEndWednesday;
    } else if (offset > 0) {
      // Start from the Thursday following enteringEndWednesday
      start = new Date(enteringEndWednesday);
      start.setDate(enteringEndWednesday.getDate() + 1 + (offset - 1) * 7);
      start.setHours(0,0,0,0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    } else {
      // For past weeks (offset < 0)
      start = new Date(baseThursday);
      start.setDate(baseThursday.getDate() + offset * 7);
      start.setHours(0,0,0,0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    }
    
    return { start, end };
  };
  const bounds = getWeekBounds(weekOffset);

  const getStatusInfo = (m) => {
    const { current_status, events = [], playlist_url } = m;
    if (playlist_url || current_status === 'playlist_ready' || ['delivered','approved'].includes(current_status))
      return { label:"LISTO", color:t.green, icon:<CheckCircle size={12}/> };
    if (events.some(e=>e.event_type==='club_confirmed') || events.some(e=>e.event_type==='producer_confirmed') || current_status==='chequeo')
      return { label:"CHEQUEO", color:t.amber, icon:<Clock size={12}/> };
    return { label:"PENDIENTE", color:t.lions, icon:<AlertTriangle size={12}/> };
  };

  const handleEvent = async (matchId, eventType, payload = {}) => {
    try {
      const ok = await addMatchEvent(matchId, eventType, profile?.id||null, profile?.name||user?.email||"Sistema", payload);
      if (!ok) throw new Error("fail");
      if (eventType === 'playlist_uploaded') { setActiveUpload(null); setUploadUrl(""); }
    } catch { alert("Error al actualizar el partido."); }
  };

  const renderActions = (m) => {
    const { id, events, current_status, playlist_url } = m;
    const isProd = isAdmin || isProducer;
    const confirmed = events.some(e=>e.event_type==='producer_confirmed') || current_status==='chequeo';
    const btn = (bg,c) => ({ padding:"4px 10px", borderRadius:6, border:"none", background:bg, color:c, fontSize:9, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:FONT });
    // Ocultado por redundancia, se puede editar/confirmar haciendo clic directamente en el badge de estado
    // if (!confirmed && isProd) return <button onClick={()=>setActiveMinuteEditor(m)} style={btn(t.lions,"#fff")}>Confirmar</button>;
    if (confirmed && isAdmin && !playlist_url) {
      if (activeUpload === id) return (
        <div style={{display:"flex",gap:4}}>
          <input type="text" placeholder="Link..." value={uploadUrl} onChange={e=>setUploadUrl(e.target.value)} style={{padding:"3px 6px",borderRadius:4,border:`1px solid ${t.border}`,background:t.bg,color:t.text,fontSize:10,width:120}}/>
          <button onClick={()=>handleEvent(id,'playlist_uploaded',{playlist_url:uploadUrl})} style={btn(t.accent,"#fff")}>Ok</button>
          <button onClick={()=>setActiveUpload(null)} style={btn(t.bg,t.text)}>x</button>
        </div>
      );
      return <button onClick={()=>setActiveUpload(id)} style={btn(`${t.lions}15`,t.lions)}><UploadCloud size={12}/>Subir</button>;
    }
    if (!confirmed) return null;
    return null;
  };

  const getBlock = (ds) => {
    if (weekOffset === 1) return "PRÓXIMO FIN DE SEMANA";
    if (weekOffset > 1) return "MÁS ADELANTE";
    if (weekOffset === -1) return "ANTERIOR FIN DE SEMANA";
    if (weekOffset === -2) return "DOS SEMANAS ATRÁS";
    if (weekOffset < -2) {
      return `HACE ${Math.abs(weekOffset)} SEMANAS`;
    }

    const d = new Date(ds), now = new Date();
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const md = new Date(d.getFullYear(),d.getMonth(),d.getDate());
    const diff = Math.ceil((md-today)/(864e5));
    if (diff < 0) return "ANTERIORES";
    if (diff === 0) return "HOY";
    if (diff === 1) return "MAÑANA";
    const dow = today.getDay(), dts = (7-dow)%7;
    const sun = new Date(today); sun.setDate(today.getDate()+(dts===0?7:dts));
    if (md <= sun) return md.getDay()>=5||md.getDay()===0 ? "ESTE FIN DE SEMANA" : "ESTA SEMANA";
    const ns = new Date(sun); ns.setDate(sun.getDate()+7);
    if (md <= ns) return md.getDay()>=5||md.getDay()===0 ? "PRÓXIMO FIN DE SEMANA" : "PRÓXIMA SEMANA";
    return "MÁS ADELANTE";
  };

  const filtered = matches.filter(m => {
    const cc = m.home_club?.leagues?.countries?.code?.toLowerCase() || m.country_code;
    if (selectedCountry !== "all" && cc !== selectedCountry.toLowerCase()) return false;
    if (homeOnly && !m.home_club_id) return false;
    const d = new Date(m.match_date);
    return d >= bounds.start && d <= bounds.end;
  });

  const groups = {};
  const ORDER = [
    "HOY",
    "MAÑANA",
    "ESTE FIN DE SEMANA",
    "ESTA SEMANA",
    "PRÓXIMO FIN DE SEMANA",
    "PRÓXIMA SEMANA",
    "MÁS ADELANTE",
    "ANTERIORES",
    "ANTERIOR FIN DE SEMANA",
    "DOS SEMANAS ATRÁS"
  ];
  ORDER.forEach(k => groups[k] = []);
  filtered.forEach(m => { const b = getBlock(m.match_date); if(!groups[b]) groups[b]=[]; groups[b].push(m); });
  const keys = [...ORDER, ...Object.keys(groups).filter(k => !ORDER.includes(k))].filter(k => groups[k]?.length > 0);



  const renderRow = (m) => {
    const status = getStatusInfo(m);
    const stats = calcStats(m.home_club?.clientes || []);
    const isVallas = m.pauta_override === 'vallas_fijas'
      ? true
      : m.pauta_override === 'vallas_led'
        ? false
        : m.home_club?.status === 'vallasfijas';
    const time24 = getStadiumTime(m.match_date, m.country_code);
    const league = m.league_name || "Liga";
    const round = m.round_name ? (/^\d+$/.test(m.round_name) ? 'Jornada '+m.round_name : m.round_name) : null;
    const venue = m.venue || m.stadium_name;
    const tooltipLines = [round ? `${league} — ${round}` : league, venue].filter(Boolean);

    // Shared button height/style for consistency
    const pillStyle = (bg, color, border) => ({
      display:"inline-flex", alignItems:"center", gap:4,
      height:24, padding:"0 9px", borderRadius:6,
      background:bg, color:color,
      border: border || "none",
      fontSize:9, fontWeight:800, whiteSpace:"nowrap",
      fontFamily:FONT, textDecoration:"none", cursor:"pointer"
    });

    return (
      <div key={m.id} style={{
        borderRadius:10, padding:"5px 10px",
        display:"grid",
        gridTemplateColumns:"1fr 3fr 1fr",
        alignItems:"center", gap:8,
        transition:"background 0.15s"
      }}>

        {/* Col 1: Flag with tooltip, left-aligned */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-start"}}>
          <FlagWithTooltip code={m.country_code} tooltipLines={tooltipLines} />
        </div>

        {/* Col 2: Teams centered — home | time | away */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:6}}>
          {/* Home */}
          <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",minWidth:0}}>
            <span style={{fontSize:12,fontWeight:700,color:t.text,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.display_home_name}</span>
            {m.display_home_logo && <img src={m.display_home_logo} alt="" style={{width:22,height:22,objectFit:"contain",flexShrink:0}}/>}
          </div>
          {/* Time center */}
          <span style={{fontSize:13,fontWeight:900,color:t.muted,letterSpacing:1,textAlign:"center",minWidth:44}}>{time24}</span>
          {/* Away */}
          <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-start",minWidth:0}}>
            {m.display_away_logo && <img src={m.display_away_logo} alt="" style={{width:22,height:22,objectFit:"contain",flexShrink:0}}/>}
            <span style={{fontSize:12,fontWeight:700,color:t.text,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.display_away_name}</span>
          </div>
        </div>

        {/* Col 3: Status, Actions, minutes, notes, & icons grouped and right-aligned */}
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end",flexShrink:0}}>
          {m.home_club_id ? (
            isVallas
              ? <span style={pillStyle(`${t.muted}12`,t.muted,`1px solid ${t.border}`)}>VALLAS FIJAS</span>
              : null /* Ocultado por solicitud para simplificar la interfaz
                <span style={{...pillStyle('transparent', stats.disponibles>0?t.green:t.lions), fontWeight:900, fontSize:11}}>
                  {stats.disponibles}' {stats.disponibles===1?'LIBRE':'LIBRES'}
                </span>
                */
          ) : (
            <span style={{fontSize:9,color:t.muted,opacity:0.4}}>EXTERNO</span>
          )}
          {m.operational_notes && <span title={m.operational_notes} style={{fontSize:10,cursor:"help",lineHeight:1}}>📝</span>}

          {m.home_club_id ? (
            <>
              {m.playlist_url ? (
                <a href={m.playlist_url} target="_blank" rel="noreferrer" style={pillStyle(`${t.green}12`, t.green, `1px solid ${t.green}30`)}>
                  ⬇ VER CARPETA
                </a>
              ) : (
                <>
                  {!isVallas && (
                    <div
                      onClick={() => (isAdmin || isProducer) && setActiveMinuteEditor(m)}
                      style={{
                        ...pillStyle(`${status.color}12`, status.color, `1px solid ${status.color}30`),
                        cursor: (isAdmin || isProducer) ? "pointer" : "default"
                      }}
                      title={(isAdmin || isProducer) ? "Editar Minutos" : ""}
                    >
                      {status.icon}
                      {(isAdmin || isProducer) && status.label === 'CHEQUEO' ? 'CHEQUEAR' : status.label}
                    </div>
                  )}
                  {renderActions(m)}
                </>
              )}
              {(isAdmin||isProducer) && (
                <button onClick={()=>setEditingMatch(m)} style={{background:"none",border:"none",padding:"0 2px",cursor:"pointer",fontSize:11,opacity:0.4,lineHeight:1}} title="Editar">⚙️</button>
              )}
            </>
          ) : (
            <span style={{fontSize:9,color:t.muted,fontWeight:700}}>LIGA</span>
          )}
        </div>
      </div>
    );
  };

  // Always group by day
  const renderGroup = (mlist) => {
    const days = {};
    mlist.forEach(m => {
      const dk = format(new Date(m.match_date), 'yyyy-MM-dd');
      if (!days[dk]) days[dk] = [];
      days[dk].push(m);
    });
    return Object.keys(days).sort().map(dk => {
      const dateObj = new Date(dk + 'T12:00:00');
      let dayName = format(dateObj, "EEEE, d 'de' MMMM", { locale: es });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return (
        <div key={dk} style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:800,color:t.accent,marginBottom:6,marginLeft:4}}>{dayName}</div>
          <div style={{display:"flex",flexDirection:"column",gap:2,background:t.card,borderRadius:12,border:`1px solid ${t.border}`,padding:"4px 0",overflow:"hidden"}}>
            {days[dk].map(m => renderRow(m))}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{fontFamily:FONT,animation:"fadeIn 0.3s"}}>
      {/* Header */}
      <div style={{marginBottom:24,display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:16,width:"100%"}}>
        {/* Left: Country pills */}
        <div style={{display:"flex",gap:4,justifyContent:"flex-start"}}>
          {[
            {id:'all',label:'',img:null},
            {id:'cl',label:'CL',img:FLAG_IMGS.cl},
            {id:'ec',label:'EC',img:FLAG_IMGS.ec},
            {id:'pe',label:'PE',img:FLAG_IMGS.pe}
          ].map(c => (
            <button key={c.id} onClick={()=>setSelectedCountry(selectedCountry===c.id?'all':c.id)}
              style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${selectedCountry===c.id?t.accent:t.border}`,background:selectedCountry===c.id?`${t.accent}15`:t.card,color:selectedCountry===c.id?t.accent:t.muted,cursor:"pointer",fontWeight:800,fontSize:10,display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"}}>
              {c.img ? <img src={c.img} alt="" style={{width:16,height:11,objectFit:"cover",borderRadius:1}}/> : <span style={{fontSize:11}}>🌍</span>}
              {c.label && <span>{c.label}</span>}
            </button>
          ))}
        </div>

        {/* Center: Week nav centered */}
        <div style={{display:"flex",alignItems:"center",gap:8,background:t.card,border:`1px solid ${t.border}`,padding:"4px 12px",borderRadius:8,justifyContent:"center"}}>
          <button onClick={()=>setWeekOffset(p=>p-1)} style={{background:"none",border:"none",color:t.text,cursor:"pointer",fontSize:12,padding:"0 4px"}}>◀</button>
          <span style={{fontSize:10,fontWeight:900,color:t.text,letterSpacing:0.5,minWidth:120,textAlign:"center"}}>
            {weekOffset===0?"SEMANA ACTUAL":`${format(bounds.start,'d MMM',{locale:es}).toUpperCase()} – ${format(bounds.end,'d MMM',{locale:es}).toUpperCase()}`}
          </span>
          <button onClick={()=>setWeekOffset(p=>p+1)} style={{background:"none",border:"none",color:t.text,cursor:"pointer",fontSize:12,padding:"0 4px"}}>▶</button>
        </div>

        {/* Right: Controls & HOY Button */}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center"}}>
          {weekOffset!==0 && (
            <button onClick={()=>setWeekOffset(0)} style={{padding:"6px 12px",borderRadius:8,background:`${t.lions}15`,color:t.lions,border:`1px solid ${t.lions}30`,cursor:"pointer",fontWeight:800,fontSize:10,transition:"all 0.2s"}}>
              HOY
            </button>
          )}
          <button onClick={()=>setHomeOnly(!homeOnly)} style={{padding:"6px 12px",borderRadius:8,background:homeOnly?`${t.accent}15`:t.card,color:homeOnly?t.accent:t.muted,border:`1px solid ${homeOnly?t.accent:t.border}`,cursor:"pointer",fontWeight:800,fontSize:10}}>
            {homeOnly?"LOCAL":"TODOS"}
          </button>
          {(isAdmin||isProducer) && <button onClick={()=>setShowAddMatch(true)} style={{padding:"6px 12px",borderRadius:8,background:t.lions,color:"#fff",border:"none",cursor:"pointer",fontWeight:800,fontSize:10}}>+ Añadir</button>}
        </div>
      </div>

      {showAddMatch && <MatchModal t={t} paises={paises} onClose={()=>setShowAddMatch(false)} onSave={async d=>{await addMatch(d.homeClubId,d.awayTeamName,d.matchDate,d.venue,d.notes,d.pautaOverride);setShowAddMatch(false);}}/>}
      {editingMatch && <MatchModal t={t} paises={paises} match={editingMatch} onClose={()=>setEditingMatch(null)} onSave={async d=>{await updateMatch(editingMatch.id,{home_club_id:d.homeClubId,away_team_name:d.awayTeamName,match_date:d.matchDate,venue:d.venue,operational_notes:d.notes,pauta_override:d.pautaOverride});setEditingMatch(null);}}/>}
      {activeMinuteEditor && (
        <MinuteEditorModal
          t={t}
          match={activeMinuteEditor}
          onClose={() => setActiveMinuteEditor(null)}
          onSave={async (data) => {
            try {
              const okClients = await updateClubClients(activeMinuteEditor.home_club_id, data.clients);
              if (!okClients) {
                alert("Error al guardar marcas/minutos. Revisá la consola del navegador (F12) para más detalles.");
                return;
              }
              const okMatch = await updateMatch(activeMinuteEditor.id, {
                gol_brand: data.golBrand,
                gol_notes: data.golNotes,
                operational_notes: data.notes
              });
              if (!okMatch) {
                alert("Error al guardar pauta del partido. Revisá la consola (F12).");
                return;
              }
              const confirmed = activeMinuteEditor.events.some(e => e.event_type === 'producer_confirmed') || activeMinuteEditor.current_status === 'chequeo';
              if (!confirmed) {
                const okEvent = await addMatchEvent(activeMinuteEditor.id, 'producer_confirmed', profile?.id||null, profile?.name||user?.email||"Sistema");
                if (!okEvent) {
                  alert("Error al registrar confirmación del partido.");
                  return;
                }
              }
              setActiveMinuteEditor(null);
            } catch (e) {
              console.error("Save error:", e);
              alert("Error inesperado: " + (e?.message || e));
            }
          }}
        />
      )}

      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {keys.map(key => (
          <div key={key}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12}}>
              <div style={{height:"1px",flex:1,background:`linear-gradient(to right, transparent, ${t.border})`}}/>
              <span style={{fontSize:10,fontWeight:900,color:t.muted,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>{key}</span>
              <div style={{height:"1px",flex:1,background:`linear-gradient(to left, transparent, ${t.border})`}}/>
            </div>
            {renderGroup(groups[key])}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchModal({ t, paises, match, onClose, onSave }) {
  const isEdit = !!match;
  const getArgDate = (ds) => new Intl.DateTimeFormat('fr-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ds));
  const getArgTime = (ds) => new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ds));

  const [homeClubId, setHomeClubId] = useState(match?.home_club_id || "");
  const [awayTeamName, setAwayTeamName] = useState(match?.away_club_name || match?.away_team_name || "");
  const [date, setDate] = useState(match ? getArgDate(match.match_date) : "");
  const [time, setTime] = useState(match ? getArgTime(match.match_date) : "");
  const [venue, setVenue] = useState(match?.venue || match?.stadium_name || "");
  const [notes, setNotes] = useState(match?.operational_notes || "");
  const [pautaOverride, setPautaOverride] = useState(match?.pauta_override || "default");
  const allClubs = paises.flatMap(p => p.equipos);
  const handleSubmit = (e) => { e.preventDefault(); if(!homeClubId||!awayTeamName||!date||!time) return; onSave({homeClubId,awayTeamName,matchDate:`${date}T${time}:00-03:00`,venue,notes,pautaOverride}); };
  const inp = {width:"100%",padding:"8px",borderRadius:6,border:`1px solid ${t.border}`,background:t.bg,color:t.text,fontFamily:FONT,boxSizing:"border-box",marginBottom:10,fontSize:12};

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:t.card,borderRadius:16,padding:20,width:"100%",maxWidth:380,boxShadow:t.shadow,border:`1px solid ${t.border}`}}>
        <h3 style={{margin:"0 0 12px",color:t.text,fontSize:16,fontWeight:900}}>{isEdit?"Editar Partido":"Añadir Partido"}</h3>
        <form onSubmit={handleSubmit}>
          <label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>CLUB LOCAL</label>
          <select value={homeClubId} onChange={e=>setHomeClubId(e.target.value)} style={inp} required>
            <option value="">Seleccione...</option>
            {allClubs.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>VISITANTE</label>
          <input type="text" value={awayTeamName} onChange={e=>setAwayTeamName(e.target.value)} placeholder="Ej: Colo-Colo" style={inp} required/>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>FECHA</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} required/></div>
            <div style={{flex:1}}><label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>HORA (ARG)</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={inp} required/></div>
          </div>
          <label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>ESTADIO</label>
          <input type="text" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Estadio..." style={inp}/>
          <label style={{display:"block",fontSize:10,fontWeight:800,color:t.muted,marginBottom:3}}>TIPO DE PAUTA (OVERRIDE)</label>
          <select value={pautaOverride} onChange={e=>setPautaOverride(e.target.value)} style={inp}>
            <option value="default">Por Defecto de Club</option>
            <option value="vallas_fijas">Vallas Fijas</option>
            <option value="vallas_led">Vallas LED (con Minutos)</option>
          </select>
          <label style={{display:"block",fontSize:10,fontWeight:800,color:t.amber,marginBottom:3}}>NOTAS OPERATIVAS</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="KO1 COOLBET..." style={{...inp,minHeight:60,resize:"vertical"}}/>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button type="button" onClick={onClose} style={{flex:1,padding:10,borderRadius:8,background:t.bg,color:t.text,border:`1px solid ${t.border}`,cursor:"pointer",fontWeight:800,fontSize:12}}>Cancelar</button>
            <button type="submit" style={{flex:1,padding:10,borderRadius:8,background:t.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:800,fontSize:12}}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
