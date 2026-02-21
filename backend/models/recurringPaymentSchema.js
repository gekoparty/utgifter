import mongoose from "mongoose";

const RecurringPaymentSchema = new mongoose.Schema(
  {
    recurringExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      required: true,
      index: true,
    },

    periodKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },

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

    // ✅ allow EXTRA
    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "SKIPPED", "EXTRA"],
      default: "PAID",
      index: true,
    },

    // ✅ NEW: explicit kind
    kind: {
      type: String,
      enum: ["MAIN", "EXTRA"],
      default: "MAIN",
      index: true,
    },

    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

// ✅ allow one MAIN + one EXTRA per month
RecurringPaymentSchema.index(
  { recurringExpenseId: 1, periodKey: 1, kind: 1 },
  { unique: true }
);

export default mongoose.model("RecurringPayment", RecurringPaymentSchema);




