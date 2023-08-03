import express from "express";
import Product from "../models/productSchema.js";
import Brand from '../models/brandSchema.js'

const productsRouter = express.Router();

productsRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("brand");
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

productsRouter.post("/", async (req, res) => {
  console.log(req.body);
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const { name, brand } = originalPayload;
    let brandId = brand;
    //let categoryId = category // Use the existing locationId parameter

    if(typeof brand === "string") {
      const existingBrand = await Brand.findOne({
          slug: slugifiedPayload.brand
      });

      if(!existingBrand) {
          const newBrand = new Brand({
              name: originalPayload.brand,
              slug: slugifiedPayload.brand
          });

          const savedBrand = await newBrand.save();
          brandId = savedBrand._id
      } else {
          brandId = existingBrand._id;
      }
    }  


    /* // Check if the location and category is provided as a string (name) instead of a reference
    if (typeof location === "string") {
      const existingLocation = await Location.findOne({
        slug: slugifiedPayload.location,
      });

      if (!existingLocation) {
        const newLocation = new Location({
          name: originalPayload.location,
          slug: slugifiedPayload.location,
        });

        const savedLocation = await newLocation.save();
        locationId = savedLocation._id; // Reassign the locationId using let
      } else {
        locationId = existingLocation._id; // Reassign the locationId using let
      }
    } */

    const slugifiedName = slugifiedPayload.name;
    const slugifiedBrand = slugifiedPayload.brand;

    // Check if a shop with the same name already exists
    const existingProduct = await Product.findOne({
      slugifiedName,
    });

    if (existingProduct) {
      // Check if the shop with the same name and location already exists
      const existingProductWithBrand = await Product.findOne({
        slugifiedName,
        brand: brandId,
      });

      if (existingProductWithBrand) {
        return res.status(400).json({ message: "duplicate" });
      }
    }

    const product = new Product({
      name,
      brand: brandId,
      //category: categoryId,
      slugifiedName,
    });

    try {
      const savedProduct = await product.save();
      console.log("Saved product:", savedProduct);

      // Fetch the associated location document using populate
      const populatedProduct = await Product.findById(savedProduct._id).populate("brand").exec();

      res.status(201).json(populatedProduct);
    } catch (saveError) {
      console.error("Error saving product:", saveError);
      res.status(500).json({ message: "Error saving product" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default productsRouter;