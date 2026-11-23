export const remainingBillsTotal = (items) => items.reduce((sum, item) => {
  if (["PAID", "SKIPPED", "PAUSED"].includes(item.status)) return sum;
  return sum + Math.max(0, Number(item.expected?.max ?? 0) - Number(item.actual?.amount ?? 0));
}, 0);
export const isOpenBill = (item) => ["UNPAID", "PARTIAL"].includes(item.status);

export const billStatus = (item, now = new Date()) => {
  if (!isOpenBill(item)) return item.status;
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit",
  });
  const dayKey = (value) => {
    const parts = format.formatToParts(new Date(value));
    return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type).value).join("-");
  };
  return item.dueDate && dayKey(item.dueDate) < dayKey(now) ? "OVERDUE" : item.status;
};
