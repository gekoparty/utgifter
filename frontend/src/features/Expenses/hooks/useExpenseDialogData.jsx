import useInfiniteProducts from "../../../hooks/useInfiniteProducts";
import useCustomHttp from "../../../hooks/useHttp";
import { useQuery } from "@tanstack/react-query";
import { useBrandsForSelectedProduct, useRecentBrands } from "./useBrandsForSelectedProduct";
import { useShopSearch } from "./useShopSearch";

export const useExpenseDialogData = ({
  open,
  productSearch,
  selectedProduct,
  shopSearch,
  selectedShopId,
}) => {
  // You can use your existing base URL config, this is just to get sendRequest
  const { sendRequest } = useCustomHttp("", { auto: false });

  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch, { enabled: open });

  const { data: brandsForProduct = [], isLoading: isLoadingBrandsForProduct } =
    useBrandsForSelectedProduct({ open, selectedProduct, sendRequest });

  const { data: recentBrands = [], isLoading: isLoadingRecentBrands } =
    useRecentBrands({ open, sendRequest });

  const { data: shops = [], isFetching: isLoadingShops } = useShopSearch({
    open,
    query: shopSearch,
    sendRequest,
  });

  const normalizedSelectedShopId = String(selectedShopId || "").trim();
  const { data: selectedShop = null, isFetching: isLoadingSelectedShop } = useQuery({
    queryKey: ["shops", "detail", normalizedSelectedShopId],
    enabled: open && Boolean(normalizedSelectedShopId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sendRequest(
        `/api/shops/${encodeURIComponent(normalizedSelectedShopId)}`,
        "GET"
      );
      if (error) throw error;
      return data;
    },
  });

  const { data: locations = [], isFetching: isLoadingLocations } = useQuery({
    queryKey: ["locations", "expense-dialog"],
    enabled: open,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sendRequest("/api/locations", "GET");
      if (error) throw error;
      return Array.isArray(data?.locations) ? data.locations : [];
    },
  });

  return {
    sendRequest,
    infiniteData,
    isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    brandsForProduct,
    recentBrands,
    isLoadingBrands: isLoadingBrandsForProduct || isLoadingRecentBrands,
    shops,
    selectedShop,
    isLoadingShops: isLoadingShops || isLoadingSelectedShop,
    locations,
    isLoadingLocations,
  };
};
