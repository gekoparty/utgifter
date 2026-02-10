// routes/recurringExpensesRouter.js
import express from "express";
import slugify from "slugify";

import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../models/recurringTermsHistorySchema.js";

const recurringExpensesRouter = express.Router();

/* =========================
   Helpers
========================= */

const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";

const yyyymmKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const monthStartDate = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

const periodKeyToMonthStart = (pk) => {
  const s = String(pk || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
};

const clampDayInMonth = (y, mIndex0, dueDay) => {
  const day = Math.min(28, Math.max(1, Number(dueDay || 1)));
  return new Date(y, mIndex0, day);
};

const isMonthWithin = (monthDate, from, to) => {
  const m = monthStartDate(monthDate);
  const f = monthStartDate(new Date(from));
  const t = monthStartDate(new Date(to));
  return m >= f && m <= t;
};

/**
 * ⭐ IMPORTANT:
 * Return pause OBJECT so we can:
 *  - show paused in UI
 *  - edit/remove pause
 */
const getPauseForMonth = (expense, monthDate) => {
  const pauses = Array.isArray(expense.pausePeriods) ? expense.pausePeriods : [];
  return (
    pauses.find((p) => p?.from && p?.to && isMonthWithin(monthDate, p.from, p.to)) ||
    null
  );
};

const buildRecurringTermsIndex = (rows) => {
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

/**
 * Pick the terms snapshot for a given month.
 * Base is template values, overridden by latest terms row <= month.
 */
const pickRecurringTermsForMonth = ({ expense, termsArr, monthStartDate }) => {
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

const estimateMonthsLeft = ({ remainingBalance, amount, monthlyFee }) => {
  const payment = Number(amount || 0);
  const fee = Number(monthlyFee || 0);
  const remaining = Number(remainingBalance || 0);
  const effective = Math.max(0, payment - fee);
  if (remaining <= 0 || effective <= 0) return null;
  return Math.ceil(remaining / effective);
};

/**
 * Recurrence:
 * interval = 1,3,6,12
 * anchor month:
 *  - if startDate exists: startDate month
 *  - else: startMonth in the timelineStart year
 */
const isDueInMonth = ({ interval, anchorMonthDate, bucketDate }) => {
  if (interval <= 1) return true;

  const monthsDiff =
    (bucketDate.getFullYear() - anchorMonthDate.getFullYear()) * 12 +
    (bucketDate.getMonth() - anchorMonthDate.getMonth());

  return monthsDiff >= 0 && monthsDiff % interval === 0;
};

/* =========================
   buildSummary
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
          (e) => e.type === filter || (filter === "MORTGAGE" && e.type === "HOUSING"),
        );

  const start = monthStart(timelineStart);
  const today = new Date(realNow);

  const paymentIndex = new Map();
  for (const p of paymentsInRange) {
    paymentIndex.set(`${String(p.recurringExpenseId)}|${p.periodKey}`, p);
  }

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
      // lifecycle
      if (startMonthDateBound && b.date < startMonthDateBound) continue;
      if (endMonthDateBound && b.date > endMonthDateBound) continue;

      // recurrence
      const dueThisMonth = isDueInMonth({
        interval,
        anchorMonthDate,
        bucketDate: b.date,
      });
      if (!dueThisMonth) continue;

      // pause detection
      const pause = getPauseForMonth(e, b.date);
      const paused = Boolean(pause);

      const dueDate = clampDayInMonth(b.date.getFullYear(), b.date.getMonth(), dueDay);
      const periodKey = b.key;

      const pay = paymentIndex.get(`${String(e._id)}|${periodKey}`) || null;

      // expected numbers
      let expectedFixed = 0;
      let expectedMin = 0;
      let expectedMax = 0;
      let estimateSource = paused ? "PAUSED" : "TERMS_HISTORY";

      // Only apply terms if not paused
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

        // If estimate is not used (min/max both 0), treat fixed as min/max
        if (expectedMin === 0 && expectedMax === 0) {
          expectedMin = expectedFixed;
          expectedMax = expectedFixed;
        }

        b.expectedFixedTotal += expectedFixed;
        b.expectedMin += expectedMin;
        b.expectedMax += expectedMax;

        if (pay && pay.status !== "SKIPPED") {
          b.paidTotal += Number(pay.amount || 0);
        }
      }

      let status;
      if (paused) status = "PAUSED";
      else status = !pay ? "UNPAID" : pay.status === "SKIPPED" ? "SKIPPED" : "PAID";

      // mortgage meta (nice for UI)
      let mortgageMeta = null;
      if (isMortgageType(e.type) && terms) {
        mortgageMeta = {
          mortgageHolder: terms.mortgageHolder,
          mortgageKind: terms.mortgageKind,
          interestRate: terms.interestRate,
          monthlyFee: terms.monthlyFee,
          remainingBalance: terms.remainingBalance,
        };
      }

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

        // ✅ pause info so UI can unpause/edit
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
      // don’t show paused as upcoming
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

  // derived fields (template-based; OK for now)
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

    const expenses = await RecurringExpense.find().sort({ type: 1, title: 1 }).lean();

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

/* =========================
   TERMS: change from month
   (history-safe future changes)
========================= */

recurringExpensesRouter.post("/:id/terms", async (req, res) => {
  try {
    const { id } = req.params;

    const periodKey = String(req.body.periodKey || "").trim();
    if (!/^\d{4}-\d{2}$/.test(periodKey)) {
      return res.status(400).json({ message: "periodKey must be YYYY-MM" });
    }

    const fromDate = periodKeyToMonthStart(periodKey);
    if (!fromDate) return res.status(400).json({ message: "invalid periodKey" });

    const exp = await RecurringExpense.findById(id).lean();
    if (!exp) return res.status(404).json({ message: "Not found" });

    const patch = {};
    if (req.body.amount != null) patch.amount = Number(req.body.amount);
    if (req.body.estimateMin != null) patch.estimateMin = Number(req.body.estimateMin);
    if (req.body.estimateMax != null) patch.estimateMax = Number(req.body.estimateMax);

    if (req.body.interestRate != null) patch.interestRate = Number(req.body.interestRate);
    if (req.body.hasMonthlyFee != null) patch.hasMonthlyFee = Boolean(req.body.hasMonthlyFee);
    if (req.body.monthlyFee != null) patch.monthlyFee = Number(req.body.monthlyFee);
    if (req.body.remainingBalance != null) patch.remainingBalance = Number(req.body.remainingBalance);

    patch.note = String(req.body.note || "").trim();

    const row = await RecurringTermsHistory.findOneAndUpdate(
      { recurringExpenseId: exp._id, fromDate },
      { $set: { recurringExpenseId: exp._id, fromDate, ...patch } },
      { upsert: true, new: true }
    ).lean();

    res.json(row);
  } catch (err) {
    console.error("Error in POST /api/recurring-expenses/:id/terms:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* =========================
   PAUSE: create / edit / remove
========================= */

// Create pause period
recurringExpensesRouter.post("/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;

    const fromPk = String(req.body.from || "").trim();
    const toPk = String(req.body.to || "").trim();
    const note = String(req.body.note || "").trim();

    if (!/^\d{4}-\d{2}$/.test(fromPk) || !/^\d{4}-\d{2}$/.test(toPk)) {
      return res.status(400).json({ message: "from/to must be YYYY-MM" });
    }

    const from = periodKeyToMonthStart(fromPk);
    const to = periodKeyToMonthStart(toPk);
    if (!from || !to || from > to) {
      return res.status(400).json({ message: "invalid range" });
    }

    const updated = await RecurringExpense.findByIdAndUpdate(
      id,
      { $push: { pausePeriods: { from, to, note } } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in POST /api/recurring-expenses/:id/pause:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Edit pause period range
recurringExpensesRouter.put("/:id/pause/:pauseId", async (req, res) => {
  try {
    const { id, pauseId } = req.params;

    const fromPk = String(req.body.from || "").trim();
    const toPk = String(req.body.to || "").trim();
    const note = String(req.body.note || "").trim();

    if (!/^\d{4}-\d{2}$/.test(fromPk) || !/^\d{4}-\d{2}$/.test(toPk)) {
      return res.status(400).json({ message: "from/to must be YYYY-MM" });
    }

    const from = periodKeyToMonthStart(fromPk);
    const to = periodKeyToMonthStart(toPk);
    if (!from || !to || from > to) {
      return res.status(400).json({ message: "invalid range" });
    }

    const updated = await RecurringExpense.findOneAndUpdate(
      { _id: id, "pausePeriods._id": pauseId },
      {
        $set: {
          "pausePeriods.$.from": from,
          "pausePeriods.$.to": to,
          "pausePeriods.$.note": note,
        },
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/recurring-expenses/:id/pause/:pauseId:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Remove pause period (unpause)
recurringExpensesRouter.delete("/:id/pause/:pauseId", async (req, res) => {
  try {
    const { id, pauseId } = req.params;

    const updated = await RecurringExpense.findByIdAndUpdate(
      id,
      { $pull: { pausePeriods: { _id: pauseId } } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-expenses/:id/pause/:pauseId:", err);
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

    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    endDate: body.endDate ? new Date(body.endDate) : null,
    startDate: body.startDate ? new Date(body.startDate) : null,
  };

  payload.slug = slugify(payload.title, { lower: true, strict: true });

  // If not mortgage, clear mortgage fields
  if (payload.type !== "MORTGAGE") {
    payload.mortgageHolder = "";
    payload.mortgageKind = "";
    payload.remainingBalance = 0;
    payload.interestRate = 0;
    payload.hasMonthlyFee = false;
    payload.monthlyFee = 0;
  } else {
    // mortgage: no estimate range
    payload.billingIntervalMonths = 1;
    payload.estimateMin = 0;
    payload.estimateMax = 0;
  }

  return payload;
};

/* =========================
   CRUD routes
========================= */

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
    const exp = await RecurringExpense.findById(req.params.id).lean();
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

    // ✅ create initial terms snapshot for current month
    const from = new Date();
    const monthFrom = new Date(from.getFullYear(), from.getMonth(), 1);

    await RecurringTermsHistory.findOneAndUpdate(
      { recurringExpenseId: created._id, fromDate: monthFrom },
      {
        $set: {
          recurringExpenseId: created._id,
          fromDate: monthFrom,
          amount: created.amount,
          estimateMin: created.estimateMin,
          estimateMax: created.estimateMax,
          interestRate: created.interestRate,
          hasMonthlyFee: created.hasMonthlyFee,
          monthlyFee: created.monthlyFee,
          remainingBalance: created.remainingBalance,
          note: "Auto snapshot from create",
        },
      },
      { upsert: true, new: true }
    );

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

    const updated = await RecurringExpense.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Not found" });

    // NOTE:
    // Editing template changes defaults only.
    // Future-only financial changes should use POST /:id/terms
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
    exp.endDate = new Date();
    await exp.save();

    res.json(exp.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringExpensesRouter.post("/:id/reactivate", async (req, res) => {
  try {
    const exp = await RecurringExpense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: "Not found" });

    exp.isActive = true;
    exp.endDate = null;
    await exp.save();

    res.json(exp.toObject());
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Soft-delete (finish)
recurringExpensesRouter.delete("/:id", async (req, res) => {
  try {
    const updated = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, endDate: new Date() } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Restore finished
recurringExpensesRouter.patch("/:id/restore", async (req, res) => {
  try {
    const updated = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true, endDate: null } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringExpensesRouter;
