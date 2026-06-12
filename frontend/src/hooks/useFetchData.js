import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestJson } from "../api/httpClient";

const identityTransform = (data) => data;

const useFetchData = (queryKey, url, transformDataProp, options = {}) => {
  const transformData = transformDataProp ?? identityTransform;
  const stableQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  const { throwOnError, ...queryOptions } = options;

  const fetchData = useCallback(
    async ({ signal }) => {
      const data = await requestJson(url, { signal });
      return transformData(data, signal);
    },
    [transformData, url],
  );

  const queryResult = useQuery({
    queryKey: stableQueryKey,
    queryFn: fetchData,
    enabled: options.enabled !== false,
    retry: options.retry ?? 3,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 10 * 60 * 1000,
    throwOnError: throwOnError ?? false,
    ...queryOptions,
  });

  return {
    data: queryResult.data,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isPending: queryResult.isPending,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
  };
};

export default useFetchData;
