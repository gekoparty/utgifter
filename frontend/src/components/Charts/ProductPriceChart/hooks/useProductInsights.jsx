// src/components/Charts/ProductPriceChart/hooks/useProductInsights.js
import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, requestJson } from "../../../../api/httpClient";

export function useProductInsights(productId, includeDiscounts, variantIds = []) {
  const normalizedVariantIds = Array.isArray(variantIds)
    ? [...new Set(variantIds.map(String).filter(Boolean))].sort()
    : [];

  return useQuery({
    queryKey: ["stats", "productInsights", productId, includeDiscounts, normalizedVariantIds],
    queryFn: async ({ signal }) => {
      const url = buildApiUrl("/api/stats/product-insights");
      url.searchParams.set("productId", productId);
      url.searchParams.set("includeDiscounts", String(includeDiscounts));
      if (normalizedVariantIds.length) {
        url.searchParams.set("variantIds", normalizedVariantIds.join(","));
      }

      return requestJson(url, { signal });
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
