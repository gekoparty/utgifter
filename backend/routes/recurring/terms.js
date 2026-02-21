import express from "express";
import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";
import { periodKeyToMonthStart } from "./_shared.js";

const router = express.Router();

router.post("/:id/terms", async (req, res) => {
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

export default router;
