export const formatCurrency = (val) =>
  new Intl.NumberFormat("no-NO", { style: "currency", currency: "NOK" }).format(val);

export const fmt1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "—");
export const fmtPct = (n) => (Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(1)}%` : "—");

export const changeChipColor = (pct) => {
  if (!Number.isFinite(pct)) return "default";
  return pct >= 0 ? "warning" : "success";
};