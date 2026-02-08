export const monthLabel = (d) =>
  new Date(d).toLocaleDateString("nb-NO", { month: "short", year: "numeric" });

export const dueShortLabel = (d) =>
  new Date(d).toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });

export const makeCurrencyFormatter = () =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" });

export const formatMonthsLeft = (monthsLeft) => {
  const years = Math.floor(monthsLeft / 12);
  const rem = monthsLeft % 12;
  if (years <= 0) return `${monthsLeft} mnd`;
  if (rem === 0) return `${years} år`;
  return `${years} år ${rem} mnd`;
};