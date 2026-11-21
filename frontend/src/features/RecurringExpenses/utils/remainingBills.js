export const remainingBillsTotal = (items) => items.reduce((sum, item) => {
  if (["PAID", "SKIPPED", "PAUSED"].includes(item.status)) return sum;
  return sum + Math.max(0, Number(item.expected?.max ?? 0) - Number(item.actual?.amount ?? 0));
}, 0);
