export function fmt(n) {
  if (n === undefined || n === null) return "0";
  return n % 1 === 0 ? `${n}` : `${parseFloat(n.toFixed(1))}`;
}

export function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
  } catch { return dateStr; }
}
