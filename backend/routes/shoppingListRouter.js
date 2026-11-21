import express from "express";
import Brand from "../models/brandSchema.js";
import Product from "../models/productSchema.js";
import ShoppingListItem from "../models/shoppingListItemSchema.js";
import Variant from "../models/variantSchema.js";
import { ownedFilter, ownerObjectId } from "../middleware/dataOwnership.js";

const router = express.Router();
const isId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
const toItem = ({ _id, productId, brandId, variantId, name, details, checked }) => ({
  id: _id.split(":").slice(1).join(":"),
  productId, brandId, variantId, name, details, checked,
});

router.use((req, res, next) => {
  req.shoppingListOwner = ownerObjectId(req);
  if (!req.shoppingListOwner) return res.status(401).json({ message: "Missing account" });
  next();
});

router.get("/", async (req, res, next) => {
  try {
    const rows = await ShoppingListItem.find({ ownerUserId: req.shoppingListOwner })
      .sort({ createdAt: 1, _id: 1 }).lean();
    res.json({ items: rows.map(toItem) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { productId, brandId = "", variantId = "" } = req.body ?? {};
  if (!isId(productId) || ![brandId, variantId].every((id) => id === "" || isId(id))) {
    return res.status(400).json({ message: "Invalid product, brand or variant ID" });
  }

  try {
    const product = await Product.findOne(ownedFilter(req, { _id: productId }))
      .select("name brands variants").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const [brand, variant] = await Promise.all([
      brandId && product.brands?.some((id) => String(id) === brandId)
        ? Brand.findOne(ownedFilter(req, { _id: brandId })).select("name").lean()
        : null,
      variantId && product.variants?.some((id) => String(id) === variantId)
        ? Variant.findOne(ownedFilter(req, { _id: variantId, product: product._id })).select("name").lean()
        : null,
    ]);
    if ((brandId && !brand) || (variantId && !variant)) {
      return res.status(400).json({ message: "Brand or variant is unavailable for this product" });
    }

    const ownerUserId = req.shoppingListOwner;
    const _id = [ownerUserId, product._id, brandId, variantId].join(":");
    const row = await ShoppingListItem.findOneAndUpdate(
      { _id },
      { $setOnInsert: {
        ownerUserId, productId: product._id, brandId, variantId,
        name: product.name,
        details: [brand?.name, variant?.name].filter(Boolean).join(" · "),
      } },
      { upsert: true, new: true, lean: true },
    );
    res.json(toItem(row));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  if (typeof req.body?.checked !== "boolean") {
    return res.status(400).json({ message: "Invalid checked value" });
  }
  try {
    const ownerUserId = req.shoppingListOwner;
    const row = await ShoppingListItem.findOneAndUpdate(
      { _id: `${ownerUserId}:${req.params.id}`, ownerUserId },
      { $set: { checked: req.body.checked } },
      { new: true, lean: true },
    );
    if (!row) return res.status(404).json({ message: "Shopping list item not found" });
    res.json(toItem(row));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const ownerUserId = req.shoppingListOwner;
    await ShoppingListItem.deleteOne({ _id: `${ownerUserId}:${req.params.id}`, ownerUserId });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

export default router;
