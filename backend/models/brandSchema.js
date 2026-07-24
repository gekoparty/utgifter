// models/brandSchema.js
import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },
    products: [
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

brandSchema.index({ products: 1 });
brandSchema.index({ ownerUserId: 1, slug: 1 }, { unique: true });

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;

