// models/variantSchema.js
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// ✅ unique only within the same product
variantSchema.index({ product: 1, slug: 1 }, { unique: true });
variantSchema.index({ product: 1, name: 1 }, { unique: true });

const Variant = mongoose.model("Variant", variantSchema);
export default Variant;

