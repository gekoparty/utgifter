import { useCallback, useState } from "react";

import { recurringApi } from "../api/recurringApi";
import { mortgageApi } from "../api/mortgageApi";

export function useRecurringMaintenanceActions({
  invalidateSummary,
  invalidateTemplates,
}) {
  const [purgeOpen, setPurgeOpen] = useState(false);

  const invalidateRecurring = useCallback(() => {
    invalidateSummary();
    invalidateTemplates();
  }, [invalidateSummary, invalidateTemplates]);

  const doPurgeAll = useCallback(async () => {
    await recurringApi.purgeAll();
    setPurgeOpen(false);
    invalidateRecurring();
  }, [invalidateRecurring]);

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsItem, setTermsItem] = useState(null);
  const [termsPk, setTermsPk] = useState("");

  const openTerms = useCallback((item, monthKey) => {
    setTermsItem(item);
    setTermsPk(monthKey);
    setTermsOpen(true);
  }, []);

  const closeTerms = useCallback(() => {
    setTermsOpen(false);
    setTermsItem(null);
    setTermsPk("");
  }, []);

  const submitTerms = useCallback(
    async (payload) => {
      if (!termsItem?.recurringExpenseId) return;
      await recurringApi.setTermsFromMonth(
        termsItem.recurringExpenseId,
        payload,
      );
      closeTerms();
      invalidateRecurring();
    },
    [termsItem, closeTerms, invalidateRecurring],
  );

  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseMode, setPauseMode] = useState("CREATE");
  const [pauseItem, setPauseItem] = useState(null);
  const [pauseInitial, setPauseInitial] = useState(null);

  const openPauseCreate = useCallback((item, monthKey) => {
    setPauseMode("CREATE");
    setPauseItem(item);
    setPauseInitial({ from: monthKey, to: monthKey, note: "" });
    setPauseOpen(true);
  }, []);

  const openPauseEdit = useCallback((item, range) => {
    setPauseMode("EDIT");
    setPauseItem(item);
    setPauseInitial(
      range || { from: item.periodKey, to: item.periodKey, note: "" },
    );
    setPauseOpen(true);
  }, []);

  const closePause = useCallback(() => {
    setPauseOpen(false);
    setPauseItem(null);
    setPauseInitial(null);
  }, []);

  const submitPause = useCallback(
    async (payload) => {
      if (!pauseItem) return;

      if (pauseMode === "EDIT") {
        if (!pauseItem.pauseId) return;
        await recurringApi.updatePause(
          pauseItem.recurringExpenseId,
          pauseItem.pauseId,
          payload,
        );
      } else {
        await recurringApi.createPause(pauseItem.recurringExpenseId, payload);
      }

      closePause();
      invalidateRecurring();
    },
    [pauseItem, pauseMode, closePause, invalidateRecurring],
  );

  const unpause = useCallback(
    async (item) => {
      if (!item?.recurringExpenseId || !item?.pauseId) return;
      await recurringApi.deletePause(item.recurringExpenseId, item.pauseId);
      invalidateRecurring();
    },
    [invalidateRecurring],
  );

  const archiveExpense = useCallback(
    async (id) => {
      if (!id) return;
      await recurringApi.archiveExpense(String(id));
      invalidateRecurring();
    },
    [invalidateRecurring],
  );

  const restoreExpense = useCallback(
    async (id) => {
      if (!id) return;
      await recurringApi.restoreExpense(String(id));
      invalidateRecurring();
    },
    [invalidateRecurring],
  );

  const hardDeleteMortgage = useCallback(
    async (mortgageId) => {
      if (!mortgageId) return;
      await mortgageApi.hardDelete({ mortgageId: String(mortgageId) });
      invalidateRecurring();
    },
    [invalidateRecurring],
  );

  const purgeMortgages = useCallback(async () => {
    await mortgageApi.purgeAllMortgages();
    invalidateRecurring();
  }, [invalidateRecurring]);

  return {
    purgeOpen,
    setPurgeOpen,
    doPurgeAll,
    termsOpen,
    termsItem,
    termsPk,
    openTerms,
    closeTerms,
    submitTerms,
    pauseOpen,
    pauseMode,
    pauseInitial,
    openPauseCreate,
    openPauseEdit,
    closePause,
    submitPause,
    unpause,
    archiveExpense,
    restoreExpense,
    hardDeleteMortgage,
    purgeMortgages,
  };
}
