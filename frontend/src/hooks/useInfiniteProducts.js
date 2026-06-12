import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { buildApiUrl, requestJson } from "../api/httpClient";

const buildProductsUrl = (globalFilter, pageParam) => {
  const url = buildApiUrl("/api/products");
  url.searchParams.set("globalFilter", globalFilter || "");
  url.searchParams.set("start", String(pageParam));
  url.searchParams.set("size", "10");
  return url;
};

const useInfiniteProducts = (globalFilter, options = {}) => {
  const queryKey = useMemo(() => ["products", globalFilter], [globalFilter]);

  const fetchProducts = async ({ pageParam = 0, signal }) => {
    return requestJson(buildProductsUrl(globalFilter, pageParam), { signal });
  };

  const getNextPageParam = (lastPage, pages) => {
    if (!lastPage || !lastPage.meta) return undefined;
    const totalItems = lastPage.meta.totalRowCount || 0;
    const loadedItems = pages.reduce((acc, page) => acc + (page.products?.length || 0), 0);
    return loadedItems < totalItems ? loadedItems : undefined;
  };

  return useInfiniteQuery({
    queryKey,
    queryFn: fetchProducts,
    getNextPageParam,
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (old) => old,
  });
};

export default useInfiniteProducts;
