import express from "express";
import RecurringExpense from "../../models/recurringExpenseSchema.js";
import {
  createInitialTermsSnapshot,
  normalizeRecurringExpensePayload,
} from "../../services/recurring/expenseService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || "false") === "true";
    const query = includeInactive ? {} : { isActive: true };

    const expenses = await RecurringExpense.find(query)
      .sort({ type: 1, title: 1 })
      .lean();

    res.json({ expenses, meta: { totalRowCount: expenses.length } });
  } catch (err) {
    console.error("Error in /api/recurring-expenses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const expense = await RecurringExpense.findById(req.params.id).lean();
    if (!expense) return res.status(404).json({ message: "Not found" });
    res.json(expense);
  } catch (err) {
    console.error("Error in GET /api/recurring-expenses/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizeRecurringExpensePayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Tittel er påkrevd" });
    }

    const existing = await RecurringExpense.findOne({
      slug: payload.slug,
      type: payload.type,
    });
    if (existing) return res.status(400).json({ message: "duplicate" });

    const created = await RecurringExpense.create(payload);
    await createInitialTermsSnapshot(created);

    res.status(201).json(created);
  } catch (err) {
    console.error("Error in POST /api/recurring-expenses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeRecurringExpensePayload(req.body);

    if (!payload.title) {
      return res.status(400).json({ message: "Tittel er påkrevd" });
    }

    const existing = await RecurringExpense.findOne({
      slug: payload.slug,
      type: payload.type,
      _id: { $ne: id },
    });
    if (existing) return res.status(400).json({ message: "duplicate" });

    const updated = await RecurringExpense.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true },
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/recurring-expenses/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/:id/archive", async (req, res) => {
  try {
    const expense = await RecurringExpense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Not found" });

    expense.isActive = false;
    expense.endDate = new Date();
    await expense.save();

    res.json(expense.toObject());
  } catch (err) {
    console.error("Error in POST /api/recurring-expenses/:id/archive:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/:id/restore", async (req, res) => {
  try {
    const updated = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true, endDate: null } },
      { new: true },
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in PATCH /api/recurring-expenses/:id/restore:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
