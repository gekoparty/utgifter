import { useQuery } from "@tanstack/react-query";

// Only enrich the SMALL returned list
const enrichShopsWithLocationsSmall = async (shops, sendRequest) => {
  const ids = [...new Set(shops.map((s) => s.location).filter(Boolean).map(String))];
  if (!ids.length) return shops;

  const { data, error } = await sendRequest(`/api/locations?ids=${ids.join(",")}`, "GET");
  if (error) throw error;

  const locations = Array.isArray(data?.locations)
    ? data.locations
    : Array.isArray(data)
    ? data
    : [];

  const map = locations.reduce((acc, loc) => {
    if (loc?._id) acc[String(loc._id)] = loc.name;
    return acc;
  }, {});

  return shops.map((s) => ({
    ...s,
    locationName: map[String(s.location)] || s.locationName || "N/A",
  }));
};

/**
 * Server-side search for shops.
 * Requires API support: GET /api/shops?query=xxx&limit=20
 * If backend already includes locationName, remove enrichment call.
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

      // If backend already returns locationName, you can just return shops.
      return enrichShopsWithLocationsSmall(shops, sendRequest);
    },
  });
};

