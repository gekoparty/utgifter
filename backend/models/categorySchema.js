import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {  // Add the 'slug' field to the schema
      type: String,
      required: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },
    expenses: [
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

categorySchema.index({ ownerUserId: 1, slug: 1 }, { unique: true });

const Category = mongoose.model(
  "Category",
  categorySchema
);

export default Category;

