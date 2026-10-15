import express from "express";
import slugify from "slugify";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationSchema.js";
import Category from "../models/categorySchema.js";
import mongoose from "mongoose";
import { ownedCreateFields, ownedFilter, withOwnerOnInsert } from "../middleware/dataOwnership.js";

const shopsRouter = express.Router();
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createSlug = (name) =>
  slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

const resolveLocationId = async (req, locationName) => {
  const trimmed = String(locationName || "").trim();
  if (!trimmed) return null;

  const slug = createSlug(trimmed);
  const loc = await Location.findOneAndUpdate(
    ownedFilter(req, { slug }),
    { $setOnInsert: withOwnerOnInsert(req, { name: trimmed, slug }) },
    { new: true, upsert: true }
  );

  return loc._id;
};

const resolveLocationIds = async (req, locationNames) => {
  const names = Array.isArray(locationNames) ? locationNames : [];
  const trimmedNames = [
    ...new Set(names.map((name) => String(name || "").trim()).filter(Boolean)),
  ];

  const ids = await Promise.all(trimmedNames.map((name) => resolveLocationId(req, name)));
  return ids.filter(Boolean);
};

const resolveCategoryId = async (req, categoryName) => {
  const trimmed = String(categoryName || "").trim();
  if (!trimmed) return null;

  const slug = createSlug(trimmed);
  const cat = await Category.findOneAndUpdate(
    ownedFilter(req, {
      slug,
      $or: [{ type: "shop" }, { type: { $exists: false } }, { type: null }],
    }),
    { $setOnInsert: withOwnerOnInsert(req, { name: trimmed, type: "shop", slug }) },
    { new: true, upsert: true }
  );

  return cat._id;
};

/**
 * Enrich ONLY the shops returned (small list) with location/category names.
 */
const enrichShops = async (shops) => {
  const allLocationIds = shops.flatMap((shop) => [
    ...(Array.isArray(shop.locations) ? shop.locations : []),
    shop.location,
  ]).filter(Boolean);
  const allCategoryIds = shops.map((s) => s.category).filter(Boolean);

  const uniqueLocationIds = [...new Set(allLocationIds.map((id) => id.toString()))];
  const uniqueCategoryIds = [...new Set(allCategoryIds.map((id) => id.toString()))];

  const [locationDocs, categoryDocs] = await Promise.all([
    uniqueLocationIds.length
      ? Location.find({ _id: { $in: uniqueLocationIds } }).select("name").lean()
      : Promise.resolve([]),
    uniqueCategoryIds.length
      ? Category.find({ _id: { $in: uniqueCategoryIds } }).select("name type").lean()
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
    const locationIds = [
      ...(Array.isArray(shopObj.locations) ? shopObj.locations : []),
      shopObj.location,
    ].filter(Boolean);

    const locationNames = [
      ...new Set(
        locationIds
          .map((id) => locationIdToNameMap[String(id)])
          .filter(Boolean)
      ),
    ];

    shopObj.locationIds = [...new Set(locationIds.map((id) => String(id)))];
    shopObj.locationNames = locationNames;
    shopObj.locationName = locationNames.join(", ") || "N/A";

    shopObj.categoryName =
      shopObj.category && categoryIdToNameMap[String(shopObj.category)]
        ? categoryIdToNameMap[String(shopObj.category)]
        : "N/A";

    return shopObj;
  });
};

const mergeShopRowsBySlug = (shops) => {
  const bySlug = new Map();

  shops.forEach((shop) => {
    const key = String(shop.slugifiedName || createSlug(shop.name || "")).trim();
    if (!key) return;

    if (!bySlug.has(key)) {
      bySlug.set(key, {
        ...shop,
        locations: [
          ...(Array.isArray(shop.locations) ? shop.locations : []),
          shop.location,
        ].filter(Boolean),
      });
      return;
    }

    const existing = bySlug.get(key);
    bySlug.set(key, {
      ...existing,
      category: existing.category || shop.category,
      brands: [
        ...new Set([
          ...(existing.brands || []).map(String),
          ...(shop.brands || []).map(String),
        ]),
      ],
      products: [
        ...new Set([
          ...(existing.products || []).map(String),
          ...(shop.products || []).map(String),
        ]),
      ],
      locations: [
        ...new Set([
          ...(existing.locations || []).map(String),
          ...(Array.isArray(shop.locations) ? shop.locations : []).map(String),
          ...(shop.location ? [String(shop.location)] : []),
        ]),
      ],
    });
  });

  return [...bySlug.values()];
};

