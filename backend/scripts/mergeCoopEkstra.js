import "dotenv/config";
import mongoose from "mongoose";
import Shop from "../models/shopSchema.js";
import Expense from "../models/expenseSchema.js";
import ReceiptMatchAlias from "../models/receiptMatchAliasSchema.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const sources = await Shop.find({ name: /^coop ekstra$/i }).lean();
  const owners = [...new Set(sources.map((shop) => String(shop.ownerUserId)))];
  if (!owners.length) console.log("No Coop Ekstra shops found. Nothing to migrate.");

  for (const owner of owners) {
    if (!mongoose.isValidObjectId(owner)) throw new Error("Shop has no valid owner; migration stopped.");
    const result = await mongoose.connection.transaction(async (session) => {
      const rows = await Shop.find({ ownerUserId: owner, name: /^coop (ekstra|extra)$/i })
        .sort({ createdAt: 1, _id: 1 }).session(session).lean();
      const target = rows.find((shop) => /^coop extra$/i.test(shop.name)) || rows[0];
      const removedIds = rows.filter((shop) => String(shop._id) !== String(target._id)).map((shop) => shop._id);
      const ids = rows.map((shop) => shop._id);
      const expenseLocations = await Expense.distinct("locationName", { ownerUserId: owner, shopName: { $in: ids } }).session(session);
      const union = (values) => [...new Set(values.filter(Boolean).map(String))];
      await Shop.updateOne({ _id: target._id }, {
        $set: {
          name: "Coop Extra", slugifiedName: "coop-extra",
          locations: union([...rows.flatMap((shop) => [...(shop.locations || []), shop.location]), ...expenseLocations]),
          brands: union(rows.flatMap((shop) => shop.brands || [])),
          products: union(rows.flatMap((shop) => shop.products || [])),
          category: target.category || rows.find((shop) => shop.category)?.category,
        },
        $unset: { location: "" },
      }, { session });
      const expenses = await Expense.updateMany({ ownerUserId: owner, shopName: { $in: removedIds } }, { $set: { shopName: target._id } }, { session });
      const aliases = await ReceiptMatchAlias.find({ ownerUserId: owner, shop: { $in: removedIds } }).session(session).lean();
      for (const alias of aliases) {
        const existing = await ReceiptMatchAlias.findOne({
          ownerUserId: owner, shop: target._id, normalizedPhrase: alias.normalizedPhrase,
          product: alias.product || null, brand: alias.brand || null,
        }).session(session);
        if (existing) {
          await ReceiptMatchAlias.updateOne({ _id: existing._id }, {
            $inc: { count: alias.count || 0 },
            $max: { lastUsedAt: alias.lastUsedAt || alias.updatedAt },
          }, { session });
          await ReceiptMatchAlias.deleteOne({ _id: alias._id }, { session });
        } else {
          await ReceiptMatchAlias.updateOne({ _id: alias._id }, { $set: { shop: target._id } }, { session });
        }
      }
      await Shop.deleteMany({ _id: { $in: removedIds }, ownerUserId: owner }, { session });
      return { expenses: expenses.modifiedCount, aliases: aliases.length, removed: removedIds.length };
    });
    console.log(`Coop Extra: moved ${result.expenses} expenses and ${result.aliases} receipt aliases; merged ${result.removed} shop records.`);
  }
  console.log(`Remaining Coop Ekstra shops: ${await Shop.countDocuments({ name: /^coop ekstra$/i })}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
