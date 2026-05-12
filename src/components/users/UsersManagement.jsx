import React, { useState } from "react";
import { FONT } from "../../theme/theme";
import { useUsers } from "../../hooks/useUsers";
import { useClubs } from "../../hooks/useClubs";
import { Shield, ShieldAlert, User, CheckCircle } from "lucide-react";

export function UsersManagement({ t }) {
  const { users, loading, updateUserRole, updateUserClubs } = useUsers();
  const { paises } = useClubs();
  const [editingUser, setEditingUser] = useState(null);

  const allClubs = paises.flatMap(p => p.equipos);

  if (loading) {
    return <div style={{ color: t.muted, textAlign: "center", padding: 40 }}>Cargando usuarios...</div>;
  }

  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
  };

  const toggleClubAssignment = async (userId, clubId, currentClubs) => {
    const updatedClubs = currentClubs.includes(clubId)
      ? currentClubs.filter(id => id !== clubId)
      : [...currentClubs, clubId];
    await updateUserClubs(userId, updatedClubs);
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={16} color={t.accent} />;
      case 'producer': return <ShieldAlert size={16} color={t.lions} />;
      case 'club_staff': return <User size={16} color={t.club} />;
      default: return <User size={16} color={t.muted} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: t.text, margin: "0 0 8px" }}>Gestión de Accesos</h2>
        <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Asigna roles y visibilidad de clubes a los miembros del equipo y clientes.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {users.map(u => (
          <div key={u.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              
              {/* Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: `${t.muted}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getRoleIcon(u.role)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: t.muted }}>{u.email}</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                
                {/* Role Select */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: t.muted, letterSpacing: 0.5 }}>ROL DEL SISTEMA</label>
                  <select 
                    value={u.role} 
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: FONT, fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="admin">Admin</option>
                    <option value="producer">Producer</option>
                    <option value="club_staff">Club Staff</option>
                    <option value="operator">Operator</option>
                    <option value="read_only">Invitado (Lectura)</option>
                  </select>
                </div>

                {/* Clubs Manage Button */}
                {(u.role === 'club_staff' || u.role === 'operator') && (
                  <button 
                    onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.border}`, background: editingUser === u.id ? `${t.accent}15` : t.bg, color: editingUser === u.id ? t.accent : t.text, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, alignSelf: "flex-end", height: 35 }}
                  >
                    {u.club_ids?.length || 0} Clubes Asignados
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Club Assignment Area */}
            {editingUser === u.id && (u.role === 'club_staff' || u.role === 'operator') && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${t.border}`, animation: "fadeIn 0.2s" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: t.muted, marginBottom: 12, letterSpacing: 0.5 }}>SELECCIONAR CLUBES PERMITIDOS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allClubs.map(club => {
                    const isAssigned = u.club_ids?.includes(club.id);
                    return (
                      <button 
                        key={club.id}
                        onClick={() => toggleClubAssignment(u.id, club.id, u.club_ids || [])}
                        style={{ 
                          padding: "6px 12px", borderRadius: 20, border: `1px solid ${isAssigned ? t.green : t.border}`, 
                          background: isAssigned ? `${t.green}15` : t.bg, color: isAssigned ? t.green : t.text, 
                          fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT 
                        }}
                      >
                        {isAssigned && <CheckCircle size={12} />} {club.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
