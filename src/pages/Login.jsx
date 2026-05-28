import React, { useState } from "react";
import { FONT } from "../theme/theme";
import { LionsSVG } from "../components/ui/LionsSVG";

export function Login({ onLogin, t, dark, loading: authLoading }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    if (!email || !pw) {
      setErr("Ingresá email y contraseña");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      await onLogin(email, pw);
    } catch (e) {
      const msg = e.message || "Error al iniciar sesión";
      // Friendly messages
      if (msg.includes("Invalid login")) setErr("Email o contraseña incorrectos");
      else if (msg.includes("Email not confirmed")) setErr("Confirmá tu email primero");
      else setErr(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <LionsSVG height={36} dark={dark} />
          </div>
          <div style={{ color: t.muted, fontSize: 13, fontWeight: 600 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "48px 40px", width: 340, textAlign: "center", boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <LionsSVG height={36} dark={dark} />
        </div>
        <div style={{ fontSize: 10, color: t.muted, marginBottom: 36, fontWeight: 600, letterSpacing: 4 }}>DASHBOARD · 2026</div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && document.getElementById("pw-input")?.focus()}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${err ? t.accent : t.border}`, background: t.bg, color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: FONT, marginBottom: 10 }}
        />

        <input
          id="pw-input"
          type="password"
          placeholder="Contraseña"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && handle()}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${err ? t.accent : t.border}`, background: t.bg, color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: FONT, animation: shake ? "shake 0.4s" : "none" }}
        />

        {err && <div style={{ color: t.accent, fontSize: 11, marginTop: 8, fontWeight: 600 }}>{err}</div>}

        <button
          onClick={handle}
          disabled={submitting}
          style={{ marginTop: 14, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: submitting ? t.muted : t.accent, color: "#fff", fontSize: 14, fontWeight: 800, cursor: submitting ? "default" : "pointer", fontFamily: FONT, letterSpacing: 1, transition: "all 0.2s" }}
        >
          {submitting ? "INGRESANDO..." : "INGRESAR"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 9, color: t.muted, fontWeight: 600, letterSpacing: 1 }}>O</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        <button
          onClick={() => { window.location.href = (import.meta.env.BASE_URL || '/') + 'agenda'; }}
          style={{ marginTop: 4, width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5, transition: "all 0.2s" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.muted; }}
        >
          📅 VER AGENDA
        </button>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}
