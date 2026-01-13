import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    // Category (e.g. Soda, Juice, Snacks)
    category: { type: String, required: false },

    // Variants (e.g. Original, Light, Zero)
    variants: { type: [String], default: [] },

    description: { type: String },

    slug: { type: String, required: true, unique: true },

    measurementUnit: {
      type: String,
      enum: ["l", "kg", "stk", "grams", "millilitres", "etc"],
      required: true,
    },

    // ✅ store as strings because UI allows "0.5", "500ml", etc.
    measures: { type: [String], default: [] },

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;

