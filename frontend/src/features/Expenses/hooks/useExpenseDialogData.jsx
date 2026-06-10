import { useQuery } from "@tanstack/react-query";
import useInfiniteProducts from "../../../hooks/useInfiniteProducts";
import useCustomHttp from "../../../hooks/useHttp";
import { useBrandsForSelectedProduct, useRecentBrands } from "./useBrandsForSelectedProduct";
import { useShopSearch } from "./useShopSearch";
import {
  fetchCategories,
  fetchLocations,
} from "../../../components/commons/Utils/apiUtils";

export const useExpenseDialogData = ({ open, productSearch, selectedProduct, shopSearch }) => {
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

  const {
    data: locationsPayload,
    isLoading: isLoadingLocations,
    isError: isLocationError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => fetchLocations({ signal }),
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: categoriesPayload,
    isLoading: isLoadingCategories,
    isError: isCategoryError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    enabled: open,
    staleTime: 10 * 60 * 1000,
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
    isLoadingShops,
    locations: locationsPayload?.locations ?? [],
    categories: categoriesPayload?.categories ?? [],
    isLoadingLocations,
    isLoadingCategories,
    isLocationError,
    isCategoryError,
  };
};
