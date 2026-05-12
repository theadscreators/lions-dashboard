import React, { useState } from "react";
import { getStatus, calcStats, statusColor, statusLabel } from "../../lib/calcStats";
import { fmt } from "../../lib/formatters";
import { AnimatedBar } from "../ui/AnimatedBar";
import { FONT } from "../../theme/theme";

export function TeamDetail({ equipo, t, onBack }) {
  const [tab, setTab] = useState("LIONS");
  const stats = calcStats(equipo.clientes);
  const status = getStatus(equipo);
  const sc = statusColor(status, t);
  const sl = statusLabel(status, stats.disponibles);
  const tabColors = { LIONS: t.lions, CLUB: t.club, OTROS: t.muted };
  const tabItems = tab === "LIONS" ? equipo.clientes.filter(c => c.categoria === "LIONS") : tab === "CLUB" ? equipo.clientes.filter(c => c.categoria === "CLUB") : equipo.clientes.filter(c => c.categoria === "OTROS");
  const sortedItems = [...tabItems].sort((a, b) => b.minutos - a.minutos);
  const maxM = sortedItems[0]?.minutos || 1;
  const pLions = Math.min(100, (stats.totalLions / 90) * 100);
  const pClub = Math.min(100 - pLions, (stats.totalClub / 90) * 100);

  return (
    <div style={{ animation: "fadeIn 0.25s", fontFamily: FONT, padding: "24px 20px", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: 56, height: 56, borderRadius: "50%", background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚽</div>}
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.text, lineHeight: 1.1 }}>{equipo.nombre}</div>
            <div style={{ fontSize: 11, color: sc, fontWeight: 800, letterSpacing: 2, marginTop: 3 }}>{sl.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "none", color: t.muted, fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { label: "LIONS", val: `${fmt(stats.totalLions)}'`, color: t.lions },
          { label: "CLUB", val: `${fmt(stats.totalClub)}'`, color: t.club },
          { label: "MIN. DISPONIBLES", val: `${fmt(stats.disponibles)}'`, color: t.green },
          { label: "BONIFICADOS", val: `${fmt(stats.totalBonificados)}'`, color: t.accent },
          { label: "TOTAL REAL", val: `${fmt(stats.totalReal)}'`, color: sc },
          { label: "MARGEN", val: stats.totalReal <= 90 ? `${fmt(90 - stats.totalReal)}'` : `+${fmt(stats.totalReal - 90)}'`, color: stats.totalReal <= 90 ? t.green : t.gray },
        ].map((k, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Occupation bar */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: t.muted, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
          <span>OCUPACIÓN 90'</span><span style={{ color: sc }}>{fmt(stats.totalReal)}' / 90'</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: t.border, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${pLions}%`, background: t.lions, transition: "width 0.7s" }} />
          <div style={{ width: `${pClub}%`, background: t.club, transition: "width 0.7s 0.1s" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, fontWeight: 700 }}>
          <span style={{ color: t.lions }}>■ Lions {fmt(stats.totalLions)}'</span>
          <span style={{ color: t.club }}>■ Club {fmt(stats.totalClub)}'</span>
          <span style={{ color: t.green }}>■ Libre {fmt(stats.disponibles)}'</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["LIONS", "CLUB", "OTROS"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: "7px 16px", borderRadius: 8, border: `2px solid ${tab === tb ? tabColors[tb] : t.border}`, background: tab === tb ? `${tabColors[tb]}15` : "transparent", color: tab === tb ? tabColors[tb] : t.muted, cursor: "pointer", fontWeight: 800, fontSize: 11, letterSpacing: 1, fontFamily: FONT, transition: "all 0.15s" }}>
            {tb} <span style={{ fontWeight: 400, opacity: 0.7 }}>{fmt(tab === "LIONS" ? stats.totalLions : tab === "CLUB" ? stats.totalClub : stats.totalOtros)}'</span>
          </button>
        ))}
      </div>

      {/* Client list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sortedItems.length === 0 && <div style={{ color: t.muted, textAlign: "center", padding: 24, fontSize: 13 }}>Sin clientes en esta categoría</div>}
        {sortedItems.map((c, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 13px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13 }}>{c.nombre}</div>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                {c.bonificados !== 0 && <span style={{ fontSize: 10, fontWeight: 700, color: c.bonificados > 0 ? t.accent : t.gray, background: c.bonificados > 0 ? `${t.accent}15` : `${t.gray}15`, padding: "2px 7px", borderRadius: 4 }}>{c.bonificados > 0 ? "+" : ""}{fmt(c.bonificados)}' bonif.</span>}
                <span style={{ fontWeight: 900, color: tabColors[tab], fontSize: 16 }}>{fmt(c.minutos)}'</span>
              </div>
            </div>
            <AnimatedBar pct={(c.minutos / maxM) * 100} color={tabColors[tab]} height={4} delay={i * 30} />
          </div>
        ))}
      </div>

      {equipo.notas && <div style={{ marginTop: 14, background: `${t.accent}0c`, border: `1px solid ${t.accent}30`, borderRadius: 10, padding: "10px 13px", fontSize: 12, color: t.sub, fontWeight: 600, lineHeight: 1.7 }}>✅ {equipo.notas}</div>}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
