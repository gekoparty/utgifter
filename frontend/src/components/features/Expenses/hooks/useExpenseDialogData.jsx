import useInfiniteProducts from "../../../../hooks/useInfiniteProducts";
import useCustomHttp from "../../../../hooks/useHttp";
import { useBrandsForSelectedProduct, useRecentBrands } from "./useBrandsForSelectedProduct";
import { useShopSearch } from "./useShopSearch";

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

  return {
    infiniteData,
    isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    brandsForProduct,
    recentBrands,
    isLoadingBrands: isLoadingBrandsForProduct || isLoadingRecentBrands,
    shops,
    isLoadingShops,
  };
};
