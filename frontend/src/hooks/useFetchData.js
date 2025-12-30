import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../components/commons/Consts/constants";

const useFetchData = (queryKey, url, transformDataProp, options = {}) => {
  const transformData = transformDataProp ?? ((data) => data);
  const stableQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  const fetchData = async ({ signal }) => {
    const fullUrl = new URL(
      url.startsWith("/") ? url.slice(1) : url,
      API_URL.endsWith("/") ? API_URL : `${API_URL}/`
    );

    const response = await fetch(fullUrl.toString(), { signal });

    if (!response.ok) {
      // Don’t read the full body unless you really need it (can be slow)
      // but this is fine if your backend sends useful text errors.
      const errorMessage = await response.text().catch(() => "");
      if (import.meta.env.DEV && errorMessage) {
        console.error(`Fetch error: ${errorMessage}`);
      }
      throw new Error(`Failed to fetch ${url} - ${response.statusText}`);
    }

    const data = await response.json();
    return transformData(data, signal);
  };

  const queryResult = useQuery({
    queryKey: stableQueryKey,
    queryFn: fetchData,
    enabled: options.enabled !== false,
    retry: options.retry ?? 3,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 10 * 60 * 1000,
    useErrorBoundary: options.useErrorBoundary ?? false,
    ...options,
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
