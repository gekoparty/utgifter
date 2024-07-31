import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Reference the 'Location' model
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    slugifiedName: {
      type: String,
      required: true,
    },
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
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

// Create a unique compound index on name and location
shopSchema.index({ name: 1, location: 1 }, { unique: true });

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
