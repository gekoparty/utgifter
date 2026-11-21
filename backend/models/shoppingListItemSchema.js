import mongoose from "mongoose";

const shoppingListItemSchema = new mongoose.Schema({
  _id: String,
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  brandId: { type: String, default: "" },
  variantId: { type: String, default: "" },
  name: { type: String, required: true },
  details: { type: String, default: "" },
  checked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

export default mongoose.model("ShoppingListItem", shoppingListItemSchema);
