import mongoose from "mongoose";
import slugify from "slugify";

const RecurringExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 80,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["MORTGAGE", "UTILITY", "INSURANCE", "SUBSCRIPTION"],
      index: true,
    },

    // ✅ allow 31 in DB (mortgages can be 29/30/31)
    dueDay: { type: Number, required: true, min: 1, max: 31, index: true },

    billingIntervalMonths: {
      type: Number,
      required: true,
      enum: [1, 3, 6, 12],
      default: 1,
      index: true,
    },

    startMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: new Date().getMonth() + 1,
    },

    amount: { type: Number, required: true, min: 0, default: 0 },
    estimateMin: { type: Number, min: 0, default: 0 },
    estimateMax: { type: Number, min: 0, default: 0 },

    mortgageHolder: { type: String, trim: true, maxlength: 60, default: "" },
    mortgageKind: { type: String, trim: true, maxlength: 40, default: "" },

    initialBalance: { type: Number, min: 0, default: 0 },
    remainingBalance: { type: Number, min: 0, default: 0 },

    interestRate: { type: Number, min: 0, max: 50, default: 0 },
    hasMonthlyFee: { type: Boolean, default: false },
    monthlyFee: { type: Number, min: 0, default: 0 },

    // ✅ NEW: first payment month used by MortgageCenter
    // format: "YYYY-MM"
    firstPaymentMonth: { type: String, trim: true, default: "" },

    slug: { type: String, required: true, index: true },

    /**
     * ⭐ NEW — lifecycle
     */
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null, index: true },

    pausePeriods: [
      {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

RecurringExpenseSchema.index({ slug: 1, type: 1 }, { unique: true });

RecurringExpenseSchema.pre("validate", function (next) {
  if (!this.title) return next();
  this.slug = slugify(this.title, { lower: true, strict: true });
  next();
});

RecurringExpenseSchema.pre("save", function (next) {
  if (this.type === "HOUSING") this.type = "MORTGAGE";
  if (!this.hasMonthlyFee) this.monthlyFee = 0;

  // ✅ clamp dueDay:
  // - legacy bills: max 28
  // - mortgages: max 31 (then scheduleMath clamps to month length)
  const rawDue = Number(this.dueDay || 1);
  const maxDue = this.type === "MORTGAGE" ? 31 : 28;
  this.dueDay = Math.min(maxDue, Math.max(1, rawDue));

  if (![1, 3, 6, 12].includes(Number(this.billingIntervalMonths))) {
    this.billingIntervalMonths = 1;
  }

  if (this.type !== "MORTGAGE") {
    this.mortgageHolder = "";
    this.mortgageKind = "";
    this.initialBalance = 0;
    this.remainingBalance = 0;
    this.interestRate = 0;
    this.hasMonthlyFee = false;
    this.monthlyFee = 0;
    this.firstPaymentMonth = ""; // ✅ not used
  } else {
    this.billingIntervalMonths = 1;
    this.estimateMin = 0;
    this.estimateMax = 0;

    if (!this.initialBalance && this.remainingBalance)
      this.initialBalance = this.remainingBalance;

    if (!this.remainingBalance && this.initialBalance)
      this.remainingBalance = this.initialBalance;

    // optional: ensure format if present
    if (this.firstPaymentMonth && !/^\d{4}-\d{2}$/.test(String(this.firstPaymentMonth))) {
      this.firstPaymentMonth = "";
    }
  }

  next();
});

export default mongoose.model("RecurringExpense", RecurringExpenseSchema);


