import express from "express";
import RecurringExpense from "../../models/recurringExpenseSchema.js";
import { periodKeyToMonthStart } from "./_shared.js";

const router = express.Router();

router.post("/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;

    const fromPk = String(req.body.from || "").trim();
    const toPk = String(req.body.to || "").trim();
    const note = String(req.body.note || "").trim();

    if (!/^\d{4}-\d{2}$/.test(fromPk) || !/^\d{4}-\d{2}$/.test(toPk)) {
      return res.status(400).json({ message: "from/to must be YYYY-MM" });
    }

    const from = periodKeyToMonthStart(fromPk);
    const to = periodKeyToMonthStart(toPk);
    if (!from || !to || from > to) return res.status(400).json({ message: "invalid range" });

    const updated = await RecurringExpense.findByIdAndUpdate(
      id,
      { $push: { pausePeriods: { from, to, note } } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in POST /api/recurring-expenses/:id/pause:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id/pause/:pauseId", async (req, res) => {
  try {
    const { id, pauseId } = req.params;

    const fromPk = String(req.body.from || "").trim();
    const toPk = String(req.body.to || "").trim();
    const note = String(req.body.note || "").trim();

    if (!/^\d{4}-\d{2}$/.test(fromPk) || !/^\d{4}-\d{2}$/.test(toPk)) {
      return res.status(400).json({ message: "from/to must be YYYY-MM" });
    }

    const from = periodKeyToMonthStart(fromPk);
    const to = periodKeyToMonthStart(toPk);
    if (!from || !to || from > to) return res.status(400).json({ message: "invalid range" });

    const updated = await RecurringExpense.findOneAndUpdate(
      { _id: id, "pausePeriods._id": pauseId },
      { $set: { "pausePeriods.$.from": from, "pausePeriods.$.to": to, "pausePeriods.$.note": note } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/recurring-expenses/:id/pause/:pauseId:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id/pause/:pauseId", async (req, res) => {
  try {
    const { id, pauseId } = req.params;

    const updated = await RecurringExpense.findByIdAndUpdate(
      id,
      { $pull: { pausePeriods: { _id: pauseId } } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error in DELETE /api/recurring-expenses/:id/pause/:pauseId:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
