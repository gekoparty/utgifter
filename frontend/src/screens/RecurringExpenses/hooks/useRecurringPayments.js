import { useMemo } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { API_URL } from "../../../components/commons/Consts/constants";
import { useRecurringInvalidation } from "../../../components/features/RecurringExpenes/hooks/useRecurringData";

export function useRecurringPayments() {
  const { invalidateSummary } = useRecurringInvalidation();

  const createPayment = useMutation({
    mutationFn: async ({
      recurringExpenseId,
      periodKey,
      amount,
      paidDate,
      kind = "MAIN",
      status,
      note = "",
    }) => {
      const url = `${API_URL}/api/recurring-payments`;

      const normalizedKind = String(kind || "MAIN").toUpperCase();
      const normalizedStatus =
        normalizedKind === "EXTRA"
          ? "EXTRA"
          : String(status || "PAID").toUpperCase();

      const payload = {
        recurringExpenseId,
        periodKey,
        amount: Number(amount || 0),
        paidDate: paidDate
          ? new Date(paidDate).toISOString()
          : new Date().toISOString(),
        kind: normalizedKind,
        status: normalizedStatus,
        note: String(note || "").trim(),
      };

      const res = await axios.post(url, payload);
      return res.data;
    },
    onSuccess: () => invalidateSummary(),
  });

  const updatePayment = useMutation({
    mutationFn: async ({
      paymentId,
      amount,
      paidDate,
      kind = "MAIN",
      status,
      note = "",
    }) => {
      const url = `${API_URL}/api/recurring-payments/${paymentId}`;

      const normalizedKind = String(kind || "MAIN").toUpperCase();
      const normalizedStatus =
        normalizedKind === "EXTRA"
          ? "EXTRA"
          : String(status || "PAID").toUpperCase();

      const payload = {
        amount: Number(amount || 0),
        paidDate: new Date(paidDate).toISOString(),
        status: normalizedStatus,
        note: String(note || "").trim(),
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

  const pending =
    createPayment.isPending ||
    updatePayment.isPending ||
    deletePayment.isPending;

  const error =
    createPayment.error ||
    updatePayment.error ||
    deletePayment.error ||
    null;

  return useMemo(
    () => ({
      createPayment,
      updatePayment,
      deletePayment,
      pending,
      error,
    }),
    [createPayment, updatePayment, deletePayment, pending, error]
  );
}
