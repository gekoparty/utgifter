import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";

import { useRecurringController } from "../../components/features/RecurringExpenes/hooks/useRecurringController";
import RecurringExpenseDialog from "../../components/features/RecurringExpenes/components/RecurringExpenseDialog";
import {
  useRecurringInvalidation,
  useRecurringData,
} from "../../components/features/RecurringExpenes/hooks/useRecurringData";
import RecurringOverviewCharts from "../../components/features/RecurringExpenes/components/RecurringOverviewCharts";

import { useRecurringSummary } from "./hooks/useRecurringSummary";
import { usePayDialog } from "./hooks/usePayDialog";
import { useRecurringPayments } from "./hooks/useRecurringPayments";
import { makeCurrencyFormatter } from "./utils/recurringFormatters";
import PastMonthsSelect from "./components/PastMonthsSelect";
import HeaderBar from "./components/HeaderBar";
import FiltersSummaryCard from "./components/FiltersSummaryCard";
import ForecastSection from "./components/ForecastSection";
import NextBillsCard from "./components/NextBillsCard";
import ExpenseTemplatesSection from "./components/ExpenseTemplatesSection";
import MonthDrawer from "./components/MonthDrawer";
import PayDialog from "./components/PayDialog";

import ChangeTermsDialog from "./components/ChangeTermsDialog";
import PauseDialog from "./components/PauseDialog";
import { recurringApi } from "./api/recurringApi";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));

