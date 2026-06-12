import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, requestJson } from "../../../api/httpClient";
import {
  recurringSummaryKey,
  DEFAULT_PAST_MONTHS,
} from "./useRecurringData";

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
  pastMonths = DEFAULT_PAST_MONTHS, // ✅ shared default
  enabled = true,
}) {
  const normalizedFilter = String(filter || "ALL").toUpperCase();
  const normalizedMonths = Number(months || 12);
  const normalizedPast = Number(pastMonths || 0);

  return useQuery({
    queryKey: recurringSummaryKey(normalizedFilter, normalizedMonths, normalizedPast),

    enabled,

    queryFn: async ({ signal }) => {
      const url = buildApiUrl("/api/recurring-expenses/summary");
      url.searchParams.set("filter", normalizedFilter);
      url.searchParams.set("months", String(normalizedMonths));
      url.searchParams.set("pastMonths", String(normalizedPast));

      return requestJson(url, { signal });
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
