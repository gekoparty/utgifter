import express from "express";
import slugify from "slugify";
import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

const router = express.Router();

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

router.get("/", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const exp = await RecurringExpense.findById(req.params.id).lean();
    if (!exp) return res.status(404).json({ message: "Not found" });
    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    if (!payload.title) return res.status(400).json({ message: "Tittel er påkrevd" });

    const existing = await RecurringExpense.findOne({ slug: payload.slug, type: payload.type });
    if (existing) return res.status(400).json({ message: "duplicate" });

    const created = await RecurringExpense.create(payload);

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

router.put("/:id", async (req, res) => {
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

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/:id/archive", async (req, res) => {
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

router.patch("/:id/restore", async (req, res) => {
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

export default router;
