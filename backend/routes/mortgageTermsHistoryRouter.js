// routes/mortgageTermsHistoryRouter.js
import express from "express";
import MortgageTermsHistory from "../models/mortgageTermsHistorySchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";

const router = express.Router();

const normalizeDate = (v) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
};

router.get("/", async (req, res) => {
  try {
    const recurringExpenseId = req.query.recurringExpenseId;
    if (!recurringExpenseId) return res.status(400).json({ message: "recurringExpenseId required" });

    const rows = await MortgageTermsHistory.find({ recurringExpenseId })
      .sort({ fromDate: -1 })
      .lean();

    res.json({ rows, meta: { totalRowCount: rows.length } });
  } catch (err) {
    console.error("Error in GET /api/mortgage-terms-history:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create (or upsert by fromDate)
router.post("/", async (req, res) => {
  try {
    const recurringExpenseId = req.body.recurringExpenseId;
    const fromDate = normalizeDate(req.body.fromDate);

    if (!recurringExpenseId) return res.status(400).json({ message: "recurringExpenseId required" });
    if (!fromDate) return res.status(400).json({ message: "fromDate invalid" });

    const exp = await RecurringExpense.findById(recurringExpenseId).lean();
    if (!exp) return res.status(404).json({ message: "RecurringExpense not found" });
    if (exp.type !== "MORTGAGE") return res.status(400).json({ message: "Only MORTGAGE supported" });

    const payload = {
      recurringExpenseId,
      fromDate,

      mortgageHolder: String(req.body.mortgageHolder ?? "").trim(),
      mortgageKind: String(req.body.mortgageKind ?? "").trim(),

      amount: Number(req.body.amount ?? 0),
      interestRate: Number(req.body.interestRate ?? 0),
      hasMonthlyFee: Boolean(req.body.hasMonthlyFee),
      monthlyFee: Boolean(req.body.hasMonthlyFee) ? Number(req.body.monthlyFee ?? 0) : 0,

      remainingBalance: Number(req.body.remainingBalance ?? 0),
      note: String(req.body.note ?? "").trim(),
    };

    const doc = await MortgageTermsHistory.findOneAndUpdate(
      { recurringExpenseId, fromDate },
      { $set: payload },
      { upsert: true, new: true }
    ).lean();

    res.json(doc);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "duplicate" });
    console.error("Error in POST /api/mortgage-terms-history:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await MortgageTermsHistory.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /api/mortgage-terms-history/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
