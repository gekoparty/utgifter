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

const useInfiniteProducts = (globalFilter) => {
  return useInfiniteQuery(
    ['products', globalFilter],
    (params) => fetchProducts({ ...params, queryKey: ['products', globalFilter] }),
    {
      getNextPageParam: (lastPage, pages) => {
        const total = lastPage.meta?.totalRowCount || 0;
        const nextPage = pages.length * 10;
        return nextPage < total ? nextPage : undefined;
      },
      // Optionally debounce or delay the query if needed
    }
  );
};

export default useInfiniteProducts;