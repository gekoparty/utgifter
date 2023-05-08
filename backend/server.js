import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import Category from "./models/CategorySchema.js";

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
dotenv.config();

mongoose.set("strictQuery", false);

connectToDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name
    });

    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

 
// Error handling middleware
/* app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
}); */



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB");
  } catch (err) {
    console.error(err.message);
  }
}

