// routes/recurringPaymentsRouter.js
import express from "express";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";

const recurringPaymentsRouter = express.Router();

const normalizePeriodKey = (v) => {
  const s = String(v || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  return s;
};

// Upsert payment for (expense, periodKey)
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

    res.json(doc);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "payment already exists" });
    console.error("Error in POST /api/recurring-payments:", err);
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
    res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-payments/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringPaymentsRouter;
