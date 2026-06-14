import express from "express";
import slugify from "slugify";
import Location from "../models/locationSchema.js";
import mongoose from "mongoose";

const locationsRouter = express.Router();
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

locationsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Location.find();

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(escapeRegex(value), "i"));
          }
        }
      });
    }

    // Global Filter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(escapeRegex(globalFilter), "i");
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
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Location.countDocuments(query.getFilter());
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const locations = await query.lean().exec();

    res.json({ locations, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/locations:", err);
    res.status(500).json({ error: err.message });
  }
});

locationsRouter.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const slug = slugify(name, { lower: true });

    const existingLocation = await Location.findOne({ slug }).lean();
    if (existingLocation) {
      return res.status(400).json({ message: "A location with this name already exists." });
    }

    const location = new Location({ name, slug });
    const savedLocation = await location.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

locationsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const name = String(req.body?.name ?? "").trim();

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid location id" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const slug = slugify(name, { lower: true });

    // Check for duplicate locations
    const existingLocation = await Location.findOne({ slug, _id: { $ne: id } }).lean();
    if (existingLocation) {
      return res.status(400).json({ message: "A location with this name already exists." });
    }

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json(updatedLocation);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

locationsRouter.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid location id" });
    }

    const location = await Location.findById(req.params.id).lean();
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

locationsRouter.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid location id" });
    }

    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default locationsRouter;
