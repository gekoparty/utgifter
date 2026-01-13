import express from "express";
import slugify from "slugify";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";
import Category from "../models/categorySchema.js";
import mongoose from "mongoose";

const shopsRouter = express.Router();

const createSlug = (name) =>
  slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

const resolveLocationId = async (locationName) => {
  const trimmed = String(locationName || "").trim();
  if (!trimmed) return null;

  const slug = createSlug(trimmed);
  const loc = await Location.findOneAndUpdate(
    { slug, name: trimmed },
    { $setOnInsert: { name: trimmed, slug } },
    { new: true, upsert: true }
  );

  return loc._id;
};

const resolveCategoryId = async (categoryName) => {
  const trimmed = String(categoryName || "").trim();
  if (!trimmed) return null;

  const slug = createSlug(trimmed);
  const cat = await Category.findOneAndUpdate(
    { slug, name: trimmed },
    { $setOnInsert: { name: trimmed, slug } },
    { new: true, upsert: true }
  );

  return cat._id;
};

const isObjectIdString = (v) =>
  typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

/**
 * Enrich ONLY the shops returned (small list) with location/category names.
 */
const enrichShops = async (shops) => {
  const allLocationIds = shops.map((s) => s.location).filter(Boolean);
  const allCategoryIds = shops.map((s) => s.category).filter(Boolean);

  const uniqueLocationIds = [...new Set(allLocationIds.map((id) => id.toString()))];
  const uniqueCategoryIds = [...new Set(allCategoryIds.map((id) => id.toString()))];

  const [locationDocs, categoryDocs] = await Promise.all([
    uniqueLocationIds.length
      ? Location.find({ _id: { $in: uniqueLocationIds } }).select("name").lean()
      : Promise.resolve([]),
    uniqueCategoryIds.length
      ? Category.find({ _id: { $in: uniqueCategoryIds } }).select("name").lean()
      : Promise.resolve([]),
  ]);

  const locationIdToNameMap = locationDocs.reduce((acc, loc) => {
    acc[loc._id.toString()] = loc.name;
    return acc;
  }, {});

  const categoryIdToNameMap = categoryDocs.reduce((acc, cat) => {
    acc[cat._id.toString()] = cat.name;
    return acc;
  }, {});

  return shops.map((shop) => {
    const shopObj = shop.toObject ? shop.toObject() : shop;

    shopObj.locationName =
      shopObj.location && locationIdToNameMap[String(shopObj.location)]
        ? locationIdToNameMap[String(shopObj.location)]
        : "N/A";

    shopObj.categoryName =
      shopObj.category && categoryIdToNameMap[String(shopObj.category)]
        ? categoryIdToNameMap[String(shopObj.category)]
        : "N/A";

    return shopObj;
  });
};

shopsRouter.get("/", async (req, res) => {
  try {
    /**
     * FAST SEARCH MODE (for ExpenseDialog)
     * GET /api/shops?query=rema&limit=20
     * Returns small result set with locationName.
     */
    const search = String(req.query.query || "").trim();
    if (search) {
      const limit = Math.min(Number(req.query.limit) || 20, 50);

      // Guard: avoid returning big lists for short search
      if (search.length < 2) {
        return res.json({ shops: [], meta: { totalRowCount: 0 } });
      }

      const query = Shop.find({ name: { $regex: search, $options: "i" } })
        .select("name location category slugifiedName") // keep it light
        .limit(limit);

      const shops = await query.exec();
      const enrichedShops = await enrichShops(shops);

      return res.json({ shops: enrichedShops, meta: { totalRowCount: enrichedShops.length } });
    }

    /**
     * EXISTING TABLE MODE (for Shops screen)
     * Supports: columnFilters, globalFilter, sorting, start, size
     */
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Shop.find();

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (!id || (!value && value !== 0)) return;

        if (id === "name") {
          query = query.where("name").regex(new RegExp(value, "i"));
        } else if (id === "location" || id === "category") {
          // allow filtering by id or name slug if you later support it
          query = query.where(id).equals(value);
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
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    if (start !== undefined && size !== undefined) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);
      totalRowCount = await Shop.countDocuments(query.getFilter());
      query = query.skip(startIndex).limit(pageSize);
    }

    const shops = await query.exec();
    const enrichedShops = await enrichShops(shops);

    res.json({ shops: enrichedShops, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/shops:", err);
    res.status(500).json({ error: err.message });
  }
});

shopsRouter.post("/", async (req, res) => {
  try {
    const { name, locationName, categoryName } = req.body;

    const locationId = await resolveLocationId(locationName);
    const categoryId = await resolveCategoryId(categoryName);

    const slugifiedName = createSlug(name);

    const existingShop = await Shop.findOne({
      slugifiedName,
      location: locationId,
    });

    if (existingShop) {
      return res.status(400).json({ message: "duplicate" });
    }

    const savedShop = await new Shop({
      name,
      location: locationId,
      category: categoryId,
      slugifiedName,
    }).save();

    const shop = await Shop.findById(savedShop._id).lean();

    res.status(201).json({
      ...shop,
      locationName: locationName || "N/A",
      categoryName: categoryName || "N/A",
    });
  } catch (err) {
    console.error("[POST /shops] error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

shopsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, locationName, categoryName } = req.body;

    const locationId = await resolveLocationId(locationName);
    const categoryId = await resolveCategoryId(categoryName);

    const slugifiedName = createSlug(name);

    const duplicateShop = await Shop.findOne({
      slugifiedName,
      location: locationId,
      _id: { $ne: id },
    });

    if (duplicateShop) return res.status(400).json({ message: "duplicate" });

    const updated = await Shop.findByIdAndUpdate(
      id,
      { name, location: locationId, category: categoryId, slugifiedName },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Shop not found" });

    res.json({
      ...updated,
      locationName: locationName || "N/A",
      categoryName: categoryName || "N/A",
    });
  } catch (err) {
    console.error("[PUT /shops/:id] error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

shopsRouter.delete("/:id", async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) return res.status(404).send({ error: "Shop not found" });
    res.send(shop);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default shopsRouter;
