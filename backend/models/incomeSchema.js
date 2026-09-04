import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    incomeDate: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Lønn",
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

IncomeSchema.index({ ownerUserId: 1, incomeDate: -1 });

export default mongoose.model("Income", IncomeSchema);
