import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    measurementUnit: {
        type: String, // You can use an enum or validation to ensure valid units
        enum: ["l", "kg", "stk", "grams", "millilitres", "etc"],
        required: true,
      },
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand", // Reference to the "Brand" model
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

