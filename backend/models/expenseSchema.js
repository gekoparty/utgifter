import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    unique: true,
  },
  brandName: {
    type: String,
    required: true,
  },
  measurementUnit: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
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
  shopName: {
    type: String,
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: false,
  },
  registeredDate: {
    type: Date,
    required: false,
  },
  hasDiscount: {
    type: Boolean,
    required: true,
    default: false,
  },
  discountValue: {
    type: Number,
    required: false,
    default: 0,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  volume: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

expenseSchema.index({ productName: 1, brandName: 1, shopName: 1 });

expenseSchema.pre('validate', function(next) {
  if (!this.purchaseDate && !this.registeredDate) {
    next(new Error('Either purchaseDate or registeredDate must be provided.'));
  } else {
    next();
  }
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
