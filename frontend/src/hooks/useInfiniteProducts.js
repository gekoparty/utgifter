// hooks/useInfiniteProducts.js
import { useInfiniteQuery } from '@tanstack/react-query';

const fetchProducts = async ({ pageParam = 0, queryKey }) => {
  const [, globalFilter] = queryKey;
  const response = await fetch(
    `/api/products?globalFilter=${globalFilter || ''}&start=${pageParam}&size=10`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch products`);
  }
  return response.json();
};

const useInfiniteProducts = (globalFilter) => {
  return useInfiniteQuery({
    queryKey: ['products', globalFilter],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, pages) => {
      const totalItems = lastPage.meta?.totalRowCount || 0;
      const loadedItems = pages.flatMap(page => page.products).length;
      return loadedItems < totalItems ? loadedItems : undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    keepPreviousData: true
  });
};

export default useInfiniteProducts;