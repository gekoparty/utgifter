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

        // variants is array (often ids/refs)
        variants: Array.isArray(p.variants) ? p.variants : [],

        category: p.category ?? "",
        measurementUnit: p.measurementUnit ?? "",
        measures: Array.isArray(p.measures) ? p.measures : [],
        brands: Array.isArray(p.brands) ? p.brands : [],
      }))
    );
  }, [infiniteData]);

  const variantOptions = useMemo(() => {
    const variants = selectedProduct?.variants;
    if (!Array.isArray(variants)) return [];

    return variants
      .map((v) => ({ label: v?.name, value: String(v?._id) }))
      .filter((o) => o.value && o.label);
  }, [selectedProduct]);

  /**
   * ✅ IMPORTANT:
   * - If a product is selected (ADD or EDIT), show ONLY brands for that product.
   * - If no product selected, show recent brands (optional UX).
   */
  const brandOptions = useMemo(() => {
    const list = selectedProduct ? brandsForProduct : recentBrands;

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
