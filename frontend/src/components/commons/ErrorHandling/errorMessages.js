const RESOURCE_LABELS = {
  brands: "merker",
  categories: "kategorier",
  shops: "butikker",
  locations: "steder",
  products: "produkter",
  expenses: "utgifter",
  "recurring-expenses": "faste kostnader",
  "recurring-payments": "betalinger",
  mortgages: "boliglån",
  global: "appen",
  server: "serveren",
};

const RESOURCE_MESSAGES = {
  brands: { duplicate: "Dette merket finnes allerede." },
  categories: { duplicate: "Denne kategorien finnes allerede." },
  shops: { duplicate: "Denne butikken finnes allerede." },
  locations: { duplicate: "Dette stedet finnes allerede." },
  products: { duplicate: "Dette produktet finnes allerede." },
};

const DEFAULT_ERROR_MESSAGE = "Noe gikk galt. Prøv igjen.";

const getNestedMessage = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const text = value.trim();
    return text === "[object Object]" ? "" : value;
  }
  if (value instanceof Error) return value.message;
  if (typeof value !== "object") return String(value);

  return (
    getNestedMessage(value.friendlyMessage) ||
    getNestedMessage(value.message) ||
    getNestedMessage(value.error) ||
    getNestedMessage(value.data?.message) ||
    getNestedMessage(value.data?.error) ||
    getNestedMessage(value.response?.data?.message) ||
    getNestedMessage(value.response?.data?.error) ||
    getNestedMessage(value.response?.statusText)
  );
};

const isTechnicalMessage = (message) => {
  const text = String(message || "").trim();
  if (!text) return true;

  return (
    /^network response was not ok$/i.test(text) ||
    /^internal server error$/i.test(text) ||
    /^\[object Object\]$/i.test(text) ||
    /^request failed with status code/i.test(text) ||
    /^failed to fetch/i.test(text) ||
    /^could not /i.test(text) ||
    /^server error/i.test(text)
  );
};

export const getResourceLabel = (resource) =>
  RESOURCE_LABELS[resource] || RESOURCE_LABELS.server;

export const getFriendlyErrorMessage = (error, resource = "server") => {
  const rawMessage = getNestedMessage(error);
  const key = String(rawMessage || "").trim();
  const mapped = RESOURCE_MESSAGES[resource]?.[key];

  if (mapped) return mapped;
  if (key && !isTechnicalMessage(key)) return key;

  return resource === "global"
    ? DEFAULT_ERROR_MESSAGE
    : `Kunne ikke hente eller lagre ${getResourceLabel(resource)}. Prøv igjen.`;
};

export const getValidationMessage = (validationError) =>
  getNestedMessage(validationError) || "";
