import slugify from "slugify";
import Product from "../models/productSchema.js";
import Brand from "../models/brandSchema.js";
import Shop from "../models/shopSchema.js";
import Location from "../models/locationSchema.js";
import { convertToUTC } from "./dateUtils.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function findOrCreate(Model, name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  const slug = slugify(trimmed, { lower: true });
  let doc = await Model.findOne({ slug });
  if (!doc) {
    doc = new Model({ name: trimmed, slug });
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
      const matchingIds = await ModelMap[id].find({ name: new RegExp(escapeRegex(value), "i") }).distinct("_id");
      query.where(id).in(matchingIds);
    } else {
      query.where(id).regex(new RegExp(escapeRegex(value), "i"));
    }
  }
  return query;
}
