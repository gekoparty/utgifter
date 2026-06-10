import { useQuery } from "@tanstack/react-query";

/**
 * Fetch ONLY the brands that belong to the selected product (by ids).
 * Requires API support: GET /api/brands?ids=id1,id2,id3
 */
export const useBrandsForSelectedProduct = ({ open, selectedProduct, sendRequest }) => {
  const ids = Array.isArray(selectedProduct?.brands)
    ? selectedProduct.brands.filter(Boolean).map(String)
    : [];

  const enabled = open && ids.length > 0;

  return useQuery({
    queryKey: ["brands", "byIds", ids.slice().sort().join(",")],
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sendRequest(`/api/brands?ids=${ids.join(",")}`, "GET");
      if (error) throw error;

      // support either {brands: []} or plain []
      if (Array.isArray(data?.brands)) return data.brands;
      if (Array.isArray(data)) return data;
      return [];
    },
  });
};

/**
 * Optional UX: show a small list before product is selected.
 * Requires API: GET /api/brands/recent?limit=20
 * If you don't have it, you can remove this and keep it empty.
 */
export const useRecentBrands = ({ open, sendRequest }) => {
  return useQuery({
    queryKey: ["brands", "recent"],
    enabled: open,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sendRequest(`/api/brands/recent?limit=20`, "GET");
      if (error) throw error;
      if (Array.isArray(data?.brands)) return data.brands;
      if (Array.isArray(data)) return data;
      return [];
    },
  });
};
