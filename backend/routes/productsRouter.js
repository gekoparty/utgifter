import express from "express";
import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";


const productsRouter = express.Router();

productsRouter.get("/", async (req, res) => {
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;
    

    console.log("Received query parameters:");
    console.log("columnFilters:", columnFilters);
    console.log("globalFilter:", globalFilter);
    console.log("sorting:", sorting);
    console.log("start", start);
    console.log("size", size);
    let query = Product.find();

    
    if (columnFilters) {
      
      const filters = JSON.parse(columnFilters);

      filters.forEach((filter) => {
        const { id, value } = filter;
        if (id && value) {
          if (id === "name") {
            const fieldFilter = {};
            fieldFilter[id] = new RegExp(`^${value}`, "i");
            query = query.where(fieldFilter);
          } else if (id === "brand") {
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
        const matchedProducts = await Product.aggregate([
          {
            $match: {
              $or: [
                {
                  name: { $regex: globalFilterRegex },
                },
                {
                  "brand.name": { $regex: globalFilterRegex },
                },
                {
                  "category.name": { $regex: globalFilterRegex },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand", // Use the correct field name from the Product model
              foreignField: "_id",
              as: "brandData",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              brand: {
                $cond: [
                  { $gt: [{ $size: "$brandData" }, 0] },
                  { $arrayElemAt: ["$brandData.name", 0] },
                  null, // Provide a default value or handle as needed
                ],
              },
            },
          },
          
        ])
        
        ;
    
        // Log the results for debugging
        console.log("Matched Products:", matchedProducts);
    
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
      const totalRowCount = await Product.countDocuments(query);

      // Apply pagination
      query = query.skip(startIndex).limit(pageSize);

      const products = await query.exec();

      // Send response with both paginated data and total row count
      res.json({ products, meta: { totalRowCount } });
      console.log("Before sending the response:");
    } else {
      // If not using pagination, just send the brands data
      const products = await query.exec();
      res.json(products);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
  console.log("After sorting and pagination:");
  
});

productsRouter.post("/", async (req, res) => {
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  try {
    const { name, brands, measurementUnit } = req.body;

    const brandIds = [];

    for (const brandObj of brands) {
      if (typeof brandObj.name === "string") {
        const slugifiedBrandName = slugify(brandObj.name, { lower: true }); // Slugify the brand name

        const existingBrand = await Brand.findOne({
          slug: slugifiedBrandName,
        });

        let brandId;

        if (!existingBrand) {
          const newBrand = new Brand({
            name: brandObj.name,
            slug: slugifiedBrandName,
          });

          const savedBrand = await newBrand.save();
          brandId = savedBrand._id;
        } else {
          brandId = existingBrand._id;
        }

        brandIds.push(brandId);
      }
    }

    const existingProduct = await Product.findOne({
      slug: slugify(name, { lower: true }),
    });

    if (existingProduct) {
      const existingProductWithBrands = await Product.findOne({
        slug: slugify(name, { lower: true }),
        brands: { $in: brandIds },
      });

      if (existingProductWithBrands) {
        return res.status(400).json({ message: "duplicate" });
      }
    }

    const product = new Product({
      name,
      measurementUnit,
      brands: brandIds,
      slug: slugify(name, { lower: true }),
    });

    try {
      console.log(product);

      const savedProduct = await product.save();
      console.log("Saved product:", savedProduct);

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
  console.log(id);
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
  const { id } = req.params;
  console.log(req.body);
  try {
    const { name, brands, measurementUnit } = req.body;
    const brandIds = [];

    for (const brandObj of brands) {
      if (typeof brandObj.name === "string") {
        const slugifiedBrandName = slugify(brandObj.name, { lower: true });
        const existingBrand = await Brand.findOne({
          slug: slugifiedBrandName,
        });

        let brandId;

        if (!existingBrand) {
          const newBrand = new Brand({
            name: brandObj.name,
            slug: slugifiedBrandName,
          });

          const savedBrand = await newBrand.save();
          brandId = savedBrand._id;
        } else {
          brandId = existingBrand._id;
        }
        brandIds.push(brandId);
      }
    }

    const existingProduct = await Product.findOne({
      _id: { $ne: id },
      slug: slugify(name, { lower: true }),
    });

    if (existingProduct) {
      const existingProductWithBrands = await Product.findOne({
        _id: { $ne: id },
        slug: slugify(name, { lower: true }),
        brands: { $in: brandIds },
      });
      if (existingProductWithBrands) {
        return res
          .status(400)
          .json({ message: "Duplicate product with same brands" });
      }
    }

    const updatedProduct = {
      name,
      measurementUnit,
      brands: brandIds,
      slug: slugify(name, { lower: true }),
    };

    console.log(updatedProduct)

    const result = await Product.findByIdAndUpdate(id, updatedProduct, {
      new: true,
      runValidators: true,
      populate: "brands", // Populate the "brands" field
    });

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Produkt ikke funnet" });
    }
  } catch (error) {
    console.error("server error", error);
    res.status(500).json({ message: "Intern server error" });
  }
});

export default productsRouter;
