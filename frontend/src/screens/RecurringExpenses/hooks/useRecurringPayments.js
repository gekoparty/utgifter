import { useMemo } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { API_URL } from "../../../components/commons/Consts/constants";
import { useRecurringInvalidation } from "../../../components/features/RecurringExpenes/hooks/useRecurringData";

/**
 * Single place for RecurringPayment mutations.
 * Keeps screens "visual".
 *
 * Requires backend:
 * - POST /api/recurring-payments
 * - PUT /api/recurring-payments/:id
 * - DELETE /api/recurring-payments/:id
 */
export function useRecurringPayments() {
  const { invalidateSummary } = useRecurringInvalidation();

  const createPayment = useMutation({
    mutationFn: async ({ recurringExpenseId, periodKey, amount, paidDate }) => {
      const url = `${API_URL}/api/recurring-payments`;
      const payload = {
        recurringExpenseId,
        periodKey,
        amount: Number(amount || 0),
        paidDate: paidDate ? new Date(paidDate).toISOString() : new Date().toISOString(),
        status: "PAID",
      };
      const res = await axios.post(url, payload);
      return res.data;
    },
    onSuccess: () => invalidateSummary(),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ paymentId, amount, paidDate }) => {
      const url = `${API_URL}/api/recurring-payments/${paymentId}`;
      const payload = {
        amount: Number(amount || 0),
        paidDate: new Date(paidDate).toISOString(),
        status: "PAID",
      };
      const res = await axios.put(url, payload);
      return res.data;
    },
    onSuccess: () => invalidateSummary(),
  });

  const deletePayment = useMutation({
    mutationFn: async ({ paymentId }) => {
      const url = `${API_URL}/api/recurring-payments/${paymentId}`;
      const res = await axios.delete(url);
      return res.data;
    },
    onSuccess: () => invalidateSummary(),
  });

  const pending = createPayment.isPending || updatePayment.isPending || deletePayment.isPending;
  const error = createPayment.isError || updatePayment.isError || deletePayment.isError;

  return useMemo(
    () => ({
      createPayment,
      updatePayment,
      deletePayment,
      pending,
      error,
    }),
    [createPayment, updatePayment, deletePayment, pending, error],
  );
}
