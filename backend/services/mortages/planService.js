import dayjs from "dayjs";
import {
  computeMortgageMonth,
  periodKeyToMonthStart,
  clampDayInMonth,
  round2,
} from "./scheduleMath.js";

const pickTermsForMonth = ({ expense, termsArr, monthDate }) => {
  // termsArr must be sorted by fromDate ASC
  let chosen = null;
  for (const t of termsArr) {
    if (new Date(t.fromDate) <= monthDate) chosen = t;
    else break;
  }

  const base = {
    amount: Number(expense.amount ?? 0),
    monthlyFee: Number(expense.monthlyFee ?? 0),
    interestRate: Number(expense.interestRate ?? 0),
  };

  if (!chosen) return base;

  return {
    amount: Number(chosen.amount ?? base.amount),
    monthlyFee: Number(chosen.monthlyFee ?? base.monthlyFee),
    interestRate: Number(chosen.interestRate ?? base.interestRate),
  };
};

const groupPaymentsByPeriodKey = (payments) => {
  const map = new Map();
  for (const p of payments || []) {
    const pk = String(p.periodKey);
    if (!map.has(pk)) map.set(pk, []);
    map.get(pk).push(p);
  }
  return map;
};

const pickMainPayment = (arr) => {
  // "main" = latest non-EXTRA, non-SKIPPED payment
  const main =
    (arr || [])
      .filter(
        (p) =>
          String(p.status).toUpperCase() !== "EXTRA" &&
          String(p.status).toUpperCase() !== "SKIPPED"
      )
      .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0] || null;
  return main;
};

const sumExtra = (arr) =>
  round2(
    (arr || [])
      .filter((p) => String(p.status).toUpperCase() === "EXTRA")
      .reduce((s, p) => s + Number(p.amount || 0), 0)
  );

export const buildMortgagePlan = ({
  expense,
  termsArr,
  payments, // raw payments list for this mortgage within range
  from,
  months,
}) => {
  const dueDay = Number(expense.dueDay || 1);
  let balance = Number(expense.remainingBalance || expense.initialBalance || 0);

  const paymentsByPk = groupPaymentsByPeriodKey(payments);

  const schedule = [];
  let payoffPeriodKey = null;
  let payoffDate = null;

  let totalInterest = 0;
  let totalFees = 0;
  let totalPrincipal = 0;

  const fromStart = periodKeyToMonthStart(from);

  for (let i = 0; i < months; i++) {
    const pk = dayjs(fromStart).add(i, "month").format("YYYY-MM");
    const monthDate = periodKeyToMonthStart(pk);

    const terms = pickTermsForMonth({ expense, termsArr, monthDate });

    const monthPays = paymentsByPk.get(pk) || [];
    const extraPrincipal = sumExtra(monthPays);

    const main = pickMainPayment(monthPays);
    const paymentTotal = Number(main?.amount ?? terms.amount);
    const fee = Number(terms.monthlyFee || 0);
    const rate = Number(terms.interestRate || 0);

    const { schedule: row, balanceEnd } = computeMortgageMonth({
      periodKey: pk,
      dueDay,
      balanceStart: balance,
      nominellRate: rate,
      paymentTotal,
      fee,
      extraPrincipal,
    });

    schedule.push({
      periodKey: pk,
      dueDate: clampDayInMonth(monthDate.getFullYear(), monthDate.getMonth(), dueDay),
      schedule: row,
      payments: {
        main: main
          ? {
              paymentId: String(main._id),
              amount: Number(main.amount || 0),
              paidDate: main.paidDate,
              status: main.status,
              note: main.note || "",
            }
          : null,
        extraSum: extraPrincipal,
        extraCount: monthPays.filter((p) => String(p.status).toUpperCase() === "EXTRA").length,
      },
    });

    totalInterest = round2(totalInterest + row.interest);
    totalFees = round2(totalFees + row.fee);
    totalPrincipal = round2(totalPrincipal + (row.balanceStart - row.balanceEnd));

    balance = balanceEnd;

    if (!payoffPeriodKey && balanceEnd <= 0) {
      payoffPeriodKey = pk;
      payoffDate = row.periodEnd;
      break;
    }
  }

  const monthsToPayoff = payoffPeriodKey
    ? schedule.findIndex((x) => x.periodKey === payoffPeriodKey) + 1
    : null;

  return {
    from,
    monthsRequested: months,
    payoffPeriodKey,
    payoffDate,
    monthsToPayoff,
    totals: { totalInterest, totalFees, totalPrincipal },
    schedule,
  };
};
