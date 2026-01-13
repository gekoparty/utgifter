// routes/expensesRouter.js
import express from "express";
import mongoose from "mongoose";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js"; // Typo in filename preserved
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

const expensesRouter = express.Router();
const TIME_ZONE = "Europe/Oslo";

// --- Utility Functions ---

const formatDate = (date) => (date ? format(new Date(date), "dd MMMM yyyy") : "");

// Parallelized Reference Lookup
const getReferenceIds = async (model, field, value) => {
  if (!value) return [];
  return model.find({ [field]: new RegExp(value, "i") }).distinct("_id");
};

// ✅ Accept either IDs OR names (future-proof for fast dialog)
const resolveByIdOrName = async (Model, id, name) => {
  if (id && mongoose.Types.ObjectId.isValid(id)) return Model.findById(id);
  if (!name) return null;
  return Model.findOne({ name });
};

const normalizeVariant = (v) => {
  const s = String(v ?? "").trim();
  return s;
};

const validateVariantForProduct = (product, variant) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  // If product has no variants defined -> allow empty
  if (variants.length === 0) return true;

  // If product has variants defined -> require one of them
  if (!variant) return false;

  return variants.map(String).includes(String(variant));
};

const filterByDate = (query, id, value) => {
  const getDateBoundary = (dateStr, type) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const zonedDate = toZonedTime(date, TIME_ZONE);

    if (type === "start") zonedDate.setHours(0, 0, 0, 0);
    else zonedDate.setHours(23, 59, 59, 999);

    return fromZonedTime(zonedDate, TIME_ZONE);
  };

  if (Array.isArray(value)) {
    const startStr = value[0];
    const endStr = value[1];

    const startDate = getDateBoundary(startStr, "start");
    const endDate = getDateBoundary(endStr, "end");

    if (startDate && endDate) query.where(id).gte(startDate).lte(endDate);
    else if (startDate) query.where(id).gte(startDate);
    else if (endDate) query.where(id).lte(endDate);
  } else {
    const start = getDateBoundary(value, "start");
    const end = getDateBoundary(value, "end");
    if (start && end) query.where(id).gte(start).lte(end);
  }
};

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

  const buildRangeQuery = (field) => {
    const criteria = {};
    if (min !== null) criteria.$gte = min;
    if (max !== null) criteria.$lte = max;
    return { [field]: criteria };
  };

  if (targetFields.length === 1) {
    const field = targetFields[0];
    if (min !== null) query.where(field).gte(min);
    if (max !== null) query.where(field).lte(max);
  } else {
    const orConditions = targetFields.map((field) => buildRangeQuery(field));
    query.or(orConditions);
  }
};

