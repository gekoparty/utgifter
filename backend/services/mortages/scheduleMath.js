import dayjs from "dayjs";

export const DAY_BASIS = 365;

export const round2 = (n) =>
  Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

export const periodKeyToMonthStart = (pk) => {
  const s = String(pk || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
};

// ⚠️ Keep UI dueDate clamp-to-28 behavior (same as recurring summary)
export const clampDayInMonth = (y, mIndex0, dueDay) => {
  const day = Math.min(28, Math.max(1, Number(dueDay || 1)));
  return new Date(y, mIndex0, day);
};

// ✅ bank-style due date for day-count interest: real last day in month
const dueDateForMonthKey = (monthKey, dueDay) => {
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
    dueDay
  );

  const bal = Number(balanceStart || 0);
  const rate = Number(nominellRate || 0);
  const pay = Number(paymentTotal || 0);
  const f = Number(fee || 0);
  const extra = Number(extraPrincipal || 0);

  const interest = round2(bal * (rate / 100) * (days / DAY_BASIS));
  const principalBase = pay - f - interest;
  const principal = round2(Math.max(0, principalBase) + extra);
  const balanceEnd = round2(Math.max(0, bal - principal));

  return {
    schedule: {
      periodStart,
      periodEnd,
      days,
      dayBasis: DAY_BASIS,

      nominellRate: rate,
      paymentTotal: round2(pay),
      fee: round2(f),
      interest,
      principal,
      extraPrincipal: round2(extra),

      balanceStart: round2(bal),
      balanceEnd,
    },
    balanceEnd,
  };
};
