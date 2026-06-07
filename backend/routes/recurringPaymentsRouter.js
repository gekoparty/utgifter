import express from "express";

import RecurringPayment from "../models/recurringPaymentSchema.js";
import {
  assertRecurringExpenseExists,
  normalizePaymentKind,
  normalizePaymentStatus,
  normalizePeriodKey,
  recomputeMortgageBalance,
  validatePaymentStatus,
} from "../services/recurring/paymentService.js";

const recurringPaymentsRouter = express.Router();

const parseAmount = (value) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const serializeDuplicateMainPayment = (res) =>
  res.status(409).json({ message: "main payment already exists" });

recurringPaymentsRouter.post("/", async (req, res) => {
  try {
    const recurringExpenseId = req.body.recurringExpenseId;
    const periodKey = normalizePeriodKey(req.body.periodKey);
    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
    const amount = parseAmount(req.body.amount);
    const kind = normalizePaymentKind(req.body.kind);
    const status = normalizePaymentStatus({ kind, status: req.body.status });
    const note = String(req.body.note || "").trim();

    if (!recurringExpenseId) {
      return res.status(400).json({ message: "recurringExpenseId required" });
    }

    if (!periodKey) {
      return res.status(400).json({ message: "periodKey invalid" });
    }

    if (amount == null) {
      return res.status(400).json({ message: "amount invalid" });
    }

    if (!validatePaymentStatus({ kind, status })) {
      return res.status(400).json({ message: "status invalid" });
    }

    const expenseExists = await assertRecurringExpenseExists(recurringExpenseId);
    if (!expenseExists) {
      return res.status(404).json({ message: "RecurringExpense not found" });
    }

    let payment;
    if (kind === "MAIN") {
      payment = await RecurringPayment.findOneAndUpdate(
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
        { upsert: true, new: true },
      ).lean();
    } else {
      const created = await RecurringPayment.create({
        recurringExpenseId,
        periodKey,
        paidDate,
        amount,
        status: "EXTRA",
        note,
        kind: "EXTRA",
      });

      payment = created.toObject();
    }

    await recomputeMortgageBalance(recurringExpenseId);

    return res.status(kind === "EXTRA" ? 201 : 200).json(payment);
  } catch (err) {
    if (err?.code === 11000) return serializeDuplicateMainPayment(res);

    console.error("Error in POST /api/recurring-payments:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringPaymentsRouter.put("/:id", async (req, res) => {
  try {
    const existing = await RecurringPayment.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Not found" });

    const patch = {};

    if (req.body.paidDate) {
      patch.paidDate = new Date(req.body.paidDate);
    }

    if (req.body.amount != null) {
      const amount = parseAmount(req.body.amount);
      if (amount == null) {
        return res.status(400).json({ message: "amount invalid" });
      }
      patch.amount = amount;
    }

    if (req.body.status) {
      const kind = normalizePaymentKind(existing.kind);
      const status = String(req.body.status).toUpperCase();

      if (!validatePaymentStatus({ kind, status })) {
        return res.status(400).json({ message: "status invalid" });
      }

      patch.status = status;
    }

    if (req.body.note != null) {
      patch.note = String(req.body.note).trim();
    }

    const updated = await RecurringPayment.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true },
    ).lean();

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

    const query = {};
    if (from || to) {
      query.periodKey = {};
      if (from) query.periodKey.$gte = from;
      if (to) query.periodKey.$lte = to;
    }

    const payments = await RecurringPayment.find(query)
      .sort({ periodKey: 1, paidDate: 1, createdAt: 1 })
      .lean();

    return res.json({ payments, meta: { totalRowCount: payments.length } });
  } catch (err) {
    console.error("Error in GET /api/recurring-payments:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

recurringPaymentsRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await RecurringPayment.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Not found" });

    await recomputeMortgageBalance(deleted.recurringExpenseId);

    return res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-payments/:id:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default recurringPaymentsRouter;
