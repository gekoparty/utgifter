// models/productSchema.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    category: { type: String, required: false },

    // ✅ reference Variant collection
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Variant" }],

    description: { type: String },

    slug: { type: String, required: true, unique: true },

    measurementUnit: {
      type: String,
      enum: ["l", "kg", "stk", "grams", "millilitres", "etc"],
      required: true,
    },

    measures: { type: [String], default: [] },

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;

