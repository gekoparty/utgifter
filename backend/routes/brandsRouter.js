import express from "express";
import Brand from "../models/brandSchema.js";

const brandsRouter = express.Router();

brandsRouter.get("/", async (req, res) => {
    try {
      const brands = await Brand.find();
      res.json(brands);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
  
  brandsRouter.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { originalPayload, slugifiedPayload } = req.body;
      const name = originalPayload.name;
      const slug = slugifiedPayload.name;
  
      const existingBrand = await Brand.findOne({ slug });
      if (existingBrand) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const brand = new Brand({
        name,
        slug, // Save the slug to the database
      });
  
      await brand.save();
      res.status(201).json(brand);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  brandsRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
      const brand = await Brand.findByIdAndDelete(req.params.id);
      if (!brand) {
        return res.status(404).send({ error: "Brand not found" });
      }
      res.send(brand);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });
  
  brandsRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { originalPayload, slugifiedPayload } = req.body;
  
    try {
      // Check if the slug already exists for a different brand
      const existingBrandWithSlug = await Brand.findOne({
        slug: slugifiedPayload.name,
        _id: { $ne: id }, // Exclude the current brand from the check
      });
  
      if (existingBrandWithSlug) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const brand = await Brand.findByIdAndUpdate(
        id,
        {
          $set: {
            name: originalPayload.name,
            slug: slugifiedPayload.name,
          },
        },
        { new: true }
      );
  
      if (!brand) {
        return res.status(404).send({ error: "Brand not found" });
      }
  
      res.send(brand);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });


export default brandsRouter;