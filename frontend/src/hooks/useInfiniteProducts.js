// hooks/useInfiniteProducts.js
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

// In your useInfiniteProducts hook, adjust cacheTime and staleTime:
const useInfiniteProducts = (globalFilter) => {
  return useInfiniteQuery(
    ['products', globalFilter],
    fetchProducts,
    {
      getNextPageParam: (lastPage, pages) => { /* ... */ },
      staleTime: 5 * 60 * 1000,  // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache data for 10 minutes
      keepPreviousData: true
    }
  );
};

export default useInfiniteProducts;