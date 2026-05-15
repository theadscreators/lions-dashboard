import React from "react";
import { FONT } from "../theme/theme";
import { calcStats } from "../lib/calcStats";
import { fmt } from "../lib/formatters";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Trophy, 
  Globe,
  ChevronRight,
  Clock,
  Download
} from "lucide-react";
import { StackedBar } from "../components/ui/StackedBar";
import { DashboardAlerts } from "../components/ui/DashboardAlerts";
import { useNavigate, Navigate } from "react-router-dom";
import { useMatches } from "../hooks/useMatches";
import { useWorkLog } from "../hooks/useWorkLog";

export function Panel({ t, auth, paises }) {
  const { role, profile, isAdmin, isProducer, isStaff } = auth;
  const { matches, loading: matchesLoading } = useMatches(
    isAdmin || isProducer ? null : profile?.club_ids?.[0],
    !!auth.user
  );

  // Global calculations
  const allEquipos = paises.flatMap(p => p.equipos);
  const activos = allEquipos.filter(e => e.estado === "activo");
  
  const globalStats = activos.reduce((acc, eq) => {
    const stats = calcStats(eq.clientes);
    acc.lions += stats.totalLions;
    acc.club += stats.totalClub;
    acc.total += stats.totalReal;
    acc.disp += stats.disponibles;
    return acc;
  }, { lions: 0, club: 0, total: 0, disp: 0 });

  const totalPossible = activos.length * 90;
  const occupancyPercent = totalPossible > 0 ? Math.round((globalStats.total / totalPossible) * 100) : 0;

  if (isStaff) return <AdminDashboard t={t} stats={globalStats} occupancy={occupancyPercent} paises={paises} profile={profile} matches={matches} matchesLoading={matchesLoading} />;
  
  if (role === 'operator') return <Navigate to="/agenda" replace />;

  return <ClubDashboard t={t} auth={auth} paises={paises} />;
}

