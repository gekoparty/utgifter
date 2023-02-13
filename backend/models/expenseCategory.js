import mongoose from "mongoose";

const expenseCategorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ExpenseCategory = mongoose.model(
  "ExpenseCategory",
  expenseCategorySchema
);

export default ExpenseCategory;
