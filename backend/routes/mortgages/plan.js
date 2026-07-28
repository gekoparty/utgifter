import express from "express";
import dayjs from "dayjs";

import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";
import { ownedFilter } from "../../middleware/dataOwnership.js";

import { buildMortgagePlan } from "../../services/mortgages/planService.js";
import {
  isMortgageType,
  periodKeyToMonthStart,
  round2,
} from "../../services/recurring/scheduleService.js";

const router = express.Router();

const isExtraPayment = (payment) =>
  String(payment?.status || "").toUpperCase() === "EXTRA";

const buildExtraPaymentSummary = ({ plan, baselinePlan, payments }) => {
  const totalExtraPaid = round2(
    (payments || [])
      .filter(isExtraPayment)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  );

  const interestSaved = round2(
    Number(baselinePlan?.totals?.totalInterest || 0) -
      Number(plan?.totals?.totalInterest || 0)
  );

  const feesSaved = round2(
    Number(baselinePlan?.totals?.totalFees || 0) -
      Number(plan?.totals?.totalFees || 0)
  );

  const planMonths = plan?.monthsToPayoff ?? null;
  const baselineMonths = baselinePlan?.monthsToPayoff ?? null;
  const monthsSaved =
    planMonths != null && baselineMonths != null
      ? Math.max(0, Number(baselineMonths) - Number(planMonths))
      : null;

  return {
    totalExtraPaid,
    interestSaved: Math.max(0, interestSaved),
    feesSaved: Math.max(0, feesSaved),
    monthsSaved,
    payoffWithExtra: plan?.payoffPeriodKey || null,
    payoffWithoutExtra: baselinePlan?.payoffPeriodKey || null,
    monthsToPayoffWithExtra: planMonths,
    monthsToPayoffWithoutExtra: baselineMonths,
    hasPayoffComparison: planMonths != null && baselineMonths != null,
  };
};

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

    const exp = await RecurringExpense.findOne(ownedFilter(req, { _id: id })).lean();
    if (!exp) return res.status(404).json({ message: "Not found" });
    if (!isMortgageType(exp.type)) return res.status(400).json({ message: "Not a mortgage" });

    const toKey = dayjs(periodKeyToMonthStart(from))
      .add(months - 1, "month")
      .format("YYYY-MM");

    const payments = await RecurringPayment.find({
      ...ownedFilter(req),
      recurringExpenseId: exp._id,
      periodKey: { $gte: from, $lte: toKey },
    }).lean();

    const termsArr = await RecurringTermsHistory.find(ownedFilter(req, { recurringExpenseId: exp._id }))
      .sort({ fromDate: 1 })
      .lean();

    const plan = buildMortgagePlan({
      expense: exp,
      termsArr,
      payments,
      from,
      months,
    });

    const baselinePlan = buildMortgagePlan({
      expense: exp,
      termsArr,
      payments: payments.filter((payment) => !isExtraPayment(payment)),
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
      extraPaymentSummary: buildExtraPaymentSummary({
        plan,
        baselinePlan,
        payments,
      }),
      ...plan,
    });
  } catch (err) {
    console.error("Error in GET /api/mortgages/:id/plan:", err);
    res.status(500).json({ message: "Internal Server Error", error: err?.message });
  }
});

export default router;
