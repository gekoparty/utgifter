import dayjs from "dayjs";

export const DAY_BASIS = 365;

export const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

export const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";

export const yyyymmKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);
export const monthStartDate = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

export const periodKeyToMonthStart = (pk) => {
  const s = String(pk || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
};

// ⚠️ keep old UI dueDate behavior (clamp to 28)
export const clampDayInMonth = (y, mIndex0, dueDay) => {
  const day = Math.min(28, Math.max(1, Number(dueDay || 1)));
  return new Date(y, mIndex0, day);
};

// ✅ bank-style day count: actual day-of-month (respects month length)
export const dueDateForMonthKey = (monthKey, dueDay) => {
  const [y, m] = String(monthKey).split("-").map(Number);
  const base = dayjs(new Date(y, m - 1, 1));
  const last = base.daysInMonth();
  const day = Math.min(Math.max(1, Number(dueDay || 1)), last);
  return base.date(day);
};

export const daysBetweenDueDates = (monthKey, dueDay) => {
  const end = dueDateForMonthKey(monthKey, dueDay);
  const prevKey = end.subtract(1, "month").format("YYYY-MM");
  const start = dueDateForMonthKey(prevKey, dueDay);
  const days = end.diff(start, "day");
  return { start: start.toDate(), end: end.toDate(), days };
};

export const isMonthWithin = (monthDate, from, to) => {
  const m = monthStartDate(monthDate);
  const f = monthStartDate(new Date(from));
  const t = monthStartDate(new Date(to));
  return m >= f && m <= t;
};

export const getPauseForMonth = (expense, monthDate) => {
  const pauses = Array.isArray(expense.pausePeriods) ? expense.pausePeriods : [];
  return pauses.find((p) => p?.from && p?.to && isMonthWithin(monthDate, p.from, p.to)) || null;
};

export const buildRecurringTermsIndex = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const id = String(r.recurringExpenseId);
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(r);
  }
  for (const [id, arr] of map.entries()) {
    arr.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
    map.set(id, arr);
  }
  return map;
};

export const pickRecurringTermsForMonth = ({ expense, termsArr, monthStartDate }) => {
  const base = {
    amount: Number(expense.amount ?? 0),
    estimateMin: Number(expense.estimateMin ?? 0),
    estimateMax: Number(expense.estimateMax ?? 0),

    interestRate: Number(expense.interestRate ?? 0),
    hasMonthlyFee: Boolean(expense.hasMonthlyFee),
    monthlyFee: Number(expense.monthlyFee ?? 0),

    remainingBalance: Number(expense.remainingBalance ?? 0),

    mortgageHolder: expense.mortgageHolder || "",
    mortgageKind: expense.mortgageKind || "",
  };

  let chosen = null;
  for (const t of termsArr) {
    if (new Date(t.fromDate) <= monthStartDate) chosen = t;
    else break;
  }
  if (!chosen) return base;

  return {
    ...base,
    amount: Number(chosen.amount ?? base.amount),
    estimateMin: Number(chosen.estimateMin ?? base.estimateMin),
    estimateMax: Number(chosen.estimateMax ?? base.estimateMax),

    interestRate: Number(chosen.interestRate ?? base.interestRate),
    hasMonthlyFee: chosen.hasMonthlyFee ?? base.hasMonthlyFee,
    monthlyFee: Number(chosen.monthlyFee ?? base.monthlyFee),

    remainingBalance: Number(chosen.remainingBalance ?? base.remainingBalance),
  };
};

export const estimateMonthsLeft = ({ remainingBalance, amount, monthlyFee }) => {
  const payment = Number(amount || 0);
  const fee = Number(monthlyFee || 0);
  const remaining = Number(remainingBalance || 0);
  const effective = Math.max(0, payment - fee);
  if (remaining <= 0 || effective <= 0) return null;
  return Math.ceil(remaining / effective);
};

export const isDueInMonth = ({ interval, anchorMonthDate, bucketDate }) => {
  if (interval <= 1) return true;
  const monthsDiff =
    (bucketDate.getFullYear() - anchorMonthDate.getFullYear()) * 12 +
    (bucketDate.getMonth() - anchorMonthDate.getMonth());
  return monthsDiff >= 0 && monthsDiff % interval === 0;
};

