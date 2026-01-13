import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env");
  process.exit(1);
}

async function main() {
  console.log("🔌 Connecting...");
  await mongoose.connect(MONGODB_URI, { w: "majority" });

  const db = mongoose.connection.db;
  const products = db.collection("products");

  console.log("✅ Connected DB:", db.databaseName);
  console.log("✅ Collection:", products.namespace);

  const total = await products.countDocuments();
  console.log(`📦 Total products: ${total}`);

  // 🔥 NO FILTER — logic is inside update
  const res = await products.updateMany(
    { type: { $exists: true, $ne: null, $ne: "" } },
    [
      {
        $set: {
          category: {
            $cond: [
              {
                $or: [
                  { $eq: ["$category", null] },
                  { $eq: ["$category", ""] },
                  { $not: ["$category"] },
                ],
              },
              "$type",
              "$category",
            ],
          },
          legacyType: {
            $cond: [
              {
                $or: [
                  { $eq: ["$legacyType", null] },
                  { $eq: ["$legacyType", ""] },
                  { $not: ["$legacyType"] },
                ],
              },
              "$type",
              "$legacyType",
            ],
          },
        },
      },
    ],
    { writeConcern: { w: "majority" } }
  );

  console.log(
    `✅ Bulk migration completed: matched=${res.matchedCount}, modified=${res.modifiedCount}`
  );

  // Verification
  const missingCategory = await products.countDocuments({
    $or: [
      { category: { $exists: false } },
      { category: null },
      { category: "" },
    ],
  });

  console.log(`📊 Products still missing category: ${missingCategory}`);
  console.log("✅ Migration done");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
