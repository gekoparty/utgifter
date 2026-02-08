import { useCallback, useMemo, useState } from "react";

const toISODate = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return new Date().toISOString().slice(0, 10);
  return x.toISOString().slice(0, 10);
};

const toPeriodKey = (d) => {
  // returns YYYY-MM
  if (!d) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  if (typeof d === "string" && /^\d{4}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Expects MonthDrawer to pass an item shaped like buildSummary():
 * {
 *   recurringExpenseId, title, status, periodKey,
 *   expected: { min/max/fixed },
 *   actual: { paymentId, amount, paidDate, ... } | null
 * }
 */
export function usePayDialog() {
  const [open, setOpen] = useState(false);

  // draft includes immutable identifiers + original periodKey in edit-mode
  const [draft, setDraft] = useState(null);

  // editable fields
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(toISODate());
  const [periodKey, setPeriodKey] = useState(toPeriodKey());
  const [error, setError] = useState("");

  const mode = useMemo(() => (draft?.paymentId ? "EDIT" : "CREATE"), [draft]);

  const openDialog = useCallback((item) => {
    const isPaid = item?.status === "PAID" && Boolean(item?.actual);

    const expectedDefault =
      item?.expected?.max ?? item?.expected?.fixed ?? item?.expected?.min ?? 0;

    const paymentIdRaw = item?.actual?.paymentId;
    const paymentId = isPaid && paymentIdRaw ? String(paymentIdRaw) : null;

    const pk = item?.periodKey ? String(item.periodKey) : toPeriodKey(new Date());
    const pd = toISODate(isPaid ? item?.actual?.paidDate : new Date());

    setDraft({
      recurringExpenseId: item?.recurringExpenseId,
      title: item?.title,
      paymentId,
      // remember original month when editing
      originalPeriodKey: paymentId ? pk : null,
    });

    setAmount(String(Number(isPaid ? item?.actual?.amount : expectedDefault) || 0));
    setPaidDate(pd);
    setPeriodKey(pk);
    setError("");
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setDraft(null);
    setAmount("");
    setPaidDate(toISODate());
    setPeriodKey(toPeriodKey());
    setError("");
  }, []);

  return {
    open,
    draft,
    mode,

    amount,
    paidDate,
    periodKey,

    error,

    setAmount,
    setPaidDate,
    setPeriodKey,
    setError,

    openDialog,
    closeDialog,
  };
}
