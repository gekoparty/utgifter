import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";

export const RECURRING_EXPENSES_QUERY_KEY = ["recurring-expenses"];
export const RECURRING_EXPENSES_SUMMARY_ROOT_KEY = ["recurring-expenses-summary"];

// ✅ include pastMonths in key (VERY important)
export const recurringSummaryKey = (filter, months, pastMonths) => [
  ...RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
  String(filter || "ALL"),
  Number(months || 12),
  Number(pastMonths || 0),
];

export const useRecurringInvalidation = () => {
  const qc = useQueryClient();

  const invalidateTemplates = useCallback(() => {
    qc.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
  }, [qc]);

  const invalidateSummary = useCallback(() => {
    qc.invalidateQueries({ queryKey: RECURRING_EXPENSES_SUMMARY_ROOT_KEY });
  }, [qc]);

  const invalidateAllRecurring = useCallback(() => {
    invalidateTemplates();
    invalidateSummary();
  }, [invalidateTemplates, invalidateSummary]);

  return { invalidateTemplates, invalidateSummary, invalidateAllRecurring };
};

const normalizeRecurring = (x) => {
  if (!x) return null;

  const id = x._id || x.id;
  const type = x.type === "HOUSING" ? "MORTGAGE" : x.type;

  const dueDate =
    x.dueDate ||
    (x.dueDay
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          Math.min(28, Math.max(1, Number(x.dueDay))),
        )
          .toISOString()
          .slice(0, 10)
      : null);

  const monthlyPayment = x.monthlyPayment ?? x.amount ?? x.total ?? 0;

  const estimate =
    x.estimate ||
    (x.estimateMin != null || x.estimateMax != null
      ? { min: Number(x.estimateMin || 0), max: Number(x.estimateMax || 0) }
      : undefined);

  return { ...x, id, type, dueDate, monthlyPayment, estimate };
};

export const useRecurringData = ({ enabled = true } = {}) => {
  const { sendRequest } = useCustomHttp("", { auto: false });

  const query = useQuery({
    queryKey: RECURRING_EXPENSES_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await sendRequest("/api/recurring-expenses", "GET");
      if (error) {
        throw new Error(error.message || "Kunne ikke hente faste kostnader");
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.recurringExpenses)
          ? data.recurringExpenses
          : Array.isArray(data?.expenses)
            ? data.expenses
            : [];

      return list.map(normalizeRecurring).filter(Boolean);
    },
    staleTime: 30_000,
  });

  const expenses = useMemo(() => query.data ?? [], [query.data]);

  return {
    expenses,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
