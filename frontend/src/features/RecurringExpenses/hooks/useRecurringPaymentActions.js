import { useCallback } from "react";

const isPeriodKey = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

export function useRecurringPaymentActions({ payDialog, payments }) {
  const {
    draft,
    mode,
    amount,
    paidDate,
    periodKey,
    isExtra,
    allowExtra,
    setAmount,
    setPaidDate,
    setPeriodKey,
    setIsExtra,
    setError,
    closeDialog,
  } = payDialog;

  const clearAmountError = useCallback(() => setError(""), [setError]);

  const onAmount = useCallback(
    (value) => {
      setAmount(value);
      clearAmountError();
    },
    [setAmount, clearAmountError],
  );

  const onPaidDate = useCallback(
    (value) => {
      setPaidDate(value);
      clearAmountError();
    },
    [setPaidDate, clearAmountError],
  );

  const onPeriodKey = useCallback(
    (value) => {
      setPeriodKey(value);
      clearAmountError();
    },
    [setPeriodKey, clearAmountError],
  );

  const onIsExtra = useCallback(
    (value) => {
      setIsExtra(Boolean(value));
      clearAmountError();
    },
    [setIsExtra, clearAmountError],
  );

  const confirmPay = useCallback(async () => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setError("Ugyldig beløp");
      return;
    }

    if (!draft?.recurringExpenseId) {
      setError("Mangler recurringExpenseId");
      return;
    }

    if (!periodKey || !isPeriodKey(periodKey)) {
      setError("Ugyldig måned (YYYY-MM)");
      return;
    }

    if (!paidDate) {
      setError("Mangler betalt dato");
      return;
    }

    const nextKind = allowExtra && isExtra ? "EXTRA" : "MAIN";
    const nextStatus = nextKind === "EXTRA" ? "EXTRA" : "PAID";

    if (mode === "EDIT") {
      if (!draft?.paymentId) {
        setError("Mangler paymentId");
        return;
      }

      const originalPeriodKey = String(draft.originalPeriodKey || "");
      const originalKind = String(draft.paymentKind || "MAIN").toUpperCase();
      const periodChanged =
        Boolean(originalPeriodKey) && originalPeriodKey !== periodKey;
      const kindChanged = originalKind !== nextKind;

      if (periodChanged || kindChanged) {
        try {
          await payments.createPayment.mutateAsync({
            recurringExpenseId: draft.recurringExpenseId,
            periodKey,
            amount: numericAmount,
            paidDate,
            kind: nextKind,
            status: nextStatus,
          });

          await payments.deletePayment.mutateAsync({
            paymentId: draft.paymentId,
          });

          closeDialog();
          return;
        } catch {
          setError(
            periodChanged && kindChanged
              ? "Kunne ikke flytte og endre betalingstypen"
              : periodChanged
                ? "Kunne ikke flytte betalingen"
                : "Kunne ikke endre betalingstypen",
          );
          return;
        }
      }

      payments.updatePayment.mutate(
        {
          paymentId: draft.paymentId,
          amount: numericAmount,
          paidDate,
          kind: nextKind,
          status: nextStatus,
        },
        {
          onSuccess: () => closeDialog(),
          onError: () => setError("Kunne ikke oppdatere betalingen"),
        },
      );
      return;
    }

    payments.createPayment.mutate(
      {
        recurringExpenseId: draft.recurringExpenseId,
        periodKey,
        amount: numericAmount,
        paidDate,
        kind: nextKind,
        status: nextStatus,
      },
      {
        onSuccess: () => closeDialog(),
        onError: () => setError("Kunne ikke opprette betalingen"),
      },
    );
  }, [
    amount,
    draft,
    paidDate,
    periodKey,
    mode,
    allowExtra,
    isExtra,
    payments,
    closeDialog,
    setError,
  ]);

  const deletePay = useCallback(() => {
    if (!draft?.paymentId) {
      setError("Mangler paymentId");
      return;
    }

    payments.deletePayment.mutate(
      { paymentId: draft.paymentId },
      {
        onSuccess: () => closeDialog(),
        onError: () => setError("Kunne ikke slette betalingen"),
      },
    );
  }, [draft, payments, closeDialog, setError]);

  return {
    confirmPay,
    deletePay,
    onAmount,
    onPaidDate,
    onPeriodKey,
    onIsExtra,
  };
}
