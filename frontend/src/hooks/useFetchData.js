import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const useFetchData = (queryKey, url, transformData = (data) => data, options = {}) => {
  const stableQueryKey = useMemo(() => (Array.isArray(queryKey) ? queryKey : [queryKey]), [queryKey]);

  const fetchData = async ({ signal }) => {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`Fetch error: ${errorMessage}`);
      throw new Error(`Failed to fetch data from ${url} - ${response.statusText}`);
    }

    try {
      const data = await response.json();
      return transformData(data);
    } catch (jsonError) {
      console.error('JSON Parsing Error:', jsonError);
      throw new Error('Invalid JSON response');
    }
  };

  const queryResult = useQuery({
    queryKey: stableQueryKey,
    queryFn: fetchData,
    enabled: options.enabled !== false,
    retry: options.retry ?? 3,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    cacheTime: options.cacheTime ?? 10 * 60 * 1000,
    useErrorBoundary: options.useErrorBoundary ?? true, // ✅ Supports Suspense
    ...options,
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
};

export default useFetchData;