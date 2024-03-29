import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    Product: {
      type: String,
      required: true,
      unique: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    unitMeasurement: {
      type: String,
      required: true,
    },
    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    purchased: {
      type: Boolean,
      required: true,
      default: false,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ Product: 1, brand: 1, shop: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
