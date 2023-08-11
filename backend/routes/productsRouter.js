import express from "express";
import slugify from 'slugify'
import Product from "../models/productSchema.js";
import Brand from '../models/brandSchema.js';

const productsRouter = express.Router();

productsRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("brands");
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

productsRouter.post("/", async (req, res) => {
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const { name, brands, measurementUnit } = originalPayload;
    const brandIds = [];

    for (const brandObj of brands) {
      if (typeof brandObj.name === "string") {
        const slugifiedBrandName = slugify(brandObj.name, { lower: true }); // Slugify the brand name

        const existingBrand = await Brand.findOne({
          slug: slugifiedBrandName,
        });

        let brandId;

        if (!existingBrand) {
          const newBrand = new Brand({
            name: brandObj.name,
            slug: slugifiedBrandName,
          });

          const savedBrand = await newBrand.save();
          brandId = savedBrand._id;
        } else {
          brandId = existingBrand._id;
        }

        brandIds.push(brandId);
      }
    }

    const existingProduct = await Product.findOne({
      slug: slugifiedPayload.name,
    });

    if (existingProduct) {
      const existingProductWithBrands = await Product.findOne({
        slug: slugifiedPayload.name,
        brands: { $in: brandIds },
      });

      if (existingProductWithBrands) {
        return res.status(400).json({ message: "duplicate" });
      }
    }

    const product = new Product({
      name,
      measurementUnit,
      brands: brandIds,
      slug: slugifiedPayload.name,
    });

    try {
      console.log(product);

      const savedProduct = await product.save();
      console.log("Saved product:", savedProduct);

      const populatedProduct = await Product.findById(savedProduct._id).populate("brands").exec();

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

