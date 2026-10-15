import { useQuery } from "@tanstack/react-query";

/**
 * Server-side search for shops.
 * Requires API support: GET /api/shops?query=xxx&limit=20
 */
export const useShopSearch = ({ open, query, sendRequest }) => {
  const q = (query ?? "").trim();
  const enabled = open && q.length >= 2;

  return useQuery({
    queryKey: ["shops", "search", q],
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // keep previous while typing
    queryFn: async () => {
      const { data, error } = await sendRequest(
        `/api/shops?query=${encodeURIComponent(q)}&limit=20`,
        "GET"
      );
      if (error) throw error;

      const shops = Array.isArray(data?.shops)
        ? data.shops
        : Array.isArray(data)
        ? data
        : [];

      return shops;
    },
  });
};

