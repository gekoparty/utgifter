import express from "express";
import slugify from "slugify";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import Category from "../models/categorySchema.js";

const shopsRouter = express.Router();

shopsRouter.get("/", async (req, res) => {
  try {
    // Log incoming query parameters for debugging
    console.log("Shops GET params:", req.query);
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Shop.find();

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i"));
          } else if (id === "location" || id === "category") {
            // Log the value received for debugging
            console.log(`Filtering on ${id} with value:`, value);
            query = query.where(id).equals(value);
          }
        }
      });
    }

    // Global Filter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i");
      query = query.or([{ name: globalFilterRegex }]);
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
      totalRowCount = await Shop.countDocuments(query.getFilter());
      console.log("Total matching shops:", totalRowCount);
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const shops = await query.exec();
    console.log("Fetched shops:", shops);

    // Enrich shops with location and category names
    const allLocationIds = shops.map(shop => shop.location).filter(Boolean);
    const allCategoryIds = shops.map(shop => shop.category).filter(Boolean);
    const uniqueLocationIds = [...new Set(allLocationIds.map(id => id.toString()))];
    const uniqueCategoryIds = [...new Set(allCategoryIds.map(id => id.toString()))];

    const locationDocs = await Location.find({ _id: { $in: uniqueLocationIds } }).lean();
    const categoryDocs = await Category.find({ _id: { $in: uniqueCategoryIds } }).lean();

    const locationIdToNameMap = locationDocs.reduce((acc, loc) => {
      acc[loc._id.toString()] = loc.name;
      return acc;
    }, {});
    const categoryIdToNameMap = categoryDocs.reduce((acc, cat) => {
      acc[cat._id.toString()] = cat.name;
      return acc;
    }, {});

    const enrichedShops = shops.map(shop => {
      const shopObj = shop.toObject();
      // Check if shopObj.location exists before calling toString()
      shopObj.locationName =
        shopObj.location && locationIdToNameMap[shopObj.location.toString()]
          ? locationIdToNameMap[shopObj.location.toString()]
          : "N/A";
      
      // Similarly for category
      shopObj.categoryName =
        shopObj.category && categoryIdToNameMap[shopObj.category.toString()]
          ? categoryIdToNameMap[shopObj.category.toString()]
          : "N/A";
      
      return shopObj;
    });

    // Log the final enriched shops for debugging
    console.log("Enriched shops:", enrichedShops);

    res.json({ shops: enrichedShops, meta: { totalRowCount } });
  } catch (err) {
    // Log the full error for debugging
    console.error("Error in /api/shops:", err);
    res.status(500).json({ error: err.message });
  }
});

shopsRouter.post("/", async (req, res) => {

  try {
    const { name, location, category } = req.body;
    let locationId = location;
    let categoryId = category;

    if (typeof category === "string") {
      const existingCategory = await Category.findOne({
        slug: slugify(category, { lower: true }),
      });

      if (!existingCategory) {
        const newCategory = new Category({
          name: category,
          slug: slugify(category, { lower: true }),
        });

        const savedCategory = await newCategory.save();
        categoryId = savedCategory._id;
      } else {
        categoryId = existingCategory._id;
      }
    }

    if (typeof location === "string") {
      const existingLocation = await Location.findOne({
        slug: slugify(location, { lower: true }),
      });

      if (!existingLocation) {
        const newLocation = new Location({
          name: location,
          slug: slugify(location, { lower: true }),
        });

        const savedLocation = await newLocation.save();
        locationId = savedLocation._id;
      } else {
        locationId = existingLocation._id;
      }
    }

    const slugifiedName = slugify(name, { lower: true });

    const existingShop = await Shop.findOne({
      name,
      location: locationId,
    });

    if (existingShop) {
      return res.status(400).json({ message: "A shop with the same name and location already exists." });
    }

    const shop = new Shop({
      name,
      location: locationId,
      category: categoryId,
      slugifiedName,
    });

    try {
      const savedShop = await shop.save();
    

      const populatedShop = await Shop.findById(savedShop._id)
        .populate("location")
        .populate("category")
        .exec();

      res.status(201).json(populatedShop);
    } catch (saveError) {
      console.error("Error saving shop:", saveError);
      res.status(500).json({ message: "Error saving shop" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})



shopsRouter.put("/:id", async (req, res) => {
  const shopId = req.params.id;
  const { name, location, category } = req.body;

  try {
    // Find the existing shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Handle the location logic
    let locationObjectId;
    if (location && typeof location === "string") {
      // Try to find the location by name
      const existingLocation = await Location.findOne({ name: location });

      if (!existingLocation) {
        // Location does not exist, so create it
        const newLocation = new Location({
          name: location,
          slug: slugify(location, { lower: true }),
        });
        const savedLocation = await newLocation.save();
        locationObjectId = savedLocation._id;
      } else {
        // Location exists, use its ObjectId
        locationObjectId = existingLocation._id;
      }
    } else {
      // If location is not provided or not a string, keep the existing one
      locationObjectId = shop.location;
    }

    // Handle the category logic
    let categoryObjectId;
    if (category && typeof category === "string") {
      const existingCategory = await Category.findOne({ name: category });

      if (!existingCategory) {
        // Category does not exist, so create it
        const newCategory = new Category({
          name: category,
          slug: slugify(category, { lower: true }),
        });
        const savedCategory = await newCategory.save();
        categoryObjectId = savedCategory._id;
      } else {
        // Category exists, use its ObjectId
        categoryObjectId = existingCategory._id;
      }
    } else {
      // If category is not provided or not a string, keep the existing one
      categoryObjectId = shop.category;
    }

    // Update the shop with the new data
    shop.name = name;
    shop.location = locationObjectId; // Now we have the correct ObjectId
    shop.category = categoryObjectId;
    shop.slugifiedName = slugify(name, { lower: true });

    // Save the updated shop
    const updatedShop = await shop.save();

    // Optionally, populate the updated shop with its references
    const populatedShop = await Shop.findById(updatedShop._id)
      .populate("location")
      .populate("category");

    // Send the updated shop back in the response
    res.status(200).json(populatedShop);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



shopsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

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
