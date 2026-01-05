// routes/stats.js
import express from 'express';
import mongoose from 'mongoose'; 
import Expense from '../models/expenseSchema.js';
import Product from '../models/productSchema.js';
import Shop from '../models/shopSchema.js';

const router = express.Router();

/**
 * GET /api/stats/expenses-by-month
 * Returns an array of:
 *   { month: "YYYY-MM", total: Number }
 */
router.get('/expenses-by-month', async (req, res, next) => {
  try {
    const data = await Expense.aggregate([
      // 1) pick whichever date is set
      {
        $addFields: {
          actualDate: {
            $cond: [
              { $ifNull: ['$purchaseDate', false] },
              '$purchaseDate',
              '$registeredDate'
            ]
          }
        }
      },
      // 2) group by year-month string
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$actualDate' } },
          total: { $sum: '$finalPrice' }
        }
      },
      // 3) rename fields
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1
        }
      },
      // 4) sort ascending by month
      { $sort: { month: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/price-history', async (req, res, next) => {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ message: 'Missing productId' });
    }
  
    try {
      const data = await Expense.aggregate([
        // 1) only expenses for the requested product
        { 
          $match: { productName: mongoose.Types.ObjectId(productId) } 
        },
  
        // 2) turn that ObjectId into the actual product doc
        {
          $lookup: {
            from: 'products',               // the Mongo collection name
            localField: 'productName',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },           // we know there's exactly one
  
        // 3) project only what we need: 
        //    - date (purchaseDate or registeredDate)
        //    - finalPrice
        //    - product.name (for context)
        {
          $project: {
            _id: 0,
            date: { $ifNull: ['$purchaseDate', '$registeredDate'] },
            price: '$finalPrice',
            productName: '$product.name'
          }
        },
  
        // 4) sort by date ascending
        { $sort: { date: 1 } }
      ]);
  
      res.json(data);
    } catch (err) {
      console.error('Error in /api/stats/price-history:', err);
      next(err);
    }
  });

 router.get('/price-per-unit-history', async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: 'Missing productId' });
  }

  try {
    const data = await Expense.aggregate([
      // 1. Match Product
      {
        $match: { productName: new mongoose.Types.ObjectId(productId) }
      },
      // 2. Join Product (to get name/unit)
      {
        $lookup: {
          from: 'products',
          localField: 'productName',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      // 3. Join Shop (to get shop name)
      {
        $lookup: {
          from: 'shops',
          localField: 'shopName',
          foreignField: '_id',
          as: 'shop'
        }
      },
      { $unwind: '$shop' },
      // 4. NEW: Join Brand (to get brand name for stats)
      {
        $lookup: {
          from: 'brands',
          localField: 'brandName',
          foreignField: '_id',
          as: 'brand'
        }
      },
      { $unwind: '$brand' },
      // 5. Project
      {
        $project: {
          _id: 0,
          date: { $ifNull: ['$purchaseDate', '$registeredDate'] },
          pricePerUnit: 1,
          finalPrice: 1, // Useful for reference
          productName: '$product.name',
          measurementUnit: '$product.measurementUnit',
          shopName: '$shop.name',
          brandName: '$brand.name', // NEW
          hasDiscount: 1,           // NEW
          discountValue: 1          // NEW (Optional, if you want to show how much %)
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/stats/price-per-unit-history:', err);
    next(err);
  }
});

router.get("/product-insights", async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ message: "Missing productId" });

  const includeDiscounts = req.query.includeDiscounts !== "false";

  try {
    const pid = new mongoose.Types.ObjectId(productId);

    const matchStage = includeDiscounts
      ? { productName: pid }
      : { productName: pid, hasDiscount: { $ne: true } };

    const [result] = await Expense.aggregate([
      { $match: matchStage },

      // unify date
      {
        $addFields: {
          actualDate: { $ifNull: ["$purchaseDate", "$registeredDate"] },
        },
      },

      // joins (names)
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
          localField: "shopName",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "brands",
          localField: "brandName",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // normalize fields we need
      {
        $project: {
          _id: 0,
          actualDate: 1,
          // money
          finalPrice: 1,
          price: 1, // original (if you store it)
          pricePerUnit: 1,

          quantity: 1,
          hasDiscount: 1,
          discountValue: 1,

          productName: "$product.name",
          measurementUnit: "$product.measurementUnit",
          shopName: { $ifNull: ["$shop.name", "Ukjent"] },
          brandName: { $ifNull: ["$brand.name", "Ukjent"] },
        },
      },

      { $sort: { actualDate: 1 } },

      {
        $facet: {
          // -------------------------
          // History (chart points)
          // -------------------------
          history: [
            {
              $project: {
                date: "$actualDate",
                pricePerUnit: 1,
                finalPrice: 1,
                price: 1,
                hasDiscount: 1,
                discountValue: 1,
                productName: 1,
                measurementUnit: 1,
                shopName: 1,
                brandName: 1,
              },
            },
          ],

          // -------------------------
          // Monthly totals (compact list)
          // -------------------------
          monthlySpend: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$actualDate" } },
                totalSpend: { $sum: "$finalPrice" },
                purchases: { $sum: 1 },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id",
                totalSpend: 1,
                purchases: 1,
                avgPricePerUnit: 1,
              },
            },
            { $sort: { month: 1 } },
          ],

          // -------------------------
          // Weekly counts (optional)
          // -------------------------
          weeklyCounts: [
            {
              $group: {
                _id: {
                  y: { $isoWeekYear: "$actualDate" },
                  w: { $isoWeek: "$actualDate" },
                },
                purchases: { $sum: 1 },
                totalSpend: { $sum: "$finalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                weekKey: {
                  $concat: [
                    { $toString: "$_id.y" },
                    "-W",
                    {
                      $cond: [
                        { $lt: ["$_id.w", 10] },
                        { $concat: ["0", { $toString: "$_id.w" }] },
                        { $toString: "$_id.w" },
                      ],
                    },
                  ],
                },
                purchases: 1,
                totalSpend: 1,
              },
            },
            { $sort: { weekKey: 1 } },
          ],

          // -------------------------
          // First/Last/Prev price + range + totals
          // -------------------------
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
                lastTwo: { $push: { date: "$actualDate", pricePerUnit: "$pricePerUnit" } },
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
                lastTwo: { $slice: ["$lastTwo", -2] },
              },
            },
          ],

          // -------------------------
          // Median gap in days for forecast
          // -------------------------
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

          // -------------------------
          // Discount savings (accurate if price exists)
          // - savings = max(price - finalPrice, 0) per expense
          // -------------------------
          discountAgg: [
            {
              $addFields: {
                computedSaving: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$price", null] },
                        { $ne: ["$finalPrice", null] },
                        { $gt: ["$price", "$finalPrice"] },
                      ],
                    },
                    { $subtract: ["$price", "$finalPrice"] },
                    0,
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                discountedPurchases: {
                  $sum: { $cond: [{ $eq: ["$hasDiscount", true] }, 1, 0] },
                },
                totalSavings: { $sum: "$computedSaving" },
                totalOriginal: { $sum: { $ifNull: ["$price", "$finalPrice"] } }, // fallback
                totalFinal: { $sum: "$finalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                discountedPurchases: 1,
                totalSavings: 1,
                totalOriginal: 1,
                totalFinal: 1,
                savingsRate: {
                  $cond: [
                    { $gt: ["$totalOriginal", 0] },
                    { $multiply: [{ $divide: ["$totalSavings", "$totalOriginal"] }, 100] },
                    null,
                  ],
                },
              },
            },
          ],

          // -------------------------
          // Top + cheapest avg
          // -------------------------
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
            { $group: { _id: "$shopName", avgPricePerUnit: { $avg: "$pricePerUnit" }, purchases: { $sum: 1 } } },
            { $sort: { avgPricePerUnit: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", avgPricePerUnit: 1, purchases: 1 } },
          ],
          cheapestBrandAvg: [
            { $group: { _id: "$brandName", avgPricePerUnit: { $avg: "$pricePerUnit" }, purchases: { $sum: 1 } } },
            { $sort: { avgPricePerUnit: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", avgPricePerUnit: 1, purchases: 1 } },
          ],
        },
      },
    ]);

    const history = result?.history ?? [];
    const monthlySpend = result?.monthlySpend ?? [];
    const weeklyCounts = result?.weeklyCounts ?? [];
    const trendBase = result?.trendBase?.[0] ?? null;
    const medianGapDays = result?.gapDays?.[0]?.medianGapDays ?? null;
    const discount = result?.discountAgg?.[0] ?? {
      discountedPurchases: 0,
      totalSavings: 0,
      totalOriginal: 0,
      totalFinal: 0,
      savingsRate: null,
    };

    // % changes
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

    // Frequency + forecast
    let perWeek = null,
      perMonth = null,
      perYear = null,
      nextPurchaseDate = null;

    if (trendBase?.firstDate && trendBase?.lastDate && trendBase?.count) {
      const rangeMs =
        new Date(trendBase.lastDate).getTime() - new Date(trendBase.firstDate).getTime();
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

    res.json({
      product: {
        name: history?.[0]?.productName ?? null,
        measurementUnit: history?.[0]?.measurementUnit ?? null,
      },
      history,
      monthlySpend,
      weeklyCounts,
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
      },
      totals: {
        totalSpend: trendBase?.totalSpend ?? 0,
      },
      discount,
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