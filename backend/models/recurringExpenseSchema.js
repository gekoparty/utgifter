// models/recurringExpenseSchema.js
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

    // day-of-month (1..28)
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
      index: true,
    },

    /**
     * ✅ NEW: interval billing
     * billingIntervalMonths:
     *  - 1 = monthly
     *  - 3 = every 3 months (quarterly)
     *  - 6 = every 6 months
     *  - 12 = yearly
     */
    billingIntervalMonths: {
      type: Number,
      required: true,
      enum: [1, 3, 6, 12],
      default: 1,
      index: true,
    },

    /**
     * ✅ NEW: anchor month (1..12)
     * If interval=3 and startMonth=2, the bill happens in Feb/May/Aug/Nov.
     * If interval=12 and startMonth=9, happens every Sep.
     */
    startMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: new Date().getMonth() + 1,
      index: true,
    },

    // Fixed monthly amount (for mortgage & truly monthly items)
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Optional estimate range for non-mortgage
    estimateMin: { type: Number, min: 0, default: 0 },
    estimateMax: { type: Number, min: 0, default: 0 },

    // Mortgage fields
    mortgageHolder: { type: String, trim: true, maxlength: 60, default: "" },
    mortgageKind: { type: String, trim: true, maxlength: 40, default: "" },
    remainingBalance: { type: Number, min: 0, default: 0 },
    interestRate: { type: Number, min: 0, max: 50, default: 0 },
    hasMonthlyFee: { type: Boolean, default: false },
    monthlyFee: { type: Number, min: 0, default: 0 },

    slug: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Unique: slug + type
RecurringExpenseSchema.index({ slug: 1, type: 1 }, { unique: true });

RecurringExpenseSchema.pre("validate", function (next) {
  if (!this.title) return next();
  this.slug = slugify(this.title, { lower: true, strict: true });
  next();
});

RecurringExpenseSchema.pre("save", function (next) {
  if (this.type === "HOUSING") this.type = "MORTGAGE";

  // fee logic
  if (!this.hasMonthlyFee) this.monthlyFee = 0;

  // normalize interval fields
  if (![1, 3, 6, 12].includes(Number(this.billingIntervalMonths))) {
    this.billingIntervalMonths = 1;
  }
  this.startMonth = Math.min(12, Math.max(1, Number(this.startMonth || 1)));

  // mortgage cleanup vs non-mortgage
  if (this.type !== "MORTGAGE") {
    this.mortgageHolder = "";
    this.mortgageKind = "";
    this.remainingBalance = 0;
    this.interestRate = 0;
    this.hasMonthlyFee = false;
    this.monthlyFee = 0;
  } else {
    // mortgages are basically monthly in practice
    this.billingIntervalMonths = 1;
    this.estimateMin = 0;
    this.estimateMax = 0;
  }

  next();
});

const RecurringExpense = mongoose.model("RecurringExpense", RecurringExpenseSchema);
export default RecurringExpense;
