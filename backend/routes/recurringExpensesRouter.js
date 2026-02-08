// routes/recurringExpensesRouter.js
import express from "express";
import slugify from "slugify";

import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import MortgageTermsHistory from "../models/mortgageTermsHistorySchema.js";

const recurringExpensesRouter = express.Router();

/* =========================
   Helpers (summary)
========================= */

const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";

const yyyymmKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const clampDayInMonth = (y, mIndex0, dueDay) => {
  const day = Math.min(28, Math.max(1, Number(dueDay || 1)));
  return new Date(y, mIndex0, day);
};

const estimateMonthsLeft = ({ remainingBalance, amount, monthlyFee }) => {
  const payment = Number(amount || 0);
  const fee = Number(monthlyFee || 0);
  const remaining = Number(remainingBalance || 0);
  const effective = Math.max(0, payment - fee);
  if (remaining <= 0 || effective <= 0) return null;
  return Math.ceil(remaining / effective);
};

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

const buildAvgMap = ({ payments }) => {
  const byExp = new Map();
  for (const p of payments) {
    const expId = String(p.recurringExpenseId);
    if (!byExp.has(expId)) byExp.set(expId, []);
    byExp.get(expId).push({ periodKey: p.periodKey, amount: Number(p.amount || 0) });
  }
  for (const [k, arr] of byExp.entries()) {
    arr.sort((a, b) => (a.periodKey > b.periodKey ? 1 : -1));
    byExp.set(k, arr);
  }
  return byExp;
};

const estimateFromHistory = ({ expenseId, avgMap, fallbackMin, fallbackMax, fallbackFixed }) => {
  const hist = avgMap.get(String(expenseId)) || [];
  const last = hist.slice(-6);
  if (last.length >= 3) {
    const a = avg(last.map((x) => x.amount));
    const spread = 0.15;
    return { estMin: Math.max(0, a * (1 - spread)), estMax: Math.max(0, a * (1 + spread)), source: "HISTORY_AVG" };
  }
  if (fallbackMin || fallbackMax) return { estMin: fallbackMin, estMax: fallbackMax, source: "TEMPLATE_RANGE" };
  return { estMin: fallbackFixed, estMax: fallbackFixed, source: "TEMPLATE_FIXED" };
};

