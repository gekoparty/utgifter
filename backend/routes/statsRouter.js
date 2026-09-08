// routes/stats.js
import express from "express";
import mongoose from "mongoose";
import Expense from "../models/expenseSchema.js";
import Income from "../models/incomeSchema.js";
import Product from "../models/productSchema.js";
import DataQualityIgnore from "../models/dataQualityIgnoreSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../models/recurringTermsHistorySchema.js";
import { convertToUTC, TIME_ZONE } from "../utils/dateUtils.js";
import { ownedFilter } from "../middleware/dataOwnership.js";
import { buildSummary } from "./recurring/summary.js";
import {
  addMonths,
  buildRecurringTermsIndex,
  monthStart,
  round2,
  yyyymmKey,
} from "../services/recurring/scheduleService.js";

const router = express.Router();

const actualDateExpr = { $ifNull: ["$purchaseDate", "$registeredDate"] };
const actualDateStage = { $addFields: { actualDate: actualDateExpr } };
const actualDateNotNull = { $match: { actualDate: { $ne: null } } };

const osloDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const osloDayRange = (dateKey) => convertToUTC(dateKey);

const yearOfActualDate = { $year: { date: "$actualDate", timezone: TIME_ZONE } };
const monthOfActualDate = { $month: { date: "$actualDate", timezone: TIME_ZONE } };
const incomeDateStage = { $addFields: { actualDate: "$incomeDate" } };
const incomeDateNotNull = { $match: { actualDate: { $ne: null } } };
const recurringPaidMatch = {
  amount: { $gt: 0 },
  $or: [
    { kind: "EXTRA" },
    { status: "EXTRA" },
    {
      kind: { $ne: "EXTRA" },
      status: { $in: ["PAID", "PARTIAL"] },
    },
  ],
};

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

