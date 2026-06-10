import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../../commons/Consts/constants";

export function useExpensesByMonthSummary({ year, compare }) {
  return useQuery({
    queryKey: ["stats", "expensesByMonthSummary", year, compare],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      params.set("compare", compare ? "1" : "0");

      const url = new URL(
        "/api/stats/expenses-by-month-summary",
        API_URL || window.location.origin
      );
      url.search = params.toString();

      const r = await fetch(url.toString());
      if (!r.ok) throw new Error("Failed to load expenses-by-month summary");
      return r.json();
    },
    staleTime: 60_000,
  });
}

