import express from "express";
import mongoose from "mongoose";
import Brand from "../models/brandSchema.js";
import Product from "../models/productSchema.js";
import ReceiptMatchAlias from "../models/receiptMatchAliasSchema.js";
import Shop from "../models/shopSchema.js";

const receiptsRouter = express.Router();

const STOP_WORDS = new Set([
  "og",
  "eller",
  "med",
  "the",
  "and",
  "for",
  "til",
  "fra",
  "kr",
  "nok",
  "mva",
  "sum",
  "total",
  "subtotal",
  "butikk",
  "dato",
  "kvittering",
]);

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå\s.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalize(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

const unique = (values) => [...new Set(values.filter(Boolean))];
const hasLetter = (value) => /[a-zæøå]/i.test(String(value ?? ""));
const isStrongProductToken = (token) =>
  token.length >= 3 && hasLetter(token) && !STOP_WORDS.has(token);

const pickLearningPhrase = (value) => {
  const lines = String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && line.length <= 90);

  return lines[0] || String(value ?? "").trim().slice(0, 90);
};

const buildAliasSuggestion = (alias) => ({
  phrase: alias.phrase,
  normalizedPhrase: alias.normalizedPhrase,
  count: alias.count || 1,
});

const scoreNamedEntity = (entity, haystack, lines, { minScore = 35 } = {}) => {
  const name = entity?.name || "";
  const tokens = tokenize(name);
  if (!tokens.length) return null;

  const normalizedName = normalize(name);
  let score = 0;

  if (normalizedName && haystack.includes(normalizedName)) {
    score += 95;
  }

  const matchedTokens = tokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length) {
    score += Math.round((matchedTokens.length / tokens.length) * 70);
  }

  if (score < minScore) return null;

  return {
    score,
    confidence: Math.min(99, Math.round(score)),
    snippets: getLineSnippets(lines, tokens),
  };
};

const buildBrandSuggestion = (brand, match) => ({
  _id: String(brand._id),
  id: String(brand._id),
  name: brand.name,
  confidence: match.confidence,
  snippets: match.snippets,
});

const buildShopSuggestion = (shop, match) => ({
  _id: String(shop._id),
  id: String(shop._id),
  name: shop.name,
  locationId: shop.location?._id ? String(shop.location._id) : String(shop.location || ""),
  locationName: shop.location?.name || shop.locationName || "",
  confidence: match.confidence,
  snippets: match.snippets,
});

const getLineSnippets = (lines, productTokens) => {
  const snippets = [];

  for (const line of lines) {
    const normalizedLine = normalize(line);
    if (!normalizedLine) continue;

    const matches = productTokens.filter((token) => normalizedLine.includes(token));
    if (matches.length) snippets.push(line.trim());
    if (snippets.length >= 3) break;
  }

  return snippets;
};

const scoreProduct = (product, haystack, lines, aliases = []) => {
  const productName = product.name || "";
  const productTokens = tokenize(productName);
  if (!productTokens.length) return null;

  const strongProductTokens = productTokens.filter(isStrongProductToken);
  const categoryTokens = tokenize(product.category);
  const brandTokens = (product.brands ?? []).flatMap((brand) => tokenize(brand?.name));
  const variantTokens = (product.variants ?? []).flatMap((variant) => tokenize(variant?.name));
  const aliasMatches = aliases.filter((alias) =>
    alias.normalizedPhrase && haystack.includes(alias.normalizedPhrase)
  );

  let score = 0;
  const reasons = [];
  const matchedTokens = [];
  const matchedAliases = aliasMatches.map(buildAliasSuggestion);

  const normalizedName = normalize(productName);
  if (normalizedName && haystack.includes(normalizedName)) {
    score += 95;
    reasons.push("Produktnavn funnet");
  }

  const matchedProductTokens = strongProductTokens.filter((token) => haystack.includes(token));
  if (matchedProductTokens.length) {
    score += Math.round((matchedProductTokens.length / strongProductTokens.length) * 70);
    matchedTokens.push(...matchedProductTokens);
    reasons.push(`${matchedProductTokens.length}/${strongProductTokens.length} produktord matcher`);
  }

  if (aliasMatches.length) {
    score += Math.min(100, 80 + aliasMatches.length * 10);
    reasons.push("Tidligere bekreftet kvitteringstekst matcher");
  }

  const hasProductEvidence =
    (normalizedName && haystack.includes(normalizedName)) ||
    matchedProductTokens.length > 0 ||
    aliasMatches.length > 0;

  if (!hasProductEvidence) return null;

  const matchedBrandTokens = unique(brandTokens).filter((token) => haystack.includes(token));
  if (matchedBrandTokens.length) {
    score += Math.min(18, matchedBrandTokens.length * 6);
    matchedTokens.push(...matchedBrandTokens);
    reasons.push("Merke matcher");
  }

  const matchedVariantTokens = unique(variantTokens).filter((token) => haystack.includes(token));
  if (matchedVariantTokens.length) {
    score += Math.min(18, matchedVariantTokens.length * 6);
    matchedTokens.push(...matchedVariantTokens);
    reasons.push("Variant matcher");
  }

  const matchedCategoryTokens = unique(categoryTokens).filter((token) => haystack.includes(token));
  if (matchedCategoryTokens.length) {
    score += Math.min(6, matchedCategoryTokens.length * 3);
    matchedTokens.push(...matchedCategoryTokens);
  }

  if (score < 45) return null;

  return {
    score,
    confidence: Math.min(99, Math.round(score)),
    reasons: unique(reasons),
    matchedTokens: unique(matchedTokens),
    matchedAliases,
    snippets: getLineSnippets(lines, [
      ...strongProductTokens,
      ...aliasMatches.map((alias) => alias.normalizedPhrase),
    ]),
  };
};