const normalizeMonthKey = (value) => {
  if (typeof value !== "string" || !MONTH_KEY_RE.test(value)) return osloDateKey().slice(0, 7);
  const [year, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12 ? value : osloDateKey().slice(0, 7);
};

const addMonthsToMonthKey = (monthKey, months) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const buildRecurringMonthlyOverlay = async (req, year) => {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return new Map();

  const timelineStart = monthStart(new Date(numericYear, 0, 1));
  const historyFromKey = yyyymmKey(addMonths(timelineStart, -48));
  const toKey = `${numericYear}-12`;

  const recurringExpenses = await RecurringExpense.find(
    ownedFilter(req, { isActive: true }),
  ).lean();

  const recurringIds = recurringExpenses.map((expense) => expense._id);
  const [paymentsInRange, termsRows] = await Promise.all([
    RecurringPayment.find({
      ...ownedFilter(req),
      ...(recurringIds.length ? { recurringExpenseId: { $in: recurringIds } } : {}),
      periodKey: { $gte: historyFromKey, $lte: toKey },
    }).lean(),
    recurringIds.length
      ? RecurringTermsHistory.find({
          ...ownedFilter(req),
          recurringExpenseId: { $in: recurringIds },
        })
          .sort({ recurringExpenseId: 1, fromDate: 1 })
          .lean()
      : [],
  ]);

  const summary = buildSummary({
    expenses: recurringExpenses,
    paymentsInRange,
    recurringTermsIndex: buildRecurringTermsIndex(termsRows),
    filter: "ALL",
    months: 12,
    timelineStart,
    realNow: new Date(),
  });
  const overlay = new Map();

  for (const month of summary.forecast || []) {
    const missing = (month.items || [])
      .filter((item) => item.status === "UNPAID")
      .reduce((sum, item) => sum + Number(item.expected?.max ?? item.expected?.fixed ?? 0), 0);

    overlay.set(month.key, {
      expected: round2(Number(month.expectedMax || 0)),
      paid: round2(Number(month.paidTotal || 0)),
      missing: round2(missing),
    });
  }

  return overlay;
};

const lastDateOfMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return `${monthKey}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
};

const buildPriceChangesPipeline = ({ req, from, to }) => {
  const selectedDateMatch = from && to ? { actualDate: { $gte: from, $lte: to } } : {};

  return [
    { $match: ownedFilter(req) },
    actualDateStage,
    {
      $addFields: {
        comparePrice: {
          $cond: [
            { $gt: ["$pricePerUnit", 0] },
            "$pricePerUnit",
            { $ifNull: ["$finalPrice", "$price"] },
          ],
        },
      },
    },
    actualDateNotNull,
    ...(to ? [{ $match: { actualDate: { $lte: to } } }] : []),
    { $match: { comparePrice: { $gt: 0 } } },
    {
      $setWindowFields: {
        partitionBy: {
          productName: "$productName",
          variant: "$variant",
          brandName: "$brandName",
          shopName: "$shopName",
        },
        sortBy: { actualDate: 1, _id: 1 },
        output: {
          previousPrice: { $shift: { output: "$comparePrice", by: -1 } },
          previousDate: { $shift: { output: "$actualDate", by: -1 } },
        },
      },
    },
    { $match: { ...selectedDateMatch, previousPrice: { $gt: 0 } } },
    {
      $addFields: {
        changeAmount: { $subtract: ["$comparePrice", "$previousPrice"] },
        changePercent: {
          $multiply: [
            { $divide: [{ $subtract: ["$comparePrice", "$previousPrice"] }, "$previousPrice"] },
            100,
          ],
        },
        variantObjectId: {
          $convert: {
            input: "$variant",
            to: "objectId",
            onError: null,
            onNull: null,
          },
        },
      },
    },
    { $match: { changeAmount: { $ne: 0 } } },
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
        from: "brands",
        localField: "brandName",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
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
        from: "variants",
        localField: "variantObjectId",
        foreignField: "_id",
        as: "variantDoc",
      },
    },
    { $unwind: { path: "$variantDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productId: "$productName",
        productName: { $ifNull: ["$product.name", "Ukjent produkt"] },
        brandName: { $ifNull: ["$brand.name", "Ukjent merke"] },
        shopName: { $ifNull: ["$shop.name", "Ukjent butikk"] },
        variantName: { $ifNull: ["$variantDoc.name", ""] },
        currentPrice: "$comparePrice",
        previousPrice: 1,
        changeAmount: 1,
        changePercent: 1,
        currentDate: "$actualDate",
        previousDate: 1,
        measurementUnit: "$measurementUnit",
        usedUnitPrice: { $gt: ["$pricePerUnit", 0] },
      },
    },
    {
      $facet: {
        increases: [
          { $match: { changeAmount: { $gt: 0 } } },
          { $sort: { changePercent: -1, changeAmount: -1 } },
          { $limit: 5 },
        ],
        decreases: [
          { $match: { changeAmount: { $lt: 0 } } },
          { $sort: { changePercent: 1, changeAmount: 1 } },
          { $limit: 5 },
        ],
      },
    },
  ];
};

const todayAtOsloStart = () => osloDayRange(osloDateKey())?.start || new Date();

/**
 * GET /api/stats/data-quality
 * Compact issue summary used by the home screen cleanup panel.
 */
router.get("/data-quality", async (req, res, next) => {
  try {
    const staleBefore = new Date(todayAtOsloStart());
    staleBefore.setUTCFullYear(staleBefore.getUTCFullYear() - 1);
    const ignoredSuspiciousExpenseIds = (
      await DataQualityIgnore.find(
        ownedFilter(req, {
          issueType: "suspicious-volume-price",
          entityType: "expense",
        }),
      )
        .select("entityId")
        .lean()
    ).map((item) => item.entityId);

    const [
      productsWithoutCategory,
      expensesMissingPlace,
      duplicateProductNames,
      staleCheapest,
      suspiciousExpenses,
    ] = await Promise.all([
      Product.aggregate([
        { $match: ownedFilter(req) },
        {
          $match: {
            $or: [
              { category: { $exists: false } },
              { category: null },
              { category: "" },
              { category: /^ikke kategorisert$/i },
            ],
          },
        },
        {
          $facet: {
            rows: [
              { $sort: { updatedAt: -1, name: 1 } },
              { $limit: 6 },
              { $project: { _id: 1, name: 1, category: 1 } },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      Expense.aggregate([
        { $match: ownedFilter(req) },
        {
          $match: {
            $or: [
              { locationName: { $exists: false } },
              { locationName: null },
            ],
          },
        },
        actualDateStage,
        {
          $lookup: {
            from: "products",
            localField: "productName",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $sort: { actualDate: -1, updatedAt: -1 } },
        {
          $facet: {
            rows: [
              { $limit: 6 },
              {
                $project: {
                  _id: 1,
                  productName: { $ifNull: ["$product.name", "Ukjent produkt"] },
                  finalPrice: { $ifNull: ["$finalPrice", "$price"] },
                  date: "$actualDate",
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      Product.aggregate([
        { $match: ownedFilter(req) },
        {
          $addFields: {
            normalizedName: {
              $toLower: {
                $trim: { input: "$name" },
              },
            },
          },
        },
        {
          $group: {
            _id: "$normalizedName",
            count: { $sum: 1 },
            names: { $addToSet: "$name" },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 }, _id: { $ne: "" } } },
        {
          $facet: {
            rows: [
              { $sort: { count: -1, _id: 1 } },
              { $limit: 6 },
              { $project: { _id: 0, name: "$_id", count: 1, names: 1, ids: 1 } },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      Expense.aggregate([
        { $match: ownedFilter(req) },
        actualDateStage,
        actualDateNotNull,
        {
          $addFields: {
            comparePrice: {
              $cond: [
                { $gt: ["$pricePerUnit", 0] },
                "$pricePerUnit",
                { $ifNull: ["$finalPrice", "$price"] },
              ],
            },
            variantKey: { $ifNull: ["$variant", ""] },
          },
        },
        { $match: { comparePrice: { $gt: 0 } } },
        { $sort: { productName: 1, variantKey: 1, comparePrice: 1, actualDate: -1, _id: 1 } },
        {
          $group: {
            _id: { productName: "$productName", variant: "$variantKey" },
            cheapest: { $first: "$$ROOT" },
            latestDate: { $max: "$actualDate" },
            purchaseCount: { $sum: 1 },
          },
        },
        {
          $match: {
            purchaseCount: { $gt: 1 },
            "cheapest.actualDate": { $lt: staleBefore },
            $expr: { $gt: ["$latestDate", "$cheapest.actualDate"] },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "cheapest.productName",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "shops",
            localField: "cheapest.shopName",
            foreignField: "_id",
            as: "shop",
          },
        },
        { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
        { $sort: { "cheapest.actualDate": 1 } },
        {
          $facet: {
            rows: [
              { $limit: 6 },
              {
                $project: {
                  _id: "$cheapest._id",
                  productId: "$cheapest.productName",
                  productName: { $ifNull: ["$product.name", "Ukjent produkt"] },
                  shopName: { $ifNull: ["$shop.name", "Ukjent butikk"] },
                  price: "$cheapest.comparePrice",
                  date: "$cheapest.actualDate",
                  latestDate: 1,
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: ownedFilter(req, {
            ...(ignoredSuspiciousExpenseIds.length
              ? { _id: { $nin: ignoredSuspiciousExpenseIds } }
              : {}),
          }),
        },
        actualDateStage,
        {
          $addFields: {
            amount: { $ifNull: ["$finalPrice", "$price"] },
            unitPrice: { $ifNull: ["$pricePerUnit", 0] },
          },
        },
        {
          $match: {
            $or: [
              { volume: { $lte: 0 } },
              { quantity: { $lte: 0 } },
              { amount: { $lte: 0 } },
              { unitPrice: { $lte: 0 } },
              { unitPrice: { $gte: 10000 } },
              { amount: { $gte: 50000 } },
            ],
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productName",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $sort: { actualDate: -1, updatedAt: -1 } },
        {
          $facet: {
            rows: [
              { $limit: 6 },
              {
                $project: {
                  _id: 1,
                  productName: { $ifNull: ["$product.name", "Ukjent produkt"] },
                  finalPrice: "$amount",
                  pricePerUnit: "$unitPrice",
                  volume: 1,
                  quantity: 1,
                  date: "$actualDate",
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
    ]);

    const productCategoryRows = productsWithoutCategory?.[0]?.rows || [];
    const productCategoryCount = Number(productsWithoutCategory?.[0]?.total?.[0]?.count || 0);
    const missingPlaceRows = expensesMissingPlace?.[0]?.rows || [];
    const missingPlaceCount = Number(expensesMissingPlace?.[0]?.total?.[0]?.count || 0);
    const duplicateRows = duplicateProductNames?.[0]?.rows || [];
    const duplicateCount = Number(duplicateProductNames?.[0]?.total?.[0]?.count || 0);
    const staleRows = staleCheapest?.[0]?.rows || [];
    const staleCount = Number(staleCheapest?.[0]?.total?.[0]?.count || 0);
    const suspiciousRows = suspiciousExpenses?.[0]?.rows || [];
    const suspiciousCount = Number(suspiciousExpenses?.[0]?.total?.[0]?.count || 0);
    const issues = [
      {
        id: "products-without-category",
        label: "Produkter uten kategori",
        count: productCategoryCount,
        severity: productCategoryCount ? "warning" : "ok",
        decision: productCategoryCount
          ? "Disse produktene gjør kategoristatistikken svakere."
          : "Alle viste produkter har kategori.",
        to: "/products",
        examples: productCategoryRows.map((item) => ({
          id: String(item._id),
          label: item.name || "Ukjent produkt",
          detail: "Mangler kategori",
          to: `/products?filterId=name&filterValue=${encodeURIComponent(item.name || "")}`,
        })),
      },
      {
        id: "expenses-missing-place",
        label: "Utgifter uten sted",
        count: missingPlaceCount,
        severity: missingPlaceCount ? "warning" : "ok",
        decision: missingPlaceCount
          ? "Sted mangler, så butikk/sted-statistikk blir mindre presis."
          : "Ingen utgifter uten sted funnet.",
        to: "/expenses",
        examples: missingPlaceRows.map((item) => ({
          id: String(item._id),
          label: item.productName,
          detail: `${round2(Number(item.finalPrice || 0))} kr`,
          to: "/expenses",
        })),
      },
      {
        id: "duplicate-product-names",
        label: "Dupliserte produktnavn",
        count: duplicateCount,
        severity: duplicateCount ? "warning" : "ok",
        decision: duplicateCount
          ? "Samme navn finnes flere ganger og kan splitte historikken."
          : "Ingen dupliserte produktnavn funnet.",
        to: "/products",
        examples: duplicateRows.map((item) => ({
          id: item.name,
          label: item.names?.[0] || item.name,
          detail: `${item.count} produkter`,
          to: `/products?filterId=name&filterValue=${encodeURIComponent(item.names?.[0] || item.name || "")}`,
        })),
      },
      {
        id: "stale-cheapest-prices",
        label: "Gamle billigste priser",
        count: staleCount,
        severity: staleCount ? "info" : "ok",
        decision: staleCount
          ? "Noen billigste priser er gamle og bør ikke stoles blindt på."
          : "Ingen gamle billigste priser funnet.",
        to: "/stats",
        examples: staleRows.map((item) => ({
          id: String(item._id),
          label: item.productName,
          detail: `${round2(Number(item.price || 0))} kr hos ${item.shopName}`,
          to: `/stats?productId=${encodeURIComponent(String(item.productId || ""))}`,
        })),
      },
      {
        id: "suspicious-volume-price",
        label: "Mistenkelig pris/volum",
        count: suspiciousCount,
        severity: suspiciousCount ? "error" : "ok",
        decision: suspiciousCount
          ? "Pris, volum eller enhetspris ser uvanlig ut."
          : "Ingen åpenbare pris/volum-feil funnet.",
        to: "/expenses",
        examples: suspiciousRows.map((item) => ({
          id: String(item._id),
          label: item.productName,
          detail: `${round2(Number(item.finalPrice || 0))} kr, volum ${round2(Number(item.volume || 0))}`,
          to: `/expenses?openExpense=${encodeURIComponent(String(item._id))}`,
          canIgnore: true,
          ignorePayload: {
            issueType: "suspicious-volume-price",
            entityType: "expense",
            entityId: String(item._id),
          },
        })),
      },
    ];

    const totals = {
      issues: issues.reduce((sum, issue) => sum + Number(issue.count || 0), 0),
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      errors: issues.filter((issue) => issue.severity === "error").length,
      stale: staleCount,
    };

    res.json({ generatedAt: new Date().toISOString(), totals, issues });
  } catch (err) {
    next(err);
  }
});

router.post("/data-quality/ignore", async (req, res, next) => {
  try {
    const issueType = String(req.body?.issueType || "").trim();
    const entityType = String(req.body?.entityType || "").trim();
    const entityId = String(req.body?.entityId || "").trim();

    if (!issueType || !entityType || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ message: "Ugyldig datakvalitetspunkt." });
    }

    if (issueType !== "suspicious-volume-price" || entityType !== "expense") {
      return res.status(400).json({ message: "Dette punktet kan ikke skjules ennå." });
    }

    const expense = await Expense.findOne(
      ownedFilter(req, { _id: new mongoose.Types.ObjectId(entityId) }),
    )
      .select("_id ownerUserId")
      .lean();

    if (!expense) return res.status(404).json({ message: "Utgiften ble ikke funnet." });

    const ignored = await DataQualityIgnore.findOneAndUpdate(
      ownedFilter(req, {
        issueType,
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
      }),
      {
        $set: { reason: String(req.body?.reason || "Bekreftet som riktig").trim() },
        $setOnInsert: {
          ownerUserId: expense.ownerUserId,
          issueType,
          entityType,
          entityId: new mongoose.Types.ObjectId(entityId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    res.json({
      _id: String(ignored._id),
      issueType: ignored.issueType,
      entityType: ignored.entityType,
      entityId: String(ignored.entityId),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/expense-dashboard?period=month|quarter|year|all&month=YYYY-MM
 * Aggregated data for the expenses dashboard. This intentionally does not use
 * the paginated expenses endpoint, so charts are based on all matching rows.
 */
router.get(["/expense-dashboard", "/expense-dashboard-v2"], async (req, res, next) => {
  try {
    const period = ["month", "quarter", "year", "all"].includes(req.query.period)
      ? req.query.period
      : "month";
    const selectedMonth = normalizeMonthKey(req.query.month);
    const selectedYear = selectedMonth.slice(0, 4);
    const selectedMonthEndKey = lastDateOfMonthKey(selectedMonth);
    let from = null;
    let to = null;

    if (period === "month") {
      from = osloDayRange(`${selectedMonth}-01`)?.start;
      to = osloDayRange(selectedMonthEndKey)?.end;
    } else if (period === "quarter") {
      from = osloDayRange(`${addMonthsToMonthKey(selectedMonth, -2)}-01`)?.start;
      to = osloDayRange(selectedMonthEndKey)?.end;
    } else if (period === "year") {
      from = osloDayRange(`${selectedYear}-01-01`)?.start;
      to = osloDayRange(`${selectedYear}-12-31`)?.end;
    }

    const dateMatch =
      from && to ? [{ $match: { actualDate: { $gte: from, $lte: to } } }] : [];
    const expectedMonthlyIncome = Number(req.appUser?.expectedMonthlyIncome || 0);
    const expectedMonths =
      period === "month" ? 1 : period === "quarter" ? 3 : period === "year" ? 12 : null;
    const expectedIncome =
      expectedMonths == null ? null : expectedMonthlyIncome * expectedMonths;
    const timelineGroup =
      period === "year" || period === "all"
        ? {
            format: "%Y-%m",
            label: "$_id",
          }
        : {
            format: "%Y-%m-%d",
            label: "$_id",
          };

    const [[result], [incomeResult = {}], [priceChanges = { increases: [], decreases: [] }]] = await Promise.all([
      Expense.aggregate([
        { $match: ownedFilter(req) },
        actualDateStage,
        { $addFields: { amount: { $ifNull: ["$finalPrice", "$price"] } } },
        actualDateNotNull,
        ...dateMatch,
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
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
                  average: { $avg: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $project: { _id: 0, total: 1, average: 1, count: 1 } },
            ],
            highest: [
              { $sort: { amount: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 0,
                  value: "$amount",
                  name: { $ifNull: ["$product.name", "Ukjent produkt"] },
                  date: "$actualDate",
                },
              },
            ],
            shops: [
              {
                $group: {
                  _id: "$shopName",
                  value: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { value: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "shops",
                  localField: "_id",
                  foreignField: "_id",
                  as: "shop",
                },
              },
              { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  _id: 0,
                  name: { $ifNull: ["$shop.name", "Ukjent"] },
                  value: 1,
                  count: 1,
                },
              },
            ],
            brands: [
              {
                $group: {
                  _id: "$brandName",
                  value: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { value: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "brands",
                  localField: "_id",
                  foreignField: "_id",
                  as: "brand",
                },
              },
              { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  _id: 0,
                  name: { $ifNull: ["$brand.name", "Ukjent"] },
                  value: 1,
                  count: 1,
                },
              },
            ],
            locations: [
              {
                $group: {
                  _id: "$locationName",
                  value: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { value: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "locations",
                  localField: "_id",
                  foreignField: "_id",
                  as: "location",
                },
              },
              { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  _id: 0,
                  name: { $ifNull: ["$location.name", "Ukjent"] },
                  value: 1,
                  count: 1,
                },
              },
            ],
            categories: [
              {
                $group: {
                  _id: { $ifNull: ["$product.category", "Ikke kategorisert"] },
                  value: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { value: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  name: "$_id",
                  value: 1,
                  count: 1,
                },
              },
            ],
            timeline: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: timelineGroup.format,
                      date: "$actualDate",
                      timezone: "Europe/Oslo",
                    },
                  },
                  value: { $sum: "$amount" },
                },
              },
              { $project: { _id: 0, key: timelineGroup.label, value: 1 } },
              { $sort: { key: 1 } },
            ],
          },
        },
      ]),
      Income.aggregate([
        { $match: ownedFilter(req) },
        incomeDateStage,
        incomeDateNotNull,
        ...dateMatch,
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
                  average: { $avg: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $project: { _id: 0, total: 1, average: 1, count: 1 } },
            ],
            categories: [
              {
                $group: {
                  _id: { $ifNull: ["$category", "Annet"] },
                  value: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { value: -1 } },
              { $project: { _id: 0, name: "$_id", value: 1, count: 1 } },
            ],
            timeline: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: timelineGroup.format,
                      date: "$actualDate",
                      timezone: TIME_ZONE,
                    },
                  },
                  value: { $sum: "$amount" },
                },
              },
              { $project: { _id: 0, key: "$_id", value: 1 } },
              { $sort: { key: 1 } },
            ],
          },
        },
      ]),
      Expense.aggregate(buildPriceChangesPipeline({ req, from, to })),
    ]);
    const expenseTotal = Number(result?.totals?.[0]?.total || 0);
    const incomeTotal = Number(incomeResult?.totals?.[0]?.total || 0);

    res.json({
      period,
      selectedMonth,
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      totals: result?.totals?.[0] ?? { total: 0, average: 0, count: 0 },
      income: {
        totals: incomeResult?.totals?.[0] ?? { total: 0, average: 0, count: 0 },
        categories: incomeResult?.categories ?? [],
        timeline: incomeResult?.timeline ?? [],
        net: incomeTotal - expenseTotal,
        savingsRate: incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : null,
        expectedMonthly: expectedMonthlyIncome,
        expected: expectedIncome,
        expectedNet: expectedIncome == null ? null : expectedIncome - expenseTotal,
      },
      highest: result?.highest?.[0] ?? { value: 0, name: "Ingen" },
      shops: result?.shops ?? [],
      brands: result?.brands ?? [],
      locations: result?.locations ?? [],
      categories: result?.categories ?? [],
      timeline: result?.timeline ?? [],
      priceChanges,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/expenses-by-month-summary?year=2025&compare=1
 */
router.get("/expenses-by-month-summary", async (req, res, next) => {
  try {
    const requestedYear = req.query.year ? String(req.query.year) : null;
    const compare = req.query.compare !== "0"; // default true
    const categoryScope = ["month", "year", "all"].includes(req.query.categoryScope)
      ? req.query.categoryScope
      : "year";

    // 1) Find available years
    const [expenseYearsAgg, incomeYearsAgg, recurringYearsAgg] = await Promise.all([
      Expense.aggregate([
        { $match: ownedFilter(req) },
        actualDateStage,
        actualDateNotNull,
        { $group: { _id: yearOfActualDate } },
        { $project: { _id: 0, year: { $toString: "$_id" } } },
      ]),
      Income.aggregate([
        { $match: ownedFilter(req) },
        incomeDateStage,
        incomeDateNotNull,
        { $group: { _id: yearOfActualDate } },
        { $project: { _id: 0, year: { $toString: "$_id" } } },
      ]),
      RecurringPayment.aggregate([
        { $match: ownedFilter(req, recurringPaidMatch) },
        {
          $project: {
            _id: 0,
            year: { $substrBytes: ["$periodKey", 0, 4] },
          },
        },
        { $match: { year: /^\d{4}$/ } },
        { $group: { _id: "$year" } },
        { $project: { _id: 0, year: "$_id" } },
      ]),
    ]);

    const years = [...new Set([...expenseYearsAgg, ...incomeYearsAgg, ...recurringYearsAgg].map((x) => x.year))]
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));
    if (!years.length) {
      return res.json({ years: [], year: null, compareYear: null, months: [], categories: [], stats: null });
    }

    const year = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];
    const expectedMonthlyIncome = Number(req.appUser?.expectedMonthlyIncome || 0);
    const candidateCompareYear = String(Number(year) - 1);
    const doCompare = compare && years.includes(candidateCompareYear);
    const compareYear = doCompare ? candidateCompareYear : null;

    // 2) Pull month totals (only year + optional compareYear)
    const matchYears = doCompare ? [Number(year), Number(compareYear)] : [Number(year)];

    const [monthTotals, incomeMonthTotals, recurringOverlay, [recurringAllTime = {}]] = await Promise.all([
      Expense.aggregate([
        { $match: ownedFilter(req) },
        actualDateStage,
        actualDateNotNull,
        {
          $addFields: {
            y: yearOfActualDate,
            m: monthOfActualDate,
            amount: { $ifNull: ["$finalPrice", "$price"] },
          },
        },
        { $match: { y: { $in: matchYears } } },
        {
          $group: {
            _id: { y: "$y", m: "$m" },
            total: { $sum: "$amount" },
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
      ]),
      Income.aggregate([
        { $match: ownedFilter(req) },
        incomeDateStage,
        incomeDateNotNull,
        {
          $addFields: {
            y: yearOfActualDate,
            m: monthOfActualDate,
            amount: "$amount",
          },
        },
        { $match: { y: { $in: matchYears } } },
        {
          $group: {
            _id: { y: "$y", m: "$m" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            y: "$_id.y",
            m: "$_id.m",
            total: 1,
            count: 1,
          },
        },
      ]),
      buildRecurringMonthlyOverlay(req, year),
      RecurringPayment.aggregate([
        { $match: ownedFilter(req, recurringPaidMatch) },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, total: 1, count: 1 } },
      ]),
    ]);

    const requestedCategoryMonth = Number(req.query.categoryMonth);
    const latestMonthWithSpend = monthTotals.reduce((latest, row) => {
      if (Number(row.y) !== Number(year) || Number(row.total || 0) <= 0) return latest;
      return Math.max(latest, Number(row.m || 0));
    }, 0);
    const categoryMonth =
      Number.isInteger(requestedCategoryMonth) &&
      requestedCategoryMonth >= 1 &&
      requestedCategoryMonth <= 12
        ? requestedCategoryMonth
        : latestMonthWithSpend || new Date().getMonth() + 1;

    const makeBreakdownStages = (nameExpr) => [
      {
        $group: {
          _id: nameExpr,
          value: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
          count: 1,
        },
      },
      { $sort: { value: -1 } },
    ];

    const [breakdownResult = {}] = await Expense.aggregate([
      { $match: ownedFilter(req) },
      actualDateStage,
      actualDateNotNull,
      {
        $addFields: {
          y: yearOfActualDate,
          m: monthOfActualDate,
          amount: { $ifNull: ["$finalPrice", "$price"] },
        },
      },
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
      {
        $lookup: {
          from: "locations",
          localField: "locationName",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          categoryDisplayName: { $ifNull: ["$product.category", "Ikke kategorisert"] },
          shopDisplayName: { $ifNull: ["$shop.name", "Ukjent butikk"] },
          brandDisplayName: { $ifNull: ["$brand.name", "Ukjent merke"] },
          locationDisplayName: { $ifNull: ["$location.name", "Ukjent sted"] },
        },
      },
      {
        $facet: {
          month: [
            { $match: { y: Number(year), m: categoryMonth } },
            ...makeBreakdownStages("$categoryDisplayName"),
          ],
          year: [{ $match: { y: Number(year) } }, ...makeBreakdownStages("$categoryDisplayName")],
          all: makeBreakdownStages("$categoryDisplayName"),
          shopMonth: [
            { $match: { y: Number(year), m: categoryMonth } },
            ...makeBreakdownStages("$shopDisplayName"),
          ],
          shopYear: [{ $match: { y: Number(year) } }, ...makeBreakdownStages("$shopDisplayName")],
          shopAll: makeBreakdownStages("$shopDisplayName"),
          brandMonth: [
            { $match: { y: Number(year), m: categoryMonth } },
            ...makeBreakdownStages("$brandDisplayName"),
          ],
          brandYear: [{ $match: { y: Number(year) } }, ...makeBreakdownStages("$brandDisplayName")],
          brandAll: makeBreakdownStages("$brandDisplayName"),
          locationMonth: [
            { $match: { y: Number(year), m: categoryMonth } },
            ...makeBreakdownStages("$locationDisplayName"),
          ],
          locationYear: [{ $match: { y: Number(year) } }, ...makeBreakdownStages("$locationDisplayName")],
          locationAll: makeBreakdownStages("$locationDisplayName"),
          monthlyTrend: [
            { $match: { y: Number(year) } },
            {
              $group: {
                _id: {
                  month: "$m",
                  category: "$categoryDisplayName",
                },
                value: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                name: "$_id.category",
                value: 1,
                count: 1,
              },
            },
            { $sort: { month: 1, value: -1 } },
          ],
        },
      },
    ]);
    const categoryBreakdowns = {
      month: breakdownResult.month ?? [],
      year: breakdownResult.year ?? [],
      all: breakdownResult.all ?? [],
    };
    const entityBreakdowns = {
      categories: categoryBreakdowns,
      shops: {
        month: breakdownResult.shopMonth ?? [],
        year: breakdownResult.shopYear ?? [],
        all: breakdownResult.shopAll ?? [],
      },
      brands: {
        month: breakdownResult.brandMonth ?? [],
        year: breakdownResult.brandYear ?? [],
        all: breakdownResult.brandAll ?? [],
      },
      locations: {
        month: breakdownResult.locationMonth ?? [],
        year: breakdownResult.locationYear ?? [],
        all: breakdownResult.locationAll ?? [],
      },
    };
    const categoryTotals =
      categoryBreakdowns[categoryScope] ?? categoryBreakdowns.year ?? [];
    const categoryMonthlyTrend = breakdownResult.monthlyTrend ?? [];

    // Map: "YYYY-MM" -> total
    const totalsMap = new Map();
    for (const r of monthTotals) {
      const mm = String(r.m).padStart(2, "0");
      totalsMap.set(`${r.y}-${mm}`, Number(r.total || 0));
    }

    const incomeTotalsMap = new Map();
    const incomeCountsMap = new Map();
    for (const r of incomeMonthTotals) {
      const mm = String(r.m).padStart(2, "0");
      incomeTotalsMap.set(`${r.y}-${mm}`, Number(r.total || 0));
      incomeCountsMap.set(`${r.y}-${mm}`, Number(r.count || 0));
    }

    // 3) Generate 12 months
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const months = [];
    for (let i = 0; i < 12; i++) {
      const mm = String(i + 1).padStart(2, "0");

      const current = totalsMap.get(`${year}-${mm}`) || 0;
      const previous = doCompare ? totalsMap.get(`${compareYear}-${mm}`) || 0 : null;
      const income = incomeTotalsMap.get(`${year}-${mm}`) || 0;
      const previousIncome = doCompare ? incomeTotalsMap.get(`${compareYear}-${mm}`) || 0 : null;
      const recurring = recurringOverlay.get(`${year}-${mm}`) || { expected: 0, paid: 0 };
      const yoyPct = doCompare && previous && previous > 0 ? ((current - previous) / previous) * 100 : null;

      months.push({
        monthIndex: i,
        month: monthShort[i],
        current,
        previous,
        income,
        previousIncome,
        expectedIncome: expectedMonthlyIncome,
        incomeCount: incomeCountsMap.get(`${year}-${mm}`) || 0,
        net: income - current,
        expectedNet: expectedMonthlyIncome - current,
        recurringExpected: recurring.expected || 0,
        recurringPaid: recurring.paid || 0,
        recurringMissing: recurring.missing || 0,
        yoyPct,
      });
    }

    // 4) Stats
    const currentVals = months.map((x) => x.current || 0);
    const prevVals = doCompare ? months.map((x) => x.previous || 0) : [];

    const sum = (arr) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

    const currentSum = sum(currentVals);
    const previousSum = doCompare ? sum(prevVals) : null;
    const incomeVals = months.map((x) => x.income || 0);
    const incomeSum = sum(incomeVals);
    const netSum = incomeSum - currentSum;
    const savingsRate = incomeSum > 0 ? (netSum / incomeSum) * 100 : null;
    const expectedIncomeSum = expectedMonthlyIncome * 12;
    const expectedNetSum = expectedIncomeSum - currentSum;
    const recurringExpectedSum = sum(months.map((x) => x.recurringExpected || 0));
    const recurringPaidSum = sum(months.map((x) => x.recurringPaid || 0));
    const recurringPaidAllTime = Number(recurringAllTime.total || 0);
    const recurringPaidAllTimeCount = Number(recurringAllTime.count || 0);

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
      categories: categoryTotals,
      categoryBreakdowns,
      entityBreakdowns,
      categoryMonthlyTrend,
      categoryScope,
      categoryMonth,
      stats: {
        currentSum,
        previousSum,
        incomeSum,
        netSum,
        savingsRate,
        expectedMonthlyIncome,
        expectedIncomeSum,
        expectedNetSum,
        recurringExpectedSum,
        recurringPaidSum,
        recurringPaidAllTime,
        recurringPaidAllTimeCount,
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
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }

  try {
    const data = await Expense.aggregate([
      { $match: ownedFilter(req, { productName: new mongoose.Types.ObjectId(productId) }) },
      actualDateStage,
      actualDateNotNull,
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
          date: "$actualDate",
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
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }

  try {
    const pid = new mongoose.Types.ObjectId(productId);

    const data = await Expense.aggregate([
      { $match: ownedFilter(req, { productName: pid }) },

      actualDateStage,
      actualDateNotNull,

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
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }

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
      { $match: ownedFilter(req) },
      { $match: matchStage },

      actualDateStage,
      actualDateNotNull,

      // robust conversions (shop/brand can be string or ObjectId)
      {
        $addFields: {
          shopObjId: {
            $convert: { input: "$shopName", to: "objectId", onError: null, onNull: null },
          },
          brandObjId: {
            $convert: { input: "$brandName", to: "objectId", onError: null, onNull: null },
          },
          locationObjId: {
            $convert: { input: "$locationName", to: "objectId", onError: null, onNull: null },
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

      {
        $lookup: {
          from: "locations",
          localField: "locationObjId",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },

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
          productCategory: "$product.category",
          measurementUnit: "$product.measurementUnit",
          shopName: { $ifNull: ["$shop.name", "Ukjent"] },
          brandName: { $ifNull: ["$brand.name", "Ukjent"] },
          locationName: { $ifNull: ["$location.name", "Ukjent"] },

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
                productCategory: 1,
                measurementUnit: 1,
                shopName: 1,
                brandName: 1,
                locationName: 1,
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

          shopStats: [
            {
              $group: {
                _id: "$shopName",
                purchases: { $sum: 1 },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                minPricePerUnit: { $min: "$pricePerUnit" },
                maxPricePerUnit: { $max: "$pricePerUnit" },
                totalSpend: { $sum: "$finalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                name: "$_id",
                purchases: 1,
                avgPricePerUnit: 1,
                minPricePerUnit: 1,
                maxPricePerUnit: 1,
                totalSpend: 1,
              },
            },
            { $sort: { avgPricePerUnit: 1 } },
          ],

          brandStats: [
            {
              $group: {
                _id: "$brandName",
                purchases: { $sum: 1 },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                minPricePerUnit: { $min: "$pricePerUnit" },
                maxPricePerUnit: { $max: "$pricePerUnit" },
                totalSpend: { $sum: "$finalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                name: "$_id",
                purchases: 1,
                avgPricePerUnit: 1,
                minPricePerUnit: 1,
                maxPricePerUnit: 1,
                totalSpend: 1,
              },
            },
            { $sort: { avgPricePerUnit: 1 } },
          ],

          locationStats: [
            {
              $group: {
                _id: "$locationName",
                purchases: { $sum: 1 },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                minPricePerUnit: { $min: "$pricePerUnit" },
                maxPricePerUnit: { $max: "$pricePerUnit" },
                totalSpend: { $sum: "$finalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                name: "$_id",
                purchases: 1,
                avgPricePerUnit: 1,
                minPricePerUnit: 1,
                maxPricePerUnit: 1,
                totalSpend: 1,
              },
            },
            { $sort: { totalSpend: -1 } },
          ],

          // Monthly buckets
          monthlySpend: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$actualDate", timezone: TIME_ZONE } },
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
                _id: yearOfActualDate,
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
                _id: { year: yearOfActualDate, shopName: "$shopName" },
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
          yearlyByBrand: [
            {
              $group: {
                _id: { year: yearOfActualDate, brandName: "$brandName" },
                avgPricePerUnit: { $avg: "$pricePerUnit" },
                purchases: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id.year" },
                brandName: "$_id.brandName",
                avgPricePerUnit: 1,
                purchases: 1,
              },
            },
            { $sort: { year: 1, brandName: 1 } },
          ],

          yearlyByVariant: [
            {
              $group: {
                _id: {
                  year: yearOfActualDate,
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
                  year: yearOfActualDate,
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
          topLocationByCount: [
            { $group: { _id: "$locationName", purchases: { $sum: 1 } } },
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
          cheapestLocationAvg: [
            {
              $group: {
                _id: "$locationName",
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
    const shopStats = result?.shopStats ?? [];
    const brandStats = result?.brandStats ?? [];
    const locationStats = result?.locationStats ?? [];

    // ---- yearly data ----
    const yearlyOverall = result?.yearlyOverall ?? [];
    const yearlyByShop = result?.yearlyByShop ?? [];
    const yearlyByBrand = result?.yearlyByBrand ?? [];
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
      byBrand: addYearChangeByGroup(yearlyByBrand, "brandName"),
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
        category: history?.[0]?.productCategory ?? null,
        measurementUnit: history?.[0]?.measurementUnit ?? null,
      },
      history,
      monthlySpend,
      variantStats,
      shopStats,
      brandStats,
      locationStats,
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
        locationMostOften: result?.topLocationByCount?.[0] ?? null,
        shopCheapestAvg: result?.cheapestShopAvg?.[0] ?? null,
        brandCheapestAvg: result?.cheapestBrandAvg?.[0] ?? null,
        locationCheapestAvg: result?.cheapestLocationAvg?.[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});
export default router;

