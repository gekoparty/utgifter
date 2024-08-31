import express from "express";
import Category from "../models/categorySchema.js";
import slugify from "slugify";

const categoriesRouter = express.Router();

categoriesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Category.find();

    // Apply columnFilters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach((filter) => {
        const { id, value } = filter;
        if (id && value) {
          const fieldFilter = {};
          fieldFilter[id] = new RegExp(`^${value}`, "i");
          query = query.where(fieldFilter);
        }
      });
    }

    // Apply globalFilter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.find({
        $or: [
          { name: globalFilterRegex }, // Assuming 'name' is a field in your data
          // Add other fields here that you want to include in the global filter
        ],
      });
    }

    // Apply sorting

    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortConfig = parsedSorting[0]; // Assuming you only have one sorting option
        const { id, desc } = sortConfig;

        // Build the sorting object
        const sortObject = {};
        sortObject[id] = desc ? -1 : 1;

        query = query.sort(sortObject);
      }
    }

    // Apply pagination
    if (start && size) {
      const startIndex = parseInt(start);
      const pageSize = parseInt(size);

      // Query total row count before pagination
      const totalRowCount = await Category.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const categories = await query.exec();

      // Send response with both paginated data and total row count
      res.json({ categories, meta: { totalRowCount } });
    } else {
      // If not using pagination, just send the brands data
      const categories = await query.exec();
      res.json(categories);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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
