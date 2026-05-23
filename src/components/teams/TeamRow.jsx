import React from "react";
import { getStatus, calcStats, statusColor, statusLabel } from "../../lib/calcStats";
import { fmt } from "../../lib/formatters";
import { FONT } from "../../theme/theme";

export function TeamRow({ equipo, t, onOpen }) {
  const status = getStatus(equipo);
  const stats = calcStats(equipo.clientes);
  const sc = statusColor(status, t);
  const sl = statusLabel(status, stats.disponibles);
  const disabled = status === "futuro";
  const isSpecial = status === "vallas" || status === "pendiente";
  const allLions = [...equipo.clientes].filter(c => c.categoria === "LIONS" && ((c.minutos || 0) + (c.bonificados || 0)) > 0).sort((a, b) => b.minutos - a.minutos);

  return (
    <div onClick={() => !disabled && !isSpecial && onOpen()} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 14px", opacity: disabled ? 0.3 : 1, cursor: disabled ? "default" : "pointer", fontFamily: FONT, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onMouseOver={e => { if (!disabled) e.currentTarget.style.borderColor = t.accent + "60"; }} onMouseOut={e => { e.currentTarget.style.borderColor = t.border; }}>
      {/* Logo + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 180, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: 26, height: 26, borderRadius: "50%", background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚽</div>}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{equipo.nombre}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: sc }}>{sl}</div>
        </div>
      </div>
      {/* Stats */}
      {!disabled && !isSpecial && (
        <>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.lions }}>{fmt(stats.totalLions)}'</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.club }}>{fmt(stats.totalClub)}'</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.green }}>{fmt(stats.disponibles)}' libre</span>
          </div>
          {/* Pills */}
          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 3, minWidth: 0 }}>
            {allLions.filter(c => c.minutos > 0 || c.bonificados > 0).map((c, i) => (
              <span key={i} style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: `${t.lions}18`, color: t.lions, whiteSpace: "nowrap" }}>
                {c.nombre} {c.minutos > 0 ? `${fmt(c.minutos)}'` : ""}{c.bonificados > 0 ? `+${fmt(c.bonificados)}` : ""}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
