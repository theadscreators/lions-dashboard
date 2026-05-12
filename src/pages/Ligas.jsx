import React, { useState, useMemo } from "react";
import { FONT } from "../theme/theme";
import { calcStats, getStatus } from "../lib/calcStats";
import { fmt } from "../lib/formatters";
import { UpcomingMatches } from "../components/matches/UpcomingMatches";
import { TeamCard } from "../components/teams/TeamCard";
import { TeamRow } from "../components/teams/TeamRow";

export function Ligas({ pais, t, onSelectTeam }) {
  const [sort, setSort] = useState("default");
  const [filter, setFilter] = useState("all");
  const [layout, setLayout] = useState("grid"); // grid | list

  const equiposActivos = pais.equipos.filter(e => e.estado === "activo");
  const sortedEquipos = useMemo(() => {
    let list = [...pais.equipos];
    if (filter === "available") list = list.filter(e => { const s = getStatus(e); return s === "available" || s === "almost"; });
    if (filter === "full") list = list.filter(e => getStatus(e) === "full");
    if (filter === "over") list = list.filter(e => getStatus(e) === "over");
    if (sort === "disponibles") list.sort((a, b) => calcStats(b.clientes).disponibles - calcStats(a.clientes).disponibles);
    if (sort === "lions") list.sort((a, b) => calcStats(b.clientes).totalLions - calcStats(a.clientes).totalLions);
    if (sort === "total") list.sort((a, b) => calcStats(b.clientes).totalReal - calcStats(a.clientes).totalReal);
    return list;
  }, [pais, sort, filter]);

  const totalLions = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).totalLions, 0);
  const totalClub = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).totalClub, 0);
  const totalDisp = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).disponibles, 0);

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s" }}>
      {/* Country summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}><img src={`https://flagcdn.com/w40/${pais.codigo}.png`} alt="" style={{ verticalAlign: "middle", marginRight: 8, borderRadius: 2 }} /> {pais.nombre}</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2, fontWeight: 400 }}>{equiposActivos.length} equipos activos · Temporada 2026</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>TOTAL LIONS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.lions }}>{fmt(totalLions)}'</div>
          </div>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>TOTAL CLUB</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.club }}>{fmt(totalClub)}'</div>
          </div>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>DISPONIBLES</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.green }}>{fmt(totalDisp)}'</div>
          </div>
        </div>
      </div>

      {/* Upcoming matches */}
      <UpcomingMatches pais={pais} t={t} />

      {/* View & Filters toggle */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[["all", "Todos"], ["available", "Disponibles"], ["full", "Completos"], ["over", "Sobrevendidos"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${filter === key ? t.accent : t.border}`, background: filter === key ? `${t.accent}12` : "transparent", color: filter === key ? t.accent : t.muted, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>Ordenar:</span>
          {[["default", "Default"], ["disponibles", "Disp ↓"], ["lions", "Lions ↓"], ["total", "Total ↓"]].map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${sort === key ? t.accent : t.border}`, background: sort === key ? `${t.accent}12` : "transparent", color: sort === key ? t.accent : t.muted, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: FONT }}>
              {label}
            </button>
          ))}
          <div style={{ marginLeft: 8, display: "flex", gap: 2, background: t.card, border: `1px solid ${t.border}`, borderRadius: 7, padding: 2 }}>
            <button onClick={() => setLayout("grid")} style={{ padding: "4px 8px", borderRadius: 5, border: "none", background: layout === "grid" ? t.accent : "transparent", color: layout === "grid" ? "#fff" : t.muted, cursor: "pointer", fontSize: 11, fontFamily: FONT, fontWeight: 700 }} title="Vista grilla">▦</button>
            <button onClick={() => setLayout("list")} style={{ padding: "4px 8px", borderRadius: 5, border: "none", background: layout === "list" ? t.accent : "transparent", color: layout === "list" ? "#fff" : t.muted, cursor: "pointer", fontSize: 11, fontFamily: FONT, fontWeight: 700 }} title="Vista lista">☰</button>
          </div>
        </div>
      </div>

      {/* Grid or List */}
      {layout === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {sortedEquipos.map(eq => <TeamCard key={eq.id} equipo={eq} t={t} onOpen={() => onSelectTeam(eq.id)} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sortedEquipos.map(eq => <TeamRow key={eq.id} equipo={eq} t={t} onOpen={() => onSelectTeam(eq.id)} />)}
        </div>
      )}
    </div>
  );
}