const applyFilters = async (query, filters) => {
  const referenceFilters = [];
  const dateFilters = [];
  const regexFilters = [];

  for (const { id, value } of filters) {
    if (!id || (!value && value !== 0)) continue;

    if (["purchaseDate", "registeredDate"].includes(id)) {
      dateFilters.push({ id, value });
    } else if (["price", "pricePerUnit", "finalPrice", "volume"].includes(id)) {
      filterByRange(query, id, value);
    } else if (["productName", "brandName", "shopName", "locationName"].includes(id)) {
      referenceFilters.push({ id, value });
    } else {
      // ✅ includes "variant" (string) and any other plain fields
      regexFilters.push({ id, value });
    }
  }

  dateFilters.forEach(({ id, value }) => filterByDate(query, id, value));

  regexFilters.forEach(({ id, value }) => {
    query.where(id).regex(new RegExp(value, "i"));
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

// GET Expenses
expensesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    let query = Expense.find();

    if (columnFilters) await applyFilters(query, JSON.parse(columnFilters));

    if (globalFilter) {
      const productIds = await getReferenceIds(Product, "name", globalFilter);

      // ✅ include variant in global search too
      const regex = new RegExp(globalFilter, "i");
      query.or([{ productName: { $in: productIds } }, { variant: regex }]);
    }

    applySorting(query, sorting ? JSON.parse(sorting) : []);

    const { query: paginatedQuery, total, startIndex } = await applyPagination(
      query,
      start,
      size
    );

    const expenses = await paginatedQuery
      // ✅ include variants so UI has it if needed
      .populate("productName", "name measures measurementUnit variants")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean()
      .exec();

    res.json({
      expenses: expenses.map((expense) => ({
        ...expense,
        productName: expense.productName?.name || "",
        brandName: expense.brandName?.name || "",
        shopName: expense.shopName?.name || "",
        locationName: expense.locationName?.name || "",
        measures: expense.productName?.measures || [],
        measurementUnit: expense.productName?.measurementUnit || "",
        variants: expense.productName?.variants || [],
        variant: expense.variant || "",
        purchaseDate: formatDate(expense.purchaseDate),
        registeredDate: formatDate(expense.registeredDate),
      })),
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
    const expense = await Expense.findById(req.params.id)
      .populate("productName", "name measures measurementUnit variants")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    if (!expense) return res.status(404).json({ error: "Expense not found" });

    res.json({
      ...expense,
      productName: expense.productName?.name || "",
      brandName: expense.brandName?.name || "",
      shopName: expense.shopName?.name || "",
      locationName: expense.locationName?.name || "",
      measures: expense.productName?.measures || [],
      measurementUnit: expense.productName?.measurementUnit || "",
      variants: expense.productName?.variants || [],
      variant: expense.variant || "",
      purchaseDate: formatDate(expense.purchaseDate),
      registeredDate: formatDate(expense.registeredDate),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST Expense (supports IDs or names)
expensesRouter.post("/", async (req, res) => {
  try {
    const {
      // names (legacy)
      productName,
      brandName,
      shopName,
      locationName,

      // ids (new)
      productId,
      brandId,
      shopId,
      locationId,

      // ✅ new
      variant,

      quantity,
      ...expenseData
    } = req.body;

    const [product, brand, shop, location] = await Promise.all([
      resolveByIdOrName(Product, productId, productName),
      resolveByIdOrName(Brand, brandId, brandName),
      resolveByIdOrName(Shop, shopId, shopName),
      locationName || locationId
        ? resolveByIdOrName(Location, locationId, locationName)
        : null,
    ]);

    if (!product || !brand || !shop) {
      return res.status(400).json({ message: "Invalid product, brand, or shop." });
    }

    // ✅ validate variant belongs to product (if product has variants)
    const normalizedVariant = normalizeVariant(variant);
    if (!validateVariantForProduct(product, normalizedVariant)) {
      return res.status(400).json({
        message: "Invalid variant for selected product.",
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const expensesToInsert = Array.from({ length: qty }).map(() => ({
      productName: product._id,
      brandName: brand._id,
      shopName: shop._id,
      locationName: location?._id,

      // ✅ store chosen variant on expense
      variant: normalizedVariant,

      ...expenseData,
    }));

    const savedExpenses = await Expense.insertMany(expensesToInsert);

    const populatedExpenses = await Expense.find({
      _id: { $in: savedExpenses.map((exp) => exp._id) },
    })
      .populate("productName", "name")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    res.status(201).json({
      message: "Expense saved!",
      data: populatedExpenses.map((exp) => ({
        _id: exp._id,
        productName: exp.productName?.name,
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

// PUT Expense (supports IDs or names)
expensesRouter.put("/:id", async (req, res) => {
  try {
    const {
      // names (legacy)
      productName,
      brandName,
      shopName,
      locationName,

      // ids (new)
      productId,
      brandId,
      shopId,
      locationId,

      // ✅ new
      variant,

      ...updateData
    } = req.body;

    const [product, brand, shop, location] = await Promise.all([
      resolveByIdOrName(Product, productId, productName),
      resolveByIdOrName(Brand, brandId, brandName),
      resolveByIdOrName(Shop, shopId, shopName),
      locationName || locationId
        ? resolveByIdOrName(Location, locationId, locationName)
        : null,
    ]);

    if (!product || !brand || !shop) {
      return res.status(400).json({ message: "Invalid product, brand, or shop." });
    }

    // ✅ validate variant belongs to product (if product has variants)
    const normalizedVariant = normalizeVariant(variant);
    if (!validateVariantForProduct(product, normalizedVariant)) {
      return res.status(400).json({
        message: "Invalid variant for selected product.",
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        productName: product._id,
        brandName: brand._id,
        shopName: shop._id,
        locationName: location?._id,

        // ✅ store chosen variant on expense
        variant: normalizedVariant,

        ...updateData,
      },
      { new: true }
    )
      .populate("productName", "name")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .lean();

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found." });

    res.json({
      message: "Expense updated successfully!",
      data: {
        _id: updatedExpense._id,
        productName: updatedExpense.productName?.name,
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
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Expense not found" });
    res.json(deleted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default expensesRouter;

