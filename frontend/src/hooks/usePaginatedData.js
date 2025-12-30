import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useCallback } from "react";

export const usePaginatedData = ({
  endpoint,
  params,
  urlBuilder,
  transformFn,
  baseQueryKey,
}) => {
  const queryClient = useQueryClient();

  // Stable, serializable key piece
  const paramKey = useMemo(() => JSON.stringify(params), [params]);

  const queryKey = useMemo(
    () => [...baseQueryKey, paramKey],
    [baseQueryKey, paramKey]
  );

  const fetchPage = useCallback(
    async (p, signal) => {
      const url = urlBuilder(endpoint, p);
      const response = await fetch(url.href, { signal });
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      return transformFn ? await transformFn(json, signal) : json;
    },
    [endpoint, urlBuilder, transformFn]
  );

  const queryResult = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchPage(params, signal),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  // Prefetch next page
  const totalRowCount = queryResult.data?.meta?.totalRowCount;

  useEffect(() => {
    if (!totalRowCount) return;

    const totalPages = Math.ceil(totalRowCount / params.pageSize);
    const nextPageIndex = params.pageIndex + 1;

    if (nextPageIndex >= totalPages) return;

    const nextParams = { ...params, pageIndex: nextPageIndex };
    const nextParamKey = JSON.stringify(nextParams);
    const nextQueryKey = [...baseQueryKey, nextParamKey];

    if (queryClient.getQueryData(nextQueryKey)) return;

    queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: ({ signal }) => fetchPage(nextParams, signal),
      staleTime: 60_000,
    });
  }, [
    totalRowCount,
    params.pageIndex,
    params.pageSize,
    params, // used to spread into nextParams
    baseQueryKey,
    queryClient,
    fetchPage,
  ]);

  return queryResult;
};
