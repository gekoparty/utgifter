import dayjs from "dayjs";
import {
  computeMortgageMonth,
  periodKeyToMonthStart,
  clampDayInMonth,
  round2,
} from "./scheduleMath.js";

const pickTermsForMonth = ({ expense, termsArr, monthDate }) => {
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

const sumExtraActual = (arr) =>
  round2(
    (arr || [])
      .filter((p) => String(p.status).toUpperCase() === "EXTRA")
      .reduce((s, p) => s + Number(p.amount || 0), 0)
  );

const pickOverrideRate = (rateOverrides, periodKey, fallback) => {
  if (!Array.isArray(rateOverrides) || rateOverrides.length === 0) return fallback;
  const sorted = [...rateOverrides].sort((a, b) => String(a.from).localeCompare(String(b.from)));
  let chosen = null;
  for (const r of sorted) {
    if (String(r.from) <= periodKey) chosen = r;
    else break;
  }
  return chosen?.interestRate != null ? Number(chosen.interestRate) : fallback;
};

const getOneTimeExtra = (oneTimeExtras, periodKey) => {
  if (!Array.isArray(oneTimeExtras)) return 0;
  const hit = oneTimeExtras.find((x) => String(x.periodKey) === String(periodKey));
  return hit ? Number(hit.amount || 0) : 0;
};

export const simulateMortgagePlan = ({
  expense,
  termsArr,
  payments, // include actual payments (optional, but useful)
  from,
  months,
  scenario,
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

  const recurringExtraAmt = Number(scenario?.recurringExtra?.amount || 0);
  const recurringExtraFrom = String(scenario?.recurringExtra?.from || "");

  const rateOverrides = scenario?.rateOverrides || [];
  const oneTimeExtras = scenario?.oneTimeExtras || [];

  const fromStart = periodKeyToMonthStart(from);

  for (let i = 0; i < months; i++) {
    const pk = dayjs(fromStart).add(i, "month").format("YYYY-MM");
    const monthDate = periodKeyToMonthStart(pk);

    const baseTerms = pickTermsForMonth({ expense, termsArr, monthDate });

    const rate = pickOverrideRate(rateOverrides, pk, baseTerms.interestRate);
    const fee = Number(baseTerms.monthlyFee || 0);

    const monthPays = paymentsByPk.get(pk) || [];
    const extraActual = sumExtraActual(monthPays);

    const main = pickMainPayment(monthPays);
    const paymentTotal = Number(main?.amount ?? baseTerms.amount);

    const recurringExtra =
      recurringExtraAmt > 0 && /^\d{4}-\d{2}$/.test(recurringExtraFrom) && recurringExtraFrom <= pk
        ? recurringExtraAmt
        : 0;

    const oneTimeExtra = getOneTimeExtra(oneTimeExtras, pk);

    const extraPrincipal = round2(extraActual + recurringExtra + oneTimeExtra);

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
      scenarioApplied: { rate, recurringExtra, oneTimeExtra, extraActual },
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
