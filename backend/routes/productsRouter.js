import express from "express";
import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";

const productsRouter = express.Router();

// Helper function for consistent slug generation
const createSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

// Helper function for brand resolution (used in both POST and PUT)
const resolveBrandIds = async (brandNames) => {
  if (!Array.isArray(brandNames)) {
    throw new Error("Brands must be an array");
  }

  return Promise.all(
    brandNames.map(async (name) => {
      const trimmedName = String(name ?? "").trim();
      if (!trimmedName) return null;

      const slug = createSlug(trimmedName);

      const brand = await Brand.findOneAndUpdate(
        { slug, name: trimmedName },
        { $setOnInsert: { name: trimmedName, slug } },
        { new: true, upsert: true }
      );

      return brand._id;
    })
  ).then((ids) => ids.filter(Boolean));
};

// Normalize variants coming from client
const normalizeVariants = (body) => {
  // preferred: array
  if (Array.isArray(body?.variants)) {
    return body.variants.map((v) => String(v).trim()).filter(Boolean);
  }

  // legacy support: single string "Original" or "Original, Zero"
  if (typeof body?.variant === "string") {
    return body.variant
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeMeasures = (measures) => {
  if (!Array.isArray(measures)) return [];
  return measures.map((m) => String(m).trim()).filter(Boolean);
};

// -------------------- GET --------------------
productsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Product.find();

    // Apply column filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);

      for (const { id, value } of filters) {
        if (!id || value === undefined || value === null || value === "") continue;

        if (id === "name") {
          query = query.where("name").regex(new RegExp(value, "i"));
        } else if (id === "brand") {
          const matchingBrands = await Brand.find({
            name: { $regex: new RegExp(value, "i") },
          }).select("_id");

          const brandIds = matchingBrands.map((b) => b._id);
          query = query.where("brands").in(brandIds.length > 0 ? brandIds : []);
        } else if (id === "type" || id === "category") {
          // ✅ Backwards compatibility: old UI used "type" but it meant category
          query = query.where("category").regex(new RegExp(value, "i"));
        } else if (id === "variant" || id === "variants") {
          // ✅ New filter: variants array
          query = query.where("variants").elemMatch({ $regex: new RegExp(value, "i") });
        }
      }
    }

    // Apply global filter
    if (globalFilter) {
      const regex = new RegExp(globalFilter, "i");
      query = query.or([
        { name: regex },
        { category: regex },
        { variants: { $elemMatch: { $regex: regex } } },
      ]);
    }

    // Apply sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce(
          (acc, { id, desc }) => ({ ...acc, [id]: desc ? -1 : 1 }),
          {}
        );
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    const startIndex = Number(start) || 0;
    const pageSize = Number(size) || 10;

    if (startIndex >= 0 && pageSize > 0) {
      totalRowCount = await Product.countDocuments(query.clone());
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute query
    const products = await query
      .select("name brands category variants measures measurementUnit")
      .lean();

    // Collect unique brand IDs
    const uniqueBrandIds = [...new Set(products.flatMap((p) => p.brands ?? []))].filter(Boolean);

    // Fetch brands
    const brandDocs = await Brand.find({ _id: { $in: uniqueBrandIds } }).lean();
    const brandIdToNameMap = brandDocs.reduce(
      (acc, { _id, name }) => ({ ...acc, [_id.toString()]: name }),
      {}
    );

    const enrichedProducts = products.map((product) => {
      const resolvedBrands = (product.brands ?? []).map(
        (id) => brandIdToNameMap[id.toString()] || "N/A"
      );

      return {
        ...product,
        brand: resolvedBrands.join(", "),
      };
    });

    res.json({ products: enrichedProducts, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/products:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -------------------- POST --------------------
productsRouter.post("/", async (req, res) => {
  try {
    console.log("[POST] Incoming request body:", req.body);

    const { name, brands, measurementUnit, category, measures } = req.body;

    const normalizedCategory = String(category ?? "").trim();
    const normalizedVariants = normalizeVariants(req.body);
    const normalizedMeasures = normalizeMeasures(measures);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!Array.isArray(brands)) {
      return res.status(400).json({ message: "Brands must be an array" });
    }

    if (!normalizedCategory) {
      return res.status(400).json({ message: "category is required" });
    }

    // If variants are required in your frontend validation, enforce here too:
    if (normalizedVariants.length === 0) {
      return res.status(400).json({ message: "variants must be a non-empty array" });
    }

    const brandIds = await resolveBrandIds(brands);

    const productSlug = createSlug(name);

    const existingProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
    });

    if (existingProduct) {
      return res.status(400).json({ message: "duplicate" });
    }

    const product = new Product({
      name: String(name).trim(),
      measurementUnit,
      category: normalizedCategory,
      variants: normalizedVariants,
      measures: normalizedMeasures,
      brands: brandIds,
      slug: productSlug,
    });

    const savedProduct = await product.save();

    const populatedProduct = await Product.findById(savedProduct._id)
      .populate("brands", "name _id")
      .lean();

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error("[POST] Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// -------------------- DELETE --------------------
productsRouter.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.send(product);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

// -------------------- PUT --------------------
productsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[PUT] Incoming request body:", req.body);

    const { name, brands, measurementUnit, category, measures } = req.body;

    const normalizedCategory = String(category ?? "").trim();
    const normalizedVariants = normalizeVariants(req.body);
    const normalizedMeasures = normalizeMeasures(measures);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!Array.isArray(brands)) {
      console.error("[PUT] Brands is not an array:", brands);
      return res.status(400).json({ message: "Brands must be an array" });
    }

    if (!normalizedCategory) {
      return res.status(400).json({ message: "category is required" });
    }

    // If variants are required in your frontend validation, enforce here too:
    if (normalizedVariants.length === 0) {
      return res.status(400).json({ message: "variants must be a non-empty array" });
    }

    const brandIds = await resolveBrandIds(brands);

    const productSlug = createSlug(name);

    const duplicateProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
      _id: { $ne: id },
    });

    if (duplicateProduct) {
      console.error("[PUT] Duplicate product found:", duplicateProduct);
      return res.status(400).json({ message: "duplicate" });
    }

    const updatedProduct = {
      name: String(name).trim(),
      measurementUnit,
      category: normalizedCategory,
      variants: normalizedVariants,
      measures: normalizedMeasures,
      brands: brandIds,
      slug: productSlug,
    };

    const result = await Product.findByIdAndUpdate(id, updatedProduct, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      console.error("[PUT] Product not found for id:", id);
      return res.status(404).json({ message: "Product not found" });
    }

    const populatedProduct = await Product.findById(result._id)
      .populate("brands", "name _id")
      .lean();

    res.status(200).json(populatedProduct);
  } catch (error) {
    console.error("[PUT] Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

export default productsRouter;
