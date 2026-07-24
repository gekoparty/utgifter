import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, requestJson } from "../../../../api/httpClient";

export function useExpensesByMonthSummary({ year, compare }) {
  return useQuery({
    queryKey: ["stats", "expensesByMonthSummary", year, compare],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      params.set("compare", compare ? "1" : "0");

      const url = buildApiUrl("/api/stats/expenses-by-month-summary");
      url.search = params.toString();

      return requestJson(url);
    },
    staleTime: 60_000,
  });
}

