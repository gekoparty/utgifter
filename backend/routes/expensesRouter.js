// routes/expensesRouter.js
import express from "express";
import mongoose from "mongoose";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationSchema.js";
import Variant from "../models/variantSchema.js";
import { convertToUTC, formatDate, parseDateForStorage } from "../utils/dateUtils.js";

const expensesRouter = express.Router();

// --- Utilities ---
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isHexObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? "").trim());

// ✅ NEW: sort numeric arrays (handles numbers + numeric strings, drops invalid)
const roundTo = (n, decimals = 3) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
};

const normalizeMeasures = (arr, decimals = 3) => {
  if (!Array.isArray(arr)) return [];
  const set = new Set();
  for (const v of arr) {
    const r = roundTo(v, decimals);
    if (r === null) continue;
    set.add(r); // ✅ dedupe after rounding
  }
  return [...set].sort((a, b) => a - b);
};

const sortByNameAsc = (arr) =>
  Array.isArray(arr)
    ? [...arr].sort((a, b) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, {
          sensitivity: "base",
        })
      )
    : [];

// Parallelized Reference Lookup
const getReferenceIds = async (model, field, value) => {
  if (!value) return [];
  return model.find({ [field]: new RegExp(escapeRegex(value), "i") }).distinct("_id");
};

const resolveById = async (Model, id) => {
  if (!id || !isHexObjectId(id)) return null;
  return Model.findById(id);
};

const normalizeVariantId = (v) => {
  const s = String(v ?? "").trim();
  return isHexObjectId(s) ? s : "";
};

const validateVariantForProduct = (product, variantId) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  // product has no variants -> allow empty
  if (variants.length === 0) return true;

  // product has variants -> must provide one
  if (!variantId) return false;

  return variants.map((id) => String(id)).includes(String(variantId));
};

// Build variantName from populated product variants
const getVariantNameFromProduct = (expense) => {
  const variantId = expense?.variant ? String(expense.variant) : "";
  const productVariants = Array.isArray(expense?.productName?.variants)
    ? expense.productName.variants
    : [];

  if (!variantId || productVariants.length === 0) return "";

  const match = productVariants.find((v) => String(v?._id) === variantId);
  return match?.name ? String(match.name) : "";
};

const getProductCategory = (product) => String(product?.category ?? "").trim();

const getProductSummary = (product) => ({
  _id: product?._id ? String(product._id) : "",
  name: product?.name || "",
  category: getProductCategory(product),
});

const filterByDate = (query, id, value) => {
  if (Array.isArray(value)) {
    const startDate = value[0] ? convertToUTC(value[0])?.start : null;
    const endDate = value[1] ? convertToUTC(value[1])?.end : null;

    if (startDate && endDate) query.where(id).gte(startDate).lte(endDate);
    else if (startDate) query.where(id).gte(startDate);
    else if (endDate) query.where(id).lte(endDate);
  } else {
    const range = convertToUTC(value);
    const start = range?.start;
    const end = range?.end;
    if (start && end) query.where(id).gte(start).lte(end);
  }
};

const normalizeExpenseDates = (payload) => ({
  ...payload,
  purchaseDate: payload.purchaseDate ? parseDateForStorage(payload.purchaseDate) : null,
  registeredDate: payload.registeredDate ? parseDateForStorage(payload.registeredDate) : null,
});

