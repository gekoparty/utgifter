export const currencyFormatter = (value) =>
  new Intl.NumberFormat("no-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const compactNOK = (value) =>
  new Intl.NumberFormat("no-NO", { notation: "compact", compactDisplay: "short" }).format(value ?? 0);

export const pct = (n) => (Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(1)}%` : "—");
