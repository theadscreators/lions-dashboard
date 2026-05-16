import { fmt } from "./formatters";

export function calcStats(clientes) {
export function calcStats(clientes) {
  const totalLions = clientes.filter(c => c.category === "LIONS").reduce((s, c) => s + (c.minutes || 0), 0);
  const totalClub = clientes.filter(c => c.category === "CLUB").reduce((s, c) => s + (c.minutes || 0), 0);
  const totalOtros = clientes.filter(c => c.category === "OTROS").reduce((s, c) => s + (c.minutes || 0), 0);
  const totalBonificados = clientes.reduce((s, c) => s + Math.max(0, c.bonified || 0), 0);
  const totalReal = totalLions + totalClub + totalOtros;
  const disponibles = Math.max(0, 90 - totalReal);
  return { totalLions, totalClub, totalOtros, totalBonificados, totalReal, disponibles };
}

export function getStatus(equipo) {
  if (equipo.estado === "futuro") return "futuro";
  if (equipo.estado === "vallasfijas") return "vallas";
  if (equipo.estado === "pendiente") return "pendiente";
  const { totalReal } = calcStats(equipo.clientes);
  if (totalReal > 90) return "over";
  if (totalReal >= 90) return "full";
  if (totalReal >= 75) return "almost";
  return "available";
}

export function statusColor(status, t) {
  return { futuro: t.muted, vallas: t.club, pendiente: t.muted, over: t.gray, full: t.amber, almost: t.amber, available: t.green }[status] || t.muted;
}

export function statusLabel(status, disponibles) {
  return { futuro: "Futuro cliente", vallas: "Vallas fijas", pendiente: "Pendiente", over: "Sobrevendido", full: "Completo", almost: `${fmt(disponibles)}' disponibles`, available: `${fmt(disponibles)}' disponibles` }[status] || "";
}
