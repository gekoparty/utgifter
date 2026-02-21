import express from "express";
import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

import {
  DAY_BASIS,
  round2,
  isMortgageType,
  yyyymmKey,
  monthStart,
  addMonths,
  clampDayInMonth,
  daysBetweenDueDates,
  getPauseForMonth,
  buildRecurringTermsIndex,
  pickRecurringTermsForMonth,
  estimateMonthsLeft,
  isDueInMonth,
} from "./_shared.js";

const router = express.Router();

/* =========================
   buildSummary (with mortgage schedule)
========================= */

const buildSummary = ({
  expenses,
  paymentsInRange,
  recurringTermsIndex = new Map(),
  filter = "ALL",
  months = 12,
  timelineStart,
  realNow,
}) => {
  const filteredExpenses =
    filter === "ALL"
      ? expenses
      : expenses.filter(
          (e) => e.type === filter || (filter === "MORTGAGE" && e.type === "HOUSING")
        );

  const start = monthStart(timelineStart);
  const today = new Date(realNow);

  // ✅ Payments indexing (MAIN + EXTRA)
  const paymentIndex = new Map(); // MAIN
  const extraIndex = new Map(); // sum of EXTRA
  const extraPaymentIndex = new Map(); // last EXTRA for UI display

  for (const p of paymentsInRange) {
    const expId = String(p.recurringExpenseId);
    const pk = String(p.periodKey);
    const kind = String(p.kind || "").toUpperCase();

    const key = `${expId}|${pk}`;

    const isExtra =
      kind === "EXTRA" ||
      String(p.status || "").toUpperCase() === "EXTRA" ||
      String(p.note || "").toLowerCase().includes("extra");

    if (isExtra) {
      extraIndex.set(key, round2((extraIndex.get(key) || 0) + Number(p.amount || 0)));
      // keep last extra for display
      extraPaymentIndex.set(key, p);
    } else {
      paymentIndex.set(key, p); // last write wins
    }
  }

  // ✅ Month buckets
  const monthBuckets = Array.from({ length: months }, (_, i) => {
    const d = addMonths(start, i);
    return {
      key: yyyymmKey(d),
      date: d,
      items: [],
      itemsCount: 0,
      expectedFixedTotal: 0,
      expectedMin: 0,
      expectedMax: 0,
      paidTotal: 0,
    };
  });

  // ✅ Running mortgage balance per expenseId through the timeline
  const mortgageBalanceById = new Map();

  for (const e of filteredExpenses) {
    const startDate = e.startDate ? new Date(e.startDate) : null;
    const endDate = e.endDate ? new Date(e.endDate) : null;

    const interval = Math.max(1, Number(e.billingIntervalMonths || 1));
    const startMonth = Math.min(12, Math.max(1, Number(e.startMonth || 1)));
    const dueDay = Number(e.dueDay || 1);

    const startMonthDateBound = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      : null;
    const endMonthDateBound = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      : null;

    const anchorMonthDate = startMonthDateBound
      ? startMonthDateBound
      : new Date(start.getFullYear(), startMonth - 1, 1);

    for (const b of monthBuckets) {
      if (startMonthDateBound && b.date < startMonthDateBound) continue;
      if (endMonthDateBound && b.date > endMonthDateBound) continue;

      const dueThisMonth = isDueInMonth({
        interval,
        anchorMonthDate,
        bucketDate: b.date,
      });
      if (!dueThisMonth) continue;

      const pause = getPauseForMonth(e, b.date);
      const paused = Boolean(pause);

      const periodKey = b.key;
      const dueDate = clampDayInMonth(
        b.date.getFullYear(),
        b.date.getMonth(),
        dueDay
      );

      const mainPay = paymentIndex.get(`${String(e._id)}|${periodKey}`) || null;
      const extraPay = extraPaymentIndex.get(`${String(e._id)}|${periodKey}`) || null;

      let expectedFixed = 0;
      let expectedMin = 0;
      let expectedMax = 0;
      let estimateSource = paused ? "PAUSED" : "TERMS_HISTORY";

      let terms = null;
      if (!paused) {
        const termsArr = recurringTermsIndex.get(String(e._id)) || [];
        terms = pickRecurringTermsForMonth({
          expense: e,
          termsArr,
          monthStartDate: b.date,
        });

        expectedFixed = Number(terms.amount ?? 0);
        expectedMin = Number(terms.estimateMin ?? 0);
        expectedMax = Number(terms.estimateMax ?? 0);

        if (expectedMin === 0 && expectedMax === 0) {
          expectedMin = expectedFixed;
          expectedMax = expectedFixed;
        }

        b.expectedFixedTotal += expectedFixed;
        b.expectedMin += expectedMin;
        b.expectedMax += expectedMax;

        if (mainPay && mainPay.status !== "SKIPPED") {
          b.paidTotal += Number(mainPay.amount || 0);
        }
      }

      let status;
      if (paused) status = "PAUSED";
      else status = !mainPay ? "UNPAID" : mainPay.status === "SKIPPED" ? "SKIPPED" : "PAID";

      // ✅ Mortgage schedule (extraIndex affects principal)
      let mortgageMeta = null;

      if (isMortgageType(e.type) && terms && !paused) {
        const expId = String(e._id);

        let balanceStart = mortgageBalanceById.get(expId);
        if (balanceStart == null) {
          balanceStart = Number(
            e.remainingBalance || e.initialBalance || terms.remainingBalance || 0
          );
        }

        const { start: pStart, end: pEnd, days } = daysBetweenDueDates(periodKey, dueDay);

        const nominell = Number(terms.interestRate || 0);
        const fee = round2(Number(terms.monthlyFee || 0));
        const paymentTotal = round2(Number(terms.amount || 0));

        const interest = round2(balanceStart * (nominell / 100) * (days / DAY_BASIS));
        const extraPrincipal = round2(extraIndex.get(`${expId}|${periodKey}`) || 0);

        const principalBase = paymentTotal - fee - interest;
        const principal = round2(Math.max(0, principalBase) + extraPrincipal);

        const balanceEnd = round2(Math.max(0, balanceStart - principal));

        const mortgageSchedule = {
          periodStart: pStart,
          periodEnd: pEnd,
          days,
          dayBasis: DAY_BASIS,
          nominellRate: nominell,
          paymentTotal,
          fee,
          interest,
          principal,
          extraPrincipal,
          balanceStart: round2(balanceStart),
          balanceEnd,
        };

        mortgageMeta = {
          mortgageHolder: terms.mortgageHolder,
          mortgageKind: terms.mortgageKind,
          interestRate: terms.interestRate,
          monthlyFee: terms.monthlyFee,
          remainingBalance: terms.remainingBalance,
          schedule: mortgageSchedule,
        };

        mortgageBalanceById.set(expId, balanceEnd);
      }

      b.items.push({
        recurringExpenseId: String(e._id),
        title: e.title,
        type: e.type,
        dueDate,
        periodKey,

        expected: {
          fixed: expectedFixed,
          min: expectedMin,
          max: expectedMax,
          source: estimateSource,
        },

        mortgage: mortgageMeta,

        // ✅ MAIN payment
        actual: mainPay
          ? {
              paymentId: String(mainPay._id),
              amount: Number(mainPay.amount || 0),
              paidDate: mainPay.paidDate,
              status: mainPay.status,
              note: mainPay.note || "",
              kind: String(mainPay.kind || "MAIN"),
            }
          : null,

        // ✅ EXTRA payment (single record for UI; schedule uses sum)
        extraPayment: extraPay
          ? {
              paymentId: String(extraPay._id),
              amount: Number(extraPay.amount || 0),
              paidDate: extraPay.paidDate,
              status: extraPay.status,
              note: extraPay.note || "",
              kind: String(extraPay.kind || "EXTRA"),
            }
          : null,

        status,

        paused,
        pauseId: pause?._id ? String(pause._id) : null,
        pauseNote: pause?.note || "",
      });

      b.itemsCount += 1;
    }
  }

  // next bills horizon
  const horizonDays = 45;
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + horizonDays);

  const upcoming = [];
  for (const b of monthBuckets) {
    for (const it of b.items) {
      if (it.status === "PAUSED") continue;

      const due = new Date(it.dueDate);
      if (due >= today && due <= horizon) {
        upcoming.push({
          recurringExpenseId: it.recurringExpenseId,
          title: it.title,
          type: it.type,
          dueDate: it.dueDate,
          expectedMax: it.expected?.max ?? 0,
          status: it.status,
        });
      }
    }
  }
  upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextBills = upcoming.slice(0, 10);

  const expensesWithDerived = filteredExpenses.map((e) => {
    const isMortgage = isMortgageType(e.type);
    const amount = Number(e.amount || 0);
    const monthlyFee = Number(e.monthlyFee || 0);
    const remainingBalance = Number(e.remainingBalance || 0);
    const rate = Number(e.interestRate || 0);

    const monthsLeft = isMortgage
      ? estimateMonthsLeft({ remainingBalance, amount, monthlyFee })
      : null;

    const estInterest =
      isMortgage && remainingBalance > 0 && rate >= 0
        ? (remainingBalance * (rate / 100)) / 12
        : null;

    const estPrincipal =
      estInterest != null
        ? Math.max(0, amount - estInterest - Number(monthlyFee || 0))
        : null;

    return { ...e, derived: { monthsLeft, estInterest, estPrincipal } };
  });

  const m0 = monthBuckets[0];
  const m1 = monthBuckets[1];
  const m2 = monthBuckets[2];

  const sum3 = {
    min: (m0?.expectedMin ?? 0) + (m1?.expectedMin ?? 0) + (m2?.expectedMin ?? 0),
    max: (m0?.expectedMax ?? 0) + (m1?.expectedMax ?? 0) + (m2?.expectedMax ?? 0),
    paid: (m0?.paidTotal ?? 0) + (m1?.paidTotal ?? 0) + (m2?.paidTotal ?? 0),
  };

  const forecast = monthBuckets.map((b) => ({
    key: b.key,
    date: b.date,
    itemsCount: b.itemsCount,
    expectedFixedTotal: b.expectedFixedTotal,
    expectedMin: b.expectedMin,
    expectedMax: b.expectedMax,
    paidTotal: b.paidTotal,
    items: b.items,
  }));

  return { expenses: expensesWithDerived, forecast, nextBills, meta: { filter, months, sum3 } };
};

