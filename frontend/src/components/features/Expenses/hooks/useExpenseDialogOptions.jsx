import { useMemo } from "react";

export const useExpenseDialogOptions = ({
  infiniteData,
  brands,
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
        type: p.type,
        measurementUnit: p.measurementUnit,
        measures: p.measures,
        brands: p.brands,
      }))
    );
  }, [infiniteData]);

  // Filter brands based on selectedProduct.brands (no extra API call)
  const brandOptions = useMemo(() => {
    const safeBrands = Array.isArray(brands) ? brands : [];
    if (!selectedProduct?.brands?.length) {
      return safeBrands.map((b) => ({ label: b.name, value: b._id, name: b.name }));
    }

    const ids = selectedProduct.brands.map(String);
    return safeBrands
      .filter((b) => ids.includes(String(b._id)))
      .map((b) => ({ label: b.name, value: b._id, name: b.name }));
  }, [brands, selectedProduct]);

  const shopOptions = useMemo(() => {
    const safe = Array.isArray(shops) ? shops : [];
    return safe.map((s) => ({
      label: `${s.name}, ${s.locationName}`,
      value: s.name,
      locationName: s.locationName,
    }));
  }, [shops]);

  return { productOptions, brandOptions, shopOptions };
};
