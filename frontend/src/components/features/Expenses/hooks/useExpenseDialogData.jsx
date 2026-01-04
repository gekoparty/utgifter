import useFetchData from "../../../../hooks/useFetchData";
import useInfiniteProducts from "../../../../hooks/useInfiniteProducts";

// Batch enrich shops with location names (your optimized approach)
const enrichShopsWithLocations = async (shopsData) => {
  const shops = Array.isArray(shopsData) ? shopsData : shopsData?.shops || [];
  if (!shops.length) return [];

  const ids = [...new Set(shops.map((s) => s.location).filter(Boolean))];
  if (!ids.length) return shops;

  const res = await fetch(`/api/locations?ids=${ids.join(",")}`);
  const json = await res.json();
  const locations = Array.isArray(json) ? json : json.locations || [];

  const map = locations.reduce((acc, loc) => {
    if (loc?._id) acc[loc._id] = loc.name;
    return acc;
  }, {});

  return shops.map((s) => ({ ...s, locationName: map[s.location] || "N/A" }));
};

export const useExpenseDialogData = ({ open, productSearch }) => {
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch, { enabled: open });

  const { data: brands, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands",
    (d) => (Array.isArray(d?.brands) ? d.brands : Array.isArray(d) ? d : []),
    { enabled: open }
  );

  const { data: shops, isLoading: isLoadingShops } = useFetchData(
    "shops",
    "/api/shops",
    enrichShopsWithLocations,
    { enabled: open }
  );

  return {
    infiniteData,
    isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    brands,
    isLoadingBrands,
    shops,
    isLoadingShops,
  };
};
