import express from "express";

import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";

const recurringPaymentsRouter = express.Router();

const normalizePeriodKey = (v) => {
  const s = String(v || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  return s;
};

const normalizeKind = (v) => {
  const s = String(v || "").toUpperCase();
  return s === "EXTRA" ? "EXTRA" : "MAIN";
};

const clamp0 = (n) => Math.max(0, Number(n || 0));

const computeMortgageRemaining = ({
  initialBalance,
  interestRate,
  monthlyFee,
  mainPayments,
  extraPayments,
}) => {
  let remaining = clamp0(initialBalance);
  const rate = clamp0(interestRate);
  const fee = clamp0(monthlyFee);

  // mainPayments sorted by periodKey asc
  for (const p of mainPayments) {
    if (!p) continue;
    if (p.status === "SKIPPED") continue;

    const paid = clamp0(p.amount);

    // simple monthly interest approximation
    const interest = remaining > 0 ? (remaining * (rate / 100)) / 12 : 0;

    const principal = Math.max(0, paid - fee - interest);
    remaining = Math.max(0, remaining - principal);

    // ✅ apply SUM of all EXTRA payments for same month
    const extra = clamp0(extraPayments.get(String(p.periodKey)) || 0);
    if (extra > 0) {
      remaining = Math.max(0, remaining - extra);
    }
  }

  return remaining;
};

const recomputeMortgageBalance = async (recurringExpenseId) => {
  const exp = await RecurringExpense.findById(recurringExpenseId);
  if (!exp) return;
  if (exp.type !== "MORTGAGE") return;

  if (!Number(exp.initialBalance) && Number(exp.remainingBalance) > 0) {
    exp.initialBalance = Number(exp.remainingBalance);
  }
  if (!Number(exp.remainingBalance) && Number(exp.initialBalance) > 0) {
    exp.remainingBalance = Number(exp.initialBalance);
  }

  const payments = await RecurringPayment.find({ recurringExpenseId: exp._id })
    .sort({ periodKey: 1, paidDate: 1, createdAt: 1 })
    .lean();

  const mainPayments = payments.filter(
    (p) => String(p.kind || "MAIN").toUpperCase() === "MAIN"
  );

  // ✅ SUM extras per month instead of overwriting last one
  const extraPayments = new Map(); // periodKey -> total extra amount
  for (const p of payments) {
    if (String(p.kind || "").toUpperCase() !== "EXTRA") continue;
    const pk = String(p.periodKey);
    extraPayments.set(pk, clamp0(extraPayments.get(pk)) + clamp0(p.amount));
  }

  const remaining = computeMortgageRemaining({
    initialBalance: exp.initialBalance,
    interestRate: exp.interestRate,
    monthlyFee: exp.hasMonthlyFee ? exp.monthlyFee : 0,
    mainPayments,
    extraPayments,
  });

  exp.remainingBalance = remaining;
  await exp.save();
};

// POST:
// - MAIN  => upsert one payment per month
// - EXTRA => always create a new payment row
recurringPaymentsRouter.post("/", async (req, res) => {
  try {
    const recurringExpenseId = req.body.recurringExpenseId;
    const periodKey = normalizePeriodKey(req.body.periodKey);
    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
    const amount = Number(req.body.amount ?? 0);

    const kind = normalizeKind(req.body.kind);
    const status =
      kind === "EXTRA"
        ? "EXTRA"
        : String(req.body.status || "PAID").toUpperCase();

    const note = String(req.body.note || "").trim();

    if (!recurringExpenseId) {
      return res.status(400).json({ message: "recurringExpenseId required" });
    }

    if (!periodKey) {
      return res.status(400).json({ message: "periodKey invalid" });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "amount invalid" });
    }

    if (!["MAIN", "EXTRA"].includes(kind)) {
      return res.status(400).json({ message: "kind invalid" });
    }

    if (!["PAID", "PARTIAL", "SKIPPED", "EXTRA"].includes(status)) {
      return res.status(400).json({ message: "status invalid" });
    }

    const exp = await RecurringExpense.findById(recurringExpenseId).lean();
    if (!exp) {
      return res.status(404).json({ message: "RecurringExpense not found" });
    }

    let doc;

    if (kind === "MAIN") {
      // ✅ keep one MAIN payment per month
      doc = await RecurringPayment.findOneAndUpdate(
        { recurringExpenseId, periodKey, kind: "MAIN" },
        {
          $set: {
            paidDate,
            amount,
            status,
            note,
            kind: "MAIN",
          },
        },
        { upsert: true, new: true }
      ).lean();
    } else {
      // ✅ allow MANY EXTRA payments in the same month
      const created = await RecurringPayment.create({
        recurringExpenseId,
        periodKey,
        paidDate,
        amount,
        status: "EXTRA",
        note,
        kind: "EXTRA",
      });

      doc = created.toObject();
    }

    await recomputeMortgageBalance(recurringExpenseId);

    return res.status(kind === "EXTRA" ? 201 : 200).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "main payment already exists" });
    }

    console.error("Error in POST /api/recurring-payments:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT: update payment by id
// kind is intentionally not changed here
recurringPaymentsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : null;
    const amount = req.body.amount != null ? Number(req.body.amount) : null;
    const status = req.body.status ? String(req.body.status).toUpperCase() : null;
    const note = req.body.note != null ? String(req.body.note).trim() : null;

    const patch = {};

    if (paidDate) patch.paidDate = paidDate;

    if (amount != null) {
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: "amount invalid" });
      }
      patch.amount = amount;
    }

    if (status) {
      // ✅ EXTRA rows must stay EXTRA
      const existing = await RecurringPayment.findById(id).lean();
      if (!existing) return res.status(404).json({ message: "Not found" });

      const currentKind = String(existing.kind || "MAIN").toUpperCase();

      if (currentKind === "EXTRA") {
        if (status !== "EXTRA") {
          return res.status(400).json({ message: "status invalid for EXTRA payment" });
        }
      } else if (!["PAID", "PARTIAL", "SKIPPED"].includes(status)) {
        return res.status(400).json({ message: "status invalid" });
      }

      patch.status = status;

      const updated = await RecurringPayment.findByIdAndUpdate(
        id,
        { $set: patch },
        { new: true }
      ).lean();

      await recomputeMortgageBalance(updated.recurringExpenseId);

      return res.json(updated);
    }

    if (note != null) patch.note = note;

    const updated = await RecurringPayment.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });

    await recomputeMortgageBalance(updated.recurringExpenseId);

    return res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/recurring-payments/:id:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringPaymentsRouter.get("/", async (req, res) => {
  try {
    const from = normalizePeriodKey(req.query.from);
    const to = normalizePeriodKey(req.query.to);

    const q = {};
    if (from || to) {
      q.periodKey = {};
      if (from) q.periodKey.$gte = from;
      if (to) q.periodKey.$lte = to;
    }

    const payments = await RecurringPayment.find(q)
      .sort({ periodKey: 1, paidDate: 1, createdAt: 1 })
      .lean();

    res.json({ payments, meta: { totalRowCount: payments.length } });
  } catch (err) {
    console.error("Error in GET /api/recurring-payments:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringPaymentsRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await RecurringPayment.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Not found" });

    await recomputeMortgageBalance(deleted.recurringExpenseId);

    res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-payments/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringPaymentsRouter;

