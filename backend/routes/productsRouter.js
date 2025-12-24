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
      const trimmedName = name.trim();
      const slug = createSlug(trimmedName);
      // Use both slug and name in the filter for extra consistency.
      const brand = await Brand.findOneAndUpdate(
        { slug, name: trimmedName },
        { $setOnInsert: { name: trimmedName, slug } },
        { new: true, upsert: true }
      );
      return brand._id;
    })
  );
};

productsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    // Initialize query object
    let query = Product.find();

    // Apply column filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);

      for (const { id, value } of filters) {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i"));
          } else if (id === "brand") {
            const matchingBrands = await Brand.find({
              name: { $regex: new RegExp(value, "i") },
            }).select("_id");

            const brandIds = matchingBrands.map((b) => b._id);

            if (brandIds.length > 0) {
              query = query.where("brands").in(brandIds);
            } else {
              query = query.where("brands").in([]);
            }
          } else if (id === "type") {
            query = query.where("type").regex(new RegExp(value, "i"));
          }
        }
      }
    }

    /* filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i"));
          } else if (id === "brand") {
            query = query.where("brands").in(value);
          } else if (id === "type") {
            query = query.where("type").regex(new RegExp(value, "i"));
          }
        }
      }); */

    // Apply global filter
    if (globalFilter) {
      const regex = new RegExp(globalFilter, "i");
      query = query.or([{ name: regex }, { type: regex }]);
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
    let startIndex = Number(start) || 0;
    let pageSize = Number(size) || 10;

   if (startIndex >= 0 && pageSize > 0) {
      totalRowCount = await Product.countDocuments(query.clone()); // .clone() is important in Mongoose 6+ to not execute the query yet
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const products = await query
      .select("name brands type measures measurementUnit")
      .lean();

    // Collect unique brand IDs
    const uniqueBrandIds = [
      ...new Set(products.flatMap((p) => p.brands)),
    ].filter(Boolean);

    // Fetch all brands in a single query
    const brandDocs = await Brand.find({ _id: { $in: uniqueBrandIds } }).lean();
    const brandIdToNameMap = brandDocs.reduce(
      (acc, { _id, name }) => ({ ...acc, [_id.toString()]: name }),
      {}
    );

    // Attach brand names to the products
    const enrichedProducts = products.map((product) => {
      console.log(`[DEBUG] Product: ${product.name}`);
      console.log(`[DEBUG] Brand IDs:`, product.brands);

      const resolvedBrands = product.brands.map(
        (id) => brandIdToNameMap[id.toString()] || "N/A"
      );

      console.log(`[DEBUG] Resolved Brands:`, resolvedBrands);

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

productsRouter.post("/", async (req, res) => {
  try {
    console.log("[POST] Incoming request body:", req.body);
    const { name, brands, measurementUnit, type, measures } = req.body;

    // Validate brands input format
    if (!Array.isArray(brands)) {
      return res.status(400).json({ message: "Brands must be an array" });
    }

    // Resolve brand names to IDs
    const brandIds = await resolveBrandIds(brands);

    // Check for duplicate product
    const productSlug = createSlug(name);
    const existingProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
    });

    if (existingProduct) {
      return res.status(400).json({ message: "duplicate" });
    }

    // Create and save product
    const product = new Product({
      name,
      measurementUnit,
      type,
      measures: measures || [],
      brands: brandIds,
      slug: productSlug,
    });

    const savedProduct = await product.save();

    // Return populated result
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate("brands", "name _id")
      .lean();

    console.log("[POST] Response body:", populatedProduct); // Log the response before sending

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error("[POST] Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

productsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

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

productsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brands, measurementUnit, type, measures } = req.body;

    // Log the incoming request body
    console.log("[PUT] Incoming request body:", req.body);

    // Validate brands input format (added consistency with POST)
    if (!Array.isArray(brands)) {
      console.error("[PUT] Brands is not an array:", brands);
      return res.status(400).json({ message: "Brands must be an array" });
    }

    // Resolve brand names to IDs (shared helper)
    const brandIds = await resolveBrandIds(brands);
    console.log("[PUT] Resolved brand IDs:", brandIds);

    // Duplicate check (added consistency with POST)
    const productSlug = createSlug(name);
    const duplicateProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
      _id: { $ne: id }, // Exclude current product
    });

    if (duplicateProduct) {
      console.error("[PUT] Duplicate product found:", duplicateProduct);
      return res.status(400).json({ message: "duplicate" });
    }

    // Update product payload
    const updatedProduct = {
      name,
      measurementUnit,
      measures: measures || [],
      brands: brandIds,
      type,
      slug: productSlug,
    };

    console.log("[PUT] Updated product payload:", updatedProduct);

    const result = await Product.findByIdAndUpdate(id, updatedProduct, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      console.error("[PUT] Product not found for id:", id);
      return res.status(404).json({ message: "Product not found" });
    }

    // Return populated result (added consistency with POST)
    const populatedProduct = await Product.findById(result._id)
      .populate("brands", "name _id")
      .lean();

    console.log("[PUT] Populated updated product:", populatedProduct);
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
