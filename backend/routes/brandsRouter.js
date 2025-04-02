import express from "express";
import Brand from "../models/brandSchema.js";
import Product from "../models/productSchema.js";
import slugify from "slugify";

const brandsRouter = express.Router();

brandsRouter.get("/", async (req, res) => {
  try {
    // Destructure the expected query parameters
    const { columnFilters, globalFilter, sorting, start, size, ids } = req.query;

    // Begin building the Mongoose query
    let query = Brand.find();

    // Filter by ids if provided (expects a comma-separated list)
    if (ids) {
      const idsArray = ids.split(",").map(id => id.trim());
      query = query.where("_id").in(idsArray);
    }

    // Apply column filters (assumes filtering on the 'name' field)
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i"));
          }
          // Extend here for additional fields if needed.
        }
      });
    }

    // Apply global filter (searching on the 'name' field)
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.or([{ name: globalFilterRegex }]);
    }

    // Apply sorting if provided
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          // Ensure MongoDB sort matches the column ID
          const mongoField = id === "name" ? "name" : "_id";
          acc[mongoField] = desc ? -1 : 1;
          return acc;
        }, {});
        query = query.sort(sortObject);
      }
    }

    // Handle pagination: use start and size if provided
    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Brand.countDocuments(query.getFilter());
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query and return the results along with meta information
    const brands = await query.exec();
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
