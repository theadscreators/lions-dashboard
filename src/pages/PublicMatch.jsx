import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FONT, T } from "../theme/theme";
import { calcStats } from "../lib/calcStats";
import { Calendar, MapPin, CheckCircle, Shield, PlayCircle } from "lucide-react";
import { LionsSVG } from "../components/ui/LionsSVG";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PublicMatch({ t }) {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select(`
            *,
            home_club:clubs!home_club_id(id, name, logo_url, clients(*)),
            away_club:clubs!away_club_id(id, name, logo_url)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setMatch(data);
      } catch (err) {
        console.error("Error fetching match:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [id]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0a0a0a", color: "#fff", fontFamily: FONT }}>Cargando reporte oficial...</div>;
  if (!match) return <Navigate to="/" replace />;

  const homeName = match.home_club?.name || "Local";
  const homeLogo = match.home_club?.logo_url;
  const awayName = match.away_club?.name || match.away_team_name || "Visitante";
  const awayLogo = match.away_club?.logo_url || match.away_team_logo;
  const dateStr = format(new Date(match.match_date), "EEEE d 'de' MMMM, yyyy - HH:mm'hs'", { locale: es });

  const clients = match.home_club?.clients || [];
  const stats = calcStats(clients);
  const isLionsTeam = clients.some(c => c.category === 'LIONS');

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: FONT, padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
            <LionsSVG height={50} dark={true} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 107, 0, 0.15)", color: "#ff6b00", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 20 }}>
            <CheckCircle size={14} /> REPORTE OFICIAL DE PAUTA
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30, marginBottom: 20 }}>
            <div style={{ textAlign: "center" }}>
              {homeLogo ? <img src={homeLogo} alt={homeName} style={{ width: 80, height: 80, objectFit: "contain" }} /> : <Shield size={80} color="#333" />}
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 10 }}>{homeName}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#666" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              {awayLogo ? <img src={awayLogo} alt={awayName} style={{ width: 80, height: 80, objectFit: "contain" }} /> : <Shield size={80} color="#333" />}
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 10 }}>{awayName}</div>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 20, color: "#999", fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}><Calendar size={14} /> {dateStr}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {match.venue || "Estadio Local"}</span>
          </div>
        </div>

        {/* Dashboard Data */}
        <div style={{ background: "#151515", border: "1px solid #333", borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircle color="#ff6b00" /> Distribución de Minutos
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* LIONS */}
            {isLionsTeam && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #222" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ff6b00", letterSpacing: 1 }}>PAUTA LIONS</div>
                  <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Total de marcas comercializadas</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.totalLions}'</div>
              </div>
            )}
            
            {/* CLUB */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #222" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#00b4d8", letterSpacing: 1 }}>PAUTA CLUB LOCAL</div>
                <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Sponsors y menciones institucionales</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.totalClub}'</div>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>TIEMPO TOTAL EMITIDO</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#00e676" }}>{stats.totalReal}'</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 40, color: "#666", fontSize: 11, fontWeight: 600 }}>
          Generado automáticamente por el Sistema Operativo de Lions.
        </div>
      </div>
    </div>
  );
}
