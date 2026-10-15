import { useMemo } from "react";

export const useExpenseDialogOptions = ({
  infiniteData,
  brandsForProduct,
  recentBrands,
  selectedProduct,
  shops,
  locations,
}) => {
  const normalizeShopKey = (name) =>
    String(name || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const productOptions = useMemo(() => {
  const pages = infiniteData?.pages || [];

  return pages.flatMap((page) =>
    (page.products || []).map((p) => ({
      label: p.name,
      value: String(p._id),   // ✅ USE ID
      id: String(p._id),      // optional but nice
      name: p.name,

      variants: Array.isArray(p.variants) ? p.variants : [],
      brands: Array.isArray(p.brands) ? p.brands : [],
      category: p.category ?? "",
      measurementUnit: p.measurementUnit ?? "",
      measures: Array.isArray(p.measures) ? p.measures : [],
    }))
  );
}, [infiniteData]);

  const variantOptions = useMemo(() => {
    const variants = selectedProduct?.variants;
    if (!Array.isArray(variants)) return [];

    return variants
      .map((v) => ({
        label: String(v?.name ?? ""),
        value: String(v?._id ?? v),
        name: String(v?.name ?? ""),
      }))
      .filter((o) => o.value && o.label);
  }, [selectedProduct]);

  // ✅ STRICT:
  // - if product selected -> ONLY brandsForProduct
  // - if no product -> recent brands (optional)
  const brandOptions = useMemo(() => {
    const safeForProduct = Array.isArray(brandsForProduct) ? brandsForProduct : [];
    const safeRecent = Array.isArray(recentBrands) ? recentBrands : [];

    const list = selectedProduct ? safeForProduct : safeRecent;

    return list.map((b) => ({
      label: b.name,
      value: b._id,
      name: b.name,
    }));
  }, [brandsForProduct, recentBrands, selectedProduct]);

  const shopOptions = useMemo(() => {
  const safe = Array.isArray(shops) ? shops : [];
  const mergedByName = new Map();

  safe.forEach((shop) => {
    const id = String(shop?._id || "").trim();
    const name = String(shop?.name || "").trim();
    const key = normalizeShopKey(name);
    if (!id || !key) return;

    const locationIds = Array.isArray(shop.locationIds)
      ? shop.locationIds.map(String)
      : Array.isArray(shop.locations)
        ? shop.locations.map(String)
        : shop.location
          ? [String(shop.location)]
          : [];
    const locationNames = Array.isArray(shop.locationNames)
      ? shop.locationNames
      : shop.locationName && shop.locationName !== "N/A"
        ? String(shop.locationName).split(",").map((locationName) => locationName.trim()).filter(Boolean)
        : [];

    const existing = mergedByName.get(key);
    if (!existing) {
      mergedByName.set(key, {
        ...shop,
        _id: id,
        name,
        locationIds,
        locationNames,
      });
      return;
    }

    mergedByName.set(key, {
      ...existing,
      locationIds: [...new Set([...(existing.locationIds || []), ...locationIds])],
      locationNames: [...new Set([...(existing.locationNames || []), ...locationNames])],
    });
  });

  return [...mergedByName.values()].map((s) => ({
      label: s.name,
      value: String(s._id),      // ✅ use ID
      id: String(s._id),
      name: s.name,
      locationIds: s.locationIds || [],
      locationNames: s.locationNames || [],
    }));
}, [shops]);

  const locationOptions = useMemo(() => {
    const safe = Array.isArray(locations) ? locations : [];

    return safe.map((location) => ({
      label: location.name,
      value: String(location._id),
      id: String(location._id),
      name: location.name,
    }));
  }, [locations]);

  return { productOptions, brandOptions, shopOptions, locationOptions, variantOptions };
};
