export const RECURRING_TYPES = [
  { key: "MORTGAGE", label: "Lån", color: "primary" },
  { key: "UTILITY", label: "Strøm/kommunikasjon", color: "warning" },
  { key: "INSURANCE", label: "Forsikring", color: "success" },
  { key: "SUBSCRIPTION", label: "Abonnement", color: "info" },
];

// Optional: map backend types -> canonical UI type
export const normalizeRecurringType = (t) => {
  const up = String(t || "").toUpperCase();
  if (up === "HOUSING") return "MORTGAGE"; // only place this mapping exists
  return up;
};

// Label/color lookup for rendering rows/items consistently
export const TYPE_META_BY_KEY = RECURRING_TYPES.reduce((acc, t) => {
  acc[t.key] = { label: t.label, color: t.color };
  return acc;
}, {});