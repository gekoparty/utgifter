import mongoose from "mongoose";

const receiptMatchAliasSchema = new mongoose.Schema(
  {
    phrase: { type: String, required: true, trim: true },
    normalizedPhrase: { type: String, required: true, trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    count: { type: Number, default: 1 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

receiptMatchAliasSchema.index(
  { normalizedPhrase: 1, product: 1, brand: 1, shop: 1 },
  { unique: true }
);
receiptMatchAliasSchema.index({ product: 1 });
receiptMatchAliasSchema.index({ brand: 1 });
receiptMatchAliasSchema.index({ shop: 1 });

const ReceiptMatchAlias = mongoose.model(
  "ReceiptMatchAlias",
  receiptMatchAliasSchema
);

export default ReceiptMatchAlias;
