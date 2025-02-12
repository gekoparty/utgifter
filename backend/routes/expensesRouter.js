import express from "express";
import slugify from "slugify";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import { format, parse, isValid, getMonth, getYear, parseISO } from "date-fns";// Import the date-fns library

const expensesRouter = express.Router();


const getDefaultValue = (value) => value || 'n/a';

function formatDate(date) {
  // Check if date is null or undefined
  if (!date) {
    return ''; // Return an empty string if date is null or undefined
  }

  // Ensure the date is a valid Date object
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return ''; // Return an empty string if the date is invalid
  }

  // Format the date
  return format(parsedDate, 'dd MMMM yyyy'); // Outputs: 12 January 2024
}


function parseDateInput(value) {
  const now = new Date();
  
  // Attempt to parse full date (dd MMMM yyyy)
  const fullDate = parse(value, "dd MMMM yyyy", new Date());
  if (isValid(fullDate)) {
    return fullDate; // returns a valid Date object
  }

  // Attempt to parse date with only day and month (dd MMMM)
  const dayMonth = parse(value, "dd MMMM", new Date());
  if (isValid(dayMonth)) {
    return new Date(now.getFullYear(), dayMonth.getMonth(), dayMonth.getDate()); // Current year
  }

  // Attempt to parse only month (MMMM)
  const monthOnly = parse(value, "MMMM", new Date());
  if (isValid(monthOnly)) {
    return new Date(now.getFullYear(), monthOnly.getMonth(), 1); // First day of the month
  }

  // Attempt to parse only year (yyyy)
  const yearOnly = parse(value, "yyyy", new Date());
  if (isValid(yearOnly)) {
    return new Date(yearOnly.getFullYear(), 0, 1); // Return January 1st of that year
  }

  return null; // Return null if no valid date was found
}




expensesRouter.get("/", async (req, res) => {
  try {
    console.log("Expenses GET params:", req.query);
    const { columnFilters, globalFilter, sorting, start, size, minPrice, maxPrice } = req.query;

    let query = Expense.find();

    // Price range filtering
    if (minPrice !== undefined && maxPrice !== undefined) {
      query = query.where("price").gte(minPrice).lte(maxPrice);
    }

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "purchaseDate" || id === "registeredDate") {
            // Parse date and filter by year/month
            const inputDate = parseDateInput(value);
            if (inputDate) {
              query = query.where(id)
                .gte(new Date(inputDate.getFullYear(), inputDate.getMonth(), 1))
                .lt(new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 1));
            }
          } else if (["productName", "brandName", "shopName", "locationName"].includes(id)) {
            query = query.populate({
              path: id,
              match: { name: new RegExp(value, "i") },
            });
          } else {
            query = query.where(id).regex(new RegExp(value, "i"));
          }
        }
      });
    }

    // Global Filter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.or([
        { productName: { $regex: globalFilterRegex, $options: "i" } },
        { brandName: { $regex: globalFilterRegex, $options: "i" } },
        { shopName: { $regex: globalFilterRegex, $options: "i" } },
        { locationName: { $regex: globalFilterRegex, $options: "i" } },
      ]);
    }

    // Sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          acc[id] = desc ? -1 : 1;
          return acc;
        }, {});
        console.log("Applying sort:", sortObject);
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Expense.countDocuments(query.getFilter());
      console.log("Total matching expenses:", totalRowCount);
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const expenses = await query
      .populate("productName", "name measures measurementUnit")
      .populate("brandName", "name")
      .populate("shopName", "name")
      .populate("locationName", "name")
      .exec();


    // Format and enrich response
    const formattedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      productName: expense.productName?.name || "",
      brandName: expense.brandName?.name || "",
      shopName: expense.shopName?.name || "",
      measures: expense.productName?.measures || "",
      locationName: expense.locationName?.name || "",
      purchaseDate: formatDate(expense.purchaseDate),
      registeredDate: formatDate(expense.registeredDate),
    }));

    

    res.json({ expenses: formattedExpenses, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/expenses:", err);
    res.status(500).json({ error: err.message });
  }
});

expensesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the specific expense and populate the referenced fields
    const expense = await Expense.findById(id)
    .populate('productName', 'name measures')  // Include measures here
      .populate('brandName', 'name')
      .populate('shopName', 'name')
      .populate('locationName', 'name');

    if (!expense) {
      return res.status(404).send({ error: "Expense not found" });
    }

    // Format the date if needed and transform populated fields to plain strings
    const formattedExpense = {
      ...expense.toObject(),
      productName: expense.productName?.name || expense.productName,
      brandName: expense.brandName?.name || expense.brandName,
      shopName: expense.shopName?.name || expense.shopName,
      measures: expense.productName?.measures || '',  // Include the measures field
      locationName: expense.locationName?.name || expense.locationName,
      purchaseDate: formatDate(expense.purchaseDate),
    };

    res.json(formattedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})

expensesRouter.post("/", async (req, res) => {
  console.log("Expense data received:", req.body);

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
    // Save all expense documents
  const savedExpenses = await Expense.insertMany(expensesToSave);

  // Populate product name for better frontend handling
  const populatedExpenses = await Expense.populate(savedExpenses, {
    path: "productName",
    select: "name"
  });

  res.status(201).json({
    message: "Utgift lagret!",
    data: populatedExpenses
  });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Serverfeil. Vennligst prøv igjen."  });
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
    locationName,
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

    // Update the expense
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
    )
    .populate('productName', 'name')
    .populate('brandName', 'name')
    .populate('shopName', 'name')
    .populate('locationName', 'name');

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    // Format response data
    const formattedExpense = {
      _id: updatedExpense._id,
      productName: updatedExpense.productName.name,
      brandName: updatedExpense.brandName.name,
      shopName: updatedExpense.shopName.name,
      locationName: updatedExpense.locationName ? updatedExpense.locationName.name : null,
      measurementUnit: updatedExpense.measurementUnit,
      type: updatedExpense.type,
      price: updatedExpense.price,
      purchased: updatedExpense.purchased,
      purchaseDate: updatedExpense.purchaseDate,
      registeredDate: updatedExpense.registeredDate,
      hasDiscount: updatedExpense.hasDiscount,
      discountValue: updatedExpense.discountValue,
      discountAmount: updatedExpense.discountAmount,
      quantity: updatedExpense.quantity,
      volume: updatedExpense.volume,
      finalPrice: updatedExpense.finalPrice,
      pricePerUnit: updatedExpense.pricePerUnit,
    };

    res.json(formattedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


expensesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
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