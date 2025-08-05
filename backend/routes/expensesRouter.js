import express from "express";
import slugify from "slugify";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format, parse, isValid, parseISO } from "date-fns";

const expensesRouter = express.Router();

// Utility Functions
const formatDate = (date) =>
  date ? format(new Date(date), "dd MMMM yyyy") : "";

const getReferenceIds = async (model, field, value) =>
  value ? model.find({ [field]: new RegExp(value, "i") }).distinct("_id") : [];

const filterByDate = (query, id, value) => {
  const timeZone = "Europe/Oslo";
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const zonedDate = toZonedTime(date, timeZone);
    const startOfDay = fromZonedTime(new Date(zonedDate.setHours(0, 0, 0, 0)), timeZone);
    const endOfDay = fromZonedTime(new Date(zonedDate.setHours(23, 59, 59, 999)), timeZone);
    query.where(id).gte(startOfDay).lte(endOfDay);
  }
};

const applyFilters = async (query, filters) => {
  for (const { id, value } of filters) {
    if (!id || !value) continue;

    if (["purchaseDate", "registeredDate"].includes(id)) {
      filterByDate(query, id, value);
    } else if (["productName", "brandName", "shopName", "locationName"].includes(id)) {
      const modelMap = {
        productName: Product,
        brandName: Brand,
        shopName: Shop,
        locationName: Location,
      };
      const matchingIds = await getReferenceIds(modelMap[id], "name", value);
      query.where(id).in(matchingIds);
    } else {
      query.where(id).regex(new RegExp(value, "i"));
    }
  }
};

const applySorting = (query, sorting) => {
  if (sorting && sorting.length > 0) {
    const sortObj = sorting.reduce((acc, { id, desc }) => {
      acc[id] = desc ? -1 : 1;
      return acc;
    }, {});
    query.sort(sortObj);
  }
};

const applyPagination = async (query, start, size) => {
  const total = await Expense.countDocuments(query.getFilter());
  const startIndex = Math.max(0, Math.min(parseInt(start, 10) || 0, total));
  const pageSize = parseInt(size, 10) || 10;
  return { query: query.skip(startIndex).limit(pageSize), total, startIndex };
};

// GET Expenses
expensesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    let query = Expense.find();
    if (columnFilters) await applyFilters(query, JSON.parse(columnFilters));
    if (globalFilter) query.or([{ productName: new RegExp(globalFilter, "i") }]);
    if (sorting) applySorting(query, JSON.parse(sorting));

    const { query: paginatedQuery, total, startIndex } = await applyPagination(query, start, size);
    const expenses = await paginatedQuery
      .populate("productName", "name measures measurementUnit")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .exec();

    res.json({
      expenses: expenses.map((expense) => ({
        ...expense.toObject(),
        productName: expense.productName?.name || "",
        brandName: expense.brandName?.name || "",
        shopName: expense.shopName?.name || "",
        locationName: expense.locationName?.name || "",
        measures: expense.productName?.measures || "",
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
      .populate("productName", "name measures")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name");

    if (!expense) return res.status(404).json({ error: "Expense not found" });

    res.json({
      ...expense.toObject(),
      productName: expense.productName?.name,
      brandName: expense.brandName?.name,
      shopName: expense.shopName?.name,
      locationName: expense.locationName?.name,
      purchaseDate: formatDate(expense.purchaseDate),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// POST Expense
expensesRouter.post("/", async (req, res) => {
  try {
    const { productName, brandName, shopName, locationName, quantity, ...expenseData } = req.body;

    const product = await Product.findOne({ name: productName });
    const brand = await Brand.findOne({ name: brandName });
    const shop = await Shop.findOne({ name: shopName });
    const location = locationName ? await Location.findOne({ name: locationName }) : null;

    if (!product || !brand || !shop) return res.status(400).json({ message: "Invalid product, brand, or shop." });

    const expenses = Array.from({ length: parseInt(quantity, 10) || 1 }).map(
      () => new Expense({ productName: product._id, brandName: brand._id, shopName: shop._id, locationName: location?._id, ...expenseData })
    );

    const savedExpenses = await Expense.insertMany(expenses);

    // Populate the response to include the names instead of just IDs
    const populatedExpenses = await Expense.find({ _id: { $in: savedExpenses.map(exp => exp._id) } })
      .populate("productName", "name")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name");

    res.status(201).json({
      message: "Expense saved!",
      data: populatedExpenses.map(exp => ({
        _id: exp._id,
        productName: exp.productName?.name,
        brandName: exp.brandName?.name,
        shopName: exp.shopName?.name,
        locationName: exp.locationName?.name
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again." });
  }
});


// PUT Expense
// PUT Expense (Update)
expensesRouter.put("/:id", async (req, res) => {
  try {
    const { productName, brandName, shopName, locationName, ...updateData } = req.body;

    const product = await Product.findOne({ name: productName });
    const brand = await Brand.findOne({ name: brandName });
    const shop = await Shop.findOne({ name: shopName });
    const location = locationName ? await Location.findOne({ name: locationName }) : null;

    if (!product || !brand || !shop) return res.status(400).json({ message: "Invalid product, brand, or shop." });

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { productName: product._id, brandName: brand._id, shopName: shop._id, locationName: location?._id, ...updateData },
      { new: true }
    ).populate("productName", "name")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name");

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found." });

    res.json({
      message: "Expense updated successfully!",
      data: {
        _id: updatedExpense._id,
        productName: updatedExpense.productName?.name,
        brandName: updatedExpense.brandName?.name,
        shopName: updatedExpense.shopName?.name,
        locationName: updatedExpense.locationName?.name
      }
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
