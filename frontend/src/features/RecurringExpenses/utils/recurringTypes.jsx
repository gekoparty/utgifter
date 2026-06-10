export const RECURRING_TYPES = [
  { key: "MORTGAGE", label: "Lån", color: "primary" },
  { key: "UTILITY", label: "Strøm/kommunikasjon", color: "warning" },
  { key: "INSURANCE", label: "Forsikring", color: "success" },
  { key: "SUBSCRIPTION", label: "Abonnement", color: "info" },
];

export const normalizeRecurringType = (t) => {
  const up = String(t || "").toUpperCase();
  if (up === "HOUSING") return "MORTGAGE";
  return up;
};

export const TYPE_META_BY_KEY = RECURRING_TYPES.reduce((acc, t) => {
  acc[t.key] = { label: t.label, color: t.color };
  return acc;
}, {});
