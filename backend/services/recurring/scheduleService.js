import dayjs from "dayjs";

export const DAY_BASIS = 365;

export const round2 = (n) =>
  Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

export const isMortgageType = (type) => type === "MORTGAGE" || type === "HOUSING";

export const yyyymmKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const monthStart = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const periodKeyToMonthStart = (periodKey) => {
  const value = String(periodKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(value)) return null;

  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return null;

  return new Date(year, month - 1, 1);
};

export const clampDayInMonth = (year, monthIndex, dueDay) => {
  const base = dayjs(new Date(year, monthIndex, 1));
  const lastDay = base.daysInMonth();
  const day = Math.min(lastDay, Math.max(1, Number(dueDay || 1)));
  return base.date(day).toDate();
};

export const dueDateForMonthKey = (monthKey, dueDay) => {
  const monthStartDate = periodKeyToMonthStart(monthKey);
  if (!monthStartDate) return null;

  const base = dayjs(monthStartDate);
  const lastDay = base.daysInMonth();
  const day = Math.min(lastDay, Math.max(1, Number(dueDay || 1)));
  return base.date(day);
};

export const daysBetweenDueDates = (monthKey, dueDay) => {
  const end = dueDateForMonthKey(monthKey, dueDay);
  if (!end) return { start: null, end: null, days: 0 };

  const previousKey = end.subtract(1, "month").format("YYYY-MM");
  const start = dueDateForMonthKey(previousKey, dueDay);
  const days = start ? end.diff(start, "day") : 0;

  return {
    start: start?.toDate() ?? null,
    end: end.toDate(),
    days,
  };
};

export const isMonthWithin = (monthDate, from, to) => {
  const month = monthStart(new Date(monthDate));
  const fromMonth = monthStart(new Date(from));
  const toMonth = monthStart(new Date(to));
  return month >= fromMonth && month <= toMonth;
};

export const getPauseForMonth = (expense, monthDate) => {
  const pauses = Array.isArray(expense.pausePeriods) ? expense.pausePeriods : [];
  return pauses.find((pause) =>
    pause?.from && pause?.to && isMonthWithin(monthDate, pause.from, pause.to)
  ) || null;
};

export const buildRecurringTermsIndex = (rows) => {
  const map = new Map();

  for (const row of rows) {
    const id = String(row.recurringExpenseId);
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }

  for (const [id, arr] of map.entries()) {
    arr.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
    map.set(id, arr);
  }

  return map;
};

export const pickRecurringTermsForMonth = ({
  expense,
  termsArr,
  monthStartDate,
}) => {
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
  for (const terms of termsArr || []) {
    if (new Date(terms.fromDate) <= monthStartDate) chosen = terms;
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
  const effectivePayment = Math.max(0, payment - fee);

  if (remaining <= 0 || effectivePayment <= 0) return null;
  return Math.ceil(remaining / effectivePayment);
};

export const isDueInMonth = ({ interval, anchorMonthDate, bucketDate }) => {
  if (interval <= 1) return true;

  const monthsDiff =
    (bucketDate.getFullYear() - anchorMonthDate.getFullYear()) * 12 +
    (bucketDate.getMonth() - anchorMonthDate.getMonth());

  return monthsDiff >= 0 && monthsDiff % interval === 0;
};

export const computeMortgageMonth = ({
  periodKey,
  dueDay,
  balanceStart,
  nominellRate,
  paymentTotal,
  fee,
  extraPrincipal,
}) => {
  const { start: periodStart, end: periodEnd, days } = daysBetweenDueDates(
    periodKey,
    dueDay,
  );

  const balance = Number(balanceStart || 0);
  const rate = Number(nominellRate || 0);
  const payment = Number(paymentTotal || 0);
  const monthlyFee = Number(fee || 0);
  const extra = Number(extraPrincipal || 0);

  const interest = round2(balance * (rate / 100) * (days / DAY_BASIS));
  const principalBase = payment - monthlyFee - interest;
  const principal = round2(Math.max(0, principalBase) + extra);
  const balanceEnd = round2(Math.max(0, balance - principal));

  return {
    schedule: {
      periodStart,
      periodEnd,
      days,
      dayBasis: DAY_BASIS,
      nominellRate: rate,
      paymentTotal: round2(payment),
      fee: round2(monthlyFee),
      interest,
      principal,
      extraPrincipal: round2(extra),
      balanceStart: round2(balance),
      balanceEnd,
    },
    balanceEnd,
  };
};
