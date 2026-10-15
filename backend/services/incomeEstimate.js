import Income from "../models/incomeSchema.js";

export const trimmedMonthlyAverage = (totals) => {
  const sorted = totals.filter(Number.isFinite).sort((a, b) => a - b);
  const used = sorted.length >= 6 ? sorted.slice(1, -1) : sorted;
  return {
    amount: used.length ? Math.round(used.reduce((sum, value) => sum + value, 0) / used.length * 100) / 100 : null,
    months: sorted.length,
    excluded: sorted.length >= 6 ? 2 : 0,
  };
};

export const getIncomeEstimate = async (user) => {
  const end = new Date();
  const period = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit" }).formatToParts(end);
  const year = Number(period.find((part) => part.type === "year").value);
  const month = Number(period.find((part) => part.type === "month").value);
  const lookback = user.incomeEstimateMonths === 6 ? 6 : 12;
  const startKey = new Date(Date.UTC(year, month - 1 - lookback, 1)).toISOString().slice(0, 7);
  const endKey = `${year}-${String(month).padStart(2, "0")}`;
  const rows = await Income.aggregate([
    { $match: { ownerUserId: user._id, incomeDate: { $gte: new Date(new Date(`${startKey}-01T00:00:00Z`).getTime() - 86400000), $lt: new Date(Date.UTC(year, month - 1, 2)) } } },
    { $group: { _id: { $dateToString: { date: "$incomeDate", format: "%Y-%m", timezone: "Europe/Oslo" } }, total: { $sum: "$amount" } } },
    { $match: { _id: { $gte: startKey, $lt: endKey } } },
  ]);
  const estimate = trimmedMonthlyAverage(rows.map((row) => row.total));
  const preset = Number(user.expectedMonthlyIncome || 0);
  return {
    ...estimate,
    lookback,
    preset,
    mode: user.incomeEstimateMode || "manual",
    effective: user.incomeEstimateMode === "history" && estimate.months >= 6 ? estimate.amount : preset,
  };
};
