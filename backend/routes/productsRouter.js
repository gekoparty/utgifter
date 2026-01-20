// routes/productsRouter.js
import express from "express";
import slugify from "slugify";
import mongoose from "mongoose";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Variant from "../models/variantSchema.js";

const productsRouter = express.Router();

// Helper function for consistent slug generation
const createSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ IMPORTANT: Strict ObjectId string check (24 hex only)
// fixes cases like "Lando Norris" (12 chars) being treated as an ObjectId by mongoose.isValid
const isHexObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? "").trim());

// -------------------- Brand helpers --------------------
const resolveBrandIds = async (brandNames) => {
  if (!Array.isArray(brandNames)) throw new Error("Brands must be an array");

  const ids = await Promise.all(
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
  );

  return ids.filter(Boolean);
};

// -------------------- Variant helpers (PRODUCT-SCOPED) --------------------

/**
 * Resolve variants for a given product.
 * body.variants can include:
 *  - ObjectId strings (24-hex) that MUST belong to this product
 *  - names (strings) => upsert per (product, slug) and return their ids
 *
 * Ensures uniqueness within payload by case-insensitive name.
 */
const resolveVariantIds = async (productId, body) => {
  const arr = Array.isArray(body?.variants) ? body.variants : [];
  if (!arr.length) return [];

  const pid = new mongoose.Types.ObjectId(productId);
  const seenNames = new Set();

  const ids = await Promise.all(
    arr.map(async (raw) => {
      const s = String(raw ?? "").trim();
      if (!s) return null;

      // ✅ If ObjectId string (STRICT 24-hex), ensure it belongs to THIS product
      if (isHexObjectId(s)) {
        const exists = await Variant.findOne({ _id: s, product: pid }).select("_id").lean();
        return exists ? new mongoose.Types.ObjectId(s) : null;
      }

      // Otherwise treat as a name; de-dupe names in payload (case-insensitive)
      const name = s;
      const key = name.toLowerCase();
      if (seenNames.has(key)) return null;
      seenNames.add(key);

      const slug = createSlug(name);

      // ✅ Upsert per product (not shared across products)
      const doc = await Variant.findOneAndUpdate(
        { product: pid, slug },
        { $setOnInsert: { product: pid, name, slug } },
        { new: true, upsert: true }
      )
        .select("_id")
        .lean();

      return doc?._id ?? null;
    })
  );

  // De-dupe ids just in case
  const unique = [...new Set(ids.filter(Boolean).map(String))].map(
    (x) => new mongoose.Types.ObjectId(x)
  );

  return unique;
};

/** Delete variant docs that were removed from this product */
const deleteVariantsForProduct = async (productId, removedVariantIds) => {
  const pid = new mongoose.Types.ObjectId(productId);

  const ids = (removedVariantIds ?? [])
    .map((x) => String(x))
    .filter((x) => isHexObjectId(x))
    .map((x) => new mongoose.Types.ObjectId(x));

  if (!ids.length) return;

  await Variant.deleteMany({ _id: { $in: ids }, product: pid });
};

/**
 * Cleanup orphan variant ObjectIds in product.variants (safety net).
 * If product references a variant id that doesn't exist (or doesn't belong to product),
 * pull it from the product array.
 */
const cleanupProductVariantOrphans = async (productId) => {
  const pid = new mongoose.Types.ObjectId(productId);

  const product = await Product.findById(pid).select("variants").lean();
  if (!product) return;

  const ids = (product.variants ?? []).map(String).filter(isHexObjectId);
  if (!ids.length) return;

  const existing = await Variant.find({ _id: { $in: ids }, product: pid })
    .select("_id")
    .lean();

  const existingSet = new Set(existing.map((v) => String(v._id)));
  const orphanIds = ids.filter((id) => !existingSet.has(id));

  if (orphanIds.length) {
    await Product.updateOne(
      { _id: pid },
      {
        $pull: {
          variants: {
            $in: orphanIds.map((x) => new mongoose.Types.ObjectId(x)),
          },
        },
      }
    );
  }
};

// -------------------- Other helpers --------------------
const normalizeMeasures = (measures) => {
  if (!Array.isArray(measures)) return [];
  return measures.map((m) => String(m).trim()).filter(Boolean);
};

