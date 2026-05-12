import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FONT } from "../../theme/theme";

export function TopNav({ t, auth }) {
  const location = useLocation();
  const path = location.pathname;
  const { isAdmin, isProducer, role } = auth;

  let tabs = [];

  if (role === 'operator') {
    tabs = [
      { to: "/agenda", label: "AGENDA" }
    ];
  } else if (role === 'club_staff') {
    tabs = [
      { to: "/", label: "PANEL" },
      { to: "/agenda", label: "AGENDA" },
      { to: "/ajustes", label: "AJUSTES" }
    ];
  } else {
    tabs = [
      { to: "/", label: "PANEL" },
      { to: "/ligas", label: "LIGAS" },
      { to: "/clientes", label: "CLIENTES" },
      { to: "/agenda", label: "AGENDA" },
      { to: "/ajustes", label: "AJUSTES" },
    ];
    if (isAdmin || isProducer) {
      tabs.push({ to: "/log", label: "LOG" });
    }
  }

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }} className="top-nav-desktop">
      {tabs.map(tab => {
        const active = path === tab.to;
        return (
          <Link key={tab.to} to={tab.to} style={{
            textDecoration: "none",
            color: active ? t.text : t.muted,
            fontSize: 12,
            fontWeight: 800,
            fontFamily: FONT,
            letterSpacing: 1,
            position: "relative",
            padding: "8px 0"
          }}>
            {tab.label}
            {active && (
              <div style={{
                position: "absolute", bottom: -2, left: 0, right: 0,
                height: 2, background: t.accent, borderRadius: 2
              }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}
