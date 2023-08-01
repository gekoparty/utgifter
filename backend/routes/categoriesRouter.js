import express from "express";
import Category from "../models/categorySchema.js";

const categoriesRouter = express.Router()

categoriesRouter.get("/", async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
  
  categoriesRouter.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { originalPayload, slugifiedPayload } = req.body;
      const name = originalPayload.name;
      const slug = slugifiedPayload.name;
  
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const category = new Category
      ({
        name,
        slug, // Save the slug to the database
      });
  
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  categoriesRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).send({ error: "Category not found" });
      }
      res.send(category);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });
  
  categoriesRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { originalPayload, slugifiedPayload } = req.body;
  
    try {
      // Check if the slug already exists for a different brand
      const existingCategoryWithSlug = await Category.findOne({
        slug: slugifiedPayload.name,
        _id: { $ne: id }, // Exclude the current brand from the check
      });
  
      if (existingCategoryWithSlug) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const category = await Category.findByIdAndUpdate(
        id,
        {
          $set: {
            name: originalPayload.name,
            slug: slugifiedPayload.name,
          },
        },
        { new: true }
      );
  
      if (!category) {
        return res.status(404).send({ error: "Category not found" });
      }
  
      res.send(category);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  export default categoriesRouter;