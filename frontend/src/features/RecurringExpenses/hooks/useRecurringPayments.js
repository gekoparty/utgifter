import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestJson } from "../../../api/httpClient";
import { useRecurringInvalidation } from "./useRecurringData";

const toPaidDateIso = (paidDate) => {
  const date = paidDate ? new Date(paidDate) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export function useRecurringPayments() {
  const { invalidateAllRecurring } = useRecurringInvalidation();

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
      const normalizedKind = String(kind || "MAIN").toUpperCase();
      const normalizedStatus =
        normalizedKind === "EXTRA"
          ? "EXTRA"
          : String(status || "PAID").toUpperCase();

      const payload = {
        recurringExpenseId,
        periodKey,
        amount: Number(amount || 0),
        paidDate: toPaidDateIso(paidDate),
        kind: normalizedKind,
        status: normalizedStatus,
        note: String(note || "").trim(),
      };

      return requestJson("/api/recurring-payments", {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: () => invalidateAllRecurring(),
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
      const normalizedKind = String(kind || "MAIN").toUpperCase();
      const normalizedStatus =
        normalizedKind === "EXTRA"
          ? "EXTRA"
          : String(status || "PAID").toUpperCase();

      const payload = {
        amount: Number(amount || 0),
        paidDate: toPaidDateIso(paidDate),
        status: normalizedStatus,
        note: String(note || "").trim(),
      };

      return requestJson(`/api/recurring-payments/${paymentId}`, {
        method: "PUT",
        data: payload,
      });
    },
    onSuccess: () => invalidateAllRecurring(),
  });

  const deletePayment = useMutation({
    mutationFn: async ({ paymentId }) => {
      return requestJson(`/api/recurring-payments/${paymentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => invalidateAllRecurring(),
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
