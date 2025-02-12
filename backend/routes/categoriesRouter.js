import express from "express";
import Category from "../models/categorySchema.js";
import slugify from "slugify";

const categoriesRouter = express.Router();

categoriesRouter.get("/", async (req, res) => {
  try {
    console.log("Categories GET params:", req.query);
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Category.find();

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i"));
          }
        }
      });
    }

    // Global Filter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.or([{ name: globalFilterRegex }]);
    }

    // Sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          acc[id] = desc ? -1 : 1;
          return acc;
        }, {});
        console.log("Applying sort:", sortObject);
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Category.countDocuments(query.getFilter());
      console.log("Total matching categories:", totalRowCount);
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const categories = await query.exec();
    console.log("Fetched categories:", categories);

    res.json({ categories, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/categories:", err);
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

categoriesRouter.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

categoriesRouter.post("/", async (req, res) => {
  
  try {
    const { name } = req.body;
    const slug = slugify(name, { lower: true });

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ message: "duplicate" });
    }

    const category = new Category({
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
  const { name } = req.body;

  try {
    // Check if the slug already exists for a different brand
    const existingCategoryWithSlug = await Category.findOne({
      slug: slugify(name, { lower: true }),
      _id: { $ne: id }, // Exclude the current brand from the check
    });

    if (existingCategoryWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          slug: slugify(name, { lower: true }),
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
