import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationScema.js";

export async function findOrCreate(Model, name) {
  if (!name) return null;
  let doc = await Model.findOne({ name });
  if (!doc) {
    doc = new Model({ name, slug: slugify(name, { lower: true }) });
    await doc.save();
  }
  return doc;
}

export async function filterByReferences(query, filters) {
  for (const { id, value } of filters) {
    if (!id || !value) continue;

    if (["purchaseDate", "registeredDate"].includes(id)) {
      const { start, end } = convertToUTC(value);
      query.where(id).gte(start).lte(end);
    } else if (["productName", "brandName", "shopName", "locationName"].includes(id)) {
      const ModelMap = { productName: Product, brandName: Brand, shopName: Shop, locationName: Location };
      const matchingIds = await ModelMap[id].find({ name: new RegExp(value, "i") }).distinct("_id");
      query.where(id).in(matchingIds);
    } else {
      query.where(id).regex(new RegExp(value, "i"));
    }
  }
  return query;
}