const filterByRange = (query, defaultField, value) => {
  let min = null;
  let max = null;
  let targetFields = [defaultField];

  if (Array.isArray(value)) {
    min = value[0] !== "" ? Number(value[0]) : null;
    max = value[1] !== "" ? Number(value[1]) : null;
  } else if (typeof value === "object" && value !== null) {
    min = value.min !== "" ? Number(value.min) : null;
    max = value.max !== "" ? Number(value.max) : null;

    if (value.mode === "finalPrice") targetFields = ["finalPrice"];
    else if (value.mode === "price") targetFields = ["price"];
    else if (value.mode === "all") targetFields = ["pricePerUnit", "finalPrice", "price"];
    else targetFields = ["pricePerUnit"];
  } else {
    query.where(defaultField).equals(Number(value));
    return;
  }

  if (min === null && max === null) return;

  if (targetFields.length === 1) {
    const field = targetFields[0];
    if (min !== null) query.where(field).gte(min);
    if (max !== null) query.where(field).lte(max);
  } else {
    const orConditions = targetFields.map((field) => {
      const criteria = {};
      if (min !== null) criteria.$gte = min;
      if (max !== null) criteria.$lte = max;
      return { [field]: criteria };
    });
    query.or(orConditions);
  }
};

const applyFilters = async (query, filters) => {
  const referenceFilters = [];
  const variantFilters = [];
  const dateFilters = [];
  const regexFilters = [];

  for (const { id, value } of filters) {
    if (!id || (!value && value !== 0)) continue;

    if (["purchaseDate", "registeredDate"].includes(id)) {
      dateFilters.push({ id, value });
    } else if (["price", "pricePerUnit", "finalPrice", "displayPrice", "volume"].includes(id)) {
      filterByRange(query, id, value);
    } else if (["productName", "brandName", "shopName", "locationName"].includes(id)) {
      referenceFilters.push({ id, value });
    } else if (["variant", "variantName"].includes(id)) {
      variantFilters.push({ value });
    } else {
      regexFilters.push({ id, value });
    }
  }

  dateFilters.forEach(({ id, value }) => filterByDate(query, id, value));

  regexFilters.forEach(({ id, value }) => {
    query.where(id).regex(new RegExp(escapeRegex(value), "i"));
  });

  if (referenceFilters.length > 0) {
    const modelMap = {
      productName: Product,
      brandName: Brand,
      shopName: Shop,
      locationName: Location,
    };

    const promises = referenceFilters.map(async ({ id, value }) => {
      const ids = await getReferenceIds(modelMap[id], "name", value);
      return { id, ids };
    });

    const results = await Promise.all(promises);

    results.forEach(({ id, ids }) => {
      query.where(id).in(ids);
    });
  }

  if (variantFilters.length > 0) {
    const variantIdSets = await Promise.all(
      variantFilters.map(async ({ value }) => {
        const ids = await getReferenceIds(Variant, "name", value);
        return ids.map(String);
      })
    );

    const matchingVariantIds = variantIdSets.reduce(
      (matches, ids) => matches.filter((id) => ids.includes(id)),
      variantIdSets[0] ?? []
    );

    query.where("variant").in(matchingVariantIds);
  }
};

const applySorting = (query, sorting) => {
  if (sorting && sorting.length > 0) {
    const sortObj = sorting.reduce((acc, { id, desc }) => {
      acc[id] = desc ? -1 : 1;
      return acc;
    }, {});
    query.sort(sortObj);
  } else {
    query.sort({ purchaseDate: -1 });
  }
};

const applyPagination = async (query, start, size) => {
  const countQuery = query.model.find(query.getFilter());
  const total = await countQuery.countDocuments();

  const startIndex = Math.max(0, parseInt(start, 10) || 0);
  const pageSize = parseInt(size, 10) || 10;

  return {
    query: query.skip(startIndex).limit(pageSize),
    total,
    startIndex,
  };
};

// --- Routes ---

