import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Settings, ShieldAlert, ClipboardList } from "lucide-react";
import { FONT } from "../../theme/theme";

export function BottomNav({ t, auth }) {
  const location = useLocation();
  const path = location.pathname;
  const { isAdmin, isProducer, role } = auth;

  let tabs = [];

  if (role === 'operator') {
    tabs = [
      { to: "/agenda", icon: <Calendar size={20} />, label: "Agenda" }
    ];
  } else if (role === 'club_staff') {
    tabs = [
      { to: "/", icon: <LayoutDashboard size={20} />, label: "Panel" },
      { to: "/agenda", icon: <Calendar size={20} />, label: "Agenda" },
      { to: "/ajustes", icon: <Settings size={20} />, label: "Ajustes" }
    ];
  } else {
    tabs = [
      { to: "/", icon: <LayoutDashboard size={20} />, label: "Panel" },
      { to: "/agenda", icon: <Calendar size={20} />, label: "Agenda" },
      { to: "/ligas", icon: <ShieldAlert size={20} />, label: "Ligas" },
      { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
      { to: "/ajustes", icon: <Settings size={20} />, label: "Ajustes" }
    ];
    if (isAdmin || isProducer) {
      tabs.push({ to: "/log", icon: <ClipboardList size={20} />, label: "Log" });
    }
  }

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: t.header, borderTop: `1px solid ${t.headerBorder}`,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "10px 10px 20px", zIndex: 100,
      boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
    }} className="bottom-nav-mobile">
      {tabs.map(tab => {
        const active = path === tab.to;
        return (
          <Link key={tab.to} to={tab.to} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            textDecoration: "none", color: active ? t.accent : t.muted,
            fontFamily: FONT, transition: "color 0.2s"
          }}>
            {tab.icon}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{tab.label.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
}