const buildMortgageTermsIndex = (rows) => {
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

const pickMortgageTermsForMonth = ({ expense, termsArr, monthStartDate }) => {
  let chosen = null;
  for (const t of termsArr) {
    if (new Date(t.fromDate) <= monthStartDate) chosen = t;
    else break;
  }

  const base = {
    mortgageHolder: expense.mortgageHolder || "",
    mortgageKind: expense.mortgageKind || "",
    amount: Number(expense.amount || 0),
    interestRate: Number(expense.interestRate || 0),
    hasMonthlyFee: Boolean(expense.hasMonthlyFee),
    monthlyFee: Number(expense.monthlyFee || 0),
    remainingBalance: Number(expense.remainingBalance || 0),
  };

  if (!chosen) return base;

  return {
    mortgageHolder: chosen.mortgageHolder ?? base.mortgageHolder,
    mortgageKind: chosen.mortgageKind ?? base.mortgageKind,
    amount: Number(chosen.amount ?? base.amount),
    interestRate: Number(chosen.interestRate ?? base.interestRate),
    hasMonthlyFee: Boolean(chosen.hasMonthlyFee ?? base.hasMonthlyFee),
    monthlyFee: Number(chosen.monthlyFee ?? base.monthlyFee),
    remainingBalance: Number(chosen.remainingBalance ?? base.remainingBalance),
  };
};

const buildSummary = ({
  expenses,
  paymentsInRange,
  mortgageTermsIndex = new Map(),
  filter = "ALL",
  months = 12,
  now = new Date(),
}) => {
  const filteredExpenses =
    filter === "ALL"
      ? expenses
      : expenses.filter((e) => e.type === filter || (filter === "MORTGAGE" && e.type === "HOUSING"));

  const start = monthStart(now);

  const paymentIndex = new Map();
  for (const p of paymentsInRange) {
    paymentIndex.set(`${String(p.recurringExpenseId)}|${p.periodKey}`, p);
  }

  const avgMap = buildAvgMap({ payments: paymentsInRange });

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

  for (const e of filteredExpenses) {
  const startDate = e.startDate ? new Date(e.startDate) : new Date(0);
  const endDate = e.endDate ? new Date(e.endDate) : null;
    const interval = Number(e.billingIntervalMonths || 1);
    const startMonth = Number(e.startMonth || start.getMonth() + 1);
    const dueDay = Number(e.dueDay || 1);

    for (const b of monthBuckets) {
       // ⭐ skip months BEFORE recurring started
      if (b.date < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
        continue;
      }

      // ⭐ skip months AFTER recurring finished
      if (endDate && b.date > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) {
        continue;
      }
      const monthIndex1 = b.date.getMonth() + 1;
      const diff = (monthIndex1 - startMonth + 12) % 12;
      const isDueThisMonth = diff % interval === 0;
      if (!isDueThisMonth) continue;

      const dueDate = clampDayInMonth(b.date.getFullYear(), b.date.getMonth(), dueDay);
      const periodKey = b.key;

      const pay = paymentIndex.get(`${String(e._id)}|${periodKey}`) || null;

      let expectedFixed = Number(e.amount || 0);
      let expectedMin = Number(e.estimateMin || 0);
      let expectedMax = Number(e.estimateMax || 0);
      let estimateSource = "MORTGAGE_FIXED";

      let mortgageMeta = null;

      if (isMortgageType(e.type)) {
        const termsArr = mortgageTermsIndex.get(String(e._id)) || [];
        const terms = pickMortgageTermsForMonth({ expense: e, termsArr, monthStartDate: b.date });

        expectedFixed = Number(terms.amount || 0);
        expectedMin = expectedFixed;
        expectedMax = expectedFixed;
        estimateSource = "MORTGAGE_TERMS";

        b.expectedFixedTotal += expectedFixed;

        mortgageMeta = {
          mortgageHolder: terms.mortgageHolder,
          mortgageKind: terms.mortgageKind,
          interestRate: terms.interestRate,
          monthlyFee: terms.monthlyFee,
          remainingBalance: terms.remainingBalance,
        };
      } else {
        const est = estimateFromHistory({
          expenseId: e._id,
          avgMap,
          fallbackMin: expectedMin,
          fallbackMax: expectedMax,
          fallbackFixed: expectedFixed,
        });

        expectedMin = est.estMin;
        expectedMax = est.estMax;
        estimateSource = est.source;

        const hasTemplateRange = Number(e.estimateMin || 0) || Number(e.estimateMax || 0);
        if (!hasTemplateRange && est.source === "TEMPLATE_FIXED") {
          b.expectedFixedTotal += expectedFixed;
        }
      }

      b.expectedMin += expectedMin;
      b.expectedMax += expectedMax;

      if (pay && pay.status !== "SKIPPED") b.paidTotal += Number(pay.amount || 0);

      const status = !pay ? "UNPAID" : pay.status === "SKIPPED" ? "SKIPPED" : "PAID";

      b.items.push({
        recurringExpenseId: String(e._id),
        title: e.title,
        type: e.type,
        dueDate,
        periodKey,
        expected: { fixed: expectedFixed, min: expectedMin, max: expectedMax, source: estimateSource },
        mortgage: mortgageMeta,
        actual: pay
          ? {
              paymentId: String(pay._id),
              amount: Number(pay.amount || 0),
              paidDate: pay.paidDate,
              status: pay.status,
              note: pay.note || "",
            }
          : null,
        status,
      });

      b.itemsCount += 1;
    }
  }

  const horizonDays = 45;
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + horizonDays);

  const upcoming = [];
  for (const b of monthBuckets) {
    for (const it of b.items) {
      const due = new Date(it.dueDate);
      if (due >= now && due <= horizon) {
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

    const monthsLeft = isMortgage ? estimateMonthsLeft({ remainingBalance, amount, monthlyFee }) : null;

    const estInterest =
      isMortgage && remainingBalance > 0 && rate >= 0 ? (remainingBalance * (rate / 100)) / 12 : null;

    const estPrincipal =
      estInterest != null ? Math.max(0, amount - estInterest - Number(monthlyFee || 0)) : null;

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
   SUMMARY (must be before "/:id")
========================= */

recurringExpensesRouter.get("/summary", async (req, res) => {
  try {
    const filter = String(req.query.filter || "ALL").toUpperCase();

    // "months" = future months to show (default 12)
    const months = Math.min(24, Math.max(3, Number(req.query.months || 12)));

    // ✅ NEW: pastMonths = months back to include in forecast (default 0)
    const pastMonths = Math.min(24, Math.max(0, Number(req.query.pastMonths || 0)));

    const now = new Date();

    const start = addMonths(monthStart(now), -pastMonths);
    const totalMonths = pastMonths + months;

    const toKey = yyyymmKey(addMonths(start, totalMonths - 1));

    // payments used for averaging + paid statuses
    // include extra history for averaging
    const histFromKey = yyyymmKey(addMonths(start, -12));

    const expenses = await RecurringExpense.find()
      .sort({ type: 1, title: 1 })
      .lean();

    const paymentsInRange = await RecurringPayment.find({
      periodKey: { $gte: histFromKey, $lte: toKey },
    }).lean();

    const mortgageIds = expenses
      .filter((e) => e.type === "MORTGAGE")
      .map((e) => e._id);

    const mortgageTermsRows = mortgageIds.length
      ? await MortgageTermsHistory.find({ recurringExpenseId: { $in: mortgageIds } })
          .sort({ recurringExpenseId: 1, fromDate: 1 })
          .lean()
      : [];

    const mortgageTermsIndex = buildMortgageTermsIndex(mortgageTermsRows);

    const summary = buildSummary({
      expenses,
      paymentsInRange,
      mortgageTermsIndex,
      filter,
      months: totalMonths,
      now: start, // ✅ IMPORTANT: buildSummary starts at "start"
    });

    // Add meta info so frontend can label time span if needed
    summary.meta = { ...(summary.meta || {}), filter, months, pastMonths };

    res.json(summary);
  } catch (err) {
    console.error("Error in /api/recurring-expenses/summary:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* =========================
   CRUD helpers
========================= */

const clampDueDay = (d) => Math.min(28, Math.max(1, Number(d || 1)));
const clampMonth = (m) => Math.min(12, Math.max(1, Number(m || 1)));
const clampInterval = (v) => ([1, 3, 6, 12].includes(Number(v)) ? Number(v) : 1);

const normalizePayload = (body = {}) => {
  const type = body.type === "HOUSING" ? "MORTGAGE" : body.type;

  const payload = {
    title: String(body.title ?? "").trim(),
    type,
    dueDay: clampDueDay(body.dueDay),

    billingIntervalMonths: clampInterval(body.billingIntervalMonths ?? 1),
    startMonth: clampMonth(body.startMonth ?? new Date().getMonth() + 1),

    amount: Number(body.amount ?? 0),
    estimateMin: Number(body.estimateMin ?? 0),
    estimateMax: Number(body.estimateMax ?? 0),

    mortgageHolder: String(body.mortgageHolder ?? "").trim(),
    mortgageKind: String(body.mortgageKind ?? "").trim(),
    remainingBalance: Number(body.remainingBalance ?? 0),
    interestRate: Number(body.interestRate ?? 0),
    hasMonthlyFee: Boolean(body.hasMonthlyFee),
    monthlyFee: Boolean(body.hasMonthlyFee) ? Number(body.monthlyFee ?? 0) : 0,

    // ✅ lifecycle (defaults)
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
endDate: body.endDate ? new Date(body.endDate) : null,
  };

  payload.slug = slugify(payload.title, { lower: true, strict: true });

  if (payload.type !== "MORTGAGE") {
    payload.mortgageHolder = "";
    payload.mortgageKind = "";
    payload.remainingBalance = 0;
    payload.interestRate = 0;
    payload.hasMonthlyFee = false;
    payload.monthlyFee = 0;
  } else {
    payload.billingIntervalMonths = 1;
    payload.estimateMin = 0;
    payload.estimateMax = 0;
  }

  return payload;
};

/* =========================
   CRUD routes
========================= */

// Optional: only active templates by default
recurringExpensesRouter.get("/", async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || "false") === "true";
    const q = includeInactive ? {} : { isActive: true };

    const expenses = await RecurringExpense.find(q).sort({ type: 1, title: 1 }).lean();
    res.json({ expenses, meta: { totalRowCount: expenses.length } });
  } catch (err) {
    console.error("Error in /api/recurring-expenses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringExpensesRouter.get("/:id", async (req, res) => {
  try {
    const exp = await RecurringExpense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: "Not found" });
    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringExpensesRouter.post("/", async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    if (!payload.title) return res.status(400).json({ message: "Tittel er påkrevd" });

    const existing = await RecurringExpense.findOne({ slug: payload.slug, type: payload.type });
    if (existing) return res.status(400).json({ message: "duplicate" });

    const created = await RecurringExpense.create(payload);

    if (created?.type === "MORTGAGE") {
      const from = new Date(created.createdAt || Date.now());
      const monthFrom = new Date(from.getFullYear(), from.getMonth(), 1);

      await MortgageTermsHistory.findOneAndUpdate(
        { recurringExpenseId: created._id, fromDate: monthFrom },
        {
          $set: {
            recurringExpenseId: created._id,
            fromDate: monthFrom,
            mortgageHolder: created.mortgageHolder,
            mortgageKind: created.mortgageKind,
            amount: created.amount,
            interestRate: created.interestRate,
            hasMonthlyFee: created.hasMonthlyFee,
            monthlyFee: created.monthlyFee,
            remainingBalance: created.remainingBalance,
            note: "Auto snapshot from create",
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringExpensesRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizePayload(req.body);

    if (!payload.title) return res.status(400).json({ message: "Tittel er påkrevd" });

    const existing = await RecurringExpense.findOne({
      slug: payload.slug,
      type: payload.type,
      _id: { $ne: id },
    });

    if (existing) return res.status(400).json({ message: "duplicate" });

    const updated = await RecurringExpense.findByIdAndUpdate(id, { $set: payload }, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });

    if (updated.type === "MORTGAGE") {
      const from = updated.updatedAt ? new Date(updated.updatedAt) : new Date();
      const monthFrom = new Date(from.getFullYear(), from.getMonth(), 1);

      await MortgageTermsHistory.findOneAndUpdate(
        { recurringExpenseId: updated._id, fromDate: monthFrom },
        {
          $set: {
            recurringExpenseId: updated._id,
            fromDate: monthFrom,
            mortgageHolder: updated.mortgageHolder,
            mortgageKind: updated.mortgageKind,
            amount: updated.amount,
            interestRate: updated.interestRate,
            hasMonthlyFee: updated.hasMonthlyFee,
            monthlyFee: updated.monthlyFee,
            remainingBalance: updated.remainingBalance,
            note: "Auto snapshot from edit",
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringExpensesRouter.post("/:id/archive", async (req, res) => {
  try {
    const exp = await RecurringExpense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: "Not found" });

    exp.isActive = false;
    exp.endDate = new Date(); // finished now
    await exp.save();

    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * Reactivate (optional but super nice UX)
 */
recurringExpensesRouter.post("/:id/reactivate", async (req, res) => {
  try {
    const exp = await RecurringExpense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: "Not found" });

    exp.isActive = true;
    exp.endDate = null;
    await exp.save();

    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * ✅ IMPORTANT:
 * DELETE is now "finish" (soft delete)
 * Keeps payments/history forever.
 */
recurringExpensesRouter.delete("/:id", async (req, res) => {
  try {
    const updated = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, endDate: new Date() } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * Optional: restore a finished template
 */
recurringExpensesRouter.patch("/:id/restore", async (req, res) => {
  try {
    const updated = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true, endDate: null } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringExpensesRouter;
