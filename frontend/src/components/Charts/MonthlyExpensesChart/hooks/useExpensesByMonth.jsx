import { useQuery } from "@tanstack/react-query";

export function useExpensesByMonthSummary({ year, compare }) {
  return useQuery({
    queryKey: ["stats", "expensesByMonthSummary", year, compare],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      params.set("compare", compare ? "1" : "0");

      const r = await fetch(`/api/stats/expenses-by-month-summary?${params.toString()}`);
      if (!r.ok) throw new Error("Failed to load expenses-by-month summary");
      return r.json();
    },
    staleTime: 60_000,
  });
}

