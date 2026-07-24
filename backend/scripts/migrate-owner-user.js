import "dotenv/config";
import mongoose from "mongoose";
import AppUser from "../models/appUserSchema.js";
import Brand from "../models/brandSchema.js";
import Category from "../models/categorySchema.js";
import Expense from "../models/expenseSchema.js";
import Location from "../models/locationSchema.js";
import Product from "../models/productSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../models/recurringTermsHistorySchema.js";
import ReceiptMatchAlias from "../models/receiptMatchAliasSchema.js";
import Shop from "../models/shopSchema.js";
import Variant from "../models/variantSchema.js";

const MODELS = [
  Brand,
  Category,
  Expense,
  Location,
  Product,
  RecurringExpense,
  RecurringPayment,
  RecurringTermsHistory,
  ReceiptMatchAlias,
  Shop,
  Variant,
];

const dropIndexIfExists = async (collection, indexName) => {
  const indexes = await collection.indexes();
  if (!indexes.some((index) => index.name === indexName)) return;
  await collection.dropIndex(indexName);
  console.log(`Dropped ${collection.collectionName}.${indexName}`);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await AppUser.findOne({ role: "admin" }).sort({ createdAt: 1 });
  if (!admin) {
    throw new Error("No admin user found. Log in once and promote an admin before running this.");
  }

  for (const Model of MODELS) {
    const result = await Model.updateMany(
      { ownerUserId: { $exists: false } },
      { $set: { ownerUserId: admin._id } }
    );
    console.log(`${Model.modelName}: assigned ${result.modifiedCount} old records to ${admin.email}`);
  }

  await dropIndexIfExists(Brand.collection, "name_1");
  await dropIndexIfExists(Brand.collection, "slug_1");
  await dropIndexIfExists(Category.collection, "name_1");
  await dropIndexIfExists(Category.collection, "slug_1");
  await dropIndexIfExists(Location.collection, "name_1");
  await dropIndexIfExists(Location.collection, "slug_1");
  await dropIndexIfExists(Product.collection, "name_1");
  await dropIndexIfExists(Product.collection, "slug_1");
  await dropIndexIfExists(RecurringExpense.collection, "slug_1_type_1");
  await dropIndexIfExists(RecurringPayment.collection, "recurringExpenseId_1_periodKey_1");
  await dropIndexIfExists(RecurringTermsHistory.collection, "recurringExpenseId_1_fromDate_1");
  await dropIndexIfExists(
    ReceiptMatchAlias.collection,
    "normalizedPhrase_1_product_1_brand_1_shop_1"
  );
  await dropIndexIfExists(Shop.collection, "name_1_location_1");
  await dropIndexIfExists(Variant.collection, "product_1_slug_1");
  await dropIndexIfExists(Variant.collection, "product_1_name_1");

  for (const Model of MODELS) {
    await Model.syncIndexes();
    console.log(`${Model.modelName}: indexes synced`);
  }

  await mongoose.disconnect();
  console.log("Owner migration complete.");
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
