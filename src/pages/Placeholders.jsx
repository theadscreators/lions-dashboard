import React from "react";
import { FONT } from "../theme/theme";

export function Ajustes({ t }) {
  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", textAlign: "center" }}>
      <h2 style={{ color: t.text, fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>⚙️ Ajustes y Solicitudes</h2>
      <p style={{ color: t.muted, fontSize: 14, maxWidth: 300 }}>La gestión de usuarios, roles, solicitudes y backup se implementará en las próximas etapas.</p>
    </div>
  );
}
