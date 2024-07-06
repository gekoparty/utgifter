import express from "express";
import Expense from "../models/expenseSchema.js";
import slugify from "slugify";

const expensesRouter = express.Router();

expensesRouter.get("/", async (req, res) => {
    console.log(req.body)
    try {
      const { columnFilters, globalFilter, sorting, start, size } = req.query;
  
      console.log("Received query parameters:");
      console.log("columnFilters:", columnFilters);
      console.log("globalFilter:", globalFilter);
      console.log("sorting:", sorting);
      console.log("start", start);
      console.log("size", size);
  
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
            { productName: globalFilterRegex }, // Assuming 'name' is a field in your data
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
  
        const expenses = await query.exec();
  
        // Send response with both paginated data and total row count
        res.json({ expenses, meta: { totalRowCount } });
      } else {
        // If not using pagination, just send the brands data
        const expenses = await query.exec();
        res.json(expenses);
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
    console.log(req.body);
    try {
      const { productName } = req.body;
  
      const slug = slugify(productName, { lower: true });
  
      const existingExpense = await Expense.findOne({ slug });
      if (existingExpense) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const expense = new Expense({
        name,
        slug, // Save the slug to the database
      });
  
      await expense.save();
      res.status(201).json(brand);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });