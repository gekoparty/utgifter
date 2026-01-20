// routes/variantsRouter.js
import express from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Variant from "../models/variantSchema.js";
import Product from "../models/productSchema.js";

const variantsRouter = express.Router();

const createSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

// ✅ Strict ObjectId string check (24 hex only)
const isHexObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? "").trim());

// GET variants (must be scoped by product)
variantsRouter.get("/", async (req, res) => {
  try {
    const { q, limit, productId } = req.query;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId is required" });
    }

    const query = { product: new mongoose.Types.ObjectId(productId) };
    if (q) query.name = { $regex: new RegExp(q, "i") };

    const take = Math.min(parseInt(limit, 10) || 200, 1000);

    const variants = await Variant.find(query)
      .select("_id name product")
      .sort({ name: 1 })
      .limit(take)
      .lean();

    res.json({ variants });
  } catch (err) {
    console.error("Error in /api/variants:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// fetch variants by ids (and optionally verify product)
variantsRouter.get("/by-ids", async (req, res) => {
  try {
    const idsParam = String(req.query.ids ?? "").trim();
    const productId = String(req.query.productId ?? "").trim();

    if (!idsParam) return res.json({ variants: [] });

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => isHexObjectId(s))
      .map((s) => new mongoose.Types.ObjectId(s));

    if (!ids.length) return res.json({ variants: [] });

    const filter = { _id: { $in: ids } };
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.product = new mongoose.Types.ObjectId(productId);
    }

    const variants = await Variant.find(filter).select("_id name product").lean();
    res.json({ variants });
  } catch (err) {
    console.error("Error in /api/variants/by-ids:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST create variant for a specific product (no global sharing)
variantsRouter.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const productId = String(req.body?.productId ?? "").trim();

    if (!name) return res.status(400).json({ message: "name is required" });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId).select("_id").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const slug = createSlug(name);

    // ✅ upsert PER PRODUCT (not global)
    const variant = await Variant.findOneAndUpdate(
      { product: product._id, slug },
      { $setOnInsert: { product: product._id, name, slug } },
      { new: true, upsert: true }
    ).select("_id name product");

    // ensure product references it (idempotent)
    await Product.updateOne({ _id: product._id }, { $addToSet: { variants: variant._id } });

    res.status(201).json({ variant });
  } catch (err) {
    console.error("Error creating variant:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ PUT rename a variant (product scoped, unique per product)
variantsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const name = String(req.body?.name ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid variant id" });
    }
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const existing = await Variant.findById(id).select("_id product").lean();
    if (!existing) return res.status(404).json({ message: "Variant not found" });

    const slug = createSlug(name);

    // Ensure uniqueness within same product (your DB index also enforces this)
    const duplicate = await Variant.findOne({
      _id: { $ne: existing._id },
      product: existing.product,
      slug,
    })
      .select("_id")
      .lean();

    if (duplicate) {
      return res.status(400).json({ message: "duplicate" });
    }

    const updated = await Variant.findByIdAndUpdate(
      existing._id,
      { name, slug },
      { new: true, runValidators: true }
    ).select("_id name product");

    res.status(200).json({ variant: updated });
  } catch (err) {
    // Handle unique index error nicely
    if (err?.code === 11000) {
      return res.status(400).json({ message: "duplicate" });
    }
    console.error("Error updating variant:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE a variant (and remove its id from product.variants to avoid orphans)
variantsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid variant id" });
    }

    const variant = await Variant.findById(id).select("_id product").lean();
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    await Variant.deleteOne({ _id: variant._id });

    // ✅ remove from product array to avoid orphan ids
    await Product.updateOne({ _id: variant.product }, { $pull: { variants: variant._id } });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error deleting variant:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default variantsRouter;
