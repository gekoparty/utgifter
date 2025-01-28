import express from "express";
import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";


const productsRouter = express.Router();

productsRouter.get("/", async (req, res) => {
  try {
    // Extract query parameters
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

    // Initialize query object
    let query = Product.find();

    // Apply column filters
    if (columnFilters) {
      const filters = JSON.parse(columnFilters);
      filters.forEach(({ id, value }) => {
        if (id && value) {
          if (id === "name") {
            query = query.where("name").regex(new RegExp(value, "i")); // Case-insensitive match
          } else if (id === "brand") {
            query = query.where("brands").in(value); // Matches brand IDs
          } else if (id === "type") {
            query = query.where("type").regex(new RegExp(value, "i"));
          }
        }
      });
    }

    // Apply global filter
    if (globalFilter) {
      const globalFilterRegex = new RegExp(globalFilter, "i"); // Case-insensitive global search
      query = query.or([
        { name: globalFilterRegex },
        { type: globalFilterRegex },
        { measures: globalFilterRegex },
      ]);
    }

    // Apply sorting
    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortObject = parsedSorting.reduce((acc, { id, desc }) => {
          acc[id] = desc ? -1 : 1; // MongoDB requires 1 for ascending, -1 for descending
          return acc;
        }, {});
        query = query.sort(sortObject);
      }
    }

    // Pagination
    let totalRowCount = 0;
    if (start && size) {
      const startIndex = parseInt(start, 10);
      const pageSize = parseInt(size, 10);

      totalRowCount = await Product.countDocuments(query); // Total count before pagination
      query = query.skip(startIndex).limit(pageSize);
    }

    // Execute the query
    const products = await query.exec();

    // Fetch brand names for each product
    const brandNamesArray = await Promise.all(
      products.map(async (product) => {
        if (!product.brands || !product.brands.length) return ["N/A"];
        return Promise.all(
          product.brands.map(async (brandId) => {
            const brand = await Brand.findById(brandId);
            return brand ? brand.name : "N/A";
          })
        );
      })
    );

    // Attach brand names to the products
    const enrichedProducts = products.map((product, idx) => ({
      ...product.toObject(),
      brand: brandNamesArray[idx].join(", "),
    }));

    // Respond with paginated products and metadata
    res.json({
      products: enrichedProducts,
      meta: { totalRowCount },
    });
  } catch (err) {
    console.error("Error in /api/products:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

productsRouter.post("/", async (req, res) => {
 
  try {
    const { name, brands, measurementUnit, type, measures } = req.body;

     // Handle each brand name in the array
     const brandPromises = brands.map(async (brandName) => {
      const slugifiedBrandName = slugify(brandName, { lower: true });
      let brandId;

    // Find existing brand or create a new one
    const existingBrand = await Brand.findOne({ slug: slugifiedBrandName });
    if (!existingBrand) {
      const newBrand = new Brand({
        name: brandName,
        slug: slugifiedBrandName,
      });

      const savedBrand = await newBrand.save();
      brandId = savedBrand._id;
    } else {
      brandId = existingBrand._id;
    }
    return brandId;
  });

  const brandIds = await Promise.all(brandPromises);

    // Check for duplicate product
    const existingProduct = await Product.findOne({
      slug: slugify(name, { lower: true }),
      brands: { $in: brandIds }, // Check if all brands exist in the product
    });

    if (existingProduct) {
      return res.status(400).json({ message: "duplicate" });
    }

    // Save the product
    const product = new Product({
      name,
      measurementUnit,
      type,
      measures: measures || [], // Save measures or default to an empty array
      brands: brandIds,
      slug: slugify(name, { lower: true }),
    });

    try {
      

      const savedProduct = await product.save();
      

      const populatedProduct = await Product.findById(savedProduct._id)
        .populate("brands")
        .exec();

      res.status(201).json(populatedProduct);
    } catch (saveError) {
      console.error("Error saving product:", saveError);
      res.status(500).json({ message: "Error saving product" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

productsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.send(product);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

productsRouter.put("/:id", async (req, res) => {
  console.log("Incoming request body:", req.body);
  const { id } = req.params;
  
  try {
    const { name, brands, measurementUnit, type, measures } = req.body;
    const brandIds = [];

    // Handle each brand name in the array
    const brandPromises = brands.map(async (brandName) => {
      const slugifiedBrandName = slugify(brandName, { lower: true });
      let brandId;

      // Find existing brand or create a new one
      const existingBrand = await Brand.findOne({ slug: slugifiedBrandName });
      if (!existingBrand) {
        const newBrand = new Brand({
          name: brandName,
          slug: slugifiedBrandName,
        });

        const savedBrand = await newBrand.save();
        brandId = savedBrand._id;
      } else {
        brandId = existingBrand._id;
      }
      return brandId;
    });

    const resolvedBrandIds = await Promise.all(brandPromises);
    
    // Now, resolvedBrandIds contains the IDs of existing or newly created brands

    // Update the product with the new data
    const updatedProduct = {
      name,
      measurementUnit,
      measures: measures || [], // Update measures or default to an empty array
      brands: resolvedBrandIds, // Assign the resolved brand IDs
      type,
      slug: slugify(name, { lower: true }),
    };

    

    const result = await Product.findByIdAndUpdate(id, updatedProduct, {
      new: true,
      runValidators: true,
      populate: "brands", // Populate the "brands" field
    });

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Server error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default productsRouter;