function AdminDashboard({ t, stats, occupancy, paises, profile, matches = [], matchesLoading = false }) {
  const { entries, loading: entriesLoading } = useWorkLog();

  const exportGlobalBackup = () => {
    if (entries.length === 0) return alert("No hay datos para exportar.");
    
    const headers = ["Fecha", "Club", "Tarea", "Descripción", "Monto/Min", "Estado", "Tipo Facturación"];
    const rows = entries.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      e.club?.name || "Global",
      e.task_type,
      e.description,
      e.amount || "",
      e.status,
      e.billing_type
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Lions_Global_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top 3 Available Teams
  const topAvailable = paises
    .flatMap(p => p.equipos)
    .filter(e => e.estado === "activo")
    .map(e => ({ ...e, disp: calcStats(e.clientes).disponibles }))
    .sort((a, b) => b.disp - a.disp)
    .slice(0, 3);

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.4s" }}>
      {/* Welcome */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: t.accent, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>CENTRO OPERATIVO</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: t.text, margin: 0 }}>Hola, {profile?.name?.split(' ')[0] || 'Admin'} 👋🏼</h1>
          <p style={{ color: t.muted, fontSize: 14, marginTop: 4 }}>Aquí tienes el resumen global de Lions para hoy.</p>
        </div>
      </div>

      <DashboardAlerts t={t} profile={profile} matches={matches} paises={paises} />

      {/* Main KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ background: `${t.lions}15`, color: t.lions, padding: 8, borderRadius: 10 }}><TrendingUp size={20} /></div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.lions }}>{occupancy}%</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>OCUPACIÓN GLOBAL</div>
          <div style={{ marginTop: 12 }}>
            <StackedBar stats={{ totalLions: stats.lions, totalClub: stats.club, totalReal: stats.total, disponibles: stats.disp }} t={t} height={8} />
          </div>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ background: `${t.accent}15`, color: t.accent, padding: 8, borderRadius: 10 }}><Trophy size={20} /></div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>{fmt(stats.lions)}'</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>MINUTOS LIONS</div>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ background: `${t.green}15`, color: t.green, padding: 8, borderRadius: 10 }}><Globe size={20} /></div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>{paises.filter(p=>p.activo).length}</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>LIGAS ACTIVAS</div>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 600, marginTop: 4 }}>Chile, Ecuador, Perú</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {/* Top availability */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 20, boxShadow: t.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color={t.accent} />
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>OPORTUNIDADES DE VENTA</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topAvailable.map((eq, i) => (
              <div key={eq.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={eq.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{eq.nombre}</div>
                    <div style={{ fontSize: 10, color: t.muted }}>{paises.find(p => p.equipos.some(e => e.id === eq.id))?.nombre}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: t.green }}>{fmt(eq.disp)}'</div>
                  <div style={{ fontSize: 9, color: t.muted, fontWeight: 700 }}>LIBRES</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            Ver todos los clubes <ChevronRight size={14} />
          </button>
        </div>

        {/* Next Matches Summary */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 20, boxShadow: t.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Calendar size={18} color={t.lions} />
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>PRÓXIMOS PARTIDOS</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matchesLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: t.muted, fontSize: 13, border: `1px dashed ${t.border}`, borderRadius: 12 }}>
                Cargando agenda...
              </div>
            ) : (() => {
              const relevantMatches = matches
                .filter(m => new Date(m.match_date) >= new Date() && !!m.home_club_id)
                .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
                .slice(0, 5);

              if (relevantMatches.length === 0) {
                return (
                  <div style={{ padding: 24, textAlign: "center", color: t.muted, fontSize: 13, border: `1px dashed ${t.border}`, borderRadius: 12 }}>
                    No hay partidos de local próximos.
                  </div>
                );
              }

              return relevantMatches.map(m => {
                const statusInfo = getStatusInfo(m, t);
                const matchDate = new Date(m.match_date);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: t.lions }}>{matchDate.getDate()}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: t.muted }}>{matchDate.toLocaleString('es', { month: 'short' }).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{m.home_club?.name} vs {m.away_club?.name || m.away_team_name}</div>
                        <div style={{ fontSize: 9, color: t.muted }}>{matchDate.getHours()}:{matchDate.getMinutes().toString().padStart(2, '0')}hs · {m.stadium_name || m.venue || 'Estadio a confirmar'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: statusInfo.color, background: `${statusInfo.color}15`, padding: "2px 6px", borderRadius: 4 }}>
                      {statusInfo.label.split(' ')[0]}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Global Backup Section */}
      <div style={{ marginTop: 24, background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24, boxShadow: t.shadow, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>RESPALDO GLOBAL DE DATOS</div>
          <p style={{ color: t.muted, fontSize: 11, marginTop: 4, margin: 0 }}>Descarga el historial completo de tareas y minutos operativos en formato CSV.</p>
        </div>
        <button 
          onClick={exportGlobalBackup}
          disabled={entriesLoading}
          style={{ 
            background: t.accent, border: "none", borderRadius: 12, padding: "12px 24px", color: "#fff", 
            fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: FONT,
            boxShadow: `0 4px 12px ${t.accent}40`, transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 0.9}
          onMouseOut={e => e.currentTarget.style.opacity = 1}
        >
          <Download size={18} /> {entriesLoading ? 'Procesando...' : 'Descargar Backup Global'}
        </button>
      </div>
    </div>
  );
}

function ClubDashboard({ t, auth, paises }) {
  const navigate = useNavigate();
  const myClubId = auth.profile?.club_ids?.[0]; // Simplified for now
  const club = paises.flatMap(p => p.equipos).find(e => e.id === myClubId);
  
  if (!club) return (
    <div style={{ padding: 40, textAlign: "center", color: t.muted }}>
      No tienes un club asignado. Contacta al administrador.
    </div>
  );

  const stats = calcStats(club.clientes);

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.4s" }}>
       <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <img src={club.logo} alt="" style={{ width: 60, height: 60, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 11, color: t.accent, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>MI PANEL · {club.nombre.toUpperCase()}</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: t.text, margin: 0 }}>Bienvenido, {auth.profile.name.split(' ')[0]}</h1>
        </div>
      </div>

      <DashboardAlerts t={t} profile={auth.profile} paises={paises} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        {/* Club status card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24, boxShadow: t.shadow }}>
             <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 1, marginBottom: 20 }}>ESTADO COMERCIAL</div>
             <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                   <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{occupancyPercent(stats.totalReal)}% ocupado</span>
                   <span style={{ fontSize: 14, fontWeight: 900, color: t.green }}>{fmt(stats.disponibles)}' libres</span>
                </div>
                <StackedBar stats={stats} t={t} height={12} />
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.muted, fontWeight: 600 }}>Minutos Lions</span>
                  <span style={{ fontWeight: 800, color: t.lions }}>{fmt(stats.totalLions)}'</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.muted, fontWeight: 600 }}>Minutos Club</span>
                  <span style={{ fontWeight: 800, color: t.club }}>{fmt(stats.totalClub)}'</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.muted, fontWeight: 600 }}>Bonificados</span>
                  <span style={{ fontWeight: 800, color: t.text }}>{fmt(stats.totalBonificados)}'</span>
                </div>
             </div>
          </div>
          
          <button onClick={() => navigate("/ajustes?new=true")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 12px ${t.accent}40`, fontFamily: FONT }}>
            SOLICITAR CAMBIO DE MARCA
          </button>
        </div>

        {/* Clients list */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24, boxShadow: t.shadow }}>
           <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 1, marginBottom: 20 }}>TUS MARCAS ACTIVAS (LOCALES)</div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {club.clientes.filter(c => c.categoria === 'CLUB').map((c, i) => (
                <div key={i} style={{ background: t.bg, border: `1px solid ${t.border}`, padding: 12, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{c.nombre}</div>
                   <div style={{ fontSize: 14, fontWeight: 900, color: t.club }}>{fmt(c.minutos)}'</div>
                </div>
              ))}
              {club.clientes.filter(c => c.categoria === 'CLUB').length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: t.muted, fontSize: 12, fontStyle: "italic" }}>No tienes marcas locales registradas.</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function occupancyPercent(total) {
  return Math.round((total / 90) * 100);
}

function getStatusInfo(match, t) {
  const { current_status, operational_notes, playlist_url } = match;
  
  if (playlist_url || current_status === 'delivered' || current_status === 'approved' || current_status === 'playlist_ready') {
    return { label: "LISTO", color: t.green };
  }

  if (operational_notes || current_status === 'club_confirmed' || current_status === 'producer_confirmed' || current_status === 'all_confirmed') {
    return { label: "CHEQUEO", color: t.amber };
  }

  return { label: "PENDIENTE", color: t.lions };
}
