// Example custom hook: usePaginatedData.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";


// Default URL builder (handles priceRange only if provided)
const buildFetchURL = (endpoint, { pageIndex, pageSize, sorting, filters, globalFilter, priceRange }) => {
    const baseURL =
      process.env.NODE_ENV === "production"
        ? "https://api.example.com"
        : "http://localhost:3000";
    const fetchURL = new URL(endpoint, baseURL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    fetchURL.searchParams.set("columnFilters", JSON.stringify(filters ?? []));
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    if (priceRange && Array.isArray(priceRange) && priceRange.length === 2) {
      fetchURL.searchParams.set("minPrice", `${priceRange[0]}`);
      if (priceRange[1] < 1000) {
        fetchURL.searchParams.set("maxPrice", `${priceRange[1]}`);
      }
    }
    return fetchURL;
  };
  
  export const usePaginatedData = (endpoint, params, urlBuilder, transformFn) => {
    const queryClient = useQueryClient();
    const finalUrlBuilder = urlBuilder || buildFetchURL;
    const queryKey = useMemo(() => [endpoint, params], [endpoint, params]);
  
    const fetchData = async ({ signal }) => {
      const url = finalUrlBuilder(endpoint, params);
      const response = await fetch(url.href, { signal });
      if (!response.ok) throw new Error("Network response was not ok");
      let json = await response.json();
      if (transformFn) {
        json = await transformFn(json, signal);
      }
      return json;
    };
  
    const queryResult = useQuery({
      queryKey,
      queryFn: fetchData,
      keepPreviousData: true,
    });
  
    // Prefetch next page
    useEffect(() => {
      const totalPages = Math.ceil(
        (queryResult.data?.meta?.totalRowCount || 0) / params.pageSize
      );
      if (params.pageIndex + 1 < totalPages) {
        const nextPageParams = { ...params, pageIndex: params.pageIndex + 1 };
        const nextQueryKey = [endpoint, nextPageParams];
        queryClient.prefetchQuery(nextQueryKey, async () => {
          const url = finalUrlBuilder(endpoint, nextPageParams);
          const response = await fetch(url.href);
          if (!response.ok) throw new Error("Network response was not ok");
          let json = await response.json();
          if (transformFn) {
            // Pass undefined for the signal since it's not provided in prefetchQuery.
            json = await transformFn(json, undefined);
          }
          return json;
        });
      }
    }, [
      params,
      queryClient,
      endpoint,
      queryResult.data?.meta?.totalRowCount,
      finalUrlBuilder,
      transformFn,
    ]);
  
    return queryResult;
  };