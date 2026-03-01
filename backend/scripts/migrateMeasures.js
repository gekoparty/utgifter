import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/productSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is missing. Check backend/.env (expected MONGODB_URI=...)."
  );
}

const roundTo = (n, decimals = 3) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
};

const normalize = (arr) => {
  if (!Array.isArray(arr)) return [];
  const set = new Set();
  for (const v of arr) {
    const r = roundTo(v, 3);
    if (r === null) continue;
    set.add(r);
  }
  return [...set].sort((a, b) => a - b);
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const cursor = Product.find({ measures: { $exists: true } })
    .select("_id measures")
    .cursor();

  let updated = 0;
  for await (const p of cursor) {
    const next = normalize(p.measures);
    await Product.updateOne({ _id: p._id }, { $set: { measures: next } });
    updated++;
  }

  console.log(`✅ Updated ${updated} products`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});