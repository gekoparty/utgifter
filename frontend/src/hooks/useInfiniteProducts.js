import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const useInfiniteProducts = (globalFilter) => {
  const queryKey = useMemo(() => ['products', globalFilter], [globalFilter]);

  const fetchProducts = async ({ pageParam = 0 }) => {
    const response = await fetch(
      `/api/products?globalFilter=${encodeURIComponent(globalFilter || '')}&start=${pageParam}&size=10`
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Fetch error:', errorMessage);
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Invalid JSON response');
    }
  };

  const getNextPageParam = (lastPage, pages) => {
    const totalItems = lastPage?.meta?.totalRowCount ?? 0;
    const loadedItems = pages.reduce((acc, page) => acc + (page.products?.length || 0), 0);
    return loadedItems < totalItems ? loadedItems : undefined;
  };

  return useInfiniteQuery({
    queryKey,
    queryFn: fetchProducts,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    keepPreviousData: true,
    useErrorBoundary: true, // Improve React 18 error handling
  });
};

export default useInfiniteProducts;