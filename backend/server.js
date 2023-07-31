import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import Category from "./models/CategorySchema.js";
import Shop from "./models/shopSchema.js";
import Brand from "./models/brandSchema.js";
import Location from "./models/locationScema.js";

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
  console.log(req.body);
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const name = originalPayload.name;
    const slug = slugifiedPayload.name;

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ message: "duplicate" });
    }

    const category = new Category
    ({
      name,
      slug, // Save the slug to the database
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
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
});

app.get("/api/locations", async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/locations", async (req, res) => {
  console.log(req.body);
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const name = originalPayload.name;
    const slug = slugifiedPayload.name;

    const existingLocation = await Location.findOne({ slug });
    if (existingLocation) {
      return res.status(400).json({ message: "duplicate" });
    }

    const location = new Location({
      name,
      slug, // Save the slug to the database
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/locations/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).send({ error: "Location not found" });
    }
    res.send(location);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.put("/api/locations/:id", async (req, res) => {
  const { id } = req.params;
  const { originalPayload, slugifiedPayload } = req.body;

  try {
    // Check if the slug already exists for a different brand
    const existingLocationWithSlug = await Location.findOne({
      slug: slugifiedPayload.name,
      _id: { $ne: id }, // Exclude the current brand from the check
    });

    if (existingLocationWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const location = await Location.findByIdAndUpdate(
      id,
      {
        $set: {
          name: originalPayload.name,
          slug: slugifiedPayload.name,
        },
      },
      { new: true }
    );

    if (!location) {
      return res.status(404).send({ error: "Location not found" });
    }

    res.send(location);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find().populate("location");
    res.json(shops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/shops", async (req, res) => {
  console.log(req.body);
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const { name, location, category } = originalPayload;
    let locationId = location; // Use the existing locationId parameter

    // Check if the location is provided as a string (name) instead of a reference
    if (typeof location === "string") {
      const existingLocation = await Location.findOne({
        slug: slugifiedPayload.location,
      });

      if (!existingLocation) {
        const newLocation = new Location({
          name: originalPayload.location,
          slug: slugifiedPayload.location,
        });

        const savedLocation = await newLocation.save();
        locationId = savedLocation._id; // Reassign the locationId using let
      } else {
        locationId = existingLocation._id; // Reassign the locationId using let
      }
    }

    const slugifiedName = slugifiedPayload.name;
    const slugifiedLocation = slugifiedPayload.location;

    // Check if a shop with the same name already exists
    const existingShop = await Shop.findOne({
      slugifiedName,
    });

    if (existingShop) {
      // Check if the shop with the same name and location already exists
      const existingShopWithLocation = await Shop.findOne({
        slugifiedName,
        location: locationId,
      });

      if (existingShopWithLocation) {
        return res.status(400).json({ message: "duplicate" });
      }
    }

    const shop = new Shop({
      name,
      location: locationId,
      category,
      slugifiedName,
      slugifiedCategory: slugifiedPayload.category,
    });

    try {
      const savedShop = await shop.save();
      console.log("Saved shop:", savedShop);

      // Fetch the associated location document using populate
      const populatedShop = await Shop.findById(savedShop._id).populate("location").exec();

      res.status(201).json(populatedShop);
    } catch (saveError) {
      console.error("Error saving shop:", saveError);
      res.status(500).json({ message: "Error saving shop" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/shops/:id", async (req, res) => {
  const shopId = req.params.id;
  console.log(req.body);

  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const { name, location, category } = originalPayload;

    // Find the shop by its ID
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check if the name already exists (excluding the current shop being updated)
    const existingShop = await Shop.findOne({
      slugifiedName: slugifiedPayload.name,
      slugifiedLocation: slugifiedPayload.location,
      _id: { $ne: shopId },
    });
    if (existingShop) {
      return res.status(400).json({ message: "duplicate" });
    }

    // If the location exists, use its ObjectId; otherwise, create a new location
    let locationObjectId;
    const existingLocation = await Location.findOne({ name: location });

    if (existingLocation) {
      locationObjectId = existingLocation._id;
    } else {
      // Create a new location
      const newLocation = new Location({ name: location, slug: slugifiedPayload.location });
      const savedLocation = await newLocation.save();
      locationObjectId = savedLocation._id;
    }

    // Update the shop fields
    shop.name = name;
    shop.location = locationObjectId;
    shop.category = category;
    shop.slugifiedName = slugifiedPayload.name;
    shop.slugifiedLocation = slugifiedPayload.location;
    shop.slugifiedCategory = slugifiedPayload.category;

    try {
      const updatedShop = await shop.save();
      console.log("Updated shop:", updatedShop); // Add a console.log to check the updated shop object
      // Fetch the updated shop data along with the associated location data using populate
      const populatedShop = await Shop.findById(updatedShop._id).populate("location").exec();

      res.status(200).json(populatedShop);
    } catch (saveError) {
      console.error("Error saving updated shop:", saveError);
      res.status(500).json({ message: "Error saving updated shop" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/shops/:id", async (req, res) => {
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
});

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
  console.log(req.body);
  try {
    const { originalPayload, slugifiedPayload } = req.body;
    const name = originalPayload.name;
    const slug = slugifiedPayload.name;

    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
      return res.status(400).json({ message: "duplicate" });
    }

    const brand = new Brand({
      name,
      slug, // Save the slug to the database
    });

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/brands/:id", async (req, res) => {
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
});

app.put("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  const { originalPayload, slugifiedPayload } = req.body;

  try {
    // Check if the slug already exists for a different brand
    const existingBrandWithSlug = await Brand.findOne({
      slug: slugifiedPayload.name,
      _id: { $ne: id }, // Exclude the current brand from the check
    });

    if (existingBrandWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        $set: {
          name: originalPayload.name,
          slug: slugifiedPayload.name,
        },
      },
      { new: true }
    );

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
