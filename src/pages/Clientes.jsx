import React, { useState, useMemo } from "react";
import { FONT } from "../theme/theme";
import { fmt } from "../lib/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../hooks/useAuth";
import { Users, TrendingUp, Trophy, Globe, Briefcase, ChevronRight, AlertCircle } from "lucide-react";

export function Clientes({ t, paises = [] }) {
  const { isAdmin, isProducer } = useAuth();
  const [filterLiga, setFilterLiga] = useState("global");
  const [sortBy, setSortBy] = useState("total");
  const [selectedClient, setSelectedClient] = useState(null);

  // Access Control: Only Admin and Producer
  if (!isAdmin && !isProducer) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center", fontFamily: FONT }}>
        <AlertCircle size={48} color={t.muted} style={{ marginBottom: 16 }} />
        <h2 style={{ color: t.text, margin: "0 0 8px" }}>Acceso Restringido</h2>
        <p style={{ color: t.muted, fontSize: 14, maxWidth: 300 }}>Esta sección solo está disponible para administradores y productores de LIONS.</p>
      </div>
    );
  }

  const investors = useMemo(() => {
    const map = {};
    const paisesToProcess = filterLiga === "global" ? paises : paises.filter(p => p.id === filterLiga);
    
    paisesToProcess.forEach(pais => {
      pais.equipos.forEach(eq => {
        eq.clientes.filter(c => c.categoria === "LIONS" && c.minutos > 0).forEach(c => {
          const key = c.nombre.toUpperCase().trim();
          if (!map[key]) map[key] = { nombre: c.nombre, equipos: [], total: 0 };
          map[key].equipos.push({ equipo: eq.nombre, minutos: c.minutos, bonificados: c.bonificados, liga: pais.nombre });
          map[key].total += c.minutos;
        });
      });
    });
    
    return Object.values(map)
      .filter(i => i.nombre.toUpperCase() !== "LIONS")
      .sort((a, b) => sortBy === "total" ? b.total - a.total : b.equipos.length - a.equipos.length);
  }, [filterLiga, sortBy, paises]);

  const top10 = investors.slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: t.card, border: `1px solid ${t.border}`, padding: "8px 12px", borderRadius: 8, boxShadow: t.shadow, fontFamily: FONT }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 12, color: t.text }}>{payload[0].payload.nombre}</p>
          <p style={{ margin: 0, color: t.lions, fontWeight: 700, fontSize: 14 }}>{fmt(payload[0].value)}'</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>🤝🏼 Clientes LIONS</h1>
        <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Ranking global de inversión y presencia de marcas en toda la red.</p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, padding: 16, borderRadius: 16, boxShadow: t.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.muted, fontSize: 11, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>
            <Users size={14} /> Total Clientes
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>{investors.length}</div>
        </div>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, padding: 16, borderRadius: 16, boxShadow: t.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.muted, fontSize: 11, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>
            <TrendingUp size={14} /> Minutos Totales
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.lions }}>{fmt(investors.reduce((s, i) => s + i.total, 0))}'</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {[{id: "global", label: "🌍 Global"}, ...paises.filter(p => p.activo).map(p => ({id: p.id, label: `${p.bandera} ${p.nombre}`}))].map(f => (
            <button key={f.id} onClick={() => setFilterLiga(f.id)} 
              style={{ padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${filterLiga === f.id ? t.accent : t.border}`, background: filterLiga === f.id ? `${t.accent}15` : t.bg, color: filterLiga === f.id ? t.accent : t.text, cursor: "pointer", fontWeight: filterLiga === f.id ? 800 : 600, fontSize: 12, whiteSpace: "nowrap", fontFamily: FONT }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["total", "Por minutos"], ["equipos", "Por equipos"]].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{ padding: "6px 12px", borderRadius: 10, border: `1.5px solid ${sortBy === key ? t.accent : t.border}`, background: sortBy === key ? `${t.accent}12` : "transparent", color: sortBy === key ? t.accent : t.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* Chart */}
        {top10.length > 0 && (
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24, boxShadow: t.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: t.text, marginBottom: 24, letterSpacing: 1 }}>
              <Trophy size={16} color={t.amber} /> TOP 10 RANKING {filterLiga !== "global" ? filterLiga.toUpperCase() : "GLOBAL"}
            </div>
            <div style={{ height: 350, width: "100%" }}>
              <ResponsiveContainer>
                <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} width={120} interval={0} tick={{ fill: t.text, fontSize: 11, fontWeight: 700, fontFamily: FONT }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: `${t.muted}10` }} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={24}>
                    {top10.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? t.accent : t.lions} fillOpacity={1 - index * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {investors.map((inv, i) => (
            <div key={i} onClick={() => setSelectedClient(selectedClient === inv.nombre ? null : inv.nombre)} style={{ background: t.card, border: `1px solid ${selectedClient === inv.nombre ? t.accent : t.border}`, borderRadius: 16, padding: 16, boxShadow: t.shadow, cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i < 3 ? t.accent : `${t.muted}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: i < 3 ? "#fff" : t.muted }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{inv.nombre}</div>
                    <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{inv.equipos.length} equipo{inv.equipos.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: t.lions }}>{fmt(inv.total)}'</div>
                </div>
              </div>
              
              {selectedClient === inv.nombre && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${t.border}`, animation: "fadeIn 0.2s" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: t.muted, marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>Desglose por Club</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {inv.equipos.sort((a,b) => b.minutos - a.minutos).map((e, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: `${t.muted}05`, borderRadius: 8, border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, opacity: 0.6 }}>{e.liga.toUpperCase()}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{e.equipo}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: t.lions }}>{fmt(e.minutos)}'</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {investors.length === 0 && <div style={{ gridColumn: "1 / -1", color: t.muted, textAlign: "center", padding: 60, fontSize: 14 }}>Sin datos disponibles para este filtro.</div>}
        </div>
      </div>
    </div>
  );
}

