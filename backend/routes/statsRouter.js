// routes/stats.js
import express from "express";
import mongoose from "mongoose";
import Expense from "../models/expenseSchema.js";
import Product from "../models/productSchema.js";
import Shop from "../models/shopSchema.js";

const router = express.Router();

/**
 * GET /api/stats/expenses-by-month-summary?year=2025&compare=1
 * (unchanged)
 */
router.get("/expenses-by-month-summary", async (req, res, next) => {
  try {
    const requestedYear = req.query.year ? String(req.query.year) : null;
    const compare = req.query.compare !== "0"; // default true

    // 1) Find available years
    const yearsAgg = await Expense.aggregate([
      {
        $addFields: {
          actualDate: {
            $cond: [{ $ifNull: ["$purchaseDate", false] }, "$purchaseDate", "$registeredDate"],
          },
        },
      },
      { $group: { _id: { $year: "$actualDate" } } },
      { $project: { _id: 0, year: { $toString: "$_id" } } },
      { $sort: { year: -1 } },
    ]);

    const years = yearsAgg.map((x) => x.year);
    if (!years.length) {
      return res.json({ years: [], year: null, compareYear: null, months: [], stats: null });
    }

    const year = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];
    const candidateCompareYear = String(Number(year) - 1);
    const doCompare = compare && years.includes(candidateCompareYear);
    const compareYear = doCompare ? candidateCompareYear : null;

    // 2) Pull month totals (only year + optional compareYear)
    const matchYears = doCompare ? [Number(year), Number(compareYear)] : [Number(year)];

    const monthTotals = await Expense.aggregate([
      {
        $addFields: {
          actualDate: {
            $cond: [{ $ifNull: ["$purchaseDate", false] }, "$purchaseDate", "$registeredDate"],
          },
        },
      },
      {
        $addFields: {
          y: { $year: "$actualDate" },
          m: { $month: "$actualDate" },
        },
      },
      { $match: { y: { $in: matchYears } } },
      {
        $group: {
          _id: { y: "$y", m: "$m" },
          total: { $sum: "$finalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          y: "$_id.y",
          m: "$_id.m",
          total: 1,
        },
      },
    ]);

    // Map: "YYYY-MM" -> total
    const totalsMap = new Map();
    for (const r of monthTotals) {
      const mm = String(r.m).padStart(2, "0");
      totalsMap.set(`${r.y}-${mm}`, Number(r.total || 0));
    }

    // 3) Generate 12 months
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const months = [];
    for (let i = 0; i < 12; i++) {
      const mm = String(i + 1).padStart(2, "0");

      const current = totalsMap.get(`${year}-${mm}`) || 0;
      const previous = doCompare ? totalsMap.get(`${compareYear}-${mm}`) || 0 : null;
      const yoyPct = doCompare && previous && previous > 0 ? ((current - previous) / previous) * 100 : null;

      months.push({
        monthIndex: i,
        month: monthShort[i],
        current,
        previous,
        yoyPct,
      });
    }

    // 4) Stats
    const currentVals = months.map((x) => x.current || 0);
    const prevVals = doCompare ? months.map((x) => x.previous || 0) : [];

    const sum = (arr) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

    const currentSum = sum(currentVals);
    const previousSum = doCompare ? sum(prevVals) : null;

    const activeMonths = currentVals.filter((v) => v > 0).length;
    const avgPerActiveMonth = activeMonths ? currentSum / activeMonths : null;

    const median = (arr) => {
      const a = arr.filter(Number.isFinite).slice().sort((x, y) => x - y);
      if (!a.length) return null;
      const mid = Math.floor(a.length / 2);
      return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
    };
    const medianPerMonth = median(currentVals);

    // MoM: last month with spend vs month before it
    const lastIdx = [...months].reverse().find((x) => x.current > 0)?.monthIndex ?? -1;
    let momPct = null;
    if (lastIdx >= 1) {
      const last = months[lastIdx].current;
      const prev = months[lastIdx - 1].current;
      if (prev > 0) momPct = ((last - prev) / prev) * 100;
    }

    const yoyTotalPct =
      doCompare && previousSum && previousSum > 0 ? ((currentSum - previousSum) / previousSum) * 100 : null;

    // Volatility (CV%)
    let volatilityPct = null;
    if (activeMonths > 1 && avgPerActiveMonth && avgPerActiveMonth > 0) {
      const vals = currentVals.filter((v) => v > 0);
      const mean = avgPerActiveMonth;
      const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length - 1);
      const std = Math.sqrt(variance);
      volatilityPct = (std / mean) * 100;
    }

    const runRate = avgPerActiveMonth != null ? avgPerActiveMonth * 12 : null;

    const maxMonth = months.reduce((best, x) => {
      if (!best || x.current > best.value) return { monthIndex: x.monthIndex, month: x.month, value: x.current };
      return best;
    }, null);

    const minMonth = months.reduce((best, x) => {
      if (x.current <= 0) return best; // ignore 0 months
      if (!best || x.current < best.value) return { monthIndex: x.monthIndex, month: x.month, value: x.current };
      return best;
    }, null);

    const quarterTotals = [0, 1, 2, 3].map((q) => {
      const start = q * 3;
      const total = months.slice(start, start + 3).reduce((acc, x) => acc + (x.current || 0), 0);
      return { q: q + 1, total };
    });

    const bestQuarter = quarterTotals.reduce((a, b) => (b.total > a.total ? b : a), quarterTotals[0]);
    const worstQuarter = quarterTotals.reduce((a, b) => (b.total < a.total ? b : a), quarterTotals[0]);

    res.json({
      years,
      year,
      compareYear,
      months,
      stats: {
        currentSum,
        previousSum,
        yoyTotalPct,
        avgPerActiveMonth,
        medianPerMonth,
        momPct,
        volatilityPct,
        runRate,
        activeMonths,
        maxMonth,
        minMonth,
        bestQuarter,
        worstQuarter,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/price-history", async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ message: "Missing productId" });

  try {
    const data = await Expense.aggregate([
      { $match: { productName: mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "products",
          localField: "productName",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          date: { $ifNull: ["$purchaseDate", "$registeredDate"] },
          price: "$finalPrice",
          productName: "$product.name",
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error in /api/stats/price-history:", err);
    next(err);
  }
});
router.get("/price-per-unit-history", async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: "Missing productId" });
  }

  try {
    const pid = new mongoose.Types.ObjectId(productId);

    const data = await Expense.aggregate([
      { $match: { productName: pid } },

      // unify date
      { $addFields: { actualDate: { $ifNull: ["$purchaseDate", "$registeredDate"] } } },

      // --- IMPORTANT: robust conversions (handles ObjectId OR string OR empty) ---
      {
        $addFields: {
          shopObjId: {
            $convert: { input: "$shopName", to: "objectId", onError: null, onNull: null },
          },
          brandObjId: {
            $convert: { input: "$brandName", to: "objectId", onError: null, onNull: null },
          },
          variantId: { $ifNull: ["$variant", ""] }, // stored as string
          variantObjId: {
            $convert: { input: "$variant", to: "objectId", onError: null, onNull: null },
          },
        },
      },

      // Product
      {
        $lookup: {
          from: "products",
          localField: "productName",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      // Shop (use shopObjId to be robust)
      {
        $lookup: {
          from: "shops",
          localField: "shopObjId",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },

      // Brand (use brandObjId)
      {
        $lookup: {
          from: "brands",
          localField: "brandObjId",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // Variant
      {
        $lookup: {
          from: "variants",
          localField: "variantObjId",
          foreignField: "_id",
          as: "variantDoc",
        },
      },
      { $unwind: { path: "$variantDoc", preserveNullAndEmptyArrays: true } },

      // Final projection
      {
        $project: {
          _id: 0,
          date: "$actualDate",
          pricePerUnit: 1,
          finalPrice: 1,
          price: 1,

          productName: "$product.name",
          measurementUnit: "$product.measurementUnit",

          shopName: { $ifNull: ["$shop.name", "Ukjent"] },
          brandName: { $ifNull: ["$brand.name", "Ukjent"] },

          hasDiscount: 1,
          discountValue: 1,

          // ✅ variants
          variantId: 1,
          variantName: {
            $cond: [
              { $and: [{ $ne: ["$variantId", ""] }, { $ifNull: ["$variantDoc.name", false] }] },
              "$variantDoc.name",
              "Standard",
            ],
          },
        },
      },

      { $sort: { date: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error in /api/stats/price-per-unit-history:", err);
    next(err);
  }
});

/**
 * ✅ UPDATED: /api/stats/product-insights
 * Adds:
 * - ?variantIds=id1,id2,id3  (string IDs, matching how you store expense.variant)
 * - history rows include { variantId, variantName }
 * - result includes variantStats facet
 */
router.get("/product-insights", async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ message: "Missing productId" });

  const includeDiscounts = req.query.includeDiscounts !== "false";

  // Filter by variants (expense.variant stored as string)
  const variantIds = req.query.variantIds
    ? String(req.query.variantIds)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const pid = new mongoose.Types.ObjectId(productId);

    const matchStage = {
      productName: pid,
      ...(includeDiscounts ? {} : { hasDiscount: { $ne: true } }),
      ...(variantIds.length ? { variant: { $in: variantIds } } : {}),
    };

    const [result] = await Expense.aggregate([
      { $match: matchStage },

      // unify date
      {
        $addFields: {
          actualDate: { $ifNull: ["$purchaseDate", "$registeredDate"] },
        },
      },

      // robust conversions (shop/brand can be string or ObjectId)
      {
        $addFields: {
          shopObjId: {
            $convert: { input: "$shopName", to: "objectId", onError: null, onNull: null },
          },
          brandObjId: {
            $convert: { input: "$brandName", to: "objectId", onError: null, onNull: null },
          },

          // variant is stored as string (or empty)
          variantId: { $ifNull: ["$variant", ""] },
          variantObjId: {
            $convert: { input: "$variant", to: "objectId", onError: null, onNull: null },
          },
        },
      },

      // joins for names
      {
        $lookup: {
          from: "products",
          localField: "productName",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "shops",
          localField: "shopObjId",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "brands",
          localField: "brandObjId",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // variant lookup
      {
        $lookup: {
          from: "variants",
          localField: "variantObjId",
          foreignField: "_id",
          as: "variantDoc",
        },
      },
      { $unwind: { path: "$variantDoc", preserveNullAndEmptyArrays: true } },

      // resolve variantName (fallback)
      {
        $addFields: {
          variantName: {
            $cond: [
              { $and: [{ $ne: ["$variantId", ""] }, { $ifNull: ["$variantDoc.name", false] }] },
              "$variantDoc.name",
              "Standard",
            ],
          },
        },
      },

      // robust discount saving per expense
      {
        $addFields: {
          computedSaving: {
            $let: {
              vars: {
                priceSafe: { $ifNull: ["$price", 0] },
                finalSafe: { $ifNull: ["$finalPrice", 0] },
                discAmt: { $ifNull: ["$discountAmount", null] },
                discPct: { $ifNull: ["$discountValue", 0] },
                hasDisc: { $ifNull: ["$hasDiscount", false] },
              },
              in: {
                $cond: [
                  { $and: [{ $ne: ["$$discAmt", null] }, { $gt: ["$$discAmt", 0] }] },
                  "$$discAmt",
                  {
                    $cond: [
                      { $gt: ["$$priceSafe", "$$finalSafe"] },
                      { $subtract: ["$$priceSafe", "$$finalSafe"] },
                      {
                        $cond: [
                          { $and: ["$$hasDisc", { $gt: ["$$discPct", 0] }, { $gt: ["$$finalSafe", 0] }] },
                          {
                            $let: {
                              vars: {
                                factor: { $subtract: [1, { $divide: ["$$discPct", 100] }] },
                              },
                              in: {
                                $cond: [
                                  { $gt: ["$$factor", 0] },
                                  {
                                    $subtract: [{ $divide: ["$$finalSafe", "$$factor"] }, "$$finalSafe"],
                                  },
                                  0,
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      // normalized projection
      {
        $project: {
          _id: 0,
          actualDate: 1,
          pricePerUnit: 1,
          price: 1,
          finalPrice: 1,
          quantity: 1,
          volume: 1,

          hasDiscount: 1,
          discountValue: 1,
          discountAmount: 1,
          computedSaving: 1,

          productName: "$product.name",
          measurementUnit: "$product.measurementUnit",
          shopName: { $ifNull: ["$shop.name", "Ukjent"] },
          brandName: { $ifNull: ["$brand.name", "Ukjent"] },

          variantId: 1,
          variantName: 1,
        },
      },

      { $sort: { actualDate: 1 } },

      {
        $facet: {
          history: [
            {
              $project: {
                date: "$actualDate",
                pricePerUnit: 1,
                price: 1,
                finalPrice: 1,
                quantity: 1,
                volume: 1,
                hasDiscount: 1,
                discountValue: 1,
                discountAmount: 1,
                saving: "$computedSaving",
                productName: 1,
                measurementUnit: 1,
                shopName: 1,
                brandName: 1,
                variantId: 1,
                variantName: 1,
              },
            },
          ],

          // Variant breakdown
          variantStats: [
            {
              $group: {
                _id: { variantId: "$variantId", variantName: "$variantName" },
                purchases: { $sum: 1 },
                totalSpend: { $sum: "$finalPrice" },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                minPricePerUnit: { $min: "$pricePerUnit" },
                maxPricePerUnit: { $max: "$pricePerUnit" },
                totalSavings: { $sum: "$computedSaving" },
              },
            },
            {
              $project: {
                _id: 0,
                variantId: "$_id.variantId",
                variantName: "$_id.variantName",
                purchases: 1,
                totalSpend: 1,
                avgPricePerUnit: 1,
                minPricePerUnit: 1,
                maxPricePerUnit: 1,
                totalSavings: 1,
              },
            },
            { $sort: { avgPricePerUnit: 1 } },
          ],

          // Monthly buckets
          monthlySpend: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$actualDate" } },
                totalSpend: { $sum: "$finalPrice" },
                purchases: { $sum: 1 },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                totalSavings: { $sum: "$computedSaving" },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id",
                totalSpend: 1,
                purchases: 1,
                avgPricePerUnit: 1,
                totalSavings: 1,
              },
            },
            { $sort: { month: 1 } },
          ],

          // ✅ NEW: yearly overall avg
          yearlyOverall: [
            {
              $group: {
                _id: { $year: "$actualDate" },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
                min: { $min: "$pricePerUnit" },
                max: { $max: "$pricePerUnit" },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id" },
                avgPricePerUnit: 1,
                purchases: 1,
                min: 1,
                max: 1,
              },
            },
            { $sort: { year: 1 } },
          ],

          // ✅ NEW: yearly by shop (all variants)
          yearlyByShop: [
            {
              $group: {
                _id: { year: { $year: "$actualDate" }, shopName: "$shopName" },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id.year" },
                shopName: "$_id.shopName",
                avgPricePerUnit: 1,
                purchases: 1,
              },
            },
            { $sort: { year: 1, shopName: 1 } },
          ],

          // ✅ NEW: yearly by variant (all shops)
          yearlyByVariant: [
            {
              $group: {
                _id: {
                  year: { $year: "$actualDate" },
                  variantId: "$variantId",
                  variantName: "$variantName",
                },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id.year" },
                variantId: "$_id.variantId",
                variantName: "$_id.variantName",
                avgPricePerUnit: 1,
                purchases: 1,
              },
            },
            { $sort: { year: 1, variantName: 1 } },
          ],

          // ✅ OPTIONAL: yearly by shop + variant (lots of series)
          yearlyByShopVariant: [
            {
              $group: {
                _id: {
                  year: { $year: "$actualDate" },
                  shopName: "$shopName",
                  variantId: "$variantId",
                  variantName: "$variantName",
                },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id.year" },
                shopName: "$_id.shopName",
                variantId: "$_id.variantId",
                variantName: "$_id.variantName",
                avgPricePerUnit: 1,
                purchases: 1,
              },
            },
            { $sort: { year: 1, shopName: 1, variantName: 1 } },
          ],

          // base trend
          trendBase: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                firstDate: { $first: "$actualDate" },
                lastDate: { $last: "$actualDate" },

                firstPricePerUnit: { $first: "$pricePerUnit" },
                lastPricePerUnit: { $last: "$pricePerUnit" },

                totalSpend: { $sum: "$finalPrice" },
                totalOriginal: { $sum: "$price" },
                totalSavings: { $sum: "$computedSaving" },

                lastTwo: { $push: { date: "$actualDate", pricePerUnit: "$pricePerUnit" } },
                discountedPurchases: {
                  $sum: { $cond: [{ $eq: ["$hasDiscount", true] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                count: 1,
                firstDate: 1,
                lastDate: 1,
                firstPricePerUnit: 1,
                lastPricePerUnit: 1,
                totalSpend: 1,
                totalOriginal: 1,
                totalSavings: 1,
                discountedPurchases: 1,
                lastTwo: { $slice: ["$lastTwo", -2] },
              },
            },
          ],

          // median gap (days)
          gapDays: [
            { $group: { _id: null, dates: { $push: "$actualDate" } } },
            {
              $project: {
                _id: 0,
                gaps: {
                  $map: {
                    input: { $range: [1, { $size: "$dates" }] },
                    as: "i",
                    in: {
                      $dateDiff: {
                        startDate: { $arrayElemAt: ["$dates", { $subtract: ["$$i", 1] }] },
                        endDate: { $arrayElemAt: ["$dates", "$$i"] },
                        unit: "day",
                      },
                    },
                  },
                },
              },
            },
            { $unwind: { path: "$gaps", preserveNullAndEmptyArrays: true } },
            { $sort: { gaps: 1 } },
            { $group: { _id: null, sorted: { $push: "$gaps" } } },
            {
              $project: {
                _id: 0,
                medianGapDays: {
                  $let: {
                    vars: { n: { $size: "$sorted" } },
                    in: {
                      $cond: [
                        { $eq: ["$$n", 0] },
                        null,
                        { $arrayElemAt: ["$sorted", { $floor: { $divide: ["$$n", 2] } }] },
                      ],
                    },
                  },
                },
              },
            },
          ],

          topShopByCount: [
            { $group: { _id: "$shopName", purchases: { $sum: 1 } } },
            { $sort: { purchases: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", purchases: 1 } },
          ],
          topBrandByCount: [
            { $group: { _id: "$brandName", purchases: { $sum: 1 } } },
            { $sort: { purchases: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", purchases: 1 } },
          ],
          cheapestShopAvg: [
            {
              $group: {
                _id: "$shopName",
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            { $sort: { avgPricePerUnit: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", avgPricePerUnit: 1, purchases: 1 } },
          ],
          cheapestBrandAvg: [
            {
              $group: {
                _id: "$brandName",
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            { $sort: { avgPricePerUnit: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", avgPricePerUnit: 1, purchases: 1 } },
          ],
        },
      },
    ]);

    const history = result?.history ?? [];
    const monthlySpend = result?.monthlySpend ?? [];
    const trendBase = result?.trendBase?.[0] ?? null;
    const medianGapDays = result?.gapDays?.[0]?.medianGapDays ?? null;
    const variantStats = result?.variantStats ?? [];

    // ---- yearly data ----
    const yearlyOverall = result?.yearlyOverall ?? [];
    const yearlyByShop = result?.yearlyByShop ?? [];
    const yearlyByVariant = result?.yearlyByVariant ?? [];
    const yearlyByShopVariant = result?.yearlyByShopVariant ?? [];

    const addYearChange = (rows, valueKey = "avgPricePerUnit") => {
      if (!Array.isArray(rows) || !rows.length) return [];
      const firstVal = rows[0]?.[valueKey];
      return rows.map((r, i) => {
        const curr = r?.[valueKey];
        const prev = i > 0 ? rows[i - 1]?.[valueKey] : null;

        const yoyPct =
          i > 0 && typeof prev === "number" && prev !== 0 && typeof curr === "number"
            ? ((curr - prev) / prev) * 100
            : null;

        const sinceStartPct =
          typeof firstVal === "number" && firstVal !== 0 && typeof curr === "number"
            ? ((curr - firstVal) / firstVal) * 100
            : null;

        return { ...r, yoyPct, sinceStartPct };
      });
    };

    const addYearChangeByGroup = (rows, groupKey, valueKey = "avgPricePerUnit") => {
      if (!Array.isArray(rows) || !rows.length) return [];
      const grouped = rows.reduce((acc, r) => {
        const k = r[groupKey] ?? "—";
        (acc[k] ||= []).push(r);
        return acc;
      }, {});
      return Object.values(grouped).flatMap((arr) => {
        const sorted = arr.slice().sort((a, b) => Number(a.year) - Number(b.year));
        return addYearChange(sorted, valueKey);
      });
    };

    const yearly = {
      overall: addYearChange(yearlyOverall),
      byShop: addYearChangeByGroup(yearlyByShop, "shopName"),
      byVariant: addYearChangeByGroup(yearlyByVariant, "variantName"),
      byShopVariant: addYearChangeByGroup(yearlyByShopVariant, "shopName"),
    };

    // ---- helper: weighted avg by purchases ----
    const weightedAvg = (rows) => {
      const totalPurchases = rows.reduce((s, r) => s + (r.purchases ?? 0), 0);
      if (!totalPurchases) return null;
      const weightedSum = rows.reduce((s, r) => s + (r.avgPricePerUnit ?? 0) * (r.purchases ?? 0), 0);
      return weightedSum / totalPurchases;
    };

    // ---- 3-month trend ----
    let threeMonth = {
      last3AvgPricePerUnit: null,
      prev3AvgPricePerUnit: null,
      pctChangePricePerUnit: null,
      last3TotalSpend: null,
      prev3TotalSpend: null,
      pctChangeSpend: null,
      last3Purchases: 0,
      prev3Purchases: 0,
      last3Months: [],
      prev3Months: [],
    };

    if (monthlySpend.length) {
      const lastIndex = monthlySpend.length - 1;
      const last3 = monthlySpend.slice(Math.max(0, lastIndex - 2), lastIndex + 1);
      const prev3 = monthlySpend.slice(Math.max(0, lastIndex - 5), Math.max(0, lastIndex - 2));

      const last3Avg = weightedAvg(last3);
      const prev3Avg = weightedAvg(prev3);

      const last3Spend = last3.reduce((s, r) => s + (r.totalSpend ?? 0), 0);
      const prev3Spend = prev3.reduce((s, r) => s + (r.totalSpend ?? 0), 0);

      const pctPrice =
        prev3Avg && prev3Avg !== 0 && last3Avg != null ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : null;

      const pctSpend =
        prev3Spend && prev3Spend !== 0 ? ((last3Spend - prev3Spend) / prev3Spend) * 100 : null;

      threeMonth = {
        last3AvgPricePerUnit: last3Avg,
        prev3AvgPricePerUnit: prev3Avg,
        pctChangePricePerUnit: pctPrice,
        last3TotalSpend: last3Spend,
        prev3TotalSpend: prev3Spend,
        pctChangeSpend: pctSpend,
        last3Purchases: last3.reduce((s, r) => s + (r.purchases ?? 0), 0),
        prev3Purchases: prev3.reduce((s, r) => s + (r.purchases ?? 0), 0),
        last3Months: last3.map((x) => x.month),
        prev3Months: prev3.map((x) => x.month),
      };
    }

    // ---- % change calculations ----
    let lastVsPrevPct = null;
    let lastVsFirstPct = null;

    if (trendBase?.lastTwo?.length === 2) {
      const prev = trendBase.lastTwo[0]?.pricePerUnit;
      const last = trendBase.lastTwo[1]?.pricePerUnit;
      if (typeof prev === "number" && prev !== 0 && typeof last === "number") {
        lastVsPrevPct = ((last - prev) / prev) * 100;
      }
    }

    if (
      typeof trendBase?.firstPricePerUnit === "number" &&
      trendBase.firstPricePerUnit !== 0 &&
      typeof trendBase?.lastPricePerUnit === "number"
    ) {
      lastVsFirstPct =
        ((trendBase.lastPricePerUnit - trendBase.firstPricePerUnit) / trendBase.firstPricePerUnit) * 100;
    }

    // ---- Frequency + forecast ----
    let perWeek = null,
      perMonth = null,
      perYear = null,
      nextPurchaseDate = null;

    if (trendBase?.firstDate && trendBase?.lastDate && trendBase?.count) {
      const rangeMs = new Date(trendBase.lastDate).getTime() - new Date(trendBase.firstDate).getTime();
      const rangeDays = Math.max(1, rangeMs / (1000 * 60 * 60 * 24));

      perWeek = trendBase.count / (rangeDays / 7);
      perMonth = trendBase.count / (rangeDays / 30.4375);
      perYear = trendBase.count / (rangeDays / 365.25);
    }

    if (trendBase?.lastDate && typeof medianGapDays === "number") {
      const d = new Date(trendBase.lastDate);
      d.setDate(d.getDate() + medianGapDays);
      nextPurchaseDate = d;
    }

    const savingsRate =
      typeof trendBase?.totalOriginal === "number" && trendBase.totalOriginal > 0
        ? (trendBase.totalSavings / trendBase.totalOriginal) * 100
        : null;

    res.json({
      product: {
        name: history?.[0]?.productName ?? null,
        measurementUnit: history?.[0]?.measurementUnit ?? null,
      },
      history,
      monthlySpend,
      variantStats,
      yearly, // ✅ NEW
      frequency: {
        totalPurchases: trendBase?.count ?? 0,
        perWeek,
        perMonth,
        perYear,
        firstPurchaseDate: trendBase?.firstDate ?? null,
        lastPurchaseDate: trendBase?.lastDate ?? null,
        medianGapDays,
        nextPurchaseDate,
      },
      trend: {
        lastPricePerUnit: trendBase?.lastPricePerUnit ?? null,
        firstPricePerUnit: trendBase?.firstPricePerUnit ?? null,
        lastVsPrevPct,
        lastVsFirstPct,
        threeMonth,
      },
      totals: {
        totalSpend: trendBase?.totalSpend ?? 0,
      },
      discount: {
        discountedPurchases: trendBase?.discountedPurchases ?? 0,
        totalSavings: trendBase?.totalSavings ?? 0,
        totalOriginal: trendBase?.totalOriginal ?? 0,
        totalFinal: trendBase?.totalSpend ?? 0,
        savingsRate,
      },
      top: {
        shopMostOften: result?.topShopByCount?.[0] ?? null,
        brandMostOften: result?.topBrandByCount?.[0] ?? null,
        shopCheapestAvg: result?.cheapestShopAvg?.[0] ?? null,
        brandCheapestAvg: result?.cheapestBrandAvg?.[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});
export default router;

