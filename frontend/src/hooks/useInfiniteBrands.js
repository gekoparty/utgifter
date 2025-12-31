import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { API_URL } from "../components/commons/Consts/constants";

const buildApiUrl = (globalFilter, pageParam) =>
  `${API_URL}/api/brands?globalFilter=${encodeURIComponent(globalFilter || "")}&start=${pageParam}&size=10`;

const useInfiniteBrands = (globalFilter) => {
  const queryKey = useMemo(() => ["brands", globalFilter], [globalFilter]);

  const fetchBrands = async ({ pageParam = 0, signal }) => {
    const response = await fetch(buildApiUrl(globalFilter, pageParam), { signal });
    if (!response.ok) throw new Error(`Failed to fetch brands: ${response.statusText}`);
    return response.json();
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
