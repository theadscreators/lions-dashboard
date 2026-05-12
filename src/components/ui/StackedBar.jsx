import React, { useState, useEffect } from "react";

/**
 * StackedBar — accepts either individual props or a stats object:
 *   <StackedBar lions={42} club={30} total={90} t={t} />
 *   <StackedBar stats={{ totalLions: 42, totalClub: 30 }} t={t} />
 */
export function StackedBar({ lions, club, total = 90, stats, t, height = 8 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const ti = setTimeout(() => setMounted(true), 150); return () => clearTimeout(ti); }, []);

  // Support both prop styles
  const lionsVal = stats?.totalLions ?? lions ?? 0;
  const clubVal = stats?.totalClub ?? club ?? 0;
  const totalVal = stats ? (lionsVal + clubVal + (stats.disponibles ?? 0)) : total;

  const pLions = totalVal > 0 ? Math.min(100, (lionsVal / totalVal) * 100) : 0;
  const pClub = totalVal > 0 ? Math.min(100 - pLions, (clubVal / totalVal) * 100) : 0;

  return (
    <div style={{ height, borderRadius: height / 2, background: "#00000012", overflow: "hidden", display: "flex" }}>
      <div style={{ width: mounted ? `${pLions}%` : "0%", background: t.lions, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
      <div style={{ width: mounted ? `${pClub}%` : "0%", background: t.club, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s" }} />
    </div>
  );
}
