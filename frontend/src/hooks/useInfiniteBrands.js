import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { buildApiUrl, requestJson } from "../api/httpClient";

const buildBrandsUrl = (globalFilter, pageParam) => {
  const url = buildApiUrl("/api/brands");
  url.searchParams.set("globalFilter", globalFilter || "");
  url.searchParams.set("start", String(pageParam));
  url.searchParams.set("size", "10");
  return url;
};

const useInfiniteBrands = (globalFilter) => {
  const queryKey = useMemo(() => ["brands", globalFilter], [globalFilter]);

  const fetchBrands = async ({ pageParam = 0, signal }) => {
    return requestJson(buildBrandsUrl(globalFilter, pageParam), { signal });
  };

  const getNextPageParam = (lastPage, pages) => {
    const totalItems = lastPage?.meta?.totalRowCount ?? 0;
    const loadedItems = pages.reduce((acc, page) => acc + (page.brands?.length || 0), 0);
    return loadedItems < totalItems ? loadedItems : undefined;
  };

  return useInfiniteQuery({
    queryKey,
    queryFn: fetchBrands,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (old) => old,
  });
};

export default useInfiniteBrands;
