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
        value: p.name,
        name: p.name,

        // ✅ variants (array of strings / reference ids)
        variants: Array.isArray(p.variants) ? p.variants : [],

        category: p.category ?? "",
        measurementUnit: p.measurementUnit ?? "",
        measures: Array.isArray(p.measures) ? p.measures : [],
        brands: Array.isArray(p.brands) ? p.brands : [],
      }))
    );
  }, [infiniteData]);

  // ✅ NEW: options for the variant select (depends on selectedProduct)
  const variantOptions = useMemo(() => {
  const variants = selectedProduct?.variants;
  if (!Array.isArray(variants)) return [];

  return variants
    .map((v) => ({ label: v?.name, value: String(v?._id) }))
    .filter((o) => o.value && o.label);
}, [selectedProduct]);

  const brandOptions = useMemo(() => {
    const list = selectedProduct?.brands?.length
      ? (brandsForProduct ?? [])
      : (recentBrands ?? []);

    const safe = Array.isArray(list) ? list : [];

    return safe.map((b) => ({
      label: b.name,
      value: b._id,
      name: b.name,
    }));
  }, [brandsForProduct, recentBrands, selectedProduct]);

  const shopOptions = useMemo(() => {
    const safe = Array.isArray(shops) ? shops : [];
    return safe.map((s) => ({
      label: `${s.name}, ${s.locationName}`,
      value: s.name,
      locationName: s.locationName,
    }));
  }, [shops]);

  return { productOptions, brandOptions, shopOptions, variantOptions };
};
