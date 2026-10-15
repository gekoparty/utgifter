import "dotenv/config";
import mongoose from "mongoose";
import Expense from "../models/expenseSchema.js";
import Shop from "../models/shopSchema.js";

const dropIndexIfExists = async (collection, indexName) => {
  const indexes = await collection.indexes();
  if (!indexes.some((index) => index.name === indexName)) return;
  await collection.dropIndex(indexName);
  console.log(`Dropped ${collection.collectionName}.${indexName}`);
};

const mergeUniqueIds = (...lists) => {
  const ids = new Set();

  lists.flat().forEach((value) => {
    if (value) ids.add(String(value));
  });

  return [...ids].map((id) => new mongoose.Types.ObjectId(id));
};

const backfillShopLocationsFromExpenses = async () => {
  const rows = await Expense.aggregate([
    {
      $match: {
        shopName: { $ne: null },
        locationName: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$shopName",
        locationIds: { $addToSet: "$locationName" },
      },
    },
  ]);

  let updatedShops = 0;

  for (const row of rows) {
    const shop = await Shop.findById(row._id).lean();
    if (!shop) continue;

    const locations = mergeUniqueIds(
      shop.locations || [],
      shop.location ? [shop.location] : [],
      row.locationIds || []
    );

    await Shop.updateOne(
      { _id: shop._id },
      {
        $set: { locations },
        $unset: { location: "" },
      }
    );
    updatedShops += 1;
  }

  console.log(`Backfilled locations for ${updatedShops} shops from expenses.`);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const groups = await Shop.aggregate([
    {
      $group: {
        _id: { ownerUserId: "$ownerUserId", slugifiedName: "$slugifiedName" },
        count: { $sum: 1 },
        shopIds: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  let mergedGroups = 0;
  let removedShops = 0;
  let movedExpenses = 0;

  for (const group of groups) {
    const shops = await Shop.find({ _id: { $in: group.shopIds } })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    if (shops.length < 2) continue;

    const [canonical, ...duplicates] = shops;
    const duplicateIds = duplicates.map((shop) => shop._id);

    const expenseResult = await Expense.updateMany(
      { shopName: { $in: duplicateIds } },
      { $set: { shopName: canonical._id } }
    );

    const category = canonical.category || duplicates.find((shop) => shop.category)?.category;
    const brands = mergeUniqueIds(canonical.brands || [], ...duplicates.map((shop) => shop.brands || []));
    const products = mergeUniqueIds(
      canonical.products || [],
      ...duplicates.map((shop) => shop.products || [])
    );
    const locations = mergeUniqueIds(
      canonical.locations || [],
      canonical.location ? [canonical.location] : [],
      ...duplicates.map((shop) => shop.locations || []),
      ...duplicates.map((shop) => (shop.location ? [shop.location] : []))
    );

    await Shop.updateOne(
      { _id: canonical._id },
      {
        $set: {
          ...(category ? { category } : {}),
          brands,
          products,
          locations,
        },
        $unset: { location: "" },
      }
    );

    const deleteResult = await Shop.deleteMany({ _id: { $in: duplicateIds } });

    mergedGroups += 1;
    removedShops += deleteResult.deletedCount || 0;
    movedExpenses += expenseResult.modifiedCount || 0;

    console.log(
      `Merged ${canonical.name}: moved ${expenseResult.modifiedCount || 0} expenses, removed ${
        deleteResult.deletedCount || 0
      } duplicate shops`
    );
  }

  await backfillShopLocationsFromExpenses();

  await dropIndexIfExists(Shop.collection, "ownerUserId_1_slugifiedName_1_location_1");
  await Shop.syncIndexes();

  await mongoose.disconnect();
  console.log(
    `Done. Merged ${mergedGroups} duplicate shop groups, removed ${removedShops} shops, moved ${movedExpenses} expenses.`
  );
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
