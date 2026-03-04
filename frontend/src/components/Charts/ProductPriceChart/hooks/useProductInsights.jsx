// src/components/Charts/ProductPriceChart/hooks/useProductInsights.js
import { useQuery } from "@tanstack/react-query";

export function useProductInsights(productId, includeDiscounts, variantIds = []) {
  return useQuery({
    queryKey: ["stats", "productInsights", productId, includeDiscounts, variantIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("productId", productId);
      params.set("includeDiscounts", String(includeDiscounts));
      if (Array.isArray(variantIds) && variantIds.length) {
        params.set("variantIds", variantIds.join(","));
      }

      const r = await fetch(`/api/stats/product-insights?${params.toString()}`);
      if (!r.ok) throw new Error("Network response was not ok");
      return r.json();
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}