// -------------------- GET --------------------
productsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Product.find();

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
          query = query.where("category").regex(new RegExp(value, "i"));
        } else if (id === "variant" || id === "variants") {
          // ✅ Filter products by variant NAME (product-scoped variants, but search is global)
          const regex = new RegExp(value, "i");
          const variantDocs = await Variant.find({ name: { $regex: regex } }).select("_id");
          const variantIds = variantDocs.map((v) => v._id);
          query = query.where("variants").in(variantIds.length ? variantIds : []);
        }
      }
    }

    if (globalFilter) {
      const regex = new RegExp(globalFilter, "i");

      const variantDocs = await Variant.find({ name: { $regex: regex } }).select("_id");
      const variantIds = variantDocs.map((v) => v._id);

      query = query.or([
        { name: regex },
        { category: regex },
        ...(variantIds.length ? [{ variants: { $in: variantIds } }] : []),
      ]);
    }

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

    let totalRowCount = 0;
    const startIndex = Number(start) || 0;
    const pageSize = Number(size) || 10;

    if (startIndex >= 0 && pageSize > 0) {
      totalRowCount = await Product.countDocuments(query.clone());
      query = query.skip(startIndex).limit(pageSize);
    }

    const products = await query
      .select("name brands category variants measures measurementUnit")
      .populate("variants", "name")
      .lean();

    const uniqueBrandIds = [...new Set(products.flatMap((p) => p.brands ?? []))].filter(Boolean);

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
    const { name, brands, measurementUnit, category, measures } = req.body;

    const normalizedCategory = String(category ?? "").trim();
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

    const brandIds = await resolveBrandIds(brands);
    const productSlug = createSlug(name);

    const existingProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
    });

    if (existingProduct) {
      return res.status(400).json({ message: "duplicate" });
    }

    // 1) create product first WITHOUT variants (we need the productId)
    const product = new Product({
      name: String(name).trim(),
      measurementUnit,
      category: normalizedCategory,
      measures: normalizedMeasures,
      brands: brandIds,
      slug: productSlug,
      variants: [],
    });

    const saved = await product.save();

    // 2) create/upsert variants scoped to this product (ids or names)
    const variantIds = await resolveVariantIds(saved._id, req.body);

    // 3) attach variants
    await Product.updateOne({ _id: saved._id }, { $set: { variants: variantIds } });

    // 4) safety cleanup
    await cleanupProductVariantOrphans(saved._id);

    const populatedProduct = await Product.findById(saved._id)
      .populate("brands", "name _id")
      .populate("variants", "name _id")
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid product id" });
    }

    const product = await Product.findById(id).select("_id variants").lean();
    if (!product) return res.status(404).send({ error: "Product not found" });

    // delete all variants owned by this product
    await Variant.deleteMany({ product: product._id });

    const deleted = await Product.findByIdAndDelete(product._id);
    res.send(deleted);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

// -------------------- PUT --------------------
productsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brands, measurementUnit, category, measures } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existing = await Product.findById(id).select("variants").lean();
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const normalizedCategory = String(category ?? "").trim();
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

    const brandIds = await resolveBrandIds(brands);
    const productSlug = createSlug(name);

    const duplicateProduct = await Product.findOne({
      slug: productSlug,
      brands: { $all: brandIds },
      _id: { $ne: id },
    });

    if (duplicateProduct) {
      return res.status(400).json({ message: "duplicate" });
    }

    // resolve next variant ids (creates/upserts per product)
    const nextVariantIds = await resolveVariantIds(id, req.body);

    // compute removed (prev -> next)
    const prevIds = (existing.variants ?? []).map(String);
    const nextIds = nextVariantIds.map((x) => String(x));
    const removedIds = prevIds.filter((x) => !nextIds.includes(x));

    // delete removed variant docs for this product
    await deleteVariantsForProduct(id, removedIds);

    const updatedProduct = {
      name: String(name).trim(),
      measurementUnit,
      category: normalizedCategory,
      variants: nextVariantIds,
      measures: normalizedMeasures,
      brands: brandIds,
      slug: productSlug,
    };

    const result = await Product.findByIdAndUpdate(id, updatedProduct, {
      new: true,
      runValidators: true,
    });

    if (!result) return res.status(404).json({ message: "Product not found" });

    // cleanup orphan ids (safety net)
    await cleanupProductVariantOrphans(id);

    const populatedProduct = await Product.findById(result._id)
      .populate("brands", "name _id")
      .populate("variants", "name _id")
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
