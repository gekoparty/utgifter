import express from "express";
import Brand from "../models/brandSchema.js";
import Product from "../models/productSchema.js";
import slugify from "slugify";

const brandsRouter = express.Router();

brandsRouter.get("/", async (req, res) => {
  try {
    // Log incoming query parameters for debugging.
    const { columnFilters, globalFilter, sorting, start, size, page, limit, ids } = req.query;

    // Compute pagination parameters.
    let computedStart, computedSize;
    if (page && limit) {
      // If infinite scroll parameters are provided, convert them to start and size.
      computedStart = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      computedSize = parseInt(limit, 10);
    } else {
      computedStart = start !== undefined ? parseInt(start, 10) : 0;
      computedSize = size !== undefined ? parseInt(size, 10) : 20; // Default size if not provided.
    }

    // Start building the Mongoose query.
    let query = Brand.find();

    // <-- NEW: Filter by ids if provided
    if (ids) {
      // Expecting a comma separated list of ids.
      const idsArray = ids.split(",").map(id => id.trim());
      query = query.where("_id").in(idsArray);
    }

    // Apply columnFilters (assumes filtering on the 'name' field).
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            // Use a case-insensitive regular expression.
            query = query.where("name").regex(new RegExp(value, "i"));
          }
          // Extend here for additional fields if necessary.
        }
      });
    }

    // Apply globalFilter.
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      // Search on the 'name' field. Add other fields as needed.
      query = query.or([{ name: globalFilterRegex }]);
    }

    // Apply sorting.
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        // Build the sorting object (e.g., { name: 1 } or { name: -1 }).
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          acc[id] = desc ? -1 : 1;
          return acc;
        }, {});
        query = query.sort(sortObject);
      }
    }

    // Count total matching documents based on the current filter.
    const totalRowCount = await Brand.countDocuments(query.getFilter());

    // Apply pagination.
    query = query.skip(computedStart).limit(computedSize);

    // Execute the query.
    const brands = await query.exec();

    // Return the data with meta information.
    res.json({ brands, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/brands:", err);
    res.status(500).json({ error: err.message });
  }
});


brandsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).send({ error: "Brand not found" });
    }

    res.json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

brandsRouter.post("/", async (req, res) => {
  
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
  try {
    // Find and delete the brand
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (!deletedBrand) {
      return res.status(404).send({ error: "Brand not found" });
    }
    
    // Update products referencing the deleted brand
    const productsToUpdate = await Product.find({ brands: deletedBrand._id });
    await Promise.all(productsToUpdate.map(async (product) => {
      product.brands = product.brands.filter(brandId => brandId.toString() !== deletedBrand._id.toString());
      await product.save();
    }));
    
    res.send(deletedBrand);
  } catch (error) {
    console.error("Error deleting brand:", error);
    return res.status(500).send({ error: "Internal server error" });
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
