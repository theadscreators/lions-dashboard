import React, { useState, useEffect } from "react";
import { FONT } from "../../theme/theme";
import { formatDate } from "../../lib/formatters";

const CACHE_KEY_PREFIX = "api_football_";
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

function useNextMatches(leagueId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!leagueId) return;
    const cacheKey = `${CACHE_KEY_PREFIX}${leagueId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_DURATION_MS) {
          setMatches(parsed.data);
          return;
        }
      } catch (e) {
        // invalid cache, ignore
      }
    }
    
    setLoading(true);
    
    const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;
    if (!apiKey) {
      if (!window._api_football_warned) {
        console.warn("API-Football Key no configurada.");
        window._api_football_warned = true;
      }
      setLoading(false);
      return;
    }

    fetch(`https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2026&next=10`, {
      headers: {
        "x-apisports-key": apiKey
      }
    })
      .then(r => r.json())
      .then(d => {
        const events = d.response || [];
        localStorage.setItem(cacheKey, JSON.stringify({ data: events, ts: Date.now() }));
        setMatches(events);
      })
      .catch((err) => {
        console.error("Error fetching matches", err);
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, [leagueId]);
  
  return { matches, loading };
}

export function UpcomingMatches({ pais, t }) {
  const { matches, loading } = useNextMatches(pais.leagueId);

  // Track all our teams that are active or future/vallas
  const teamNames = pais.equipos.filter(e => e.estado === "activo" || e.estado === "vallasfijas").map(e => ({
    name: e.nombre.toLowerCase(),
    tsdb: (e.tsdbName || "").toLowerCase()
  }));

  // Match our teams by fuzzy name matching
  const isOurTeam = (matchName) => {
    if (!matchName) return false;
    const n = matchName.toLowerCase();
    return teamNames.some(t => {
      if (t.tsdb && (n === t.tsdb || n.includes(t.tsdb))) return true;
      return n.includes(t.name) || t.name.includes(n) || n.replace(/[^a-z]/g, "").includes(t.name.replace(/[^a-záéíóúñü]/g, ""));
    });
  };

  const relevantMatches = matches.filter(m => isOurTeam(m.teams.home.name) || isOurTeam(m.teams.away.name));
  
  if (!pais.leagueId || (relevantMatches.length === 0 && !loading)) return null;

  return (
    <div style={{ marginBottom: 18, animation: "fadeIn 0.3s", fontFamily: FONT }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10, letterSpacing: 0.5 }}>🗓️ PRÓXIMOS PARTIDOS</div>
      {loading && <div style={{ color: t.muted, fontSize: 11, padding: 12 }}>Cargando partidos...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {relevantMatches.map((m, i) => {
          const homeTeamName = m.teams.home.name;
          const awayTeamName = m.teams.away.name;
          const isHome = isOurTeam(homeTeamName);
          
          return (
            <div key={i} style={{ background: t.card, border: `1.5px solid ${isHome ? t.accent + "50" : t.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }}>
              {isHome && <div style={{ fontSize: 8, fontWeight: 800, color: "#fff", background: t.accent, padding: "2px 6px", borderRadius: 4, letterSpacing: 1, flexShrink: 0 }}>🏠 LOCAL</div>}
              {!isHome && <div style={{ fontSize: 8, fontWeight: 800, color: t.muted, background: t.border, padding: "2px 6px", borderRadius: 4, letterSpacing: 1, flexShrink: 0 }}>VISITA</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                {m.teams.home.logo && <img src={m.teams.home.logo} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />}
                <span style={{ fontSize: 12, fontWeight: isHome ? 800 : 600, color: isHome ? t.text : t.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{homeTeamName}</span>
                <span style={{ fontSize: 10, color: t.muted, fontWeight: 700, flexShrink: 0 }}>vs</span>
                {m.teams.away.logo && <img src={m.teams.away.logo} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />}
                <span style={{ fontSize: 12, fontWeight: !isHome ? 800 : 600, color: !isHome ? t.text : t.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{awayTeamName}</span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.text }}>{formatDate(m.fixture.date.substring(0, 10))}</div>
                {m.fixture.venue?.name && <div style={{ fontSize: 9, color: t.muted, fontWeight: 500, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {m.fixture.venue.name}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
