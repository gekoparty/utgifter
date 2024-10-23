import express from "express";
import slugify from "slugify";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import { format } from "date-fns"; // Import the date-fns library

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

expensesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size, minPrice, maxPrice } = req.query;
    
    let query = Expense.find();

    // Populate fields
   // Only populate fields if needed for filtering or sorting
   if (columnFilters || globalFilter) {
    query = query.populate('productName', 'name measures')  // Include measures here
                 .populate('brandName', 'name')
                 .populate('shopName', 'name')
                 .populate('locationName', 'name');
  }

    // Apply price range filtering
    if (minPrice !== undefined && maxPrice !== undefined) {
      query = query.where('price').gte(minPrice).lte(maxPrice);
    }


    // Execute the initial query to get all records for filtering
    let expenses = await query.exec();

    // Apply columnFilters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      

      expenses = expenses.filter(expense => {
        return filters.every(filter => {
          const { id, value } = filter;
          if (id && value) {
            if (['productName', 'brandName', 'shopName', 'locationName'].includes(id)) {
              return new RegExp(`^${value}`, "i").test(expense[id]?.name);
            } else {
              return new RegExp(`^${value}`, "i").test(expense[id]);
            }
          }
          return true;
        });
      });
    }

    // Apply globalFilter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
   

      expenses = expenses.filter(expense => {
        return ['productName', 'brandName', 'shopName', 'locationName'].some(field => {
          return globalFilterRegex.test(expense[field]?.name);
        });
      });
    }

    // Get total row count after filtering
    const totalRowCount = expenses.length;

    // Apply sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortConfig = parsedSorting[0]; // Assuming you only have one sorting option
        const { id, desc } = sortConfig;

        expenses = expenses.sort((a, b) => {
          let fieldA = id === 'purchaseDate' || id === 'registeredDate' ? new Date(a[id]) : (a[id]?.name || a[id]);
          let fieldB = id === 'purchaseDate' || id === 'registeredDate' ? new Date(b[id]) : (b[id]?.name || b[id]);

          if (desc) {
            return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
          } else {
            return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
          }
        });
      }
    }

    // Apply pagination
    if (start && size) {
      const startIndex = parseInt(start);
      const pageSize = parseInt(size);

      expenses = expenses.slice(startIndex, startIndex + pageSize);
    }

    // Format the expenses
    const formattedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      productName: expense.productName?.name || '',
      brandName: expense.brandName?.name || '',
      shopName: expense.shopName?.name || '',
      measures: expense.productName?.measures || '',  // Include the measures field
      locationName: expense.locationName?.name || '',
      purchaseDate: formatDate(expense.purchaseDate),
      registeredDate: formatDate(expense.registeredDate)
    }));

    // Send response with both paginated data and total row count
    res.json({ expenses: formattedExpenses, meta: { totalRowCount } });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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