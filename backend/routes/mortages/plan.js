import express from "express";
import dayjs from "dayjs";

import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

import { buildMortgagePlan } from "../../services/mortages/planService.js"
import { periodKeyToMonthStart } from "../../services/mortages/scheduleMath.js";

const router = express.Router();

const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";

router.get("/:id/plan", async (req, res) => {
  try {
    const { id } = req.params;

    const from = String(req.query.from || "").trim();
    const months = Math.min(
      600,
      Math.max(1, parseInt(String(req.query.months || "360"), 10) || 360)
    );

    if (!/^\d{4}-\d{2}$/.test(from)) return res.status(400).json({ message: "from must be YYYY-MM" });
    if (!periodKeyToMonthStart(from)) return res.status(400).json({ message: "invalid from" });

    const exp = await RecurringExpense.findById(id).lean();
    if (!exp) return res.status(404).json({ message: "Not found" });
    if (!isMortgageType(exp.type)) return res.status(400).json({ message: "Not a mortgage" });

    const toKey = dayjs(periodKeyToMonthStart(from))
      .add(months - 1, "month")
      .format("YYYY-MM");

    const payments = await RecurringPayment.find({
      recurringExpenseId: exp._id,
      periodKey: { $gte: from, $lte: toKey },
    }).lean();

    const termsArr = await RecurringTermsHistory.find({ recurringExpenseId: exp._id })
      .sort({ fromDate: 1 })
      .lean();

    const plan = buildMortgagePlan({
      expense: exp,
      termsArr,
      payments,
      from,
      months,
    });

    res.json({
      recurringExpenseId: String(exp._id),
      mortgage: {
        title: exp.title,
        mortgageHolder: exp.mortgageHolder,
        mortgageKind: exp.mortgageKind,
        dueDay: exp.dueDay,
      },
      ...plan,
    });
  } catch (err) {
    console.error("Error in GET /api/mortgages/:id/plan:", err);
    res.status(500).json({ message: "Internal Server Error", error: err?.message });
  }
});

export default router;
