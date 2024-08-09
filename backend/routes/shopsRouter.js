import express from "express";
import slugify from "slugify";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import Category from "../models/categorySchema.js";

const shopsRouter = express.Router();

shopsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    

    console.log("Received query parameters:");
    console.log("columnFilters:", columnFilters);
    console.log("globalFilter:", globalFilter);
    console.log("sorting:", sorting);
    console.log("start", start);
    console.log("size", size);
    let query = Shop.find();

    
    if (columnFilters) {
      
      const filters = JSON.parse(columnFilters);

      filters.forEach((filter) => {
        const { id, value } = filter;
        if (id && value) {
          if (id === "name") {
            const fieldFilter = {};
            fieldFilter[id] = new RegExp(`^${value}`, "i");
            query = query.where(fieldFilter);
          } else if (id === "location" || id === "category") {
            // Handle filtering for reference fields
            const referenceField = `${id}`;
            const referenceFilter = {};
            referenceFilter[referenceField] = value; // Only pass the _id of the location or category
            query = query.where(referenceField, referenceFilter[referenceField]);
          }
        }
      });
      console.log("After applying filters: columfilter");
    }
    


    if (globalFilter) {

      const globalFilterRegex = new RegExp(globalFilter, "i");
    
      try {
        const matchedShops = await Shop.aggregate([
          {
            $match: {
              $or: [
                {
                  name: { $regex: globalFilterRegex },
                },
                {
                  "location.name": { $regex: globalFilterRegex },
                },
                {
                  "category.name": { $regex: globalFilterRegex },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "locations", // Replace with your actual collection name for locations
              localField: "location",
              foreignField: "_id",
              as: "locationData",
            },
          },
          {
            $lookup: {
              from: "categories", // Replace with your actual collection name for categories
              localField: "category",
              foreignField: "_id",
              as: "categoryData",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              location: {
                $cond: [
                  {
                    $gt: [{ $size: "$locationData" }, 0],
                  },
                  { $arrayElemAt: ["$locationData.name", 0] },
                  "$location.name",
                ],
              },
              category: {
                $cond: [
                  {
                    $gt: [{ $size: "$categoryData" }, 0],
                  },
                  { $arrayElemAt: ["$categoryData.name", 0] },
                  "$category.name",
                ],
              },
            },
          },
        ]);
    
        // Log the results for debugging
        console.log("Matched Shops:", matchedShops);
    
      } catch (error) {
        console.error("Error in query:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Handle errors
      }
      console.log("After applying filters: global");
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
      console.log("After sorting");
    }

    // Apply pagination
    if (start && size) {
      const startIndex = parseInt(start);
      const pageSize = parseInt(size);

      // Query total row count before pagination
      const totalRowCount = await Shop.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const shops = await query.exec();

      // Send response with both paginated data and total row count
      res.json({ shops, meta: { totalRowCount } });
      console.log("Before sending the response:");
    } else {
      // If not using pagination, just send the brands data
      const shops = await query.exec();
      res.json(shops);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
  console.log("After sorting and pagination:");
  
});

shopsRouter.post("/", async (req, res) => {
  console.log(req.body);
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
      console.log("Saved shop:", savedShop);

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
