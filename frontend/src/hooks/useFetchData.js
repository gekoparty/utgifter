import { useQuery } from '@tanstack/react-query';

const useFetchData = (queryKey, url, transformData) => {
  const { data = [], isLoading } = useQuery(
    [queryKey],
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const data = await response.json();
      return transformData ? transformData(data) : data;
    },
    { enabled: true } // Adjust as needed
  );

  return { data, isLoading };
};

export default useFetchData;