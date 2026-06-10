// src/components/Charts/ProductPriceChart/hooks/useProductInsights.js
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../../commons/Consts/constants";

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

      const url = new URL(
        "/api/stats/product-insights",
        API_URL || window.location.origin
      );
      url.search = params.toString();

      const r = await fetch(url.toString());
      if (!r.ok) throw new Error("Network response was not ok");
      return r.json();
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
