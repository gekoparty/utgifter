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

/**
 * Loads BOTH history + future timeline.
 *
 * pastMonths = months of history
 * months     = months of forecast
 */
export function useRecurringSummary({
  filter,
  months = 12,
  pastMonths = 12, // ⭐ NEW DEFAULT
  enabled = true,
}) {
  return useQuery({
    queryKey: recurringSummaryKey(filter, months, pastMonths),

    enabled,

    queryFn: async () => {
      const url =
        `${API_URL}/api/recurring-expenses/summary` +
        `?filter=${encodeURIComponent(filter)}` +
        `&months=${months}` +
        `&pastMonths=${pastMonths}`;   // ⭐ NEW PARAM

      const res = await axios.get(url);
      return res.data;
    },

    // Shape data for screen
    select: (raw) => {
      const d = raw ?? EMPTY;

      return {
        expenses: Array.isArray(d.expenses) ? d.expenses : [],
        forecast: Array.isArray(d.forecast) ? d.forecast : [],
        nextBills: Array.isArray(d.nextBills) ? d.nextBills : [],
        sum3: d?.meta?.sum3 ?? { min: 0, max: 0, paid: 0 },
        meta: d?.meta ?? {},
      };
    },

    placeholderData: EMPTY,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
