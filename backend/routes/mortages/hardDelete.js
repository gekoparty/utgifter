// routes/mortages/hardDelete.js
import express from "express";

import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

const router = express.Router();

const isMortgageType = (t) => {
  const s = String(t || "").toUpperCase();
  return s === "MORTGAGE" || s === "HOUSING";
};

// DELETE /api/mortgages/:id/hard
router.delete("/:id/hard", async (req, res) => {
  try {
    const { id } = req.params;

    const exp = await RecurringExpense.findById(id).lean();
    if (!exp) return res.status(404).json({ message: "Not found" });
    if (!isMortgageType(exp.type)) return res.status(400).json({ message: "Not a mortgage" });

    // Delete history tied to this recurringExpenseId
    await RecurringPayment.deleteMany({ recurringExpenseId: exp._id });
    await RecurringTermsHistory.deleteMany({ recurringExpenseId: exp._id });

    // Finally delete the expense itself
    await RecurringExpense.findByIdAndDelete(exp._id);

    return res.status(204).send();
  } catch (err) {
    console.error("Error in DELETE /api/mortgages/:id/hard:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/mortgages/purge-all  (DEV/TEST ONLY)
router.delete("/purge-all", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Disabled in production" });
    }

    const confirm = String(req.headers["x-confirm-purge"] || "");
    if (confirm !== "PURGE") {
      return res.status(400).json({ message: "Missing x-confirm-purge: PURGE" });
    }

    const mortgageExpenses = await RecurringExpense.find({
      type: { $in: ["MORTGAGE", "HOUSING"] },
    }).lean();

    const ids = mortgageExpenses.map((x) => x._id);
    if (ids.length === 0) return res.json({ deleted: 0 });

    await RecurringPayment.deleteMany({ recurringExpenseId: { $in: ids } });
    await RecurringTermsHistory.deleteMany({ recurringExpenseId: { $in: ids } });
    await RecurringExpense.deleteMany({ _id: { $in: ids } });

    return res.json({ deleted: ids.length });
  } catch (err) {
    console.error("Error in DELETE /api/mortgages/purge-all:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;