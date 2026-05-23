import React from "react";
import { getStatus, calcStats, statusColor, statusLabel } from "../../lib/calcStats";
import { fmt } from "../../lib/formatters";
import { StackedBar } from "../ui/StackedBar";
import { FONT } from "../../theme/theme";

export function TeamCard({ equipo, t, onOpen }) {
  const status = getStatus(equipo);
  const stats = calcStats(equipo.clientes);
  const sc = statusColor(status, t);
  const sl = statusLabel(status, stats.disponibles);
  const disabled = status === "futuro";
  const isSpecial = status === "vallas" || status === "pendiente";
  const allLions = [...equipo.clientes].filter(c => c.categoria === "LIONS" && ((c.minutos || 0) + (c.bonificados || 0)) > 0).sort((a, b) => b.minutos - a.minutos);

  return (
    <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14, overflow: "hidden", opacity: disabled ? 0.3 : 1, transition: "all 0.2s", boxShadow: t.shadow, fontFamily: FONT, cursor: disabled ? "default" : "pointer" }} onClick={() => !disabled && !isSpecial && onOpen()} onMouseOver={e => { if (!disabled) e.currentTarget.style.borderColor = t.accent + "60"; }} onMouseOut={e => { e.currentTarget.style.borderColor = t.border; }}>
      {/* Card header */}
      <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚽</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{equipo.nombre}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: sc, letterSpacing: 0.5, marginTop: 1 }}>{sl}</div>
        </div>
        {!disabled && !isSpecial && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: t.muted, fontWeight: 700 }}>LIONS</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.lions }}>{fmt(stats.totalLions)}'</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: t.muted, fontWeight: 700 }}>CLUB</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.club }}>{fmt(stats.totalClub)}'</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: t.muted, fontWeight: 700 }}>LIBRE</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.green }}>{fmt(stats.disponibles)}'</div>
            </div>
          </div>
        )}
        {isSpecial && <div style={{ fontSize: 11, color: sc, fontWeight: 700 }}>{status === "vallas" ? "📍" : "⏳"}</div>}
      </div>

      {/* Stacked bar */}
      {!disabled && !isSpecial && (
        <div style={{ padding: "0 14px" }}>
          <StackedBar lions={stats.totalLions} club={stats.totalClub} t={t} />
        </div>
      )}

      {/* Lions brands pills */}
      {!disabled && !isSpecial && allLions.length > 0 && (
        <div style={{ padding: "8px 14px 12px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {allLions.map((c, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: c.minutos > 0 ? `${t.lions}18` : `${t.muted}18`, color: c.minutos > 0 ? t.lions : t.muted, whiteSpace: "nowrap", lineHeight: 1 }}>
              {c.nombre} {c.minutos > 0 ? `${fmt(c.minutos)}'` : ""}{c.bonificados > 0 ? ` +${fmt(c.bonificados)}` : c.bonificados < 0 ? ` ${fmt(c.bonificados)}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
