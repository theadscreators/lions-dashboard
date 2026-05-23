import React from "react";
import { Link } from "react-router-dom";
import { useAlerts } from "../../hooks/useAlerts";
import { FONT } from "../../theme/theme";
import { AlertCircle, AlertTriangle, Info, Zap, ChevronRight, Check } from "lucide-react";

/**
 * DashboardAlerts displays contextual alerts based on match status, requests, etc.
 * 
 * Props:
 * - t: theme object
 * - profile: authenticated user profile
 * - matches: array of matches (from useMatches)
 * - requests: array of requests (optional, from useRequests) 
 * - paises: array of countries/teams (from useClubs)
 */
export function DashboardAlerts({ t, profile, matches = [], requests = [], paises = [] }) {
  const { alerts } = useAlerts(profile, matches, requests, paises);

  if (alerts.length === 0) return null; // Don't show if no alerts

  const getAlertStyle = (type) => {
    switch (type) {
      case 'urgent': return { bg: `${t.accent}15`, color: t.accent, icon: <AlertCircle size={18} /> };
      case 'warning': return { bg: `${t.amber}15`, color: t.amber, icon: <AlertTriangle size={18} /> };
      case 'success': return { bg: `${t.green}15`, color: t.green, icon: <Check size={18} /> };
      case 'opportunity': return { bg: `${t.green}15`, color: t.green, icon: <Zap size={18} /> };
      case 'info': return { bg: `${t.lions}15`, color: t.lions, icon: <Info size={18} /> };
      default: return { bg: `${t.muted}15`, color: t.text, icon: <Info size={18} /> };
    }
  };

  return (
    <div style={{ marginBottom: 24, animation: "fadeIn 0.4s" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((alert) => {
          const style = getAlertStyle(alert.type);
          
          const content = (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: style.bg, border: `1px solid ${style.color}30`, borderRadius: 12, padding: "12px 16px", cursor: alert.actionLink ? "pointer" : "default", transition: "all 0.2s" }} onMouseOver={e => alert.actionLink && (e.currentTarget.style.background = `${style.color}25`)} onMouseOut={e => alert.actionLink && (e.currentTarget.style.background = style.bg)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: style.color, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 32 }}>{style.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.muted }}>
                    {alert.homeLogo && <img src={alert.homeLogo} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                    <span>{alert.description}</span>
                    {alert.awayLogo && <img src={alert.awayLogo} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                  </div>
                </div>
              </div>
              {alert.actionLink && (
                <div style={{ color: style.color, display: "flex", alignItems: "center" }}>
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
          );

          if (alert.actionLink) {
            return (
              <Link key={alert.id} to={alert.actionLink} style={{ textDecoration: "none" }}>
                {content}
              </Link>
            );
          }
          
          return <React.Fragment key={alert.id}>{content}</React.Fragment>;
        })}
      </div>
    </div>
  );
}
