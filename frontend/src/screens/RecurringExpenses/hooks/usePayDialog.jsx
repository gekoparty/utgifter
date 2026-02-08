import { useCallback, useState } from "react";

export function usePayDialog() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const openDialog = useCallback((item) => {
    const defaultAmount =
      item?.expected?.max ?? item?.expected?.fixed ?? item?.expected?.min ?? 0;

    setDraft(item);
    setAmount(String(Number(defaultAmount || 0)));
    setError("");
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setDraft(null);
    setAmount("");
    setError("");
  }, []);

  return {
    open,
    draft,
    amount,
    error,
    setAmount,
    setError,
    openDialog,
    closeDialog,
  };
}