export const currencyFormatter = (value) =>
  new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const compactNOK = (value) =>
  new Intl.NumberFormat("nb-NO", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value ?? 0);

export const pct = (value) =>
  Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "—";
