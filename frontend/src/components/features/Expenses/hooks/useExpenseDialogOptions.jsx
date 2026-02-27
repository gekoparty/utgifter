import { useMemo } from "react";

export const useExpenseDialogOptions = ({
  infiniteData,
  brandsForProduct,
  recentBrands,
  selectedProduct,
  shops,
}) => {
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

  return safe.map((s) => ({
    label: `${s.name}, ${s.locationName}`,
    value: String(s._id),      // ✅ use ID
    id: String(s._id),
    name: s.name,
    locationName: s.locationName,
  }));
}, [shops]);

  return { productOptions, brandOptions, shopOptions, variantOptions };
};