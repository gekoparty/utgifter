import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  productName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  brandName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
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
  pricePerUnit: {
    type: Number, 
    required: false,
  },
  purchased: {
    type: Boolean,
    required: true,
    default: false,
  },
  shopName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: false,
    default: null, // Ensure it remains null if not set
  },
  registeredDate: {
    type: Date,
    required: false,
    default: null
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
  discountAmount: {
    type: Number,
    required: false,
  },
  finalPrice: {
    type: Number,
    required: true,
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
  locationName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false,
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
