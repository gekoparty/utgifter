// usePaginatedData.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";

export const usePaginatedData = ({
  endpoint,
  params,
  urlBuilder,
  transformFn,
  baseQueryKey
}) => {
  const queryClient = useQueryClient();
  
  // Create stable query key array
  const queryKey = useMemo(() => [
    ...baseQueryKey,
    params // Ensure params is memoized with deep compare in parent
  ], [baseQueryKey, params]);

  const fetchData = useMemo(() => async ({ signal }) => {
    const url = urlBuilder(endpoint, params);
    const response = await fetch(url.href, { signal });
    if (!response.ok) throw new Error("Network response was not ok");
    const json = await response.json();
    return transformFn ? await transformFn(json, signal) : json;
  }, [endpoint, params, urlBuilder, transformFn]);

  const queryResult = useQuery({
    queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  // Prefetch next page with proper query key structure
  useEffect(() => {
    if (queryResult.data?.meta) {
      const totalPages = Math.ceil(queryResult.data.meta.totalRowCount / params.pageSize);
      
      if (params.pageIndex + 1 < totalPages) {
        const nextParams = { ...params, pageIndex: params.pageIndex + 1 };
        const nextQueryKey = [...baseQueryKey, nextParams];
        
        if (!queryClient.getQueryData(nextQueryKey)) {
          queryClient.prefetchQuery({
            queryKey: nextQueryKey,
            queryFn: async () => {
              const url = urlBuilder(endpoint, nextParams);
              const response = await fetch(url.href);
              if (!response.ok) throw new Error("Network response was not ok");
              const json = await response.json();
              return transformFn ? transformFn(json) : json;
            },
            staleTime: 60_000
          });
        }
      }
    }
  }, [params, queryClient, endpoint, queryResult.data?.meta, urlBuilder, transformFn, baseQueryKey]);

  return queryResult;
};