shopsRouter.get("/", async (req, res) => {
  try {
    /**
     * FAST SEARCH MODE (for ExpenseDialog)
     * GET /api/shops?query=rema&limit=20
     * Returns one shop per name.
     */
    const search = String(req.query.query || "").trim();
    if (search) {
      const limit = Math.min(Number(req.query.limit) || 20, 50);

      // Guard: avoid returning big lists for short search
      if (search.length < 2) {
        return res.json({ shops: [], meta: { totalRowCount: 0 } });
      }

      const query = Shop.find(
        ownedFilter(req, { name: { $regex: escapeRegex(search), $options: "i" } })
      )
        .select("name location locations category slugifiedName") // keep it light
        .limit(limit * 10)
        .lean();

      const shops = await query.exec();
      const enrichedShops = await enrichShops(mergeShopRowsBySlug(shops).slice(0, limit));

      return res.json({ shops: enrichedShops, meta: { totalRowCount: enrichedShops.length } });
    }

    /**
     * EXISTING TABLE MODE (for Shops screen)
     * Supports: columnFilters, globalFilter, sorting, start, size
     */
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    let query = Shop.find(ownedFilter(req));

    // Column Filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (!id || (!value && value !== 0)) return;

        if (id === "name") {
          query = query.where("name").regex(new RegExp(escapeRegex(value), "i"));
        } else if (id === "location" || id === "category") {
          // allow filtering by id or name slug if you later support it
          query = query.where(id).equals(value);
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

    const shops = mergeShopRowsBySlug(await query.lean().exec());
    const totalRowCount = shops.length;
    const pagedShops =
      start !== undefined && size !== undefined
        ? shops.slice(parseInt(start, 10), parseInt(start, 10) + parseInt(size, 10))
        : shops;
    const enrichedShops = await enrichShops(pagedShops);

    res.json({ shops: enrichedShops, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/shops:", err);
    res.status(500).json({ error: err.message });
  }
});

shopsRouter.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const locationName = String(req.body?.locationName ?? "").trim();
    const locationNames = Array.isArray(req.body?.locationNames)
      ? req.body.locationNames
      : locationName
        ? [locationName]
        : [];
    const categoryName = String(req.body?.categoryName ?? "").trim();

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const locationIds = await resolveLocationIds(req, locationNames);
    const categoryId = await resolveCategoryId(req, categoryName);

    const slugifiedName = createSlug(name);

    const existingShop = await Shop.findOne(
      ownedFilter(req, {
        slugifiedName,
      })
    ).lean();

    if (existingShop) {
      return res.status(400).json({ message: "duplicate" });
    }

    const savedShop = await new Shop({
      name,
      locations: locationIds,
      category: categoryId,
      slugifiedName,
      ...ownedCreateFields(req),
    }).save();

    const shop = await Shop.findById(savedShop._id).lean();

    res.status(201).json({
      ...shop,
      locationNames: locationNames.filter(Boolean),
      locationName: locationNames.filter(Boolean).join(", ") || "N/A",
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
    const name = String(req.body?.name ?? "").trim();
    const locationName = String(req.body?.locationName ?? "").trim();
    const locationNames = Array.isArray(req.body?.locationNames)
      ? req.body.locationNames
      : locationName
        ? [locationName]
        : [];
    const categoryName = String(req.body?.categoryName ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shop id" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const locationIds = await resolveLocationIds(req, locationNames);
    const categoryId = await resolveCategoryId(req, categoryName);

    const slugifiedName = createSlug(name);

    const duplicateShop = await Shop.findOne(
      ownedFilter(req, {
        slugifiedName,
        _id: { $ne: id },
      })
    ).lean();

    if (duplicateShop) return res.status(400).json({ message: "duplicate" });

    const updated = await Shop.findOneAndUpdate(
      ownedFilter(req, { _id: id }),
      {
        $set: {
          name,
          category: categoryId,
          slugifiedName,
          locations: locationIds,
        },
        $unset: { location: "" },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Shop not found" });

    res.json({
      ...updated,
      locationNames: locationNames.filter(Boolean),
      locationName: locationNames.filter(Boolean).join(", ") || "N/A",
      categoryName: categoryName || "N/A",
    });
  } catch (err) {
    console.error("[PUT /shops/:id] error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

shopsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shop id" });
    }

    const shop = await Shop.findOne(ownedFilter(req, { _id: id })).lean();
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const matchingShopRows = await Shop.find(
      ownedFilter(req, { slugifiedName: shop.slugifiedName })
    ).lean();
    const mergedRows = mergeShopRowsBySlug([shop, ...matchingShopRows]);
    const [enrichedShop] = await enrichShops(mergedRows);

    res.json(enrichedShop);
  } catch (err) {
    console.error("[GET /shops/:id] error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

shopsRouter.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ error: "Invalid shop id" });
    }

    const shop = await Shop.findOneAndDelete(ownedFilter(req, { _id: req.params.id }));
    if (!shop) return res.status(404).send({ error: "Shop not found" });
    res.send(shop);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default shopsRouter;
