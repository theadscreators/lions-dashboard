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
  Download,
  Bell,
  X
} from "lucide-react";
import { StackedBar } from "../components/ui/StackedBar";
import { DashboardAlerts } from "../components/ui/DashboardAlerts";
import { useNavigate, Navigate } from "react-router-dom";
import { useMatches } from "../hooks/useMatches";
import { useWorkLog } from "../hooks/useWorkLog";
import { useAlerts } from "../hooks/useAlerts";

const BASE = import.meta.env.BASE_URL || '/';
const FLAG_IMGS = {
  cl: `${BASE}flags/cl.svg`,
  ec: `${BASE}flags/ec.svg`,
  pe: `${BASE}flags/pe.svg`,
  py: `${BASE}flags/py.svg`,
};

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
  const occupancyPercentGlobal = totalPossible > 0 ? Math.round((globalStats.total / totalPossible) * 100) : 0;

  if (isStaff) return <AdminDashboard t={t} stats={globalStats} occupancy={occupancyPercentGlobal} paises={paises} profile={profile} matches={matches} matchesLoading={matchesLoading} />;
  
  if (role === 'operator') return <Navigate to="/agenda" replace />;

  return <ClubDashboard t={t} auth={auth} paises={paises} matches={matches} />;
}

function AdminDashboard({ t, stats, occupancy, paises, profile, matches = [], matchesLoading = false }) {
  const { entries, loading: entriesLoading } = useWorkLog();
  const { alerts } = useAlerts(profile, matches, [], paises);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const exportGlobalBackup = () => {
    // 1. Prepare Work Log
    const logHeaders = ["Fecha Tarea", "Club", "Tipo Tarea", "Descripción", "Monto", "Estado Tarea", "Facturación"];
    const logRows = entries.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      e.club?.name || "Global",
      e.task_type,
      e.description,
      e.amount || "",
      e.status,
      e.billing_type
    ]);

    // 2. Prepare Minutes & Brands Allocation
    const minutesHeaders = ["País", "Club", "Categoría Marca", "Nombre Marca", "Minutos Asignados", "Minutos Bonificados", "Estado Club"];
    const minutesRows = paises.flatMap(p => 
      p.equipos.flatMap(eq => 
        eq.clientes.map(cl => [
          p.nombre,
          eq.nombre,
          cl.categoria,
          cl.nombre,
          cl.minutos,
          cl.bonificados,
          eq.estado
        ])
      )
    );

    // Escape CSV values
    const csvEscape = (val) => {
      const str = String(val === null || val === undefined ? '' : val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      "=== HISTORIAL DE TRABAJO (WORK LOG) ===",
      logHeaders.map(csvEscape).join(","),
      ...logRows.map(row => row.map(csvEscape).join(",")),
      "",
      "=== DISTRIBUCIÓN DE MINUTOS COMERCIALES Y MARCAS ===",
      minutesHeaders.map(csvEscape).join(","),
      ...minutesRows.map(row => row.map(csvEscape).join(","))
    ];

    const csvContent = "\uFEFF" + csvLines.join("\n");
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
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.4s", position: "relative" }}>
      {/* Welcome */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32, position: "relative" }}>
        
        {/* Bell Button */}
        <button
          onClick={() => setShowNotifications(true)}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: t.card,
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: t.shadow,
            color: alerts.length > 0 ? t.lions : t.text,
            transition: "all 0.2s ease",
            outline: "none"
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.borderColor = t.accent;
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.borderColor = t.border;
          }}
          title="Notificaciones y Avisos"
        >
          <Bell size={18} fill={alerts.length > 0 ? `${t.lions}20` : "none"} />
          {alerts.length > 0 && (
            <span style={{
              position: "absolute",
              top: -2, right: -2,
              background: t.lions,
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              borderRadius: "50%",
              width: 18, height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${t.card}`,
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
            }}>
              {alerts.length}
            </span>
          )}
        </button>

        <div style={{ fontSize: 11, color: t.accent, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>CENTRO OPERATIVO</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: t.text, margin: 0 }}>Hola, {profile?.name?.split(' ')[0] || 'Admin'} 👋🏼</h1>
        <p style={{ color: t.muted, fontSize: 14, marginTop: 4, marginBottom: 0 }}>Aquí tienes el resumen global de Lions para hoy.</p>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease-out"
        }} onClick={() => setShowNotifications(false)}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 24,
            width: "95%",
            maxWidth: "500px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: t.text }}>Últimos Avisos</span>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                style={{
                  background: `${t.muted}15`,
                  border: "none",
                  borderRadius: "50%",
                  width: 32, height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.text,
                  transition: "all 0.15s"
                }}
                onMouseOver={e => e.currentTarget.style.background = `${t.muted}25`}
                onMouseOut={e => e.currentTarget.style.background = `${t.muted}15`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: t.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>¡Todo al día!</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>No tienes alertas ni confirmaciones pendientes.</div>
                </div>
              ) : (
                <DashboardAlerts t={t} profile={profile} matches={matches} paises={paises} />
              )}
            </div>
          </div>
        </div>
      )}

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
                const countryCode = m.country_code?.toLowerCase();
                const flagSrc = FLAG_IMGS[countryCode];
                const argTime = matchDate.toLocaleTimeString('en-US', { 
                  timeZone: 'America/Argentina/Buenos_Aires', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                }).toLowerCase().replace(' am', 'am').replace(' pm', 'pm') + " ARG";

                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: t.lions }}>{matchDate.getDate()}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: t.muted }}>{matchDate.toLocaleString('es', { month: 'short' }).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                          {flagSrc ? (
                            <img 
                              src={flagSrc} 
                              alt={m.country_code} 
                              style={{ width: 15, height: 10, objectFit: "cover", borderRadius: 1.5, border: "1px solid #333", flexShrink: 0 }} 
                            />
                          ) : (
                            <span style={{ fontSize: 10 }}>⚽</span>
                          )}
                          <span>
                            {m.home_club?.name} vs {m.away_club?.name || m.away_team_name}
                          </span>
                        </div>
                        <div style={{ fontSize: 9, color: t.muted }}>
                          {matchDate.getHours()}:{matchDate.getMinutes().toString().padStart(2, '0')}hs 
                          <span style={{ color: t.accent, fontWeight: 700, marginLeft: 6 }}>({argTime})</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: statusInfo.color, background: `${statusInfo.color}15`, padding: "2px 6px", borderRadius: 4 }}>
                      {statusInfo.label}
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

const getStatusInfo = (match, t) => {
  const { current_status, operational_notes, playlist_url } = match;
  if (playlist_url || ['delivered', 'approved', 'playlist_ready'].includes(current_status)) {
    return { label: "LISTO", color: t.green };
  }
  if (operational_notes || ['club_confirmed', 'producer_confirmed', 'all_confirmed'].includes(current_status)) {
    return { label: "CHEQUEANDO", color: t.amber };
  }
  return { label: "PENDIENTE", color: t.lions };
};

function ClubDashboard({ t, auth, paises, matches = [] }) {
  const navigate = useNavigate();
  const myClubId = auth.profile?.club_ids?.[0]; // Simplified for now
  const club = paises.flatMap(p => p.equipos).find(e => e.id === myClubId);
  const { alerts } = useAlerts(auth.profile, matches, [], paises);
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  if (!club) return (
    <div style={{ padding: 40, textAlign: "center", color: t.muted }}>
      No tienes un club asignado. Contacta al administrador.
    </div>
  );

  const stats = calcStats(club.clientes);

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.4s", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32, position: "relative" }}>
        
        {/* Bell Button */}
        <button
          onClick={() => setShowNotifications(true)}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: t.card,
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: t.shadow,
            color: alerts.length > 0 ? t.lions : t.text,
            transition: "all 0.2s ease",
            outline: "none"
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.borderColor = t.accent;
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.borderColor = t.border;
          }}
          title="Notificaciones y Avisos"
        >
          <Bell size={18} fill={alerts.length > 0 ? `${t.lions}20` : "none"} />
          {alerts.length > 0 && (
            <span style={{
              position: "absolute",
              top: -2, right: -2,
              background: t.lions,
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              borderRadius: "50%",
              width: 18, height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${t.card}`,
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
            }}>
              {alerts.length}
            </span>
          )}
        </button>

        <img src={club.logo} alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 12 }} />
        <div style={{ fontSize: 11, color: t.accent, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>MI PANEL · {club.nombre.toUpperCase()}</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: t.text, margin: 0 }}>Bienvenido, {auth.profile.name.split(' ')[0]} 👋🏼</h1>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease-out"
        }} onClick={() => setShowNotifications(false)}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 24,
            width: "95%",
            maxWidth: "500px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: t.text }}>Últimos Avisos</span>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                style={{
                  background: `${t.muted}15`,
                  border: "none",
                  borderRadius: "50%",
                  width: 32, height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.text,
                  transition: "all 0.15s"
                }}
                onMouseOver={e => e.currentTarget.style.background = `${t.muted}25`}
                onMouseOut={e => e.currentTarget.style.background = `${t.muted}15`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: t.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>¡Todo al día!</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>No tienes alertas ni confirmaciones pendientes.</div>
                </div>
              ) : (
                <DashboardAlerts t={t} profile={auth.profile} matches={matches} paises={paises} />
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        {/* Club status card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24, boxShadow: t.shadow }}>
             <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: 1, marginBottom: 20 }}>ESTADO COMERCIAL</div>
             <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                   <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{Math.round((stats.totalReal / 90) * 100)}% ocupado</span>
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
              {club.clientes.filter(c => c.category === 'CLUB').map((c, i) => (
                <div key={i} style={{ background: t.bg, border: `1px solid ${t.border}`, padding: 12, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{c.nombre}</div>
                   <div style={{ fontSize: 14, fontWeight: 900, color: t.club }}>{fmt(c.minutes)}'</div>
                </div>
              ))}
              {club.clientes.filter(c => c.category === 'CLUB').length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: t.muted, fontSize: 12, fontStyle: "italic" }}>No tienes marcas locales registradas.</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