export default function RecurringExpenseScreen() {
  const ctrl = useRecurringController();
  const payments = useRecurringPayments();
  const { invalidateSummary, invalidateTemplates } = useRecurringInvalidation();
  const [showFinished, setShowFinished] = useState(false);

  // ✅ templates include pausePeriods (used for edit/unpause UI)
  const templates = useRecurringData({ enabled: true, includeInactive: true });

  const currencyFormatter = useMemo(() => makeCurrencyFormatter(), []);
  const formatCurrency = useCallback(
    (val) => currencyFormatter.format(Number(val || 0)),
    [currencyFormatter],
  );

  const {
    open: payDialogOpen,
    draft: payDraft,
    mode: payMode,
    amount: payAmount,
    paidDate: payPaidDate,
    periodKey: payPeriodKey,
    error: payAmountError,
    setAmount: setPayAmount,
    setPaidDate: setPayPaidDate,
    setPeriodKey: setPayPeriodKey,
    setError: setPayAmountError,
    openDialog: openPayDialog,
    closeDialog: closePayDialog,
  } = usePayDialog();

  const monthsForward = 12;

  // ✅ slider-controlled history window
  const [monthsBack, setMonthsBack] = useState(12);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useRecurringSummary({
    filter: ctrl.filter,
    months: monthsForward,
    pastMonths: monthsBack,
    enabled: true,
  });

  const { expenses, forecast, nextBills, sum3 } = data || {
    expenses: [],
    forecast: [],
    nextBills: [],
    sum3: { min: 0, max: 0, paid: 0 },
  };

  const thisMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
  const forecastPast = useMemo(
    () => (forecast || []).filter((m) => m.key < thisMonthKey),
    [forecast, thisMonthKey],
  );
  const forecastFuture = useMemo(
    () => (forecast || []).filter((m) => m.key >= thisMonthKey),
    [forecast, thisMonthKey],
  );

  const selected = useMemo(() => {
    if (!ctrl.selectedMonthKey) return null;
    return forecast.find((m) => m.key === ctrl.selectedMonthKey) ?? null;
  }, [forecast, ctrl.selectedMonthKey]);

  const maxRef = useMemo(() => {
    const vals = (forecast || []).map((x) =>
      ctrl.tab === 1 ? x.paidTotal : x.expectedMax,
    );
    return Math.max(...vals, 1) || 1;
  }, [forecast, ctrl.tab]);

  const onFilter = useCallback((f) => ctrl.setFilter(f), [ctrl.setFilter]);
  const onTab = useCallback((v) => ctrl.setTab(v), [ctrl.setTab]);
  const onOpenMonth = useCallback(
    (key) => ctrl.openMonth(key),
    [ctrl.openMonth],
  );

  const onAmount = useCallback(
    (v) => {
      setPayAmount(v);
      setPayAmountError("");
    },
    [setPayAmount, setPayAmountError],
  );

  const onPaidDate = useCallback(
    (v) => {
      setPayPaidDate(v);
      setPayAmountError("");
    },
    [setPayPaidDate, setPayAmountError],
  );

  const onPeriodKey = useCallback(
    (v) => {
      setPayPeriodKey(v);
      setPayAmountError("");
    },
    [setPayPeriodKey, setPayAmountError],
  );

  const confirmPay = useCallback(async () => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n < 0) {
      setPayAmountError("Ugyldig beløp");
      return;
    }

    if (!payDraft?.recurringExpenseId) {
      setPayAmountError("Mangler recurringExpenseId");
      return;
    }

    if (!payPeriodKey || !isPeriodKey(payPeriodKey)) {
      setPayAmountError("Ugyldig måned (YYYY-MM)");
      return;
    }

    if (!payPaidDate) {
      setPayAmountError("Mangler betalt dato");
      return;
    }

    if (payMode === "EDIT") {
      if (!payDraft?.paymentId) {
        setPayAmountError("Mangler paymentId");
        return;
      }

      const originalPk = payDraft.originalPeriodKey;

      if (originalPk && originalPk !== payPeriodKey) {
        try {
          await payments.createPayment.mutateAsync({
            recurringExpenseId: payDraft.recurringExpenseId,
            periodKey: payPeriodKey,
            amount: n,
            paidDate: payPaidDate,
          });

          await payments.deletePayment.mutateAsync({
            paymentId: payDraft.paymentId,
          });

          closePayDialog();
          return;
        } catch {
          setPayAmountError("Kunne ikke flytte betalingen");
          return;
        }
      }

      payments.updatePayment.mutate(
        { paymentId: payDraft.paymentId, amount: n, paidDate: payPaidDate },
        { onSuccess: () => closePayDialog() },
      );
      return;
    }

    payments.createPayment.mutate(
      {
        recurringExpenseId: payDraft.recurringExpenseId,
        periodKey: payPeriodKey,
        amount: n,
        paidDate: payPaidDate,
      },
      { onSuccess: () => closePayDialog() },
    );
  }, [
    payAmount,
    payDraft,
    payPaidDate,
    payPeriodKey,
    payMode,
    payments,
    closePayDialog,
    setPayAmountError,
  ]);

  const deletePay = useCallback(() => {
    if (!payDraft?.paymentId) {
      setPayAmountError("Mangler paymentId");
      return;
    }

    payments.deletePayment.mutate(
      { paymentId: payDraft.paymentId },
      { onSuccess: () => closePayDialog() },
    );
  }, [payDraft, payments, closePayDialog, setPayAmountError]);

  /* =========================
     ✅ Terms dialog state
  ========================= */

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsItem, setTermsItem] = useState(null);
  const [termsPk, setTermsPk] = useState("");

  const openTerms = useCallback((it, monthKey) => {
    setTermsItem(it);
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
      await recurringApi.setTermsFromMonth(
        termsItem.recurringExpenseId,
        payload,
      );
      closeTerms();
      invalidateSummary();
      invalidateTemplates();
    },
    [termsItem, closeTerms, invalidateSummary, invalidateTemplates],
  );

  /* =========================
     ✅ Pause dialog state
  ========================= */

  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseMode, setPauseMode] = useState("CREATE"); // CREATE | EDIT
  const [pauseItem, setPauseItem] = useState(null);
  const [pauseInitial, setPauseInitial] = useState(null);

  const openPauseCreate = useCallback((it, monthKey) => {
    setPauseMode("CREATE");
    setPauseItem(it);
    setPauseInitial({ from: monthKey, to: monthKey, note: "" });
    setPauseOpen(true);
  }, []);

  const openPauseEdit = useCallback((it, range) => {
    setPauseMode("EDIT");
    setPauseItem(it);
    setPauseInitial(
      range || { from: it.periodKey, to: it.periodKey, note: "" },
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
      invalidateSummary();
      invalidateTemplates();
    },
    [pauseItem, pauseMode, closePause, invalidateSummary, invalidateTemplates],
  );

  const unpause = useCallback(
    async (it) => {
      if (!it?.recurringExpenseId || !it?.pauseId) return;
      await recurringApi.deletePause(it.recurringExpenseId, it.pauseId);
      invalidateSummary();
      invalidateTemplates();
    },
    [invalidateSummary, invalidateTemplates],
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <HeaderBar onAdd={ctrl.openAdd} />

      <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
        <FiltersSummaryCard
          filter={ctrl.filter}
          onFilter={onFilter}
          sum3={sum3}
          formatCurrency={formatCurrency}
        />

        {/* ✅ Past months slider */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography fontWeight={800}>Historikk</Typography>
              <Typography variant="body2" color="text.secondary">
                Vis {monthsBack} måneder bakover
              </Typography>
              <PastMonthsSelect value={monthsBack} onChange={setMonthsBack} />
            </Stack>
          </CardContent>
        </Card>

        {!isLoading && !isError && (forecast?.length ?? 0) > 0 && (
          <Box sx={{ mt: 2 }}>
            <RecurringOverviewCharts
              forecast={forecast}
              monthsForTypeSplit={3}
            />
          </Box>
        )}

        {(isLoading || isError) && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              {isLoading && (
                <Typography color="text.secondary">
                  Laster faste kostnader…
                </Typography>
              )}
              {isError && (
                <Typography color="error">
                  Kunne ikke hente faste kostnader
                  {loadError?.message ? `: ${loadError.message}` : "."}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            alignItems: "start",
          }}
        >
          <ForecastSection
            title="Kommende måneder"
            forecast={forecastFuture}
            tab={ctrl.tab}
            onTab={onTab}
            onOpenMonth={onOpenMonth}
            maxRef={maxRef}
            formatCurrency={formatCurrency}
          />

          <NextBillsCard
            nextBills={nextBills}
            formatCurrency={formatCurrency}
          />

          <ForecastSection
            title="Historikk"
            forecast={forecastPast}
            tab={ctrl.tab}
            onTab={onTab}
            onOpenMonth={onOpenMonth}
            maxRef={maxRef}
            formatCurrency={formatCurrency}
          />

          <ExpenseTemplatesSection
            expenses={templates.expenses}
            templates={templates.expenses} 
            formatCurrency={formatCurrency}
            onEdit={ctrl.openEdit}
            // onDelete is no longer used for "Fullfør" (we use onFinish instead)
            onDelete={ctrl.openDelete}
            showFinished={showFinished}
            onToggleShowFinished={() => setShowFinished((v) => !v)}
            onFinish={async (id) => {
  if (!id) return;
  await recurringApi.archiveExpense(String(id));
  invalidateSummary();
  invalidateTemplates();
}}
            onRestore={async (id) => {
  if (!id) return;
  await recurringApi.restoreExpense(String(id));
  invalidateSummary();
  invalidateTemplates();
}}
            onOpenTerms={openTerms}
            onOpenPauseCreate={openPauseCreate}
            onOpenPauseEdit={openPauseEdit}
            onUnpause={unpause}
          />
        </Box>
      </Box>

      <MonthDrawer
        open={ctrl.monthDrawerOpen}
        onClose={ctrl.closeMonth}
        selected={selected}
        expenses={templates.expenses} // ✅ include pausePeriods for edit/unpause
        onOpenPay={openPayDialog}
        onOpenTerms={openTerms}
        onOpenPauseCreate={openPauseCreate}
        onOpenPauseEdit={openPauseEdit}
        onUnpause={unpause}
        registerPaymentPending={payments.pending}
        registerPaymentError={payments.error}
        formatCurrency={formatCurrency}
      />

      <RecurringExpenseDialog
        open={ctrl.dialogOpen}
        mode={ctrl.dialogMode}
        expense={ctrl.expenseTarget}
        onClose={ctrl.closeDialog}
        onSuccess={() => invalidateSummary()}
        onError={() => {}}
      />

      <PayDialog
        open={payDialogOpen}
        onClose={closePayDialog}
        title={payDraft?.title}
        amount={payAmount}
        onAmount={onAmount}
        paidDate={payPaidDate}
        onPaidDate={onPaidDate}
        periodKey={payPeriodKey}
        onPeriodKey={onPeriodKey}
        error={payAmountError}
        onConfirm={confirmPay}
        onDelete={payMode === "EDIT" ? deletePay : undefined}
        pending={payments.pending}
        mode={payMode}
      />

      <ChangeTermsDialog
        open={termsOpen}
        onClose={closeTerms}
        onSubmit={submitTerms}
        expense={termsItem}
        periodKey={termsPk}
      />

      <PauseDialog
        open={pauseOpen}
        mode={pauseMode}
        onClose={closePause}
        onSubmit={submitPause}
        initial={pauseInitial}
      />
    </Box>
  );
}
