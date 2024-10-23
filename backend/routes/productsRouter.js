import express from "express";
import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";


const productsRouter = express.Router();

productsRouter.get("/", async (req, res) => {
  console.log("Incoming request body:", req.body);
  try {
    const { columnFilters, globalFilter, sorting, start, size } = req.query;

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
             // Only pass the _id of the location or category
            query = query.where("brands", { $in: value }); // Use $in for array comparison
          }
        }
      });
      
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
              measures: 1, // Include the measures field
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
        console.log("Fetched products:", products);
    
      } catch (error) {
        console.error("Error in query:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Handle errors
      }
     
    }

    // Apply sorting

    if (sorting) {
      const parsedSorting = JSON.parse(sorting);
      if (parsedSorting.length > 0) {
        const sortConfig = parsedSorting[0]; // Assuming you only have one sorting option
        const { id, desc } = sortConfig;
    
        const sortObject = {};
    
        // Handle sorting by brand name if id is "brand"
        if (id === "brand.name") {
          sortObject["brand.name"] = desc ? 1 : -1; // Sort based on brand name within the array
        } else {
          sortObject[id] = desc ? -1 : 1; // Default sorting for other fields
        }
    
        query = query.sort(sortObject);
      }
    
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
      console.log(products)
   
    } else {
      // If not using pagination, just send the brands data
      const products = await query.exec();
     
      res.json(products);
      console.log(products)
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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
