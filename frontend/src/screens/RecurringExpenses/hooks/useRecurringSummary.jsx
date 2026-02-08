import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../../components/commons/Consts/constants";
import { recurringSummaryKey } from "../../../components/features/RecurringExpenes/hooks/useRecurringData";

const EMPTY = Object.freeze({
  expenses: [],
  forecast: [],
  nextBills: [],
  meta: { sum3: { min: 0, max: 0, paid: 0 } },
});



export function useRecurringSummary({ filter, months = 12, enabled = true }) {
  return useQuery({
    queryKey: recurringSummaryKey(filter, months),
    enabled,
    queryFn: async () => {
      const url = `${API_URL}/api/recurring-expenses/summary?filter=${encodeURIComponent(
        filter,
      )}&months=${months}`;
      const res = await axios.get(url);
      return res.data;
    },

    // ✅ Shape data here (so screen has fewer memos and ?? fallbacks)
    select: (raw) => {
      const d = raw ?? EMPTY;
      return {
        expenses: Array.isArray(d.expenses) ? d.expenses : [],
        forecast: Array.isArray(d.forecast) ? d.forecast : [],
        nextBills: Array.isArray(d.nextBills) ? d.nextBills : [],
        sum3: d?.meta?.sum3 ?? { min: 0, max: 0, paid: 0 },
      };
    },

    placeholderData: EMPTY,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
