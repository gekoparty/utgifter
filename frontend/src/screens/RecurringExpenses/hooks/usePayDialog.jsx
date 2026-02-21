import { useCallback, useMemo, useState } from "react";

const toISODate = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return new Date().toISOString().slice(0, 10);
  return x.toISOString().slice(0, 10);
};

const toPeriodKey = (d) => {
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

export function usePayDialog() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(toISODate());
  const [periodKey, setPeriodKey] = useState(toPeriodKey());
  const [error, setError] = useState("");

  // ✅ extra payment toggle state (UI)
  const [isExtra, setIsExtra] = useState(false);

  const mode = useMemo(() => (draft?.paymentId ? "EDIT" : "CREATE"), [draft]);
  const allowExtra = useMemo(() => Boolean(draft?.isMortgage), [draft]);

  const openDialog = useCallback((item) => {
    const desiredKind = String(item?.paymentKind || "MAIN").toUpperCase(); // MAIN | EXTRA
    const isMortgage = String(item?.type || "").toUpperCase() === "MORTGAGE";
    const pk = item?.periodKey ? String(item.periodKey) : toPeriodKey(new Date());

    // ✅ choose which payment object to edit
    const actualObj = desiredKind === "EXTRA" ? item?.extraPayment : item?.actual;

    const hasPayment = Boolean(actualObj?.paymentId);
    const paymentId = hasPayment ? String(actualObj.paymentId) : null;

    const expectedDefault =
      item?.expected?.max ?? item?.expected?.fixed ?? item?.expected?.min ?? 0;

    const startingAmount = hasPayment ? Number(actualObj.amount || 0) : Number(expectedDefault || 0);
    const startingPaidDate = hasPayment ? toISODate(actualObj.paidDate) : toISODate(new Date());

    setDraft({
      recurringExpenseId: item?.recurringExpenseId,
      title: item?.title,
      type: item?.type,
      isMortgage,
      paymentId,
      paymentKind: desiredKind, // MAIN | EXTRA
      originalPeriodKey: paymentId ? pk : null,
    });

    setAmount(String(Number(startingAmount) || 0));
    setPaidDate(startingPaidDate);
    setPeriodKey(pk);

    // ✅ checkbox follows the kind we opened
    setIsExtra(isMortgage && desiredKind === "EXTRA");

    setError("");
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setDraft(null);
    setAmount("");
    setPaidDate(toISODate());
    setPeriodKey(toPeriodKey());
    setIsExtra(false);
    setError("");
  }, []);

  return {
    open,
    draft,
    mode,

    amount,
    paidDate,
    periodKey,

    isExtra,
    allowExtra,

    error,

    setAmount,
    setPaidDate,
    setPeriodKey,
    setIsExtra,
    setError,

    openDialog,
    closeDialog,
  };
}