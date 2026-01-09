import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    // NEW: category (what your current "type" really is)
    category: { type: String, required: false }, // temporarily optional for migration

    // NEW: type becomes variant/flavor
    type: { type: String, required: false }, // temporarily optional for migration

    // OPTIONAL: keep old field for a while (so old code still works)
    legacyType: { type: String, required: false }, // will store old "type" (food/drinks)

    description: { type: String },

    slug: { type: String, required: true, unique: true },

    measurementUnit: {
      type: String,
      enum: ["l", "kg", "stk", "grams", "millilitres", "etc"],
      required: true,
    },

    measures: { type: [Number], default: [] },

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;

