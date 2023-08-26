import express from "express";
import Location from "../models/locationScema.js";
import slugify from "slugify";

const locationsRouter = express.Router();


locationsRouter.get("/", async (req, res) => {
  console.log(req.body)
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    console.log("Received query parameters:");
    console.log("columnFilters:", columnFilters);
    console.log("globalFilter:", globalFilter);
    console.log("sorting:", sorting);
    console.log("start", start);
    console.log("size", size);

    let query = Location.find();

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
          { name: globalFilterRegex }, // Assuming 'name' is a field in your data
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
      const totalRowCount = await Location.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const locations = await query.exec();

      // Send response with both paginated data and total row count
      res.json({ locations, meta: { totalRowCount } });
    } else {
      // If not using pagination, just send the brands data
      const locations = await query.exec();
      res.json(locations);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

locationsRouter.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
  
  locationsRouter.delete("/:id", async (req, res) => {
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

  locationsRouter.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { name } = req.body;
      const slug = slugify(name, { lower: true });
  
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
  
  locationsRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, slug} = req.body;
  
    try {
      // Check if the slug already exists for a different brand
      const existingLocationWithSlug = await Location.findOne({
        slug: slugify(name, {lower: true}),
        _id: { $ne: id }, // Exclude the current brand from the check
      });
  
      if (existingLocationWithSlug) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const location = await Location.findByIdAndUpdate(
        id,
        {
          $set: {
            name,
            slug: slugify(name, {lower: true})
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


export default locationsRouter;