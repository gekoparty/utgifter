// models/mortgageTermsHistorySchema.js
import mongoose from "mongoose";

const MortgageTermsHistorySchema = new mongoose.Schema(
  {
    recurringExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      required: true,
      index: true,
    },

    // Effective from this date (we'll use monthStart comparisons)
    fromDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Terms snapshot (only what can change)
    mortgageHolder: { type: String, trim: true, maxlength: 60, default: "" },
    mortgageKind: { type: String, trim: true, maxlength: 40, default: "" },

    amount: { type: Number, min: 0, default: 0 }, // expected monthly payment
    interestRate: { type: Number, min: 0, max: 50, default: 0 },
    hasMonthlyFee: { type: Boolean, default: false },
    monthlyFee: { type: Number, min: 0, default: 0 },

    // optional but useful for month-by-month derived display
    remainingBalance: { type: Number, min: 0, default: 0 },

    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicates for the same effective month/day
MortgageTermsHistorySchema.index(
  { recurringExpenseId: 1, fromDate: 1 },
  { unique: true }
);

const MortgageTermsHistory = mongoose.model(
  "MortgageTermsHistory",
  MortgageTermsHistorySchema
);

export default MortgageTermsHistory;
