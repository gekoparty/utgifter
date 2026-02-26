import express from "express";
import Brand from "../models/brandSchema.js";
import Product from "../models/productSchema.js";
import slugify from "slugify";

const brandsRouter = express.Router();

/**
 * GET /api/brands
 * Supports:
 *  - FAST: /api/brands?ids=a,b,c
 *  - TABLE: columnFilters/globalFilter/sorting/start/size
 *  - Optional SEARCH: /api/brands?query=xxx&limit=20
 *
 * IMPORTANT: if none of these are provided, return [].
 */
brandsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size, ids, query, limit } = req.query;

    // FAST PATH: ids
    if (ids) {
      const idsArray = String(ids)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const brands = await Brand.find({ _id: { $in: idsArray } })
        .select("_id name slug") // ✅ include _id
        .lean();

      return res.json({ brands, meta: { totalRowCount: brands.length } });
    }

    // Optional: lightweight search
    if (query) {
      const q = String(query).trim();
      const lim = Math.min(Number(limit) || 20, 50);
      if (q.length < 2) return res.json({ brands: [], meta: { totalRowCount: 0 } });

      const brands = await Brand.find({ name: { $regex: q, $options: "i" } })
        .select("_id name slug") // ✅ include _id
        .limit(lim)
        .lean();

      return res.json({ brands, meta: { totalRowCount: brands.length } });
    }

    // TABLE MODE
    const hasTableParams =
      columnFilters || globalFilter || sorting || start !== undefined || size !== undefined;

    if (!hasTableParams) {
      return res.json({ brands: [], meta: { totalRowCount: 0 } });
    }

    let mongooseQuery = Brand.find();

    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            mongooseQuery = mongooseQuery.where("name").regex(new RegExp(value, "i"));
          }
        }
      });
    }

    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      mongooseQuery = mongooseQuery.or([{ name: globalFilterRegex }]);
    }

    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          const mongoField = id === "name" ? "name" : "_id";
          acc[mongoField] = desc ? -1 : 1;
          return acc;
        }, {});
        mongooseQuery = mongooseQuery.sort(sortObject);
      }
    }

    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Brand.countDocuments(mongooseQuery.getFilter());
      mongooseQuery = mongooseQuery.skip(startIndex).limit(pageSize);
    } else {
      mongooseQuery = mongooseQuery.limit(50);
    }

    const brands = await mongooseQuery.select("_id name slug").lean().exec(); // ✅ include _id
    res.json({ brands, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/brands:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/brands/recent?limit=20
 */
brandsRouter.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const brands = await Brand.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id name slug") // ✅ include _id
      .lean();

    res.json({ brands, meta: { totalRowCount: brands.length } });
  } catch (err) {
    console.error("Error in /api/brands/recent:", err);
    res.status(500).json({ error: err.message });
  }
});

brandsRouter.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).send({ error: "Brand not found" });
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

    const brand = new Brand({ name, slug });
    await brand.save();

    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

brandsRouter.delete("/:id", async (req, res) => {
  try {
    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
    if (!deletedBrand) return res.status(404).send({ error: "Brand not found" });

    const productsToUpdate = await Product.find({ brands: deletedBrand._id });
    await Promise.all(
      productsToUpdate.map(async (product) => {
        product.brands = product.brands.filter(
          (brandId) => brandId.toString() !== deletedBrand._id.toString()
        );
        await product.save();
      })
    );

    res.send(deletedBrand);
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

brandsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const newSlug = slugify(name, { lower: true });

    const existingBrandWithSlug = await Brand.findOne({
      slug: newSlug,
      _id: { $ne: id },
    });

    if (existingBrandWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      { $set: { name, slug: newSlug } },
      { new: true }
    );

    if (!brand) return res.status(404).send({ error: "Brand not found" });

    res.send(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default brandsRouter;