import express from "express";
import Brand from "../models/brandSchema.js";
import slugify from "slugify";

const brandsRouter = express.Router();

brandsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    console.log("Received query parameters:");
    console.log("columnFilters:", columnFilters);
    console.log("globalFilter:", globalFilter);
    console.log("sorting:", sorting);
    console.log("start", start);
    console.log("size", size);

    let query = Brand.find();

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
      const totalRowCount = await Brand.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const brands = await query.exec();

      // Send response with both paginated data and total row count
      res.json({ brands, meta: { totalRowCount } });
    } else {
      // If not using pagination, just send the brands data
      const brands = await query.exec();
      res.json(brands);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

brandsRouter.post("/", async (req, res) => {
  console.log(req.body);
  try {
    const { name } = req.body;

    const slug = slugify(name, { lower: true });

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
  const { name } = req.body;

  try {
    // Check if the slug already exists for a different brand
    const existingBrandWithSlug = await Brand.findOne({
      slug: slugify(name, { lower: true }),
      _id: { $ne: id }, // Exclude the current brand from the check
    });

    if (existingBrandWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          slug: slugify(name, { lower: true }),
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
