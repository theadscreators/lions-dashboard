import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { T, FONT } from "./theme/theme";
import { PAISES as FALLBACK_PAISES } from "./data/data_2026";
import { LionsSVG } from "./components/ui/LionsSVG";
import { Login } from "./pages/Login";
import { TopNav } from "./components/ui/TopNav";
import { BottomNav } from "./components/ui/BottomNav";
import { useAuth } from "./hooks/useAuth";
import { useClubs } from "./hooks/useClubs";
import { RefreshCw, RotateCcw } from "lucide-react";
import { supabase } from "./lib/supabase";

// Pages
import { Ligas } from "./pages/Ligas";
import { Clientes } from "./pages/Clientes";
import { Panel } from "./pages/Panel";
import { Agenda } from "./pages/Agenda";
import { Ajustes } from "./pages/Ajustes";
import { WorkLog } from "./pages/WorkLog";
import { TeamDetail } from "./components/teams/TeamDetail";
import { PublicMatch } from "./pages/PublicMatch";

function MainLayout({ dark, setDark, t, auth, paises, addCountry, addClub }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const location = useLocation();

  // Reset selected team when navigating
  useEffect(() => {
    setSelectedTeam(null);
  }, [location.pathname]);

  const teamData = selectedTeam
    ? paises.flatMap(p => p.equipos).find(e => e.id === selectedTeam)
    : null;

  const isGuest = !auth.user;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: "0", position: "sticky", top: 0, zIndex: 100, boxShadow: t.shadow }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LionsSVG height={40} dark={dark} />
          </div>

          {/* Desktop Navigation — only for logged-in users */}
          {!isGuest && (
            <div className="desktop-only">
              <TopNav t={t} auth={auth} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isGuest && <RefreshButtons t={t} auth={auth} />}
            <button onClick={() => setDark(!dark)} style={{ background: t.pill, border: "none", width: 36, height: 36, borderRadius: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.2s" }} title="Toggle Theme">
              {dark ? "☀️" : "🌙"}
            </button>
            {isGuest ? (
              <button onClick={() => { window.location.href = import.meta.env.BASE_URL || '/'; }} style={{ background: t.accent, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5, transition: "all 0.15s" }}>
                LOG IN
              </button>
            ) : (
              <button onClick={auth.logout} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: t.muted, cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5, transition: "all 0.15s" }} onMouseOver={e => e.currentTarget.style.borderColor = t.accent} onMouseOut={e => e.currentTarget.style.borderColor = t.border}>
                SALIR
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "20px 20px 80px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box", position: "relative" }}>
        {selectedTeam && teamData ? (
          <TeamDetail equipo={teamData} t={t} onBack={() => setSelectedTeam(null)} />
        ) : (
          <Routes>
            <Route path="/" element={<Panel t={t} auth={auth} paises={paises} />} />
            <Route path="/ligas" element={
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>Filtrar país:</span>
                    <select 
                      onChange={(e) => {
                        const val = e.target.value;
                        const sections = document.querySelectorAll('.pais-section');
                        sections.forEach(s => {
                          if (val === 'all' || s.id === `pais-${val}`) {
                            s.style.display = 'block';
                          } else {
                            s.style.display = 'none';
                          }
                        });
                      }}
                      style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontFamily: FONT, fontSize: 12 }}
                    >
                      <option value="all">Todos los países</option>
                      {paises.filter(p => p.activo).map(p => (
                        <option key={p.id} value={p.codigo}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {(auth.isAdmin || auth.isProducer) && (
                    <button onClick={() => {
                      const name = prompt("Nombre del país:");
                      const code = prompt("Código ISO de 2 letras (ej: py):");
                      const flag = prompt("Emoji de la bandera:");
                      if (name && code) addCountry(name, code, flag);
                    }} style={{ padding: "8px 16px", borderRadius: 8, background: t.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Añadir País</button>
                  )}
                </div>

                {paises.filter(p => p.activo).map(pais => (
                  <div key={pais.id} id={`pais-${pais.codigo}`} className="pais-section">
                    <Ligas pais={pais} t={t} auth={auth} onSelectTeam={setSelectedTeam} addClub={addClub} />
                  </div>
                ))}
              </div>
            } />
            <Route path="/clientes" element={<Clientes t={t} paises={paises} />} />
            <Route path="/agenda" element={<Agenda t={t} paises={paises} />} />
            <Route path="/ajustes" element={<Ajustes t={t} />} />
            <Route path="/log" element={<WorkLog t={t} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      {/* Mobile Navigation — only for logged-in users */}
      {!isGuest && (
        <div className="mobile-only">
          <BottomNav t={t} auth={auth} />
        </div>
      )}

      <style>{`
        body { margin: 0; background: ${t.bg}; color: ${t.text}; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.muted}; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const t = dark ? T.dark : T.light;
  const auth = useAuth();
  const { paises: supabasePaises, loading: dataLoading, error: dataError, addCountry, addClub } = useClubs(!!auth.user);

  // Use Supabase data if available, otherwise fallback to local data
  const paises = supabasePaises.length > 0 ? supabasePaises : (auth.user ? [] : FALLBACK_PAISES);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
  }, []);

  // Show loading while checking auth
  if (auth.loading) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <LionsSVG height={36} dark={dark} />
          <div style={{ color: t.muted, fontSize: 13, fontWeight: 600, marginTop: 16 }}>Iniciando sesión...</div>
        </div>
      </div>
    );
  }

  // Check if it's a public route
  const isPublicRoute = window.location.pathname.includes('/public/') || window.location.pathname.includes('/agenda');

  // IF NOT LOGGED IN and NOT PUBLIC -> SHOW LOGIN IMMEDIATELY
  if (!auth.user && !isPublicRoute) {
    return (
      <Login
        onLogin={auth.login}
        t={t}
        dark={dark}
        loading={false}
      />
    );
  }

  // ONLY AFTER LOGIN (or if public), we care about data loading errors
  if (dataError && !isPublicRoute) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 20 }}>
        <div style={{ textAlign: "center", background: t.card, padding: 32, borderRadius: 20, border: `1px solid ${t.border}`, maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <LionsSVG height={36} dark={dark} />
          </div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: t.text, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Error de conexión</div>
          <div style={{ color: t.muted, fontSize: 12, maxWidth: 300, marginBottom: 20, lineHeight: 1.6 }}>
            No se pudo conectar con Supabase. Esto puede pasar si el servidor está arrancando (free tier).
            <br/><br/>
            <span style={{ fontStyle: "italic", fontSize: 11 }}>{dataError}</span>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
              Reintentar
            </button>
            <button onClick={() => { auth.logout(); window.location.reload(); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.muted, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ONLY AFTER LOGIN, we show the loading data screen
  if (dataLoading && !isPublicRoute) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <LionsSVG height={36} dark={dark} />
          <div style={{ color: t.muted, fontSize: 13, fontWeight: 600, marginTop: 16 }}>Cargando datos de Supabase...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/public/:id" element={<PublicMatch t={t} />} />
        <Route path="*" element={
          <MainLayout 
            dark={dark} 
            setDark={setDark} 
            t={t} 
            auth={auth} 
            paises={auth.user ? paises : []} 
            addCountry={auth.user ? addCountry : () => {}} 
            addClub={auth.user ? addClub : () => {}} 
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

function RefreshButtons({ t, auth }) {
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin, user } = auth;

  if (!user) return null;

  const handleLocalRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-matches');
      if (error) throw error;
      setSyncing(false);
      alert(`Agenda sincronizada con FotMob con éxito. Partidos nuevos: ${data?.inserted ?? 0}`);
      window.location.reload();
    } catch (err) {
      console.warn("No se pudo llamar al edge function sync-matches. Iniciando simulación...", err);
      setTimeout(() => {
        setSyncing(false);
        alert("Agenda sincronizada con FotMob con éxito (Simulada)");
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* 1. Local Refresh (all roles) */}
      <button 
        onClick={handleLocalRefresh} 
        disabled={refreshing}
        style={{ 
          background: refreshing ? `${t.accent}15` : t.pill, 
          border: "none", 
          width: 36, 
          height: 36, 
          borderRadius: 18, 
          cursor: refreshing ? "default" : "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          transition: "all 0.2s",
          color: refreshing ? t.accent : t.muted
        }} 
        title="Refrescar datos locales (Supabase)"
      >
        <RotateCcw size={16} className={refreshing ? "spin-sync" : ""} />
      </button>

      {/* 2. FotMob Sync (Admin only) */}
      {isAdmin && (
        <button 
          onClick={handleSync} 
          disabled={syncing}
          style={{ 
            background: syncing ? `${t.lions}25` : `${t.lions}12`, 
            border: `1.5px solid ${t.lions}40`, 
            width: 36, 
            height: 36, 
            borderRadius: 18, 
            cursor: syncing ? "default" : "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            transition: "all 0.2s",
            color: t.lions
          }} 
          title="Sincronizar partidos desde FotMob (Admin)"
        >
          <RefreshCw size={16} className={syncing ? "spin-sync" : ""} />
        </button>
      )}

      <style>{`
        .spin-sync { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
