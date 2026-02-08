import express from "express";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";

const recurringPaymentsRouter = express.Router();

const normalizePeriodKey = (v) => {
  const s = String(v || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  return s;
};

const clamp0 = (n) => Math.max(0, Number(n || 0));

const computeMortgageRemaining = ({ initialBalance, interestRate, monthlyFee, payments }) => {
  let remaining = clamp0(initialBalance);
  const rate = clamp0(interestRate);
  const fee = clamp0(monthlyFee);

  for (const p of payments) {
    if (!p) continue;
    if (p.status === "SKIPPED") continue;

    const paid = clamp0(p.amount);

    // simple monthly interest approximation
    const interest = remaining > 0 ? (remaining * (rate / 100)) / 12 : 0;

    const principal = Math.max(0, paid - fee - interest);
    remaining = Math.max(0, remaining - principal);
  }

  return remaining;
};

const recomputeMortgageBalance = async (recurringExpenseId) => {
  const exp = await RecurringExpense.findById(recurringExpenseId);
  if (!exp) return;

  if (exp.type !== "MORTGAGE") return;

  // ensure initialBalance exists
  if (!Number(exp.initialBalance) && Number(exp.remainingBalance) > 0) {
    exp.initialBalance = Number(exp.remainingBalance);
  }
  if (!Number(exp.remainingBalance) && Number(exp.initialBalance) > 0) {
    exp.remainingBalance = Number(exp.initialBalance);
  }

  const payments = await RecurringPayment.find({ recurringExpenseId: exp._id })
    .sort({ periodKey: 1, paidDate: 1, createdAt: 1 })
    .lean();

  const remaining = computeMortgageRemaining({
    initialBalance: exp.initialBalance,
    interestRate: exp.interestRate,
    monthlyFee: exp.hasMonthlyFee ? exp.monthlyFee : 0,
    payments,
  });

  exp.remainingBalance = remaining;
  await exp.save();
};

// POST: upsert payment for (expense, periodKey)
recurringPaymentsRouter.post("/", async (req, res) => {
  try {
    const recurringExpenseId = req.body.recurringExpenseId;
    const periodKey = normalizePeriodKey(req.body.periodKey);
    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
    const amount = Number(req.body.amount ?? 0);
    const status = String(req.body.status || "PAID").toUpperCase();
    const note = String(req.body.note || "").trim();

    if (!recurringExpenseId) return res.status(400).json({ message: "recurringExpenseId required" });
    if (!periodKey) return res.status(400).json({ message: "periodKey invalid" });
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: "amount invalid" });
    if (!["PAID", "PARTIAL", "SKIPPED"].includes(status)) {
      return res.status(400).json({ message: "status invalid" });
    }

    const exp = await RecurringExpense.findById(recurringExpenseId).lean();
    if (!exp) return res.status(404).json({ message: "RecurringExpense not found" });

    const doc = await RecurringPayment.findOneAndUpdate(
      { recurringExpenseId, periodKey },
      { $set: { paidDate, amount, status, note } },
      { upsert: true, new: true }
    ).lean();

    // ✅ update mortgage balance
    await recomputeMortgageBalance(recurringExpenseId);

    res.json(doc);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "payment already exists" });
    console.error("Error in POST /api/recurring-payments:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT: update payment by id
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
      if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: "amount invalid" });
      patch.amount = amount;
    }
    if (status) {
      if (!["PAID", "PARTIAL", "SKIPPED"].includes(status)) return res.status(400).json({ message: "status invalid" });
      patch.status = status;
    }
    if (note != null) patch.note = note;

    const updated = await RecurringPayment.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Not found" });

    // ✅ update mortgage balance
    await recomputeMortgageBalance(updated.recurringExpenseId);

    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/recurring-payments/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
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
      .sort({ periodKey: 1, paidDate: 1 })
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

    // ✅ update mortgage balance
    await recomputeMortgageBalance(deleted.recurringExpenseId);

    res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-payments/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringPaymentsRouter;

