import React, { useState, useEffect, useMemo } from "react";
import { FONT } from "../theme/theme";
import { X, Plus, Minus, Trash2, Info, Check } from "lucide-react";

// Format helper to strip .0 from integers but preserve .5 for decimals
const formatMinutes = (num) => {
  const rounded = Number(num) || 0;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

export function MinuteEditorModal({ t, match, onClose, onSave }) {
  const [lionsBrands, setLionsBrands] = useState([]);
  const [clubBrands, setClubBrands] = useState([]);
  const [golBrand, setGolBrand] = useState(match?.gol_brand || "");
  const [golNotes, setGolNotes] = useState(match?.gol_notes || "");
  const [notes, setNotes] = useState(match?.operational_notes || "");

  // Initialize data on mount
  useEffect(() => {
    const clients = match?.home_club?.clientes || [];
    
    // Separate by category
    const lions = clients.filter(c => c.categoria === 'LIONS' || c.categoria === 'Lions').map(c => ({
      id: c.id,
      nombre: c.nombre || "",
      minutos: Number(c.minutos) || 0,
      bonificados: Number(c.bonificados) || 0,
      categoria: 'LIONS'
    }));
    
    const club = clients.filter(c => c.categoria === 'CLUB' || c.categoria === 'Club').map(c => ({
      id: c.id,
      nombre: c.nombre || "",
      minutos: Number(c.minutos) || 0,
      bonificados: Number(c.bonificados) || 0,
      categoria: 'CLUB'
    }));

    // Ensure at least one blank row is present if empty
    if (lions.length === 0) {
      lions.push({ id: null, nombre: "", minutos: 0, bonificados: 0, categoria: 'LIONS' });
    }
    if (club.length === 0) {
      club.push({ id: null, nombre: "", minutos: 0, bonificados: 0, categoria: 'CLUB' });
    }

    setLionsBrands(lions);
    setClubBrands(club);
  }, [match]);

  // Inline totals
  const subtotalLions = useMemo(() => lionsBrands.reduce((acc, b) => acc + (b.minutos || 0), 0), [lionsBrands]);
  const bonifiedLions = useMemo(() => lionsBrands.reduce((acc, b) => acc + (b.bonificados || 0), 0), [lionsBrands]);
  const subtotalClub = useMemo(() => clubBrands.reduce((acc, b) => acc + (b.minutos || 0), 0), [clubBrands]);
  const bonifiedClub = useMemo(() => clubBrands.reduce((acc, b) => acc + (b.bonificados || 0), 0), [clubBrands]);

  // Sum both LIONS + CLUB including both subtotals and bonifications!
  const totalAsignado = subtotalLions + bonifiedLions + subtotalClub + bonifiedClub;
  const minutosLibres = Math.max(0, 90 - totalAsignado);

  // Legendary Donut Chart Calculations (Top 5 + "Otros")
  const chartData = useMemo(() => {
    // Combine both lists and filter brands with total minutes
    const all = [...lionsBrands, ...clubBrands]
      .map(b => ({
        nombre: b.nombre?.trim() || "Sin Nombre",
        total: (Number(b.minutos) || 0) + (Number(b.bonificados) || 0)
      }))
      .filter(b => b.total > 0);

    const totalMinutes = all.reduce((acc, b) => acc + b.total, 0);
    if (totalMinutes === 0) {
      return { legend: [], segments: [], totalBrands: 0 };
    }

    // Sort descending
    const sorted = [...all].sort((a, b) => b.total - a.total);
    
    // Top 5 brands
    const top5 = sorted.slice(0, 5);
    
    // Others sum (from index 5 onwards)
    const othersSum = sorted.slice(5).reduce((acc, b) => acc + b.total, 0);

    const legend = [];
    const colors = ["#ffc107", "#28a745", "#ff3131", "#adc7ff", "#f57c00", "#007bff"]; // Yellow, Green, Red, Light Blue, Orange, Dark Blue

    top5.forEach((b, i) => {
      legend.push({
        nombre: b.nombre,
        minutos: b.total,
        percentage: Math.round((b.total / totalMinutes) * 100),
        color: colors[i]
      });
    });

    if (othersSum > 0) {
      legend.push({
        nombre: "Otros",
        minutos: othersSum,
        percentage: Math.round((othersSum / totalMinutes) * 100),
        color: colors[5]
      });
    }

    // SVG donut calculations
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;
    
    const segments = legend.map(item => {
      const p = item.percentage / 100;
      const offset = circumference - (p * circumference);
      const angle = (accumulated * 360) - 90; // offset to top
      accumulated += p;
      return {
        ...item,
        offset,
        angle,
        strokeDasharray: `${circumference} ${circumference}`
      };
    });

    return { legend, segments, totalBrands: sorted.length };
  }, [lionsBrands, clubBrands]);

  // Handle changes in row
  const updateRow = (type, index, field, value) => {
    const list = type === 'LIONS' ? [...lionsBrands] : [...clubBrands];
    list[index] = {
      ...list[index],
      [field]: field === 'nombre' ? value : Number(value) || 0
    };
    if (type === 'LIONS') setLionsBrands(list);
    else setClubBrands(list);
  };

  const addRow = (type) => {
    const list = type === 'LIONS' ? [...lionsBrands] : [...clubBrands];
    list.push({ id: null, nombre: "", minutos: 0, bonificados: 0, categoria: type });
    if (type === 'LIONS') setLionsBrands(list);
    else setClubBrands(list);
  };

  const removeRow = (type, index) => {
    const list = type === 'LIONS' ? [...lionsBrands] : [...clubBrands];
    list.splice(index, 1);
    if (list.length === 0) {
      list.push({ id: null, nombre: "", minutos: 0, bonificados: 0, categoria: type });
    }
    if (type === 'LIONS') setLionsBrands(list);
    else setClubBrands(list);
  };

  // Clipboard Paste handler for TSV/Excel data
  const handlePaste = (e, type, index) => {
    const rawData = e.clipboardData.getData("text");
    if (!rawData || !rawData.includes("\t") && !rawData.includes("\n")) return; // Only process actual table copy paste

    e.preventDefault();
    const rows = rawData.split(/\r?\n/).filter(r => r.trim());
    const list = type === 'LIONS' ? [...lionsBrands] : [...clubBrands];

    let currentIdx = index;
    rows.forEach(row => {
      if (currentIdx >= list.length) return; // Ignore overflow as requested

      const cols = row.split("\t");
      const nombre = cols[0] ? cols[0].trim() : list[currentIdx].nombre;
      const minutos = cols[1] !== undefined ? Number(cols[1].replace(",", ".")) || 0 : list[currentIdx].minutos;
      const bonificados = cols[2] !== undefined ? Number(cols[2].replace(",", ".")) || 0 : list[currentIdx].bonificados;

      list[currentIdx] = {
        ...list[currentIdx],
        nombre,
        minutos,
        bonificados
      };
      currentIdx++;
    });

    if (type === 'LIONS') setLionsBrands(list);
    else setClubBrands(list);
  };

  const handleSave = () => {
    // Filter out rows without name/minutes and map clean format
    const cleanedLions = lionsBrands
      .map(b => ({
        ...b,
        nombre: b.nombre.trim(),
        minutos: Number(b.minutos) || 0,
        bonificados: Number(b.bonificados) || 0
      }))
      .filter(b => b.nombre !== "");

    const cleanedClub = clubBrands
      .map(b => ({
        ...b,
        nombre: b.nombre.trim(),
        minutos: Number(b.minutos) || 0,
        bonificados: Number(b.bonificados) || 0
      }))
      .filter(b => b.nombre !== "");

    const combined = [...cleanedLions, ...cleanedClub];
    
    onSave({
      clients: combined,
      golBrand: golBrand.trim(),
      golNotes: golNotes.trim(),
      notes: notes.trim()
    });
  };

  // Styled helper for standard inputs
  const cellInput = {
    background: "#251210",
    border: "1px solid #4a3431",
    color: "#fddbd7",
    padding: "6px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    outline: "none"
  };

  const cellInputName = {
    ...cellInput,
    textAlign: "left"
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(10, 5, 5, 0.85)", zIndex: 1100,
        overflowY: "auto", WebkitOverflowScrolling: "touch",
        fontFamily: FONT, padding: "24px 0",
        display: "flex", justifyContent: "center"
      }}
    >
      <div style={{
        background: "#120605", border: "1px solid #4a3431",
        borderRadius: "16px", width: "95%", maxWidth: "480px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
        alignSelf: "flex-start", marginBottom: "24px"
      }}>
        
        {/* Header Section */}
        <div style={{
          background: "#200f0d", padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #331d1b",
          borderRadius: "16px 16px 0 0"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#ffb4ab", letterSpacing: "1.5px", textTransform: "uppercase" }}>EDITOR DE MINUTOS</span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#fddbd7" }}>
              {match?.display_home_name} VS {match?.display_away_name}
            </span>
          </div>
          <button 
            onClick={handleSave}
            style={{
              background: "#ff3131", color: "#ffffff", border: "none",
              padding: "6px 14px", borderRadius: "6px", fontSize: "11px",
              fontWeight: 900, cursor: "pointer", transition: "all 0.15s",
              boxShadow: "0 2px 8px rgba(255, 49, 49, 0.4)"
            }}
          >
            GUARDAR
          </button>
        </div>

        {/* Modal Body Container — no height constraint, parent overlay scrolls */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Top Info Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Total Asignado */}
            <div style={{ background: "#1a0a08", border: "1px solid #331d1b", borderRadius: "8px", padding: "10px 12px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#ae8883", display: "block" }}>TOTAL ASIGNADO</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "#fddbd7" }}>
                {formatMinutes(totalAsignado)}<span style={{ fontSize: "16px", fontWeight: 700 }}>'</span>
              </span>
              <div style={{ fontSize: "9px", color: "#ae8883", display: "flex", alignItems: "flex-start", gap: 4, marginTop: 4, lineHeight: 1.3 }}>
                <Info size={10} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Clientes de Lions + Club + Bonificados</span>
              </div>
            </div>
            
            {/* Minutos Libres */}
            <div style={{ background: "#1a0a08", border: "1px solid #331d1b", borderRadius: "8px", padding: "10px 12px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#ae8883", display: "block" }}>MINUTOS LIBRES</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: minutosLibres > 0 ? "#28a745" : "#ff3131" }}>
                {formatMinutes(minutosLibres)}<span style={{ fontSize: "16px", fontWeight: 700 }}>'</span>
              </span>
              <div style={{ fontSize: "9px", color: minutosLibres > 0 ? "#28a745" : "#ff3131", display: "flex", alignItems: "flex-start", gap: 4, marginTop: 4, lineHeight: 1.3 }}>
                <Check size={10} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Espacio disponible (Base 90')</span>
              </div>
            </div>
          </div>

          {/* Mayores Clientes Pie/Donut Chart */}
          <div style={{
            background: "#1a0a08", border: "1px solid #331d1b", borderRadius: "10px",
            padding: "12px 14px", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "#fddbd7" }}>Mayores Clientes</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Circular Donut via SVG */}
              <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#221110" strokeWidth="10" />
                  {chartData.segments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="45"
                      cy="45"
                      r="35"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.offset}
                      transform={`rotate(${seg.angle} 45 45)`}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                {/* Center Badge */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  display: "flex", flexDirection: "column", alignItems: "center"
                }}>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#fddbd7", lineHeight: 1 }}>{chartData.totalBrands}</span>
                  <span style={{ fontSize: "7px", fontWeight: 800, color: "#ae8883", textTransform: "uppercase" }}>Marcas</span>
                </div>
              </div>

              {/* Dynamic Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {chartData.legend.length === 0 ? (
                  <span style={{ fontSize: "10px", color: "#ae8883", fontStyle: "italic" }}>Sin marcas activas aún</span>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                    {chartData.legend.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                        <span style={{
                          color: "#fddbd7", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", maxWidth: "80px"
                        }}>{item.nombre}</span>
                        <span style={{ color: "#ae8883", fontWeight: 900 }}>{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minutos Lions Table */}
          <div style={{ background: "#1a0a08", border: "1px solid #331d1b", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              background: "#2e1b19", padding: "8px 12px", display: "flex",
              justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#ffb4ab" }}>🔥 MINUTOS LIONS</span>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#ae8883" }}>
                Subtotal: {formatMinutes(subtotalLions)}' | Bon: {formatMinutes(bonifiedLions)}'
              </span>
            </div>
            
            <div style={{ padding: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #331d1b", fontSize: "9px", color: "#ae8883" }}>
                    <th style={{ textAlign: "left", padding: "4px 6px", width: "42%" }}>MARCAS</th>
                    <th style={{ padding: "4px 6px", width: "20%" }}>MINUTOS</th>
                    <th style={{ padding: "4px 6px", width: "20%" }}>BONIF.</th>
                    <th style={{ padding: "4px 6px", width: "18%" }}>TOTAL</th>
                    <th style={{ padding: "4px 6px", width: "10%", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lionsBrands.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #221110" }}>
                      <td style={{ padding: "4px 2px" }}>
                        <input
                          type="text"
                          value={b.nombre}
                          onChange={e => updateRow('LIONS', i, 'nombre', e.target.value)}
                          onPaste={e => handlePaste(e, 'LIONS', i)}
                          placeholder="Nombre marca..."
                          style={cellInputName}
                        />
                      </td>
                      <td style={{ padding: "4px 2px", position: "relative" }}>
                        <NumericCellInput 
                          value={b.minutos} 
                          onChange={val => updateRow('LIONS', i, 'minutos', val)} 
                          style={cellInput} 
                        />
                      </td>
                      <td style={{ padding: "4px 2px", position: "relative" }}>
                        <NumericCellInput 
                          value={b.bonificados} 
                          onChange={val => updateRow('LIONS', i, 'bonificados', val)} 
                          style={cellInput} 
                        />
                      </td>
                      <td style={{ padding: "4px 2px", fontSize: "12px", fontWeight: 800, color: "#fddbd7", textAlign: "center" }}>
                        {formatMinutes((Number(b.minutos) || 0) + (Number(b.bonificados) || 0))}
                      </td>
                      <td style={{ padding: "4px 2px", textAlign: "right" }}>
                        <button 
                          onClick={() => removeRow('LIONS', i)}
                          style={{ background: "none", border: "none", color: "#ae8883", cursor: "pointer", display: "inline-flex", padding: 4 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={() => addRow('LIONS')}
                style={{
                  width: "100%", background: "none", border: "1px dashed #4a3431",
                  color: "#ffb4ab", padding: "6px", fontSize: "10px", fontWeight: 800,
                  borderRadius: "4px", marginTop: 8, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 4
                }}
              >
                <Plus size={10} /> AGREGAR MARCA LIONS
              </button>
            </div>
          </div>

          {/* Minutos Club Table */}
          <div style={{ background: "#1a0a08", border: "1px solid #331d1b", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              background: "#161b2e", padding: "8px 12px", display: "flex",
              justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#adc7ff" }}>🛡️ MINUTOS CLUB</span>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#ae8883" }}>
                Subtotal: {formatMinutes(subtotalClub)}' | Bon: {formatMinutes(bonifiedClub)}'
              </span>
            </div>
            
            <div style={{ padding: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #331d1b", fontSize: "9px", color: "#ae8883" }}>
                    <th style={{ textAlign: "left", padding: "4px 6px", width: "42%" }}>MARCAS</th>
                    <th style={{ padding: "4px 6px", width: "20%" }}>MINUTOS</th>
                    <th style={{ padding: "4px 6px", width: "20%" }}>BONIF.</th>
                    <th style={{ padding: "4px 6px", width: "18%" }}>TOTAL</th>
                    <th style={{ padding: "4px 6px", width: "10%", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {clubBrands.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #221110" }}>
                      <td style={{ padding: "4px 2px" }}>
                        <input
                          type="text"
                          value={b.nombre}
                          onChange={e => updateRow('CLUB', i, 'nombre', e.target.value)}
                          onPaste={e => handlePaste(e, 'CLUB', i)}
                          placeholder="Nombre marca..."
                          style={cellInputName}
                        />
                      </td>
                      <td style={{ padding: "4px 2px", position: "relative" }}>
                        <NumericCellInput 
                          value={b.minutos} 
                          onChange={val => updateRow('CLUB', i, 'minutos', val)} 
                          style={cellInput} 
                        />
                      </td>
                      <td style={{ padding: "4px 2px", position: "relative" }}>
                        <NumericCellInput 
                          value={b.bonificados} 
                          onChange={val => updateRow('CLUB', i, 'bonificados', val)} 
                          style={cellInput} 
                        />
                      </td>
                      <td style={{ padding: "4px 2px", fontSize: "12px", fontWeight: 800, color: "#fddbd7", textAlign: "center" }}>
                        {formatMinutes((Number(b.minutos) || 0) + (Number(b.bonificados) || 0))}
                      </td>
                      <td style={{ padding: "4px 2px", textAlign: "right" }}>
                        <button 
                          onClick={() => removeRow('CLUB', i)}
                          style={{ background: "none", border: "none", color: "#ae8883", cursor: "pointer", display: "inline-flex", padding: 4 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={() => addRow('CLUB')}
                style={{
                  width: "100%", background: "none", border: "1px dashed #4a3431",
                  color: "#ffb4ab", padding: "6px", fontSize: "10px", fontWeight: 800,
                  borderRadius: "4px", marginTop: 8, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 4
                }}
              >
                <Plus size={10} /> AGREGAR MARCA CLUB
              </button>
            </div>
          </div>

          {/* Estado del Gol Input */}
          <div style={{
            background: "#1a0a08", border: "1px solid #ff313130", borderRadius: "10px",
            padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6
          }}>
            <span style={{ fontSize: "12px", fontWeight: 900, color: "#ffb4ab", display: "flex", alignItems: "center", gap: 4 }}>
              ⚽ ESTADO DEL GOL
            </span>
            <input 
              type="text" 
              value={golBrand} 
              onChange={e => setGolBrand(e.target.value)} 
              placeholder="(SIN GOL ASIGNADO)" 
              style={{
                background: "#251210", border: "1px solid #ff313160", borderRadius: "6px",
                color: "#ff3131", fontSize: "14px", fontWeight: 900, textAlign: "center",
                padding: "6px 12px", width: "100%", outline: "none", textTransform: "uppercase"
              }}
            />
            <input 
              type="text" 
              value={golNotes} 
              onChange={e => setGolNotes(e.target.value)} 
              placeholder="Pauta vendida - Exclusividad de mención" 
              style={{
                background: "none", border: "none", borderBottom: "1px solid #4a3431",
                color: "#ae8883", fontSize: "10px", textAlign: "center",
                padding: "2px", width: "100%", outline: "none"
              }}
            />
          </div>

          {/* Notas de Pauta Operational notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#ae8883" }}>📝 NOTAS DE PAUTA / OPERATIVAS</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="- Dejar aquí las notas relevantes para el partido..."
              style={{
                width: "100%", minHeight: "60px", background: "#251210", border: "1px solid #4a3431",
                borderRadius: "6px", padding: "8px 10px", color: "#fddbd7", fontSize: "11px",
                fontFamily: FONT, resize: "vertical", outline: "none"
              }}
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          background: "#1a0a08", padding: "12px 20px", display: "flex", gap: 10,
          borderTop: "1px solid #331d1b",
          borderRadius: "0 0 16px 16px"
        }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1, background: "none", border: "1px solid #4a3431", color: "#fddbd7",
              padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 800,
              cursor: "pointer", transition: "all 0.15s"
            }}
          >
            CANCELAR
          </button>
          <button 
            onClick={handleSave}
            style={{
              flex: 1, background: "#ff3131", color: "#ffffff", border: "none",
              padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 800,
              cursor: "pointer", transition: "all 0.15s",
              boxShadow: "0 4px 12px rgba(255, 49, 49, 0.3)"
            }}
          >
            CONFIRMAR Y GUARDAR
          </button>
        </div>

      </div>
    </div>
  );
}

// Sub-component for premium numeric inputs with interactive +/- hover controls
function NumericCellInput({ value, onChange, style }) {
  const [localVal, setLocalVal] = useState(value === 0 ? "" : String(value));
  const [hover, setHover] = useState(false);

  // Keep state synchronized on mount or outside modifications
  useEffect(() => {
    setLocalVal(value === 0 ? "" : String(value));
  }, [value]);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(",", ".");
    // Allow empty, digits, single decimal point or comma
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setLocalVal(raw);
      const parsed = parseFloat(raw);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  const increment = () => {
    const next = Math.max(0, (Number(value) || 0) + 0.5);
    onChange(next);
  };

  const decrement = () => {
    const next = Math.max(0, (Number(value) || 0) - 0.5);
    onChange(next);
  };

  return (
    <div 
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", width: "100%" }}
    >
      <input
        type="text"
        inputMode="decimal"
        value={localVal}
        onChange={handleInputChange}
        placeholder="0"
        style={style}
      />
      {hover && (
        <div style={{
          position: "absolute", right: "2px", top: "50%", transform: "translateY(-50%)",
          display: "flex", gap: "2px", background: "#1a0a08b3", padding: "2px",
          borderRadius: "3px", border: "1px solid #4a3431", zIndex: 10
        }}>
          <button 
            onClick={decrement}
            style={{
              background: "#331d1b", border: "none", color: "#ffb4ab",
              width: "14px", height: "14px", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "8px", borderRadius: "2px", cursor: "pointer"
            }}
          >
            <Minus size={8} />
          </button>
          <button 
            onClick={increment}
            style={{
              background: "#331d1b", border: "none", color: "#ffb4ab",
              width: "14px", height: "14px", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "8px", borderRadius: "2px", cursor: "pointer"
            }}
          >
            <Plus size={8} />
          </button>
        </div>
      )}
    </div>
  );
}
