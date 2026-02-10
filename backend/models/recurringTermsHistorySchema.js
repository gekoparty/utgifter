import mongoose from "mongoose";

const RecurringTermsHistorySchema = new mongoose.Schema(
  {
    recurringExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      required: true,
      index: true,
    },

    // Month start when these terms become active
    fromDate: { type: Date, required: true, index: true },

    // Generic terms
    amount: { type: Number, min: 0 },
    estimateMin: { type: Number, min: 0 },
    estimateMax: { type: Number, min: 0 },

    // Mortgage terms (optional)
    interestRate: { type: Number, min: 0, max: 50 },
    hasMonthlyFee: { type: Boolean },
    monthlyFee: { type: Number, min: 0 },
    remainingBalance: { type: Number, min: 0 },

    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

RecurringTermsHistorySchema.index(
  { recurringExpenseId: 1, fromDate: 1 },
  { unique: true }
);

export default mongoose.model("RecurringTermsHistory", RecurringTermsHistorySchema);