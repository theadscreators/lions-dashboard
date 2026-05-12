import React, { useState, useMemo } from "react";
import { FONT } from "../theme/theme";
import { useAuth } from "../hooks/useAuth";
import { useWorkLog } from "../hooks/useWorkLog";
import { useClubs } from "../hooks/useClubs";
import { fmt } from "../lib/formatters";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function WorkLog({ t }) {
  const { isAdmin, isProducer } = useAuth();
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useWorkLog();
  const { paises } = useClubs();

  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  const [filterClub, setFilterClub] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const allClubs = useMemo(() => paises.flatMap(p => p.equipos), [paises]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const date = parseISO(entry.date_done);
      const start = startOfMonth(parseISO(`${filterMonth}-01`));
      const end = endOfMonth(start);
      
      const matchMonth = isWithinInterval(date, { start, end });
      const matchClub = filterClub === "all" || entry.club_id === filterClub;
      
      return matchMonth && matchClub;
    });
  }, [entries, filterMonth, filterClub]);

  const totalUSD = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + (Number(entry.net_value) || 0), 0);
  }, [filteredEntries]);

  if (!isAdmin && !isProducer) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center", fontFamily: FONT }}>
        <AlertCircle size={48} color={t.muted} style={{ marginBottom: 16 }} />
        <h2 style={{ color: t.text, margin: "0 0 8px" }}>Acceso Restringido</h2>
        <p style={{ color: t.muted, fontSize: 14, maxWidth: 300 }}>El registro de trabajo solo es visible para administradores y productores.</p>
      </div>
    );
  }

  const handleExport = () => {
    alert("Exportando a Excel (Simulado)... Esta función genera un archivo .xlsx con el formato oficial.");
  };

  return (
    <div style={{ fontFamily: FONT, animation: "fadeIn 0.3s", paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>📋 Registro de Trabajo (Work Log)</h1>
          <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Control de tareas artísticas y facturación mensual.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              <Download size={16} /> Exportar Excel
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
              <Plus size={18} /> Nueva Tarea
            </button>
          )}
        </div>
      </div>

      {/* Filters & Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, padding: 16, borderRadius: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>FILTRAR POR MES</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT }} />
        </div>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, padding: 16, borderRadius: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>FILTRAR POR CLUB</label>
          <select value={filterClub} onChange={e => setFilterClub(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT }}>
            <option value="all">Todos los clubes</option>
            {allClubs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        {isAdmin && (
          <div style={{ background: `${t.lions}10`, border: `1px solid ${t.lions}30`, padding: 16, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: t.lions, letterSpacing: 0.5, marginBottom: 4 }}>TOTAL MES (NETO USD)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.lions }}>${fmt(totalUSD)}</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, overflow: "hidden", boxShadow: t.shadow }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ background: `${t.muted}05`, borderBottom: `1px solid ${t.border}` }}>
              <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11 }}>FECHA</th>
              <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11 }}>CLUB / PARTIDO</th>
              <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11 }}>TIPO / TAREA</th>
              <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11 }}>COBRAR A</th>
              {isAdmin && <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11, textAlign: "right" }}>VALOR NETO</th>}
              <th style={{ padding: "16px 20px", color: t.muted, fontWeight: 800, fontSize: 11, textAlign: "center" }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: 40, textAlign: "center", color: t.muted }}>Cargando log...</td></tr>
            ) : filteredEntries.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: 40, textAlign: "center", color: t.muted }}>No hay registros para este filtro.</td></tr>
            ) : (
              filteredEntries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${t.border}`, transition: "all 0.1s" }} onMouseOver={e => e.currentTarget.style.background = `${t.muted}03`} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 700, color: t.text }}>{format(parseISO(entry.date_done), "dd MMM", { locale: es })}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{format(parseISO(entry.date_done), "yyyy")}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 800, color: t.text }}>{entry.club?.name}</div>
                    {entry.match && (
                      <div style={{ fontSize: 11, color: t.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        {entry.match.home_club?.name} vs {entry.match.away_club?.name || entry.match.away_team_name}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "inline-block", background: `${t.accent}15`, color: t.accent, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900, marginBottom: 4 }}>
                      {entry.task_type?.replace("_", " ").toUpperCase() || "TAREA"}
                    </div>
                    <div style={{ color: t.text, fontWeight: 600 }}>{entry.description}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: entry.billing_type === 'extra_lions' ? t.lions : entry.billing_type === 'extra_club' ? t.club : t.muted, textTransform: "uppercase" }}>
                      {entry.billing_type?.replace("_", " ") || "No definido"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 900, color: t.lions }}>
                      ${fmt(entry.net_value)}
                    </td>
                  )}
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    {entry.status === 'confirmed' ? (
                      <div style={{ color: t.green, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <CheckCircle2 size={16} /> <span style={{ fontSize: 10, fontWeight: 800 }}>CONFIRMADO</span>
                      </div>
                    ) : (
                      <div style={{ color: t.amber, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Clock size={16} /> <span style={{ fontSize: 10, fontWeight: 800 }}>BORRADOR</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
