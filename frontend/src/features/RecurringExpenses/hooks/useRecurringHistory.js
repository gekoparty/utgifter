import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, requestJson } from "../../../api/httpClient";

export function useRecurringHistory({ from, to }) {
  return useQuery({
    queryKey: ["recurring-history", from, to],
    queryFn: async ({ signal }) => {
      const url = buildApiUrl("/api/recurring-payments/history");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      return requestJson(url, { signal });
    },
  });
}
