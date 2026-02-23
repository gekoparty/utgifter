// routes/recurring/purge.js
import express from "express";

import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

const router = express.Router();

/**
 * DELETE /api/recurring-expenses/purge-all
 * DEV/TEST ONLY
 * Deletes ALL recurring "mal", payments and terms history.
 */
router.delete("/purge-all", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Disabled in production" });
    }

    const confirm = String(req.headers["x-confirm-purge"] || "");
    if (confirm !== "PURGE") {
      return res.status(400).json({ message: "Missing x-confirm-purge: PURGE" });
    }

    const [payments, terms, expenses] = await Promise.all([
      RecurringPayment.deleteMany({}),
      RecurringTermsHistory.deleteMany({}),
      RecurringExpense.deleteMany({}),
    ]);

    return res.json({
      ok: true,
      deleted: {
        payments: payments.deletedCount || 0,
        termsHistory: terms.deletedCount || 0,
        expenses: expenses.deletedCount || 0,
      },
    });
  } catch (err) {
    console.error("Error in DELETE /api/recurring-expenses/purge-all:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;