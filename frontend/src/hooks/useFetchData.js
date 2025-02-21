import { useQuery } from '@tanstack/react-query';

const useFetchData = (
  queryKey,
  url,
  transformData = (data) => data,
  options = {}
) => {
  const queryResult = useQuery(
    [queryKey],
    async ({ signal }) => {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const data = await response.json();
      return transformData(data);
    },
    {
      enabled: options.enabled !== false, // Disable auto-fetching if `enabled` is false
      ...options,
    }
  );

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};

export default useFetchData;