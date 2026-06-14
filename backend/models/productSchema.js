// models/productSchema.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    category: { type: String, required: true, trim: true },

    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Variant" }],

    description: { type: String },

    slug: { type: String, required: true, unique: true },

    measurementUnit: {
      type: String,
      enum: ["l", "kg", "stk", "grams", "millilitres", "etc"],
      required: true,
    },

    // ✅ CHANGED: store as numbers
    measures: { type: [Number], default: [] },

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ brands: 1 });
productSchema.index({ variants: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
