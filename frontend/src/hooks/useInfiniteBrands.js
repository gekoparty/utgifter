import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { API_URL } from '../components/commons/Consts/constants';

const buildApiUrl = (globalFilter, pageParam) =>
  `${API_URL}/api/brands?globalFilter=${encodeURIComponent(globalFilter || '')}&start=${pageParam}&size=10`;

const useInfiniteBrands = (globalFilter) => {
  const queryKey = useMemo(() => ['brands', globalFilter], [globalFilter]);

  const fetchBrands = async ({ pageParam = 0, signal }) => {
    const response = await fetch(buildApiUrl(globalFilter, pageParam), { signal });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Fetch error:', errorMessage);
      throw new Error(`Failed to fetch brands: ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Invalid JSON response');
    }
  };

  const getNextPageParam = (lastPage, pages) => {
    if (!lastPage || !lastPage.meta) return undefined;
    const totalItems = lastPage.meta.totalRowCount || 0;
    const loadedItems = pages.reduce((acc, page) => acc + (page.brands?.length || 0), 0);
    return loadedItems < totalItems ? loadedItems : undefined;
  };

  return useInfiniteQuery({
    queryKey,
    queryFn: fetchBrands,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    keepPreviousData: true,
    placeholderData: (oldData) => oldData, // Keep old data as placeholder
    onError: (error) => {
      console.error("Infinite query error:", error);
    },
  });
};

export default useInfiniteBrands;