/* =========================
   SUMMARY route
========================= */

router.get("/summary", async (req, res) => {
  try {
    const filter = String(req.query.filter || "ALL").toUpperCase();

    const toInt = (v, fallback) => {
      const n = parseInt(String(v ?? ""), 10);
      return Number.isFinite(n) ? n : fallback;
    };

    const monthsForward = Math.min(24, Math.max(3, toInt(req.query.months, 12)));
    const pastMonths = Math.min(24, Math.max(0, toInt(req.query.pastMonths, 0)));

    const now = new Date();

    const timelineStart = addMonths(monthStart(now), -pastMonths);
    const totalMonths = pastMonths + monthsForward;

    const toKey = yyyymmKey(addMonths(timelineStart, totalMonths - 1));
    const histFromKey = yyyymmKey(addMonths(timelineStart, -12));

    const includeInactive = String(req.query.includeInactive || "false") === "true";
    const q = includeInactive ? {} : { isActive: true };

    const expenses = await RecurringExpense.find(q).sort({ type: 1, title: 1 }).lean();

    const paymentsInRange = await RecurringPayment.find({
      periodKey: { $gte: histFromKey, $lte: toKey },
    }).lean();

    const expIds = expenses.map((e) => e._id);
    const termsRows = expIds.length
      ? await RecurringTermsHistory.find({ recurringExpenseId: { $in: expIds } })
          .sort({ recurringExpenseId: 1, fromDate: 1 })
          .lean()
      : [];

    const recurringTermsIndex = buildRecurringTermsIndex(termsRows);

    const summary = buildSummary({
      expenses,
      paymentsInRange,
      recurringTermsIndex,
      filter,
      months: totalMonths,
      timelineStart,
      realNow: now,
    });

    summary.meta = { ...(summary.meta || {}), filter, months: monthsForward, pastMonths };
    res.json(summary);
  } catch (err) {
    console.error("Error in /api/recurring-expenses/summary:", err);
    res.status(500).json({ message: "Internal Server Error", error: err?.message });
  }
});

export default router;