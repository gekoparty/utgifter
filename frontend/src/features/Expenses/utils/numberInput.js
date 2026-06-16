export const normalizeDecimal = (value) =>
  String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");

export const parseDecimalOrNull = (value) => {
  const normalized = normalizeDecimal(value);
  if (normalized === "") return null;
  if (normalized === "." || normalized === "-" || normalized === "-.") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatDecimalForInput = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "";
  return String(value);
};

export const roundMoney = (value) => Number(value.toFixed(2));