// GET Expenses (paginated)
expensesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    let query = Expense.find();

    if (columnFilters) await applyFilters(query, JSON.parse(columnFilters));

    if (globalFilter) {
      const productIds = await getReferenceIds(Product, "name", globalFilter);

      // Optional: allow searching by variant name (store variant as id string)
      const regex = new RegExp(escapeRegex(globalFilter), "i");
      const variantIds = await Variant.find({
        name: { $regex: regex },
      }).distinct("_id");

      query.or([
        { productName: { $in: productIds } },
        ...(variantIds.length ? [{ variant: { $in: variantIds.map(String) } }] : []),
      ]);
    }

    applySorting(query, sorting ? JSON.parse(sorting) : []);

    const { query: paginatedQuery, total, startIndex } = await applyPagination(
      query,
      start,
      size
    );

    const expenses = await paginatedQuery
      .populate({
        path: "productName",
        select: "name category measures measurementUnit variants brands",
        populate: {
          path: "variants",
          select: "name",
          options: { sort: { name: 1 } }, // ✅ sort variants asc by name
        },
      })
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean()
      .exec();

    res.json({
      expenses: expenses.map((expense) => {
        const variantId = expense.variant ? String(expense.variant) : "";
        const variantName = getVariantNameFromProduct(expense);

        // ✅ NEW: product brand ids (for Edit dialog brand filtering)
        const productBrandIds = Array.isArray(expense.productName?.brands)
          ? expense.productName.brands.map((id) => String(id))
          : [];

        return {
          ...expense,
          product: getProductSummary(expense.productName),
          shopId: expense.shopName?._id ? String(expense.shopName._id) : "",
          locationId: expense.locationName?._id ? String(expense.locationName._id) : "",
          productId: expense.productName?._id ? String(expense.productName._id) : "",
          brandId: expense.brandName?._id ? String(expense.brandName._id) : "",
          productName: expense.productName?.name || "",
          productCategory: getProductCategory(expense.productName),
          brandName: expense.brandName?.name || "",
          shopName: expense.shopName?.name || "",
          locationName: expense.locationName?.name || "",

          // ✅ CHANGED: always return measures sorted ascending
          measures: normalizeMeasures(expense.productName?.measures, 3),

          measurementUnit: expense.productName?.measurementUnit || "",
          variants: expense.productName?.variants || [],
          productBrandIds,
          variant: variantId,
          variantName,
          purchaseDateRaw: expense.purchaseDate,
          registeredDateRaw: expense.registeredDate,
          purchaseDate: formatDate(expense.purchaseDate),
          registeredDate: formatDate(expense.registeredDate),
        };
      }),
      meta: { totalRowCount: total, startIndex },
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET Expense by ID
expensesRouter.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid expense id" });
    }

    const expense = await Expense.findById(req.params.id)
      .populate({
        path: "productName",
        select: "name category measures measurementUnit variants brands",
        populate: {
          path: "variants",
          select: "name",
          options: { sort: { name: 1 } }, // ✅ sort variants asc by name
        },
      })
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    if (!expense) return res.status(404).json({ error: "Expense not found" });

    const variantId = expense.variant ? String(expense.variant) : "";
    const variantName = getVariantNameFromProduct(expense);

    const productBrandIds = Array.isArray(expense.productName?.brands)
      ? expense.productName.brands.map((id) => String(id))
      : [];

    res.json({
      ...expense,
      product: getProductSummary(expense.productName),
      shopId: expense.shopName?._id ? String(expense.shopName._id) : "",
      locationId: expense.locationName?._id ? String(expense.locationName._id) : "",
      productId: expense.productName?._id ? String(expense.productName._id) : "",
      brandId: expense.brandName?._id ? String(expense.brandName._id) : "",
      productName: expense.productName?.name || "",
      productCategory: getProductCategory(expense.productName),
      brandName: expense.brandName?.name || "",
      shopName: expense.shopName?.name || "",
      locationName: expense.locationName?.name || "",

      // ✅ CHANGED: always return measures sorted ascending
      measures: normalizeMeasures(expense.productName?.measures, 3),

      measurementUnit: expense.productName?.measurementUnit || "",
      variants: expense.productName?.variants || [],
      productBrandIds,
      variant: variantId,
      variantName,
      purchaseDateRaw: expense.purchaseDate,
      registeredDateRaw: expense.registeredDate,
      purchaseDate: formatDate(expense.purchaseDate),
      registeredDate: formatDate(expense.registeredDate),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST Expense
expensesRouter.post("/", async (req, res) => {
  try {
    const {
      productId,
      brandId,
      shopId,
      locationId,

      variant, // variantId string
      quantity,
      ...expenseData
    } = req.body;

    const [product, brand, shop, location] = await Promise.all([
      resolveById(Product, productId),
      resolveById(Brand, brandId),
      resolveById(Shop, shopId),
      locationId ? resolveById(Location, locationId) : null,
    ]);

    if (!product || !brand || !shop) {
      return res.status(400).json({ message: "Invalid product, brand, or shop." });
    }

    const allowedBrandIds = (product.brands ?? []).map(String);
    if (!allowedBrandIds.includes(String(brand._id))) {
      return res.status(400).json({ message: "Brand is not valid for selected product." });
    }

    const normalizedVariantId = normalizeVariantId(variant);
    if (!validateVariantForProduct(product, normalizedVariantId)) {
      return res.status(400).json({ message: "Invalid variant for selected product." });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const normalizedExpenseData = normalizeExpenseDates(expenseData);

    const expensesToInsert = Array.from({ length: qty }).map(() => ({
      productName: product._id,
      brandName: brand._id,
      shopName: shop._id,
      locationName: location?._id,
      variant: normalizedVariantId,
      ...normalizedExpenseData,
    }));

    const savedExpenses = await Expense.insertMany(expensesToInsert);

    // Return minimal payload; client refetches table anyway
    const populatedExpenses = await Expense.find({
      _id: { $in: savedExpenses.map((exp) => exp._id) },
    })
      .populate("productName", "name category")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    res.status(201).json({
      message: "Expense saved!",
      data: populatedExpenses.map((exp) => ({
        _id: exp._id,
        product: getProductSummary(exp.productName),
        productId: exp.productName?._id ? String(exp.productName._id) : "",
        productName: exp.productName?.name,
        productCategory: getProductCategory(exp.productName),
        brandName: exp.brandName?.name,
        shopName: exp.shopName?.name,
        locationName: exp.locationName?.name,
        variant: exp.variant || "",
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again." });
  }
});

// PUT Expense
expensesRouter.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const {
      productId,
      brandId,
      shopId,
      locationId,

      variant, // optional
      ...updateData
    } = req.body;

    const [product, brand, shop, location] = await Promise.all([
      resolveById(Product, productId),
      resolveById(Brand, brandId),
      resolveById(Shop, shopId),
      locationId ? resolveById(Location, locationId) : null,
    ]);

    if (!product || !brand || !shop) {
      return res.status(400).json({ message: "Invalid product, brand, or shop." });
    }

    const allowedBrandIds = (product.brands ?? []).map(String);
    if (!allowedBrandIds.includes(String(brand._id))) {
      return res.status(400).json({ message: "Brand is not valid for selected product." });
    }

    const update = {
      productName: product._id,
      brandName: brand._id,
      shopName: shop._id,
      locationName: location?._id,
      ...normalizeExpenseDates(updateData),
    };

    if (variant !== undefined) {
      const normalizedVariantId = normalizeVariantId(variant);
      if (!validateVariantForProduct(product, normalizedVariantId)) {
        return res.status(400).json({ message: "Invalid variant for selected product." });
      }
      update.variant = normalizedVariantId;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
      .populate("productName", "name category")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found." });

    res.json({
      message: "Expense updated successfully!",
      data: {
        _id: updatedExpense._id,
        product: getProductSummary(updatedExpense.productName),
        productId: updatedExpense.productName?._id ? String(updatedExpense.productName._id) : "",
        productName: updatedExpense.productName?.name,
        productCategory: getProductCategory(updatedExpense.productName),
        brandName: updatedExpense.brandName?.name,
        shopName: updatedExpense.shopName?.name,
        locationName: updatedExpense.locationName?.name,
        variant: updatedExpense.variant || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE Expense
expensesRouter.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid expense id" });
    }

    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Expense not found" });
    res.json(deleted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default expensesRouter;
