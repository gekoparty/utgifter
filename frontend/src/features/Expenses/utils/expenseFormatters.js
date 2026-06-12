export const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
});

export const formatExpenseDate = (value, displayValue) => {
  if (displayValue) return displayValue;
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("nb-NO");
};

export const formatBool = (value) => (value ? "Ja" : "Nei");
