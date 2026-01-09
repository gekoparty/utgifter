import { useQuery } from "@tanstack/react-query";

export function useProductInsights(productId, includeDiscounts) {
  return useQuery({
    queryKey: ["stats", "productInsights", productId, includeDiscounts],
    queryFn: async () => {
      const r = await fetch(
        `/api/stats/product-insights?productId=${productId}&includeDiscounts=${includeDiscounts}`
      );
      if (!r.ok) throw new Error("Network response was not ok");
      return r.json();
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