receiptsRouter.post("/match-products", async (req, res) => {
  try {
    const { text = "", fileName = "" } = req.body ?? {};
    const combinedText = `${fileName}\n${text}`.slice(0, 120000);
    const haystack = normalize(combinedText);

    if (!haystack) {
      return res.json({
        candidates: [],
        extractedText: "",
        message: "Ingen tekst å matche mot.",
      });
    }

    const lines = String(combinedText)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 400);

    const products = await Product.find()
      .select("name category brands variants measures measurementUnit")
      .populate("brands", "name")
      .populate({ path: "variants", select: "name", options: { sort: { name: 1 } } })
      .lean();

    const [brands, shops, aliases] = await Promise.all([
      Brand.find().select("name products").lean(),
      Shop.find()
        .select("name location category brands products")
        .populate("location", "name")
        .lean(),
      ReceiptMatchAlias.find()
        .select("phrase normalizedPhrase product brand shop count")
        .lean(),
    ]);

    const aliasesByProductId = aliases.reduce((acc, alias) => {
      if (!alias.product) return acc;
      const productId = String(alias.product);
      if (!acc.has(productId)) acc.set(productId, []);
      acc.get(productId).push(alias);
      return acc;
    }, new Map());

    const brandCandidates = brands
      .map((brand) => {
        const match = scoreNamedEntity(brand, haystack, lines);
        return match ? buildBrandSuggestion(brand, match) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    const shopCandidates = shops
      .map((shop) => {
        const match = scoreNamedEntity(shop, haystack, lines);
        return match ? buildShopSuggestion(shop, match) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    const brandById = new Map(brandCandidates.map((brand) => [brand.id, brand]));
    const shopById = new Map(shopCandidates.map((shop) => [shop.id, shop]));
    const bestShop = shopCandidates[0] ?? null;

    const candidates = products
      .map((product) => {
        const match = scoreProduct(
          product,
          haystack,
          lines,
          aliasesByProductId.get(String(product._id)) ?? []
        );
        if (!match) return null;

        const productBrandIds = Array.isArray(product.brands)
          ? product.brands.map((brand) => String(brand?._id ?? brand)).filter(Boolean)
          : [];
        const suggestedBrand =
          productBrandIds.map((id) => brandById.get(id)).find(Boolean) ??
          null;
        const suggestedShop =
          shops
            .filter((shop) =>
              Array.isArray(shop.products)
                ? shop.products.some((id) => String(id) === String(product._id))
                : false
            )
            .map((shop) => shopById.get(String(shop._id)))
            .find(Boolean) ??
          bestShop;

        return {
          product: {
            _id: String(product._id),
            id: String(product._id),
            name: product.name,
            category: product.category || "",
            measurementUnit: product.measurementUnit || "",
            measures: Array.isArray(product.measures) ? product.measures : [],
            brands: productBrandIds,
            brandNames: Array.isArray(product.brands)
              ? product.brands.map((brand) => brand?.name).filter(Boolean)
              : [],
            variants: Array.isArray(product.variants) ? product.variants : [],
          },
          suggestedBrand,
          suggestedShop,
          ...match,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    res.json({
      candidates,
      brandCandidates,
      shopCandidates,
      extractedText: String(text || "").slice(0, 5000),
      source: {
        fileName: String(fileName || ""),
        lineCount: lines.length,
      },
    });
  } catch (error) {
    console.error("Receipt product matching failed:", error);
    res.status(500).json({ message: "Kunne ikke analysere kvittering." });
  }
});

receiptsRouter.post("/learn-match", async (req, res) => {
  try {
    const {
      text = "",
      phrase = "",
      productId = "",
      brandId = "",
      shopId = "",
    } = req.body ?? {};

    const learnedPhrase = pickLearningPhrase(phrase || text);
    const normalizedPhrase = normalize(learnedPhrase);

    if (!normalizedPhrase || !hasLetter(normalizedPhrase)) {
      return res.status(400).json({ message: "Mangler tekst å lære fra." });
    }

    const update = {
      phrase: learnedPhrase,
      normalizedPhrase,
      lastUsedAt: new Date(),
      ...(mongoose.isValidObjectId(productId) ? { product: productId } : {}),
      ...(mongoose.isValidObjectId(brandId) ? { brand: brandId } : {}),
      ...(mongoose.isValidObjectId(shopId) ? { shop: shopId } : {}),
    };

    if (!update.product && !update.brand && !update.shop) {
      return res.status(400).json({ message: "Mangler valgt match å lagre." });
    }

    const alias = await ReceiptMatchAlias.findOneAndUpdate(
      {
        normalizedPhrase,
        product: update.product ?? null,
        brand: update.brand ?? null,
        shop: update.shop ?? null,
      },
      {
        $set: update,
        $inc: { count: 1 },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ alias });
  } catch (error) {
    console.error("Receipt learning failed:", error);
    res.status(500).json({ message: "Kunne ikke lagre kvitteringsmatch." });
  }
});

export default receiptsRouter;
