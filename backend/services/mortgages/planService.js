import dayjs from "dayjs";
import { isExtraPayment } from "./paymentTimeline.js";
import {
  computeMortgageMonth,
  periodKeyToMonthStart,
  clampDayInMonth,
  round2,
  pickRecurringTermsForMonth,
} from "../recurring/scheduleService.js";

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

const sumExtra = (arr) =>
  round2(
    (arr || [])
      .filter((p) => String(p.status).toUpperCase() === "EXTRA")
      .reduce((s, p) => s + Number(p.amount || 0), 0)
  );

export const buildMortgagePlan = ({
  expense,
  termsArr,
  payments,
  from,
  months,
  scenario = {},
}) => {
  const dueDay = Number(expense.dueDay || 1);

  let balance = Number(expense.initialBalance || expense.remainingBalance || 0);

  const paymentsByPk = groupPaymentsByPeriodKey(payments);

  const schedule = [];
  let payoffPeriodKey = null;
  let payoffDate = null;

  let totalInterest = 0;
  let totalFees = 0;
  let totalPrincipal = 0;

  const firstKey = [expense.firstPaymentMonth, ...payments.map((payment) => payment.periodKey)]
    .filter((key) => periodKeyToMonthStart(key)).sort()[0] || from;
  const fromStart = periodKeyToMonthStart(firstKey);
  const replayMonths = dayjs(periodKeyToMonthStart(from)).diff(fromStart, "month");
  const extras = payments.filter(isExtraPayment);
  const rateOverrides = [...(scenario.rateOverrides || [])].sort((a, b) => String(a.from).localeCompare(String(b.from)));

  for (let i = 0; i < months + replayMonths; i++) {
    const pk = dayjs(fromStart).add(i, "month").format("YYYY-MM");
    const monthDate = periodKeyToMonthStart(pk);

    const terms = pickRecurringTermsForMonth({
      expense,
      termsArr,
      monthStartDate: monthDate,
    });

    const monthPays = paymentsByPk.get(pk) || [];
    const recurringExtra = scenario.recurringExtra?.from <= pk
      ? Number(scenario.recurringExtra.amount || 0) : 0;
    const oneTimeExtra = (scenario.oneTimeExtras || [])
      .filter((extra) => extra.periodKey === pk)
      .reduce((sum, extra) => sum + Number(extra.amount || 0), 0);
    const extraPrincipal = recurringExtra + oneTimeExtra;

    const main = pickMainPayment(monthPays);
    const beforeFirstPayment = expense.firstPaymentMonth && pk < expense.firstPaymentMonth;
    const skipped = monthPays.some((payment) => !isExtraPayment(payment) && payment.status === "SKIPPED");
    const paymentTotal = Number(main?.amount ?? (beforeFirstPayment || skipped ? 0 : terms.amount));
    const fee = terms.hasMonthlyFee && !beforeFirstPayment && !skipped ? Number(terms.monthlyFee || 0) : 0;
    const override = rateOverrides.filter((entry) => entry.from <= pk).at(-1);
    const rate = Number(override?.interestRate ?? terms.interestRate ?? 0);

    const { schedule: row, balanceEnd } = computeMortgageMonth({
      periodKey: pk,
      dueDay,
      balanceStart: balance,
      nominellRate: rate,
      paymentTotal,
      fee,
      extraPrincipal,
      extraPayments: extras,
    });

    balance = balanceEnd;
    if (pk < from) continue;

    schedule.push({
      periodKey: pk,
      dueDate: clampDayInMonth(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        dueDay
      ),
      schedule: row,
      scenarioApplied: { rate, recurringExtra, oneTimeExtra, extraActual: sumExtra(monthPays) },
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
        extraSum: sumExtra(monthPays),
        extraCount: monthPays.filter(
          (p) => String(p.status).toUpperCase() === "EXTRA"
        ).length,
      },
    });

    totalInterest = round2(totalInterest + row.interest);
    totalFees = round2(totalFees + row.fee);
    totalPrincipal = round2(totalPrincipal + (row.balanceStart - row.balanceEnd));

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
