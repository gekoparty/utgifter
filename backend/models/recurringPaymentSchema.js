// models/recurringPaymentSchema.js
import mongoose from "mongoose";

const RecurringPaymentSchema = new mongoose.Schema(
  {
    recurringExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      required: true,
      index: true,
    },

    // Accounting month for the payment ("YYYY-MM")
    periodKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },

    // Actual payment date (can be outside the period)
    paidDate: {
      type: Date,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "SKIPPED"],
      default: "PAID",
      index: true,
    },

    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

// Simple UX: 1 payment per bill per month.
// If you later want split payments, remove this unique index.
RecurringPaymentSchema.index(
  { recurringExpenseId: 1, periodKey: 1 },
  { unique: true }
);

const RecurringPayment = mongoose.model("RecurringPayment", RecurringPaymentSchema);
export default RecurringPayment;
