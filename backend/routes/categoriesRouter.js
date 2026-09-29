import express from "express";
import Category from "../models/categorySchema.js";
import Product from "../models/productSchema.js";
import Shop from "../models/shopSchema.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { ownedCreateFields, ownedFilter } from "../middleware/dataOwnership.js";

const categoriesRouter = express.Router();
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CATEGORY_TYPES = new Set(["product", "shop"]);
const normalizeType = (value) => (CATEGORY_TYPES.has(value) ? value : "shop");
const createSlug = (name) =>
  slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
const createCategorySlug = (type, name) =>
  type === "product" ? `product-${createSlug(name)}` : createSlug(name);

const typeFilter = (type) =>
  type === "shop"
    ? { $or: [{ type: "shop" }, { type: { $exists: false } }, { type: null }] }
    : { type };

const ensureProductCategories = async (req) => {
  const names = await Product.distinct("category", ownedFilter(req, {
    category: { $exists: true, $ne: "" },
  }));

  await Promise.all(
    names
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .map((name) =>
        Category.findOneAndUpdate(
          ownedFilter(req, { type: "product", slug: createCategorySlug("product", name) }),
          {
            $setOnInsert: {
              ...ownedCreateFields(req),
              type: "product",
              name,
              slug: createCategorySlug("product", name),
            },
          },
          { upsert: true, new: true },
        ),
      ),
  );
};

categoriesRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    const type = normalizeType(req.query.type);

    if (type === "product") {
      await ensureProductCategories(req);
    }

    let query = Category.find(ownedFilter(req, typeFilter(type)));

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
      query = query.where("name").regex(globalFilterRegex);
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
      totalRowCount = await Category.countDocuments(query.getFilter());
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const categories = await query.lean().exec();

    res.json({ categories, meta: { totalRowCount } });
  } catch (err) {
    console.error("Error in /api/categories:", err);
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const category = await Category.findOne(ownedFilter(req, { _id: req.params.id })).lean();
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

categoriesRouter.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const type = normalizeType(req.body?.type);
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const slug = createCategorySlug(type, name);

    const existingCategory = await Category.findOne(ownedFilter(req, { type, slug })).lean();
    if (existingCategory) {
      return res.status(400).json({ message: "duplicate" });
    }

    const category = new Category({
      name,
      type,
      slug, // Save the slug to the database
      ...ownedCreateFields(req),
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ error: "Invalid category id" });
    }

    const category = await Category.findOne(ownedFilter(req, { _id: req.params.id })).lean();
    if (!category) {
      return res.status(404).send({ error: "Category not found" });
    }

    const type = category.type || "shop";
    const inUse =
      type === "product"
        ? await Product.exists(
            ownedFilter(req, {
              $or: [{ categoryId: category._id }, { category: category.name }],
            }),
          )
        : await Shop.exists(ownedFilter(req, { category: category._id }));

    if (inUse) {
      return res.status(400).json({
        message:
          type === "product"
            ? "Kan ikke slette produktkategori som brukes av produkter."
            : "Kan ikke slette butikkategori som brukes av butikker.",
      });
    }

    await Category.deleteOne(ownedFilter(req, { _id: req.params.id }));
    res.send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

categoriesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const name = String(req.body?.name ?? "").trim();
  const type = normalizeType(req.body?.type);

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid category id" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    // Check if the slug already exists for a different brand
    const existingCategoryWithSlug = await Category.findOne(
      ownedFilter(req, {
        type,
        slug: createCategorySlug(type, name),
        _id: { $ne: id }, // Exclude the current brand from the check
      })
    ).lean();

    if (existingCategoryWithSlug) {
      return res.status(400).json({ message: "duplicate" });
    }

    const currentCategory = await Category.findOne(ownedFilter(req, { _id: id })).lean();
    if (!currentCategory) {
      return res.status(404).send({ error: "Category not found" });
    }

    const category = await Category.findOneAndUpdate(
      ownedFilter(req, { _id: id }),
      {
        $set: {
          name,
          type,
          slug: createCategorySlug(type, name),
        },
      },
      { new: true }
    );

    if ((currentCategory.type || "shop") === "product" && currentCategory.name !== name) {
      await Product.updateMany(
        ownedFilter(req, {
          $or: [{ categoryId: currentCategory._id }, { category: currentCategory.name }],
        }),
        { $set: { category: name } },
      );
    }

    res.send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default categoriesRouter;
