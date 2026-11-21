import { toZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "../../utils/dateUtils.js";
export const DAY_BASIS = 365;

// Calendar days avoid UTC offsets and daylight-saving changes affecting interest.
export const paymentDay = (value) => {
  const date = toZonedTime(value, TIME_ZONE);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

export const isExtraPayment = (payment) =>
  payment.kind === "EXTRA" || payment.status === "EXTRA";

export const accrueMortgageInterest = ({ balance, rate, start, end, extraPayments = [] }) => {
  let principal = Math.max(0, Number(balance));
  let cursor = start;
  let interest = 0;
  let extraPrincipal = 0;
  const events = extraPayments
    .map((payment) => ({ day: paymentDay(payment.paidDate), amount: Number(payment.amount || 0) }))
    .filter(({ day }) => day >= start && day < end)
    .sort((a, b) => a.day - b.day);

  for (const event of events) {
    interest += principal * rate / 100 * ((event.day - cursor) / 86400000) / DAY_BASIS;
    const applied = Math.min(principal, event.amount);
    principal -= applied;
    extraPrincipal += applied;
    cursor = event.day;
  }
  interest += principal * rate / 100 * ((end - cursor) / 86400000) / DAY_BASIS;
  return { interest, extraPrincipal, balance: principal };
};
