import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { T, FONT } from "./theme/theme";
import { PAISES as FALLBACK_PAISES } from "./data/data_2026";
import { LionsSVG } from "./components/ui/LionsSVG";
import { Login } from "./pages/Login";
import { TopNav } from "./components/ui/TopNav";
import { BottomNav } from "./components/ui/BottomNav";
import { useAuth } from "./hooks/useAuth";
import { useClubs } from "./hooks/useClubs";

// Pages
import { Ligas } from "./pages/Ligas";
import { Clientes } from "./pages/Clientes";
import { Panel } from "./pages/Panel";
import { Agenda } from "./pages/Agenda";
import { Ajustes } from "./pages/Ajustes";
import { WorkLog } from "./pages/WorkLog";
import { TeamDetail } from "./components/teams/TeamDetail";

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

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: "12px 20px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: t.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LionsSVG height={30} dark={dark} />
          {auth.profile && (
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, background: t.pill, padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5 }}>
              {auth.role.toUpperCase()}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-only">
          <TopNav t={t} auth={auth} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setDark(!dark)} style={{ background: t.pill, border: "none", width: 36, height: 36, borderRadius: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.2s" }} title="Toggle Theme">
            {dark ? "☀️" : "🌙"}
          </button>
          <button onClick={auth.logout} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: t.muted, cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5, transition: "all 0.15s" }} onMouseOver={e => e.currentTarget.style.borderColor = t.accent} onMouseOut={e => e.currentTarget.style.borderColor = t.border}>
            SALIR
          </button>
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
                {(auth.isAdmin || auth.isProducer) && (
                  <div style={{ display: "flex", gap: 10, background: t.card, padding: 16, borderRadius: 12, border: `1px solid ${t.border}` }}>
                    <button onClick={() => {
                      const name = prompt("Nombre del país:");
                      const code = prompt("Código ISO de 2 letras (ej: py):");
                      const flag = prompt("Emoji de la bandera:");
                      if (name && code) addCountry(name, code, flag);
                    }} style={{ padding: "8px 16px", borderRadius: 8, background: t.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Añadir País</button>
                    
                    <button onClick={() => {
                      const countryCode = prompt("Código del país al que pertenece (ej: cl, py):");
                      const name = prompt("Nombre del nuevo club:");
                      if (countryCode && name) addClub(countryCode, name, null);
                    }} style={{ padding: "8px 16px", borderRadius: 8, background: t.lions, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Añadir Equipo</button>
                  </div>
                )}
                {paises.filter(p => p.activo).map(pais => (
                  <Ligas key={pais.id} pais={pais} t={t} onSelectTeam={setSelectedTeam} />
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

      {/* Mobile Navigation */}
      <div className="mobile-only">
        <BottomNav t={t} auth={auth} />
      </div>

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
  const { paises: supabasePaises, loading: dataLoading, error: dataError, addCountry, addClub } = useClubs();

  // Use Supabase data if available, otherwise fallback to local data
  const paises = supabasePaises.length > 0 ? supabasePaises : FALLBACK_PAISES;

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

  // Show login if not authenticated
  if (!auth.user) {
    return (
      <Login
        onLogin={auth.login}
        t={t}
        dark={dark}
        loading={false}
      />
    );
  }

  // Show error if data failed
  if (dataError) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 20 }}>
        <div style={{ textAlign: "center", background: t.card, padding: 32, borderRadius: 20, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: t.text, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Error al cargar datos</div>
          <div style={{ color: t.muted, fontSize: 12, maxWidth: 300, marginBottom: 20 }}>{dataError}</div>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Reintentar</button>
        </div>
      </div>
    );
  }

  // Show loading while data loads
  if (dataLoading) {
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
    <BrowserRouter>
      <MainLayout dark={dark} setDark={setDark} t={t} auth={auth} paises={paises} addCountry={addCountry} addClub={addClub} />
    </BrowserRouter>
  );
}
