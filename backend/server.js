import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import Category from "./models/CategorySchema.js";
import Shop from './models/shopSchema.js'
import Brand from './models/brandSchema.js';

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

app.delete("/api/categories/:id", async (req,res) =>  {
  const { id } = req.params;
  console.log(id);
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).send({ error: "Category not found" });
    }
    res.send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})

app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/shops", async (req, res) => {
  try {
    const shop = new Shop({
      name: req.body.name,
      location: req.body.location,
      category: req.body.category
    });

    const existingShop = await Shop.findOne({ name: req.body.name });
    if (existingShop) {
      return res.status(400).json({ message: "Shop already exists" });
    }

    await shop.save();
    res.status(201).json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/shops/:id", async (req,res) =>  {
  const { id } = req.params;
  console.log(id);
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).send({ error: "Shop not found" });
    }
    res.send(shop);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})

app.get("/api/brands", async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/brands", async (req, res) => {
  try {
    const brand = new Brand({
      name: req.body.name
    });

    const existingBrand = await Brand.findOne({ name: req.body.name });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/brands/:id", async (req,res) =>  {
  const { id } = req.params;
  console.log(id);
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).send({ error: "Brand not found" });
    }
    res.send(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})

app.put("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const brand = await Brand.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!brand) {
      return res.status(404).send({ error: "Brand not found" });
    }
    res.send(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
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

