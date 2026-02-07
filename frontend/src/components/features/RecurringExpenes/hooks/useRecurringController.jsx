import { useCallback, useMemo, useState } from "react";

export const useRecurringController = () => {
  const [filter, setFilter] = useState("ALL");
  const [tab, setTab] = useState(0); // 0 totals, 1 estimate range

  const [monthDrawerOpen, setMonthDrawerOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  // Dialog scaffold
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("ADD"); // ADD | EDIT | DELETE
  const [expenseTarget, setExpenseTarget] = useState(null);

  const openMonth = useCallback((key) => {
    setSelectedMonthKey(key);
    setMonthDrawerOpen(true);
  }, []);

  const closeMonth = useCallback(() => setMonthDrawerOpen(false), []);

  const openAdd = useCallback(() => {
    setDialogMode("ADD");
    setExpenseTarget(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((exp) => {
    setDialogMode("EDIT");
    setExpenseTarget(exp);
    setDialogOpen(true);
  }, []);

  const openDelete = useCallback((exp) => {
    setDialogMode("DELETE");
    setExpenseTarget(exp);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  return useMemo(
    () => ({
      filter,
      setFilter,
      tab,
      setTab,

      monthDrawerOpen,
      selectedMonthKey,
      openMonth,
      closeMonth,

      dialogOpen,
      dialogMode,
      expenseTarget,
      openAdd,
      openEdit,
      openDelete,
      closeDialog,
    }),
    [
      filter,
      tab,
      monthDrawerOpen,
      selectedMonthKey,
      openMonth,
      closeMonth,
      dialogOpen,
      dialogMode,
      expenseTarget,
      openAdd,
      openEdit,
      openDelete,
      closeDialog,
    ],
  );
};