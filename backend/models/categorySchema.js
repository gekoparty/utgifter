import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {  // Add the 'slug' field to the schema
      type: String,
      required: true,
      unique: true,
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

const Category = mongoose.model(
  "Category",
  categorySchema
);

export default Category;

