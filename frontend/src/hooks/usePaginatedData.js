import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useMemo, useEffect, useCallback } from "react";

/**
 * usePaginatedData (optimized)
 * - Uses React Query's structural queryKey instead of JSON.stringify
 * - keepPreviousData prevents table flicker on param changes
 * - Prefetches next page safely without effect churn
 */
export const usePaginatedData = ({
  endpoint,
  params,
  urlBuilder,
  transformFn,
  baseQueryKey,
  enabled = true,
  staleTime = 60_000,
}) => {
  const queryClient = useQueryClient();

  // ✅ Create a stable queryKey using structured params
  // React Query will hash this deterministically.
  const queryKey = useMemo(() => {
    // If baseQueryKey isn't stable, callers should memoize it.
    return [...baseQueryKey, params];
  }, [baseQueryKey, params]);

  const fetchPage = useCallback(
    async ({ p, signal }) => {
      const url = urlBuilder(endpoint, p);
      const response = await fetch(url.href, { signal });

      if (!response.ok) {
        // try to extract server message if present
        let msg = "Network response was not ok";
        try {
          const text = await response.text();
          if (text) msg = text;
        } catch {}
        throw new Error(msg);
      }

      const json = await response.json();
      return transformFn ? transformFn(json) : json;
    },
    [endpoint, urlBuilder, transformFn]
  );

  const queryResult = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchPage({ p: params, signal }),
    enabled,
    staleTime,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData, // ✅ best practice in v5
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ---------- Prefetch next page ----------
  const totalRowCount = queryResult.data?.meta?.totalRowCount ?? 0;

  const nextParams = useMemo(() => {
    if (!totalRowCount) return null;

    const totalPages = Math.ceil(totalRowCount / params.pageSize);
    const nextPageIndex = params.pageIndex + 1;

    if (nextPageIndex >= totalPages) return null;

    // ✅ only copy what you must; keep reference churn low
    return { ...params, pageIndex: nextPageIndex };
  }, [totalRowCount, params]);

  useEffect(() => {
    if (!nextParams) return;

    const nextQueryKey = [...baseQueryKey, nextParams];
    if (queryClient.getQueryData(nextQueryKey)) return;

    queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: ({ signal }) => fetchPage({ p: nextParams, signal }),
      staleTime,
    });
  }, [nextParams, baseQueryKey, queryClient, fetchPage, staleTime]);

  return queryResult;
};

