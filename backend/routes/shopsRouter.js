import express from "express";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import Category from "../models/categorySchema.js";

const shopsRouter = express.Router()

shopsRouter.get("/", async (req, res) => {
    try {
      const shops = await Shop.find().populate("location").populate("category");
      res.json(shops);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
  
  shopsRouter.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { originalPayload, slugifiedPayload } = req.body;
      const { name, location, category } = originalPayload;
      let locationId = location;
      let categoryId = category // Use the existing locationId parameter
  
      if(typeof category === "string") {
        const existingCategory = await Category.findOne({
            slug: slugifiedPayload.category
        });

        if(!existingCategory) {
            const newCategory = new Category({
                name: originalPayload.category,
                slug: slugifiedPayload.category
            });

            const savedCategory = await newCategory.save();
            categoryId = savedCategory._id
        } else {
            categoryId = existingCategory._id;
        }
      }  


      // Check if the location and category is provided as a string (name) instead of a reference
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
        category: categoryId,
        slugifiedName,
      });
  
      try {
        const savedShop = await shop.save();
        console.log("Saved shop:", savedShop);
  
        // Fetch the associated location document using populate
        const populatedShop = await Shop.findById(savedShop._id).populate("location").populate("category").exec();
  
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
  
  shopsRouter.put("/:id", async (req, res) => {
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
      let categoryObjectId;

      const existingCategory = await Category.findOne({name: category})

      if(existingCategory) {
        categoryObjectId = existingCategory._id
      } else {
        const newCategory = new Category({name: category, slug: slugifiedPayload.category})
        const savedCategory = await newCategory.save();
        categoryObjectId = savedCategory._id
      }

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
      shop.category = categoryObjectId;
      shop.slugifiedName = slugifiedPayload.name;
  
      try {
        const updatedShop = await shop.save();
        console.log("Updated shop:", updatedShop); // Add a console.log to check the updated shop object
        // Fetch the updated shop data along with the associated location data using populate
        const populatedShop = await Shop.findById(updatedShop._id).populate("location").populate("category").exec();
  
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
  
  shopsRouter.delete("/:id", async (req, res) => {
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

  export default shopsRouter;