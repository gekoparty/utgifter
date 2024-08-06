import express from "express";
import slugify from "slugify";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import { format } from "date-fns"; // Import the date-fns library

const expensesRouter = express.Router();

const formatDate = (date) => {
  return format(new Date(date), "dd.MM.yy");
};

expensesRouter.get("/", async (req, res) => {
  console.log("GET /api/expenses hit");
  console.log(req.body);

  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    console.log("Received query parameters:", { columnFilters, globalFilter, sorting, start, size });

    let query = Expense.find();

    // Apply columnFilters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach((filter) => {
        const { id, value } = filter;
        if (id && value) {
          const fieldFilter = {};
          fieldFilter[id] = new RegExp(`^${value}`, "i");
          query = query.where(fieldFilter);
        }
      });
    }

    // Apply globalFilter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.find({
        $or: [
          { productName: globalFilterRegex },
          { brandName: globalFilterRegex },
          { shopName: globalFilterRegex },
          { locationName: globalFilterRegex },
          // Add other fields here that you want to include in the global filter
        ],
      });
    }

    // Apply sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortConfig = parsedSorting[0]; // Assuming you only have one sorting option
        const { id, desc } = sortConfig;

        // Build the sorting object
        const sortObject = {};
        sortObject[id] = desc ? -1 : 1;

        query = query.sort(sortObject);
      }
    }

    // Apply pagination
    if (start && size) {
      const startIndex = parseInt(start);
      const pageSize = parseInt(size);

      // Query total row count before pagination
      const totalRowCount = await Expense.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const expenses = await query
        .populate('productName', 'name')
        .populate('brandName', 'name')
        .populate('shopName', 'name')
        .populate('locationName', 'name')
        .exec();

      // Format purchaseDate
      const formattedExpenses = expenses.map(expense => ({
        ...expense.toObject(),
        purchaseDate: formatDate(expense.purchaseDate),
      }));

      // Send response with both paginated data and total row count
      res.json({ expenses: formattedExpenses, meta: { totalRowCount } });
    } else {
      // If not using pagination, just send the expenses data
      const expenses = await query
        .populate('productName', 'name')
        .populate('brandName', 'name')
        .populate('shopName', 'name')
        .populate('locationName', 'name')
        .exec();

      // Format purchaseDate
      const formattedExpenses = expenses.map(expense => ({
        ...expense.toObject(),
        purchaseDate: formatDate(expense.purchaseDate),
      }));

      res.json(formattedExpenses);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

expensesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).send({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

expensesRouter.post("/", async (req, res) => {
  console.log("POST /api/expenses hit");
  console.log(req.body);

  try {
    const {
      productName,
      brandName,
      measurementUnit,
      type,
      price,
      purchased,
      shopName,
      purchaseDate,
      registeredDate,
      hasDiscount,
      discountValue,
      discountAmount,
      quantity,
      locationName,
      volume,
      finalPrice,
      pricePerUnit,
    } = req.body;

    // Find or create references
    const product = await Product.findOne({ name: productName });
    const brand = await Brand.findOne({ name: brandName });
    const shop = await Shop.findOne({ name: shopName });
    const location = locationName ? await Location.findOne({ name: locationName }) : null;

    if (!product || !brand || !shop) {
      return res.status(400).json({ message: "Invalid product, brand, or shop." });
    }

    // Ensure quantity is a positive integer
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    // Create an array to hold all expense documents
    const expensesToSave = [];

    // Create each expense document based on quantity
    for (let i = 0; i < quantityNumber; i++) {
      const expense = new Expense({
        productName: product._id,
        brandName: brand._id,
        measurementUnit,
        type,
        price,
        purchased,
        shopName: shop._id,
        purchaseDate,
        registeredDate,
        hasDiscount,
        discountValue,
        discountAmount,
        quantity: 1, // Set quantity to 1 for each document
        volume,
        locationName: location ? location._id : null,
        finalPrice,
        pricePerUnit,
      });

      expensesToSave.push(expense);
    }

    // Save all expense documents
    const savedExpenses = await Expense.insertMany(expensesToSave);

    res.status(201).json(savedExpenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

expensesRouter.put("/:id", async (req, res) => {
  console.log("Received PUT request data:", req.body);
  
  const { id } = req.params;
  const {
    productName,
    brandName,
    measurementUnit,
    type,
    price,
    purchased,
    shopName,
    purchaseDate,
    registeredDate,
    hasDiscount,
    discountValue,
    discountAmount,
    quantity,
    locationName,  // Required for creating/updating a shop
    volume,
    finalPrice,
    pricePerUnit,
  } = req.body;

  try {
    // Find or create the product
    const product = await Product.findOne({ name: productName });
    if (!product) {
      return res.status(400).json({ message: "Invalid product." });
    }

    // Find or create the brand
    let brand = await Brand.findOne({ name: brandName });
    if (!brand) {
      const brandSlug = slugify(brandName, { lower: true });
      brand = new Brand({
        name: brandName,
        slug: brandSlug,
      });
      await brand.save();
    }

    // Find or create the location
    let location = locationName
      ? await Location.findOne({ name: locationName })
      : null;
    if (locationName && !location) {
      const locationSlug = slugify(locationName, { lower: true });
      location = new Location({
        name: locationName,
        slug: locationSlug,
      });
      await location.save();
    }

    // Find or create the shop (ensure location is included)
    let shop = await Shop.findOne({ name: shopName, location: location?._id });
    if (!shop) {
      const shopSlug = slugify(shopName, { lower: true });
      if (!location) {
        return res.status(400).json({ message: "Location is required to create a shop." });
      }
      shop = new Shop({
        name: shopName,
        slugifiedName: shopSlug,
        location: location._id,  // Assign the location to the shop
      });
      await shop.save();
    }

    // Find the expense by ID and update it
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      {
        productName: product._id,
        brandName: brand._id,
        measurementUnit,
        type,
        price,
        purchased,
        shopName: shop._id,
        purchaseDate,
        registeredDate,
        hasDiscount,
        discountValue,
        discountAmount,
        quantity,
        locationName: location ? location._id : null,
        volume,
        finalPrice,
        pricePerUnit,
      },
      { new: true } // Return the updated document
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

expensesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).send({ error: "Expense not found" });
    }
    res.send(expense);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default expensesRouter;