// src/components/Charts/ProductPriceChart/hooks/useProductInsights.js
import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, requestJson } from "../../../../api/httpClient";

export function useProductInsights(productId, includeDiscounts, variantIds = []) {
  return useQuery({
    queryKey: ["stats", "productInsights", productId, includeDiscounts, variantIds],
    queryFn: async ({ signal }) => {
      const url = buildApiUrl("/api/stats/product-insights");
      url.searchParams.set("productId", productId);
      url.searchParams.set("includeDiscounts", String(includeDiscounts));
      if (Array.isArray(variantIds) && variantIds.length) {
        url.searchParams.set("variantIds", variantIds.join(","));
      }

      return requestJson(url, { signal });
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
